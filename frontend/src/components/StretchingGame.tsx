import { useRef, useState, useEffect, useCallback } from "react";
import type { DrawableLandmarks } from "../types/posture";
import { LandmarkOverlay } from "./LandmarkOverlay";
import "./StretchingGame.css";

/**
 * StretchingGame — 3 retos de estiramiento con detección de pose.
 * 
 * Reto 1: Levantar hombros (encoge los hombros arriba)
 * Reto 2: Inclinar cabeza a la derecha e izquierda
 * Reto 3: Llevar mentón al pecho (bajar la cabeza)
 * 
 * Usa PoseLandmarker del backend para detectar movimientos.
 */

interface StretchingGameProps {
  exercise: any;
  landmarks: DrawableLandmarks | undefined;
  connected: boolean;
  stream: MediaStream | null;
  srcVideoRef: React.RefObject<HTMLVideoElement>;
  onCompleted: () => void;
  onBack: () => void;
}

interface Challenge {
  id: number;
  name: string;
  icon: string;
  instruction: string;
  target: number; // reps needed
}

const CHALLENGES: Challenge[] = [
  { id: 1, name: "Hombros arriba", icon: "arrow_upward", instruction: "Sube los hombros hasta las orejas y baja lentamente", target: 3 },
  { id: 2, name: "Cabeza lateral", icon: "swap_horiz", instruction: "Inclina la cabeza hacia un lado y luego al otro", target: 4 },
  { id: 3, name: "Mentón al pecho", icon: "arrow_downward", instruction: "Baja la cabeza llevando el mentón al pecho y sube", target: 3 },
];

export function StretchingGame({ exercise, landmarks, connected, stream, srcVideoRef, onCompleted, onBack }: StretchingGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [reps, setReps] = useState([0, 0, 0]);
  const [allDone, setAllDone] = useState(false);
  const [videoDims, setVideoDims] = useState({ w: 640, h: 480 });
  const [feedback, setFeedback] = useState("Prepárate...");
  const [feedbackColor, setFeedbackColor] = useState("#60a5fa");

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

  // Use exercise state from backend for reps counting
  useEffect(() => {
    if (!exercise) return;
    const ch = CHALLENGES[currentChallenge];
    if (!ch) return;

    const currentReps = exercise.currentReps || 0;
    const newReps = [...reps];
    newReps[currentChallenge] = Math.min(currentReps, ch.target);
    setReps(newReps);

    if (currentReps >= ch.target) {
      if (currentChallenge < 2) {
        setFeedback("✅ ¡Reto completado! Siguiente...");
        setFeedbackColor("#34d399");
        setTimeout(() => {
          setCurrentChallenge((c) => c + 1);
          setFeedback("Prepárate...");
          setFeedbackColor("#60a5fa");
        }, 1500);
      } else {
        setAllDone(true);
        setFeedback("🎉 ¡Todos los retos completados!");
        setFeedbackColor("#a78bfa");
      }
    } else {
      const pos = exercise.position || "center";
      if (pos === "left" || pos === "right") {
        setFeedback("🔄 ¡Bien! Vuelve al centro");
        setFeedbackColor("#f59e0b");
      } else {
        setFeedback(ch.instruction);
        setFeedbackColor("#60a5fa");
      }
    }
  }, [exercise, currentChallenge]);

  const handleResize = useCallback(() => {
    const v = videoRef.current;
    if (v && v.videoWidth > 0) setVideoDims({ w: v.videoWidth, h: v.videoHeight });
  }, []);

  const ch = CHALLENGES[currentChallenge];
  const totalProgress = reps.reduce((a, b) => a + b, 0);
  const totalTarget = CHALLENGES.reduce((a, c) => a + c.target, 0);

  return (
    <div className="stretch-overlay">
      <div className="stretch-card">
        <button className="stretch-back" onClick={onBack}>
          <span className="material-symbols-rounded">arrow_back</span> Volver
        </button>

        <h2 className="stretch-title">
          <span className="material-symbols-rounded">fitness_center</span>
          Retos de Estiramiento
        </h2>

        {/* Challenge indicators */}
        <div className="stretch-challenges">
          {CHALLENGES.map((c, i) => (
            <div key={c.id} className={`stretch-challenge ${i === currentChallenge ? "active" : ""} ${reps[i] >= c.target ? "done" : ""}`}>
              <span className="material-symbols-rounded">{c.icon}</span>
              <span>{c.name}</span>
              <span className="stretch-challenge__reps">{reps[i]}/{c.target}</span>
            </div>
          ))}
        </div>

        {/* Video */}
        <div className="stretch-video-wrap">
          <video ref={videoRef} autoPlay playsInline muted className="stretch-video"
            onLoadedMetadata={handleResize} onResize={handleResize} />
          <LandmarkOverlay landmarks={landmarks} videoWidth={videoDims.w} videoHeight={videoDims.h}
            isGood={allDone || feedback.includes("Bien")} visible={true} />
          <div className="stretch-feedback" style={{ color: feedbackColor }}>
            {feedback}
          </div>
        </div>

        {/* Progress */}
        <div className="stretch-progress">
          <div className="stretch-progress__bar">
            <div className="stretch-progress__fill" style={{ width: `${(totalProgress / totalTarget) * 100}%` }} />
          </div>
          <span className="stretch-progress__text">{totalProgress}/{totalTarget} movimientos</span>
        </div>

        {/* Current challenge info */}
        {!allDone && (
          <div className="stretch-current">
            <span className="material-symbols-rounded">{ch.icon}</span>
            <div>
              <strong>Reto {currentChallenge + 1}: {ch.name}</strong>
              <p>{ch.instruction}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="stretch-actions">
          {allDone ? (
            <button className="stretch-btn stretch-btn--done" onClick={onCompleted}>
              <span className="material-symbols-rounded">celebration</span>
              Reclamar +20 XP
            </button>
          ) : (
            <button className="stretch-btn stretch-btn--skip" onClick={onBack}>
              Saltar
            </button>
          )}
        </div>

        {!connected && <p className="stretch-reconnecting">🔄 Reconectando...</p>}
      </div>
    </div>
  );
}
