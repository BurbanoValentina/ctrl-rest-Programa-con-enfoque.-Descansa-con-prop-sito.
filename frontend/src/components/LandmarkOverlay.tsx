import { useEffect, useRef } from "react";
import type { DrawableLandmarks } from "../types/posture";

interface Props {
  landmarks: DrawableLandmarks | undefined;
  videoWidth: number;
  videoHeight: number;
  isGood: boolean;
  visible: boolean;
}

/**
 * Dibuja los landmarks (puntos + conexiones) sobre el video
 * usando un canvas overlay transparente.
 */
export function LandmarkOverlay({
  landmarks,
  videoWidth,
  videoHeight,
  isGood,
  visible,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || !visible) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    const pointColor = isGood ? "#1D9E75" : "#E24B4A";
    const lineColor = isGood
      ? "rgba(29, 158, 117, 0.7)"
      : "rgba(226, 75, 74, 0.7)";

    // Dibujar conexiones (líneas)
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    for (const conn of landmarks.connections) {
      // Espejamos X porque el video tiene transform: scaleX(-1)
      const x1 = (1 - conn.x1) * videoWidth;
      const y1 = conn.y1 * videoHeight;
      const x2 = (1 - conn.x2) * videoWidth;
      const y2 = conn.y2 * videoHeight;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Dibujar puntos
    for (const point of landmarks.points) {
      const x = (1 - point.x) * videoWidth;
      const y = point.y * videoHeight;

      // Punto exterior (glow)
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isGood
        ? "rgba(29, 158, 117, 0.3)"
        : "rgba(226, 75, 74, 0.3)";
      ctx.fill();

      // Punto interior sólido
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();

      // Borde blanco
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [landmarks, videoWidth, videoHeight, isGood, visible]);

  return (
    <canvas
      ref={canvasRef}
      className="landmark-canvas"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
