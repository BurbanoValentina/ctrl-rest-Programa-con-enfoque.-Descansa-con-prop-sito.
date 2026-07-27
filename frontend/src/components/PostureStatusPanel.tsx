import { useState, useCallback, useRef, useEffect } from "react";
import { LandmarkOverlay } from "./LandmarkOverlay";
import type { PostureState } from "../types/posture";

interface Props {
  state: PostureState;
  connected: boolean;
  cameraActive: boolean;
  cameraError: string | null;
  startCamera: () => void;
  stopCamera: () => void;
  stream: MediaStream | null;
}

export function PostureStatusPanel({
  state,
  connected,
  cameraActive,
  cameraError,
  startCamera,
  stopCamera,
  stream,
}: Props) {
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ w: 640, h: 480 });
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Asignar stream al video local de este componente
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream]);

  const handleVideoResize = useCallback(() => {
    const video = localVideoRef.current;
    if (video && video.videoWidth > 0) {
      setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
    }
  }, []);

  if (!cameraActive) {
    return (
      <div className="posture-panel">
        <div className="camera-prompt">
          <h3>📷 Activa tu cámara para empezar</h3>
          <p>
            La cámara se procesa localmente y solo se envían datos numéricos al
            servidor.
          </p>
          {cameraError && <p className="error-msg">❌ {cameraError}</p>}
          <button className="btn-start" onClick={startCamera}>
            Activar cámara
          </button>
        </div>
      </div>
    );
  }

  let borderColor = "#333";
  let badgeText = "";
  let badgeColor = "";

  if (!connected) {
    borderColor = "#555";
    badgeText = "Reconectando...";
    badgeColor = "#888";
  } else if (state.status === "no_person") {
    borderColor = "#3B82F6";
    badgeText = "Buscando persona...";
    badgeColor = "#3B82F6";
  } else if (state.status === "ok" && state.isGood) {
    borderColor = "#1D9E75";
    badgeText = "Buena postura ✓";
    badgeColor = "#1D9E75";
  } else if (state.status === "ok" && !state.isGood) {
    borderColor = "#E24B4A";
    badgeText = "Mala postura ✗";
    badgeColor = "#E24B4A";
  }

  return (
    <div className="posture-panel" style={{ borderColor }}>
      <div className="video-container">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="camera-preview"
          onLoadedMetadata={handleVideoResize}
          onResize={handleVideoResize}
        />

        <LandmarkOverlay
          landmarks={state.landmarks}
          videoWidth={videoDimensions.w}
          videoHeight={videoDimensions.h}
          isGood={state.isGood ?? true}
          visible={showLandmarks && state.status === "ok"}
        />

        <div className="video-overlay">
          <span
            className="status-dot"
            style={{ backgroundColor: connected ? "#1D9E75" : "#888" }}
          />
          {connected ? "En vivo" : "Reconectando..."}
        </div>

        {badgeText && (
          <div
            className="video-posture-badge"
            style={{ backgroundColor: badgeColor }}
          >
            {badgeText}
          </div>
        )}
      </div>

      <div className="controls-row">
        <button
          className={`btn-toggle ${showLandmarks ? "active" : ""}`}
          onClick={() => setShowLandmarks(!showLandmarks)}
        >
          {showLandmarks ? "🟢 Puntos ON" : "⚪ Puntos OFF"}
        </button>
        <button className="btn-stop" onClick={stopCamera}>
          Apagar cámara
        </button>
      </div>

      {connected && state.status === "ok" && (
        <>
          <h3
            style={{ color: state.isGood ? "#1D9E75" : "#E24B4A", marginTop: "1rem" }}
          >
            {state.isGood ? "✅ Buena postura" : "⚠️ Corrige tu postura"}
          </h3>
          {!state.isGood && state.reason && (
            <p className="reason-text">Problema: {state.reason}</p>
          )}

          <div className="metrics">
            <div className="metric">
              <span className="metric-label">Ángulo cuello</span>
              <span className="metric-value">{state.neckAngle}°</span>
            </div>
            <div className="metric">
              <span className="metric-label">Encorvamiento</span>
              <span className="metric-value">{state.slouchRatio}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Inclinación</span>
              <span className="metric-value">{state.shoulderTilt}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Cabeza</span>
              <span className="metric-value">{state.headDrop}</span>
            </div>
          </div>
        </>
      )}

      {connected && state.status === "no_person" && (
        <p className="info-msg blue">
          🔍 Buscando persona — muévete dentro del cuadro de la cámara
        </p>
      )}

      {!connected && (
        <p className="info-msg">🔄 Reconectando al servidor de postura...</p>
      )}

      {state.triggerPause && (
        <div className="alert-banner">
          🚨 Llevas mucho tiempo en mala postura — ¡hora de una PausaActiva!
        </div>
      )}
    </div>
  );
}
