"""
PausaActiva - servicio de sensores (Python + MediaPipe Tasks)

Tres modos en el mismo WebSocket:
  - "postura" (default): monitorea postura con PoseLandmarker
  - "exercise": cuenta repeticiones de giro de cuello con PoseLandmarker
  - "pingpong": detecta manos con HandLandmarker y simula ping pong

Comandos del frontend:
  - "start_exercise" → modo ejercicio
  - "stop_exercise"  → vuelve a postura
  - "start_pingpong" → modo ping pong (usa HandLandmarker)
  - "stop_pingpong"  → vuelve a postura
  - (cualquier otro texto largo) → es un frame base64
"""
import asyncio
import base64
import os
import time
import traceback
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    HandLandmarker,
    HandLandmarkerOptions,
    RunningMode,
)
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.posture import compute_posture, get_drawable_landmarks
from app.exercise import ExerciseTracker
from app.pingpong import PingPongGame

app = FastAPI(title="PausaActiva Sensor Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
POSE_MODEL_PATH = os.path.join(MODEL_DIR, "pose_landmarker_lite.task")
HAND_MODEL_PATH = os.path.join(MODEL_DIR, "hand_landmarker.task")

BAD_POSTURE_TRIGGER_SECONDS = 20


def create_pose_landmarker() -> PoseLandmarker:
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=POSE_MODEL_PATH),
        running_mode=RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.4,
        min_tracking_confidence=0.4,
    )
    return PoseLandmarker.create_from_options(options)


def create_hand_landmarker() -> HandLandmarker:
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=HAND_MODEL_PATH),
        running_mode=RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.4,
        min_tracking_confidence=0.4,
    )
    return HandLandmarker.create_from_options(options)


@app.websocket("/ws/postura")
async def postura_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    pose_landmarker: Optional[PoseLandmarker] = None
    hand_landmarker: Optional[HandLandmarker] = None
    bad_since: Optional[float] = None
    mode = "postura"
    exercise_tracker = ExerciseTracker()
    pingpong_game = PingPongGame()
    # Estabilización: mantener último estado válido para evitar titileo
    last_valid_response: Optional[dict] = None
    no_person_count = 0  # Frames consecutivos sin persona
    NO_PERSON_THRESHOLD = 5  # Solo reportar "no_person" después de 5 frames seguidos

    try:
        pose_landmarker = create_pose_landmarker()
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
        await websocket.close()
        return

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"status": "no_frame", "mode": mode})
                continue

            # --- Comandos de control ---
            if data == "start_exercise":
                mode = "exercise"
                exercise_tracker.reset()
                await websocket.send_json({
                    "status": "exercise_started", "mode": "exercise",
                    "exercise": exercise_tracker._state(),
                })
                continue

            if data == "stop_exercise":
                mode = "postura"
                bad_since = None
                await websocket.send_json({"status": "exercise_stopped", "mode": "postura"})
                continue

            if data == "start_pingpong":
                mode = "pingpong"
                pingpong_game.reset()
                # Lazy-load hand landmarker
                if hand_landmarker is None:
                    try:
                        hand_landmarker = create_hand_landmarker()
                    except Exception as e:
                        await websocket.send_json({"status": "error", "message": str(e)})
                        mode = "postura"
                        continue
                await websocket.send_json({"status": "pingpong_started", "mode": "pingpong"})
                continue

            if data == "stop_pingpong":
                mode = "postura"
                bad_since = None
                await websocket.send_json({"status": "pingpong_stopped", "mode": "postura"})
                continue

            # --- Procesamiento de frame ---
            try:
                img_bytes = base64.b64decode(data)
                np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_json({"status": "no_frame", "mode": mode})
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                if mode == "pingpong":
                    # --- MODO PING PONG (HandLandmarker) ---
                    if hand_landmarker is None:
                        await websocket.send_json({"status": "no_frame", "mode": mode})
                        continue

                    result = hand_landmarker.detect(mp_image)

                    hands_data = []
                    if result.hand_landmarks and result.handedness:
                        for i, hand_lm in enumerate(result.hand_landmarks):
                            handedness = result.handedness[i][0].category_name
                            lm_list = []
                            for lm in hand_lm:
                                lm_list.append({"x": lm.x, "y": lm.y, "z": lm.z})
                            hands_data.append({
                                "handedness": handedness,
                                "landmarks": lm_list,
                            })

                    game_state = pingpong_game.update(hands_data)

                    await websocket.send_json({
                        "status": "ok",
                        "mode": "pingpong",
                        "game": game_state,
                    })

                else:
                    # --- MODO POSTURA / EJERCICIO (PoseLandmarker) ---
                    result = pose_landmarker.detect(mp_image)

                    if not result.pose_landmarks or len(result.pose_landmarks) == 0:
                        no_person_count += 1
                        # Solo reportar no_person si persiste 8+ frames
                        if no_person_count >= 8:
                            bad_since = None
                            last_valid_response = {"status": "no_person", "mode": mode}
                            await websocket.send_json(last_valid_response)
                        elif last_valid_response:
                            await websocket.send_json(last_valid_response)
                        else:
                            await websocket.send_json({"status": "no_person", "mode": mode})
                        continue

                    no_person_count = 0
                    landmarks = result.pose_landmarks[0]

                    if mode == "postura":
                        reading = compute_posture(landmarks)
                        drawable = get_drawable_landmarks(landmarks)
                        now = time.time()

                        if reading.is_good:
                            bad_since = None
                            trigger_pause = False
                        else:
                            bad_since = bad_since or now
                            trigger_pause = (now - bad_since) >= BAD_POSTURE_TRIGGER_SECONDS

                        last_valid_response = {
                            "status": "ok", "mode": "postura",
                            "neckAngle": reading.neck_angle,
                            "slouchRatio": reading.slouch_ratio,
                            "shoulderTilt": reading.shoulder_tilt,
                            "headDrop": reading.head_drop,
                            "isGood": reading.is_good,
                            "reason": reading.reason,
                            "triggerPause": trigger_pause,
                            "landmarks": drawable,
                        }
                        await websocket.send_json(last_valid_response)
                    else:
                        drawable = get_drawable_landmarks(landmarks)
                        exercise_state = exercise_tracker.process_landmarks(landmarks)
                        last_valid_response = {
                            "status": "ok", "mode": "exercise",
                            "exercise": exercise_state,
                            "landmarks": drawable,
                        }
                        await websocket.send_json(last_valid_response)

            except Exception:
                traceback.print_exc()
                await websocket.send_json({"status": "no_frame", "mode": mode})
                continue

    except WebSocketDisconnect:
        pass
    except Exception:
        traceback.print_exc()
    finally:
        if pose_landmarker:
            pose_landmarker.close()
        if hand_landmarker:
            hand_landmarker.close()


@app.get("/health")
def health() -> dict:
    return {"ok": True}
