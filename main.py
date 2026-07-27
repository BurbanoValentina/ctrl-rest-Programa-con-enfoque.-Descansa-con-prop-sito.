"""
PausaActiva - servicio de sensores (Python + OpenCV + MediaPipe)

Captura la webcam LOCALMENTE y transmite el estado de postura al frontend
por WebSocket. No se envía video a ningún servidor: solo números derivados
de los landmarks.
"""
import asyncio
import time
from typing import Optional

import cv2
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.posture import compute_posture

app = FastAPI(title="PausaActiva Sensor Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción, restringir al dominio del frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose

# Segundos consecutivos de mala postura antes de disparar la pausa
BAD_POSTURE_TRIGGER_SECONDS = 20
TARGET_FPS = 10


class PostureMonitor:
    """Mantiene la cámara abierta y la racha de tiempo en mala postura."""

    def __init__(self) -> None:
        self.cap: Optional[cv2.VideoCapture] = None
        self.pose = mp_pose.Pose(
            min_detection_confidence=0.6, min_tracking_confidence=0.6
        )
        self.bad_since: Optional[float] = None

    def start(self) -> None:
        if self.cap is None:
            self.cap = cv2.VideoCapture(0)

    def stop(self) -> None:
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def read_state(self) -> dict:
        ok, frame = self.cap.read()
        if not ok:
            return {"status": "no_frame"}

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.pose.process(rgb)

        if not result.pose_landmarks:
            self.bad_since = None
            return {"status": "no_person"}

        reading = compute_posture(result.pose_landmarks.landmark)
        now = time.time()

        if reading.is_good:
            self.bad_since = None
            trigger_pause = False
        else:
            self.bad_since = self.bad_since or now
            trigger_pause = (now - self.bad_since) >= BAD_POSTURE_TRIGGER_SECONDS

        return {
            "status": "ok",
            "neckAngle": reading.neck_angle,
            "slouchRatio": reading.slouch_ratio,
            "shoulderTilt": reading.shoulder_tilt,
            "isGood": reading.is_good,
            "triggerPause": trigger_pause,
        }


monitor = PostureMonitor()


@app.websocket("/ws/postura")
async def postura_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    monitor.start()
    try:
        while True:
            state = monitor.read_state()
            await websocket.send_json(state)
            await asyncio.sleep(1 / TARGET_FPS)
    except WebSocketDisconnect:
        pass
    finally:
        monitor.stop()


@app.get("/health")
def health() -> dict:
    return {"ok": True}
