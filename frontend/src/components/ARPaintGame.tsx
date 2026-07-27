import { useEffect, useRef, useState } from "react";
import "./ARPaintGame.css";

/**
 * AR Paint — Dibuja con el dedo índice usando HandLandmarker.
 * 
 * TODO se controla con las manos:
 * - Pinch (pulgar + índice juntos) = dibujar
 * - Mano abierta (dedos extendidos) = no dibujar, mover cursor
 * - Llevar el índice a la zona de colores (parte inferior izquierda) = cambiar color
 * - Llevar el índice a la zona borrador (parte inferior derecha) = activar borrador
 * - Puño cerrado (todos los dedos cerrados) = limpiar canvas
 * - Dos manos detectadas = cambiar tamaño de brocha según distancia entre índices
 */

interface ARPaintProps {
  game: any;
  connected: boolean;
  stream: MediaStream | null;
  onBack: () => void;
}

const COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308",
  "#a855f7", "#ffffff", "#f97316", "#ec4899",
];

export function ARPaintGame({ game, connected, stream, onBack }: ARPaintProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const handCanvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[4]);
  const [brushSize, setBrushSize] = useState(10);
  const [isEraser, setIsEraser] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gesture, setGesture] = useState("Esperando manos...");
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const gameRef = useRef(game);
  const colorIndexRef = useRef(4);
  const fistFramesRef = useRef(0);

  useEffect(() => { gameRef.current = game; }, [game]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) { video.srcObject = stream; video.play().catch(() => {}); }
  }, [stream]);

  // Detect gestures from hand landmarks
  const detectGesture = (points: { x: number; y: number }[]) => {
    if (!points || points.length < 21) return "none";

    const thumbTip = points[4];
    const indexTip = points[8];
    const middleTip = points[12];
    const ringTip = points[16];
    const pinkyTip = points[20];
    const indexMcp = points[5];
    const middleMcp = points[9];
    const ringMcp = points[13];
    const pinkyMcp = points[17];
    const wrist = points[0];

    // Check if fingers are extended (tip above mcp in y)
    const indexUp = indexTip.y < indexMcp.y;
    const middleUp = middleTip.y < middleMcp.y;
    const ringUp = ringTip.y < ringMcp.y;
    const pinkyUp = pinkyTip.y < pinkyMcp.y;

    // Pinch: thumb and index close
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const isPinching = pinchDist < 0.05;

    // Fist: all fingers down
    const isFist = !indexUp && !middleUp && !ringUp && !pinkyUp;

    // Open hand: all fingers up
    const isOpen = indexUp && middleUp && ringUp && pinkyUp;

    // Peace sign: only index + middle up (change color)
    const isPeace = indexUp && middleUp && !ringUp && !pinkyUp;

    if (isFist) return "fist";
    if (isPinching) return "pinch";
    if (isPeace) return "peace";
    if (isOpen) return "open";
    return "none";
  };

  // Main render loop
  useEffect(() => {
    let animId: number;

    function loop() {
      animId = requestAnimationFrame(loop);
      const drawCanvas = drawCanvasRef.current;
      const handCanvas = handCanvasRef.current;
      const video = videoRef.current;
      if (!drawCanvas || !handCanvas || !video) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (handCanvas.width !== w) handCanvas.width = w;
      if (handCanvas.height !== h) handCanvas.height = h;
      if (drawCanvas.width !== w) drawCanvas.width = w;
      if (drawCanvas.height !== h) drawCanvas.height = h;

      const hCtx = handCanvas.getContext("2d");
      if (!hCtx) return;
      hCtx.clearRect(0, 0, w, h);

      const g = gameRef.current;
      if (!g || !g.hands || g.hands.length === 0) {
        setGesture("Muestra tus manos a la cámara");
        lastPosRef.current = null;
        fistFramesRef.current = 0;
        return;
      }

      const firstHand = g.hands[0];
      if (!firstHand || !firstHand.points || firstHand.points.length < 21) return;

      // Draw hand skeleton
      const conns = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
      hCtx.strokeStyle = "rgba(167, 139, 250, 0.5)";
      hCtx.lineWidth = 2;
      for (const [a, b] of conns) {
        hCtx.beginPath();
        hCtx.moveTo(firstHand.points[a].x * w, firstHand.points[a].y * h);
        hCtx.lineTo(firstHand.points[b].x * w, firstHand.points[b].y * h);
        hCtx.stroke();
      }

      const gesture = detectGesture(firstHand.points);
      const tip = firstHand.points[8];
      const x = tip.x * w;
      const y = tip.y * h;

      // Draw cursor
      hCtx.beginPath();
      hCtx.arc(x, y, brushSize / 2 + 4, 0, Math.PI * 2);
      hCtx.strokeStyle = gesture === "pinch" ? (isEraser ? "#f87171" : color) : "rgba(255,255,255,0.5)";
      hCtx.lineWidth = 3;
      hCtx.stroke();

      // Draw color palette indicators on canvas (bottom left)
      COLORS.forEach((c, i) => {
        const cx = 30 + i * 35;
        const cy = h - 30;
        hCtx.beginPath();
        hCtx.arc(cx, cy, 12, 0, Math.PI * 2);
        hCtx.fillStyle = c;
        hCtx.fill();
        if (c === color && !isEraser) {
          hCtx.strokeStyle = "#fff";
          hCtx.lineWidth = 3;
          hCtx.stroke();
        }
      });

      // Eraser indicator (bottom right)
      hCtx.beginPath();
      hCtx.arc(w - 40, h - 30, 14, 0, Math.PI * 2);
      hCtx.fillStyle = isEraser ? "#f87171" : "rgba(248,113,113,0.3)";
      hCtx.fill();
      hCtx.fillStyle = "#fff";
      hCtx.font = "10px Inter";
      hCtx.textAlign = "center";
      hCtx.fillText("🧹", w - 40, h - 26);

      // Gesture actions
      if (gesture === "pinch") {
        setGesture("✏️ Dibujando...");
        const dCtx = drawCanvas.getContext("2d");
        if (dCtx && lastPosRef.current) {
          dCtx.beginPath();
          dCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
          dCtx.lineTo(x, y);
          if (isEraser) {
            dCtx.globalCompositeOperation = "destination-out";
            dCtx.strokeStyle = "rgba(0,0,0,1)";
          } else {
            dCtx.globalCompositeOperation = "source-over";
            dCtx.strokeStyle = color;
          }
          dCtx.lineWidth = brushSize;
          dCtx.lineCap = "round";
          dCtx.lineJoin = "round";
          dCtx.stroke();
          dCtx.globalCompositeOperation = "source-over";
        }
        lastPosRef.current = { x, y };
        fistFramesRef.current = 0;
      } else if (gesture === "open") {
        setGesture("✋ Mano abierta — mueve el cursor");
        lastPosRef.current = null;
        fistFramesRef.current = 0;

        // Check if index finger is in color zone (bottom area)
        if (tip.y > 0.85) {
          // Check which color
          const colorIdx = Math.floor(tip.x * COLORS.length);
          if (colorIdx >= 0 && colorIdx < COLORS.length) {
            setColor(COLORS[colorIdx]);
            setIsEraser(false);
            colorIndexRef.current = colorIdx;
            setGesture(`🎨 Color: ${COLORS[colorIdx]}`);
          }
          // Check eraser zone (right edge)
          if (tip.x > 0.85) {
            setIsEraser(true);
            setGesture("🧹 Borrador activado");
          }
        }
      } else if (gesture === "peace") {
        // Cycle through colors
        setGesture("✌️ Cambiando color...");
        lastPosRef.current = null;
        fistFramesRef.current = 0;
      } else if (gesture === "fist") {
        fistFramesRef.current++;
        setGesture(`✊ Puño — mantén para limpiar (${Math.min(fistFramesRef.current, 30)}/30)`);
        lastPosRef.current = null;
        // Hold fist for 30 frames (~1 second) to clear
        if (fistFramesRef.current >= 30) {
          const dCtx = drawCanvas.getContext("2d");
          if (dCtx) dCtx.clearRect(0, 0, w, h);
          fistFramesRef.current = 0;
          setGesture("🗑️ ¡Canvas limpio!");
        }
      } else {
        lastPosRef.current = null;
        fistFramesRef.current = 0;
        setGesture("Muestra un gesto");
      }

      // Two hands = adjust brush size
      if (g.hands.length >= 2) {
        const hand2 = g.hands[1];
        if (hand2.points && hand2.points.length >= 21) {
          const tip1 = firstHand.points[8];
          const tip2 = hand2.points[8];
          const dist = Math.hypot((tip1.x - tip2.x) * w, (tip1.y - tip2.y) * h);
          const newSize = Math.max(3, Math.min(40, dist / 10));
          setBrushSize(Math.round(newSize));
          setGesture(`📏 Tamaño: ${Math.round(newSize)}px`);
        }
      }
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [color, brushSize, isEraser]);

  return (
    <div className="paint-overlay">
      <video ref={videoRef} autoPlay playsInline muted className="paint-video" />
      <canvas ref={drawCanvasRef} className="paint-draw-canvas" />
      <canvas ref={handCanvasRef} className="paint-hand-canvas" />

      {/* Status */}
      <div className="paint-status">
        <span className={`paint-dot ${connected ? "on" : ""}`} />
        <span>{gesture}</span>
      </div>

      {/* Instructions overlay */}
      {showInstructions && (
        <div className="paint-instructions">
          <div className="paint-instructions__card">
            <h2><span className="material-symbols-rounded">brush</span> AR Paint</h2>
            <p className="paint-instructions__sub">Dibuja en el aire con tus manos</p>
            <div className="paint-instructions__list">
              <div className="paint-instructions__item">
                <span className="paint-instructions__gesture">🤏</span>
                <div>
                  <strong>Pinch (pulgar + índice)</strong>
                  <p>Junta pulgar e índice para dibujar</p>
                </div>
              </div>
              <div className="paint-instructions__item">
                <span className="paint-instructions__gesture">✋</span>
                <div>
                  <strong>Mano abierta</strong>
                  <p>Mueve el cursor sin dibujar. Baja al fondo para cambiar color.</p>
                </div>
              </div>
              <div className="paint-instructions__item">
                <span className="paint-instructions__gesture">✊</span>
                <div>
                  <strong>Puño cerrado (1 seg)</strong>
                  <p>Mantén el puño para limpiar todo el canvas</p>
                </div>
              </div>
              <div className="paint-instructions__item">
                <span className="paint-instructions__gesture">🖐️🖐️</span>
                <div>
                  <strong>Dos manos</strong>
                  <p>Separa o junta los índices para cambiar tamaño de brocha</p>
                </div>
              </div>
              <div className="paint-instructions__item">
                <span className="paint-instructions__gesture">👇</span>
                <div>
                  <strong>Zona inferior</strong>
                  <p>Lleva el índice abajo para seleccionar color. Esquina derecha = borrador.</p>
                </div>
              </div>
            </div>
            <button className="paint-instructions__btn" onClick={() => setShowInstructions(false)}>
              <span className="material-symbols-rounded">play_arrow</span> ¡Empezar a dibujar!
            </button>
          </div>
        </div>
      )}

      {/* Current brush info */}
      <div className="paint-brush-info">
        <div className="paint-brush-info__color" style={{ background: isEraser ? "#f87171" : color }} />
        <span>{isEraser ? "Borrador" : "Pincel"} • {brushSize}px</span>
      </div>

      {/* Persistent instructions panel (bottom left) */}
      <div className="paint-help">
        <div className="paint-help__title"><span className="material-symbols-rounded">help</span> Controles</div>
        <div className="paint-help__item"><span>🤏</span> Pinch = Dibujar</div>
        <div className="paint-help__item"><span>✋</span> Abierta = Mover</div>
        <div className="paint-help__item"><span>✊</span> Puño 1s = Limpiar</div>
        <div className="paint-help__item"><span>🖐🖐</span> 2 manos = Tamaño</div>
        <div className="paint-help__item"><span>👇</span> Abajo = Color</div>
        <div className="paint-help__item"><span>👇➡️</span> Abajo-der = Borrador</div>
      </div>

      <button className="paint-back" onClick={onBack}>
        <span className="material-symbols-rounded">arrow_back</span> Volver
      </button>
    </div>
  );
}
