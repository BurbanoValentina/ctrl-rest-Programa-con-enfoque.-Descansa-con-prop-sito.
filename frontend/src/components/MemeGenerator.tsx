import { useEffect, useRef, useState } from "react";
import "./MemeGenerator.css";

interface MemeGeneratorProps {
  connected: boolean;
  stream: MediaStream | null;
  srcVideoRef: React.RefObject<HTMLVideoElement>;
  state: any;
  landmarks: any;
  onBack: () => void;
}

const MEME_CATS = [
  { id: 1, img: "/ga1-02.png", name: "Feliz", instruction: "¡Sonríe!", target: "up" },
  { id: 2, img: "/ga2-02.png", name: "Sorprendido", instruction: "¡Abre la boca!", target: "up" },
  { id: 3, img: "/ga3-02.png", name: "Chill", instruction: "Relájate", target: "center" },
  { id: 4, img: "/ga4-02.png", name: "Pensando", instruction: "Mira arriba", target: "up" },
  { id: 5, img: "/ga6-02.png", name: "Cool", instruction: "Inclina cabeza", target: "tilt" },
  { id: 6, img: "/ga7-02.png", name: "Triste", instruction: "Baja la mirada", target: "down" },
  { id: 7, img: "/ga8-02.png", name: "Enojado", instruction: "Frunce el ceño", target: "down" },
  { id: 8, img: "/ga9-02.png", name: "Dormido", instruction: "Cierra los ojos", target: "down" },
  { id: 9, img: "/ga10-02.png", name: "Risa", instruction: "¡Ríete!", target: "up" },
  { id: 10, img: "/ga11-02.png", name: "Guiño", instruction: "Guiña un ojo", target: "tilt" },
  { id: 11, img: "/ga12-02.png", name: "Shock", instruction: "¡Cara de shock!", target: "up" },
  { id: 12, img: "/gato sentado-02.png", name: "Zen", instruction: "Relax total", target: "center" },
];

const COMMENTS = [
  "Jajaja esa cara 😂", "¡Deberías sonreír más! 😄",
  "Pareces un gato de verdad 🐈", "¡Qué hermosa foto! ✨",
  "10/10 expresión legendaria 🏆", "Blizzy aprueba ✅",
  "¡Casi! Un poco más 🎯", "¡Vamos tú puedes! 💪",
  "Error 404: seriedad no encontrada 🤣", "Pose de dev pro 👩‍💻",
];

export function MemeGenerator({ connected, stream, srcVideoRef, state, landmarks, onBack }: MemeGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(MEME_CATS[0]);
  const [captured, setCaptured] = useState<string | null>(null);
  const [comment, setComment] = useState(COMMENTS[0]);
  const [similarity, setSimilarity] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const capturedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    const src = srcVideoRef.current;
    if (v && src && src.srcObject) {
      const s = src.srcObject as MediaStream;
      if (v.srcObject !== s) { v.srcObject = s; v.play().catch(() => {}); }
    } else if (v && stream) {
      if (v.srcObject !== stream) { v.srcObject = stream; v.play().catch(() => {}); }
    }
  });

  // Rotate comments
  useEffect(() => {
    const t = setInterval(() => {
      setComment(COMMENTS[Math.floor(Math.random() * COMMENTS.length)]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Draw face landmarks + calculate similarity
  useEffect(() => {
    if (captured) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    if (landmarks && landmarks.points && landmarks.points.length > 0) {
      setFaceDetected(true);
      // Draw ALL points as purple dots
      for (const pt of landmarks.points) {
        const px = (1 - pt.x) * w;
        const py = pt.y * h;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#a78bfa";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(167,139,250,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Draw connections
      if (landmarks.connections) {
        ctx.strokeStyle = "rgba(124,58,237,0.4)";
        ctx.lineWidth = 2;
        for (const c of landmarks.connections) {
          ctx.beginPath();
          ctx.moveTo((1 - c.x1) * w, c.y1 * h);
          ctx.lineTo((1 - c.x2) * w, c.y2 * h);
          ctx.stroke();
        }
      }

      // Similarity based on head position
      const nose = landmarks.points.find((p: any) => p.id === 0);
      if (nose) {
        let sim = 45 + Math.floor(Math.random() * 15);
        const t = selected.target;
        if (t === "up" && nose.y < 0.4) sim += 35;
        else if (t === "down" && nose.y > 0.5) sim += 35;
        else if (t === "center" && nose.y > 0.35 && nose.y < 0.5) sim += 35;
        else if (t === "tilt") sim += 30;
        else sim += 10;
        sim = Math.min(98, Math.max(25, sim));
        setSimilarity(sim);
        // Auto capture at 88%
        if (sim >= 88 && !capturedRef.current) {
          capturedRef.current = true;
          setTimeout(() => capture(), 300);
        }
      }
    } else {
      setFaceDetected(false);
      setSimilarity(0);
    }
  }, [landmarks, captured, selected]);

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    setCaptured(c.toDataURL("image/png"));
  };

  const retake = () => { setCaptured(null); capturedRef.current = false; };

  const selectMeme = (cat: typeof MEME_CATS[0]) => {
    setSelected(cat); setCaptured(null); capturedRef.current = false;
  };

  const download = () => {
    const cv = document.createElement("canvas");
    cv.width = 900; cv.height = 520;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0c0c1e";
    ctx.fillRect(0, 0, 900, 520);
    const mi = new Image(); mi.src = selected.img;
    const fi = new Image(); if (captured) fi.src = captured;
    setTimeout(() => {
      ctx.drawImage(mi, 30, 80, 360, 360);
      if (captured) ctx.drawImage(fi, 510, 80, 360, 360);
      ctx.font = "bold 28px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#7c3aed";
      ctx.fillText(`${similarity}% similar`, 450, 280);
      ctx.font = "bold 22px Inter,sans-serif";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      const txt = comment.replace(/[\u{1F600}-\u{1F9FF}]/gu, "").trim();
      ctx.strokeText(txt, 450, 50);
      ctx.fillText(txt, 450, 50);
      ctx.font = "12px Inter,sans-serif";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("Ctrl + Rest • Blizzy Memes", 450, 505);
      const link = document.createElement("a");
      link.download = `blizzy-${selected.name}-${similarity}pct.png`;
      link.href = cv.toDataURL("image/png");
      link.click();
    }, 400);
  };

  return (
    <div className="meme-overlay">
      <div className="meme-header">
        <button className="meme-back" onClick={onBack}>
          <span className="material-symbols-rounded">arrow_back</span> Volver
        </button>
        <h1 className="meme-title">
          <span className="material-symbols-rounded">sentiment_very_satisfied</span>
          Imita el Meme
        </h1>
        <div className="meme-status">
          <span className={`meme-dot ${connected ? "on" : ""}`} />
          {connected ? "Detectando" : "Conectando..."}
        </div>
      </div>

      <div className="meme-body">
        {/* Sidebar memes */}
        <div className="meme-sidebar">
          <h3>Elige un meme</h3>
          <div className="meme-grid">
            {MEME_CATS.map((cat) => (
              <button key={cat.id} className={`meme-grid__item ${selected.id === cat.id ? "active" : ""}`}
                onClick={() => selectMeme(cat)}>
                <img src={cat.img} alt={cat.name} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="meme-main">
          {/* Blizzy comment */}
          <div className="meme-bubble">
            <img src="/gato computador-02.png" alt="Blizzy" className="meme-bubble__img" />
            <p key={comment}>{comment}</p>
          </div>

          {/* Compare */}
          <div className="meme-compare">
            <div className="meme-card">
              <span className="meme-card__label">MEME</span>
              <div className="meme-card__imgwrap">
                <img src={selected.img} alt={selected.name} />
              </div>
              <span className="meme-card__instruction">{selected.instruction}</span>
            </div>

            {/* Similarity */}
            <div className="meme-sim">
              <svg viewBox="0 0 100 100" className="meme-sim__svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1f1f3a" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={similarity >= 85 ? "#34d399" : similarity >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={264} strokeDashoffset={264 - (264 * similarity / 100)}
                  transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 0.5s"}} />
              </svg>
              <div className="meme-sim__text">
                <span className="meme-sim__num">{similarity}%</span>
                <span className="meme-sim__label">Similitud</span>
              </div>
            </div>

            <div className="meme-card">
              <span className="meme-card__label">TÚ</span>
              <div className="meme-card__live">
                {captured ? (
                  <img src={captured} alt="Captura" className="meme-card__captured" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="meme-card__video" />
                    <canvas ref={canvasRef} className="meme-card__canvas" />
                    {!faceDetected && (
                      <div className="meme-card__noface">
                        <span className="material-symbols-rounded">face</span>
                        Muestra tu cara
                      </div>
                    )}
                    {faceDetected && similarity >= 85 && (
                      <div className="meme-card__snap">📸 ¡Capturando!</div>
                    )}
                  </>
                )}
              </div>
              {!captured && faceDetected && (
                <span className="meme-card__hint">Auto-captura al 88%</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {captured && (
            <div className="meme-actions">
              <button className="meme-btn" onClick={retake}>
                <span className="material-symbols-rounded">refresh</span> Otra vez
              </button>
              <button className="meme-btn meme-btn--primary" onClick={download}>
                <span className="material-symbols-rounded">download</span> Descargar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
