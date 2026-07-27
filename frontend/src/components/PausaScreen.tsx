import type { ExerciseState, DrawableLandmarks } from "../types/posture";
import { LandmarkOverlay } from "./LandmarkOverlay";
import { useRef, useCallback, useState, useEffect } from "react";

interface Props {
  exercise: ExerciseState | undefined;
  landmarks: DrawableLandmarks | undefined;
  connected: boolean;
  stream: MediaStream | null;
  onCompleted: () => void;
  onBack: () => void;
}

/**
 * Pantalla de PausaActiva — ejercicio de giro de cuello.
 * Tiene su propio <video> que recibe el mismo stream de la cámara.
 */
export function PausaScreen({
  exercise,
  landmarks,
  connected,
  stream,
  onCompleted,
  onBack,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState({ w: 640, h: 480 });

  // Asignar stream al video local
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream]);

  const handleResize = useCallback(() => {
    const video = localVideoRef.current;
    if (video && video.videoWidth > 0) {
      setVideoDims({ w: video.videoWidth, h: video.videoHeight });
    }
  }, []);

  const reps = exercise?.currentReps ?? 0;
  const target = exercise?.targetReps ?? 3;
  const completed = exercise?.completed ?? false;
  const position = exercise?.position ?? "center";
  const deviation = exercise?.deviation ?? 0;

  // Indicador visual de dirección
  let directionHint = "↔️ Gira la cabeza a un lado";
  let directionColor = "#3B82F6";

  if (position === "left") {
    directionHint = "⬅️ Izquierda — vuelve al centro";
    directionColor = "#F59E0B";
  } else if (position === "right") {
    directionHint = "➡️ Derecha — vuelve al centro";
    directionColor = "#F59E0B";
  } else if (reps > 0 && !completed) {
    directionHint = "✓ ¡Bien! Sigue girando";
    directionColor = "#1D9E75";
  }

  if (completed) {
    directionHint = "🎉 ¡Ejercicio completado!";
    directionColor = "#1D9E75";
  }

  return (
    <div className="pausa-overlay">
      <div className="pausa-card">
        {/* Botón volver arriba a la izquierda */}
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>

        <h2 className="pausa-title">🧘 PausaActiva</h2>
        <p className="pausa-subtitle">
          {completed
            ? "¡Excelente! Completaste el ejercicio"
            : "Gira la cabeza de lado a lado lentamente"}
        </p>

        {/* Video con landmarks */}
        <div className="pausa-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="camera-preview"
            onLoadedMetadata={handleResize}
            onResize={handleResize}
          />
          <LandmarkOverlay
            landmarks={landmarks}
            videoWidth={videoDims.w}
            videoHeight={videoDims.h}
            isGood={completed || position === "center"}
            visible={true}
          />

          <div className="direction-indicator" style={{ color: directionColor }}>
            {directionHint}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="reps-section">
          <div className="reps-bar-bg">
            <div
              className="reps-bar-fill"
              style={{
                width: `${(reps / target) * 100}%`,
                backgroundColor: completed ? "#1D9E75" : "#3B82F6",
              }}
            />
          </div>
          <p className="reps-count">
            {reps} / {target} repeticiones
          </p>
        </div>

        {/* Medidor de desviación */}
        <div className="deviation-meter">
          <div className="deviation-track">
            <div
              className="deviation-thumb"
              style={{
                left: `${Math.max(5, Math.min(95, 50 + deviation * 100))}%`,
                backgroundColor: position === "center" ? "#888" : directionColor,
              }}
            />
          </div>
          <div className="deviation-labels">
            <span>Izq</span>
            <span>Centro</span>
            <span>Der</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pausa-actions">
          {completed ? (
            <button className="btn-complete" onClick={onCompleted}>
              ✓ Reclamar puntos (+10)
            </button>
          ) : (
            <button className="btn-skip" onClick={onBack}>
              Saltar pausa
            </button>
          )}
        </div>

        {!connected && (
          <p className="pausa-reconnecting">🔄 Reconectando...</p>
        )}
      </div>
    </div>
  );
}
