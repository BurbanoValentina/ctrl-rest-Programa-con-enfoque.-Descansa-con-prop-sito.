import { useRef, useState, useEffect } from "react";
import { LandmarkOverlay } from "./LandmarkOverlay";
import "./StretchChallenge.css";

/**
 * StretchChallenge — 3 retos de estiramiento usando PoseLandmarker.
 * Usa las muñecas (landmarks de postura) para detectar posición de manos.
 * Funciona en modo "exercise" del backend (PoseLandmarker activo).
 */
interface Props {
  state: any;
  landmarks: any;
  connected: boolean;
  stream: MediaStream | null;
  srcVideoRef: React.RefObject<HTMLVideoElement>;
  onCompleted: () => void;
  onBack: () => void;
}

const CHALLENGES = [
  { id: 1, name: "Brazos arriba", icon: "expand_less",
    instruction: "Levanta los brazos por encima de tu cabeza", target: "up" },
  { id: 2, name: "Brazos abajo", icon: "expand_more",
    instruction: "Baja los brazos completamente", target: "down" },
  { id: 3, name: "Brazos abiertos", icon: "open_in_full",
    instruction: "Abre los brazos a los lados", target: "sides" },
];

export function StretchChallenge({
  state, landmarks, connected, stream, srcVideoRef, onCompleted, onBack
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState({ w: 640, h: 480 });
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [done, setDone] = useState([false, false, false]);
  const [allDone, setAllDone] = useState(false);
  const [holdTimer, setHoldTimer] = useState(0);
  const holdRef = useRef(0);
  const prevLandmarksRef = useRef<any>(null);

  // Assign stream
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

  const handleResize = () => {
    const v = videoRef.current;
    if (v && v.videoWidth > 0) setVideoDims({ w: v.videoWidth, h: v.videoHeight });
  };

  // Detect wrist positions from pose landmarks
  // PoseLandmarker landmarks: 15=left_wrist, 16=right_wrist, 0=nose, 11=left_shoulder, 12=right_shoulder
  useEffect(() => {
    if (allDone || !landmarks || !landmarks.points || landmarks.points.length === 0) {
      if (holdRef.current > 0) { holdRef.current--; setHoldTimer(holdRef.current); }
      return;
    }

    // Avoid processing same landmarks twice
    if (prevLandmarksRef.current === landmarks) return;
    prevLandmarksRef.current = landmarks;

    // Find wrist points (id 15 = left wrist, id 16 = right wrist, id 0 = nose)
    const leftWrist = landmarks.points.find((p: any) => p.id === 15);
    const rightWrist = landmarks.points.find((p: any) => p.id === 16);
    const nose = landmarks.points.find((p: any) => p.id === 0);
    const leftShoulder = landmarks.points.find((p: any) => p.id === 11);
    const rightShoulder = landmarks.points.find((p: any) => p.id === 12);

    if (!leftWrist || !rightWrist || !nose) {
      holdRef.current = Math.max(0, holdRef.current - 1);
      setHoldTimer(holdRef.current);
      return;
    }

    const target = CHALLENGES[currentChallenge]?.target;
    if (!target) return;

    let match = false;

    if (target === "up") {
      // Both wrists above nose
      match = leftWrist.y < nose.y && rightWrist.y < nose.y;
    } else if (target === "down") {
      // Both wrists below shoulders significantly
      const shoulderY = leftShoulder ? leftShoulder.y : 0.5;
      match = leftWrist.y > shoulderY + 0.15 && rightWrist.y > shoulderY + 0.15;
    } else if (target === "sides") {
      // Wrists far apart horizontally (wider than shoulders)
      if (leftShoulder && rightShoulder) {
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
        const wristWidth = Math.abs(leftWrist.x - rightWrist.x);
        match = wristWidth > shoulderWidth * 1.4;
      } else {
        match = Math.abs(leftWrist.x - rightWrist.x) > 0.5;
      }
    }

    if (match) {
      holdRef.current = Math.min(holdRef.current + 2, 25);
      setHoldTimer(holdRef.current);
      if (holdRef.current >= 20) {
        // Challenge complete!
        const newDone = [...done];
        newDone[currentChallenge] = true;
        setDone(newDone);
        holdRef.current = 0;
        setHoldTimer(0);
        if (currentChallenge < 2) {
          setTimeout(() => setCurrentChallenge((c) => c + 1), 800);
        } else {
          setAllDone(true);
        }
      }
    } else {
      holdRef.current = Math.max(0, holdRef.current - 1);
      setHoldTimer(holdRef.current);
    }
  }, [landmarks, currentChallenge, allDone]);

  const challenge = CHALLENGES[currentChallenge];
  const holdProgress = Math.min(100, (holdTimer / 20) * 100);

  return (
    <div className="stretch-overlay">
      <div className="stretch-layout">
        <div className="stretch-camera">
          <video ref={videoRef} autoPlay playsInline muted className="stretch-video"
            onLoadedMetadata={handleResize} onResize={handleResize} />
          <LandmarkOverlay landmarks={landmarks} videoWidth={videoDims.w}
            videoHeight={videoDims.h} isGood={holdProgress > 50} visible={true} />
          <div className="stretch-camera__badge">
            <span className={`stretch-dot ${connected ? "on" : ""}`} />
            {connected ? "Detectando cuerpo" : "Conectando..."}
          </div>
          {holdTimer > 0 && !allDone && (
            <div className="stretch-hold-bar">
              <div className="stretch-hold-bar__fill" style={{ width: `${holdProgress}%` }} />
            </div>
          )}
          {!allDone && holdProgress > 50 && (
            <div className="stretch-matching">✓ ¡Mantén!</div>
          )}
        </div>

        <div className="stretch-panel">
          <button className="stretch-back" onClick={onBack}>
            <span className="material-symbols-rounded">arrow_back</span> Volver
          </button>

          <div className="stretch-header">
            <span className="material-symbols-rounded stretch-header__icon">fitness_center</span>
            <h1>Estiramiento</h1>
            <span className="stretch-header__sub">3 retos • Mueve tu cuerpo</span>
          </div>

          <div className="stretch-progress">
            {CHALLENGES.map((c, i) => (
              <div key={c.id} className={`stretch-progress__step ${done[i] ? "done" : ""} ${i === currentChallenge && !allDone ? "active" : ""}`}>
                <span className="material-symbols-rounded">{c.icon}</span>
                <span>{c.name}</span>
                {done[i] && <span className="stretch-progress__check">✓</span>}
              </div>
            ))}
          </div>

          {!allDone && (
            <div className="stretch-current">
              <div className="stretch-current__header">
                <span className="material-symbols-rounded">{challenge.icon}</span>
                <h2>Reto {currentChallenge + 1}: {challenge.name}</h2>
              </div>
              <p className="stretch-current__status" style={{ color: holdProgress > 50 ? "#34d399" : "#60a5fa" }}>
                {holdProgress > 50 ? "¡Bien! Mantén la posición..." : challenge.instruction}
              </p>
              <div className="stretch-bar">
                <div className="stretch-bar__fill" style={{ width: `${holdProgress}%`, background: holdProgress > 80 ? "#34d399" : "#7c3aed" }} />
              </div>
              <span className="stretch-bar__label">
                {holdProgress > 0 ? `Manteniendo... ${Math.round(holdProgress)}%` : "Mantén la posición 1 segundo"}
              </span>
            </div>
          )}

          {allDone && (
            <div className="stretch-done">
              <img src="/gato sentado-02.png" alt="Blizzy" className="stretch-done__img" />
              <h3>🎉 ¡Estiramiento completado!</h3>
              <p>Completaste los 3 retos. ¡Tu cuerpo te lo agradece!</p>
              <button className="stretch-done__btn" onClick={onCompleted}>
                <span className="material-symbols-rounded">star</span> Reclamar +20 XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
