import { useEffect, useRef, useState, useCallback } from "react";
import type { PingPongGameState } from "../types/posture";

interface Props {
  game: PingPongGameState | undefined;
  connected: boolean;
  stream: MediaStream | null;
  onBack: () => void;
}

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

/**
 * Ping Pong AR — ambas manos son raquetas.
 * El video ya tiene transform: scaleX(-1), así que las coordenadas
 * de MediaPipe se dibujan directamente (x normal) en el canvas que
 * TAMBIÉN tiene scaleX(-1). Resultado: coincide con tus manos reales.
 */
export function PingPongGame({ game, connected, stream, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const gameDataRef = useRef<PingPongGameState | undefined>(undefined);

  useEffect(() => { gameDataRef.current = game; }, [game]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => {
    let t = 60;
    setTimer(60);
    setGameOver(false);
    timerRef.current = window.setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameOver(true);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let animId: number;

    function draw() {
      animId = requestAnimationFrame(draw);
      if (!canvas || !video) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const g = gameDataRef.current;
      if (!g) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Cargando detección de manos...", w / 2, h / 2);
        return;
      }

      // Las coordenadas de MediaPipe van de 0 a 1.
      // El canvas tiene scaleX(-1) en CSS (igual que el video),
      // así que dibujamos x directamente — se espejan juntos.

      // --- Manos con landmarks ---
      for (const hand of g.hands) {
        // "Left" en MediaPipe = mano derecha visual del usuario = ROJA
        // "Right" en MediaPipe = mano izquierda visual = AZUL
        const isVisualRight = hand.handedness === "Left";
        const color = isVisualRight ? "#d9534f" : "#3B82F6";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (const [a, b] of HAND_CONNECTIONS) {
          if (!hand.points[a] || !hand.points[b]) continue;
          ctx.beginPath();
          ctx.moveTo(hand.points[a].x * w, hand.points[a].y * h);
          ctx.lineTo(hand.points[b].x * w, hand.points[b].y * h);
          ctx.stroke();
        }

        for (const pt of hand.points) {
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      // --- Raqueta izquierda (azul) ---
      const lx = g.leftPaddle.x * w;
      const ly = g.leftPaddle.y * h;
      ctx.beginPath();
      ctx.arc(lx, ly, 38, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.35)";
      ctx.fill();
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 3;
      ctx.stroke();

      // --- Raqueta derecha (roja) ---
      const rx = g.rightPaddle.x * w;
      const ry = g.rightPaddle.y * h;
      ctx.beginPath();
      ctx.arc(rx, ry, 38, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(217, 83, 79, 0.35)";
      ctx.fill();
      ctx.strokeStyle = "#d9534f";
      ctx.lineWidth = 3;
      ctx.stroke();

      // --- Pelota ---
      const bx = g.ball.x * w;
      const by = g.ball.y * h;
      // Sombra
      ctx.beginPath();
      ctx.arc(bx + 2, by + 2, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();
      // Pelota
      ctx.beginPath();
      ctx.arc(bx, by, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ffa500";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    onBack();
  }, [onBack]);

  const rally = game?.rally ?? 0;
  const record = game?.record ?? 0;

  return (
    <div className="pingpong-overlay">
      <video ref={videoRef} autoPlay playsInline muted className="pingpong-video" />
      <canvas ref={canvasRef} className="pingpong-hand-canvas" />

      {!gameOver && (
        <>
          <div className="pingpong-hud">
            <div className="pingpong-hud-left">
              <span>Rally: <b>{rally}</b></span>
              <span>Récord: <b>{record}</b></span>
            </div>
            <div className="pingpong-hud-right">
              <span>⏱️ {timer}s</span>
            </div>
          </div>

          <div className="pingpong-ingame-help">
            <p>🔴 Mano derecha = Raqueta roja</p>
            <p>🔵 Mano izquierda = Raqueta azul</p>
            <p>🏓 Pega la pelota con ambas manos</p>
            {game && game.hands.length === 0 && (
              <p style={{ color: "#f59e0b" }}>⚠️ Muestra tus manos</p>
            )}
          </div>

          <button className="pingpong-back-btn" onClick={handleBack}>← Volver</button>
          <div className="pingpong-timer-bar" style={{ width: `${(timer / 60) * 100}%` }} />
        </>
      )}

      {gameOver && (
        <div className="pingpong-screen">
          <h2>⏱️ ¡Tiempo!</h2>
          <p className="pingpong-final-score">{record}</p>
          <p>Rally máximo</p>
          <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: "1.2rem" }}>
            +{record * 2} puntos
          </p>
          <button className="btn-complete" onClick={handleBack}>
            ← Volver a PausaActiva (+{record * 2} pts)
          </button>
        </div>
      )}
    </div>
  );
}
