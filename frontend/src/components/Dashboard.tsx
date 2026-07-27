import { useState, useEffect, useRef, useCallback } from "react";
import "./Dashboard.css";

interface DashboardProps {
  points: number;
  missionsCompleted: number;
  cameraActive: boolean;
  cameraError: string | null;
  connected: boolean;
  state: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartPostura: () => void;
  onStartPausa: () => void;
  onStartPingPong: () => void;
  onBackToLanding: () => void;
}

export function Dashboard({
  points,
  missionsCompleted,
  cameraActive,
  cameraError,
  connected,
  state,
  videoRef,
  onStartCamera,
  onStopCamera,
  onStartPostura,
  onStartPausa,
  onStartPingPong,
  onBackToLanding,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"inicio" | "misiones">("inicio");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionMinutes] = useState(25);
  const intervalRef = useRef<number | null>(null);
  const displayVideoRef = useRef<HTMLVideoElement>(null);

  // Assign camera stream to display video
  useEffect(() => {
    const video = displayVideoRef.current;
    const srcVideo = videoRef.current;
    if (video && srcVideo && srcVideo.srcObject) {
      const stream = srcVideo.srcObject as MediaStream;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    }
  });

  // Timer
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimerSeconds((s) => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timerSeconds]);

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      setTimerRunning(false);
    } else {
      if (timerSeconds === 0) setTimerSeconds(sessionMinutes * 60);
      setTimerRunning(true);
    }
  }, [timerRunning, timerSeconds, sessionMinutes]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timerSeconds / (sessionMinutes * 60);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);
  const level = Math.floor(points / 200) + 1;
  const levelName = level <= 3 ? "Dev Starter" : level <= 6 ? "Dev Mind" : "Dev Master";

  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar__logo">
          <span className="material-symbols-rounded">pets</span>
          <span>BreakPoint</span>
        </div>
        <nav className="dash-sidebar__nav">
          <button className={`dash-sidebar__item ${activeTab === "inicio" ? "active" : ""}`} onClick={() => setActiveTab("inicio")}>
            <span className="material-symbols-rounded">home</span> Inicio
          </button>
          <button className={`dash-sidebar__item ${activeTab === "misiones" ? "active" : ""}`} onClick={() => setActiveTab("misiones")}>
            <span className="material-symbols-rounded">rocket_launch</span> Misiones
          </button>
        </nav>
        <div className="dash-sidebar__user">
          <div className="dash-sidebar__user-avatar">
            <span className="material-symbols-rounded">pets</span>
          </div>
          <div className="dash-sidebar__user-info">
            <span className="dash-sidebar__user-name">Blizzy</span>
            <span className="dash-sidebar__user-level">Nivel {level}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header__greeting">
            <h1>¡Hola, Dev! 👋</h1>
            <p>Estás haciendo un gran trabajo.</p>
          </div>
          <div className="dash-header__streak">
            <span className="material-symbols-rounded">local_fire_department</span>
            Racha 🔥 7 días
          </div>
        </header>

        <div className="dash-content">
          {/* ===== TAB INICIO: Solo la imagen ===== */}
          {activeTab === "inicio" && (
            <div className="dash-inicio">
              <img src="/tu-bienestar.png" alt="Tu bienestar, tu mejor código" className="dash-inicio__img" />
            </div>
          )}

          {/* ===== TAB MISIONES: Camera + Missions + Stats + Timer ===== */}
          {activeTab === "misiones" && (
            <>
              {/* Camera */}
              <div className="dash-card dash-camera-area">
                {!cameraActive ? (
                  <div className="dash-camera-area__off">
                    <img src="/gato sobre el compu-14.png" alt="Blizzy" className="dash-camera-area__mascot" />
                    <div className="dash-camera-area__bubble">
                      <h4>¡Activa tu cámara!</h4>
                      <p>Necesitas la cámara para las misiones. 💜</p>
                    </div>
                    {cameraError && <p className="dash-camera-area__error">{cameraError}</p>}
                    <button className="dash-camera-area__btn" onClick={onStartCamera}>
                      <span className="material-symbols-rounded">videocam</span> Activar Cámara
                    </button>
                  </div>
                ) : (
                  <div className="dash-camera-area__on">
                    <video ref={displayVideoRef} autoPlay playsInline muted className="dash-camera-area__video" />
                    <div className="dash-camera-area__badge">
                      <span className="dash-camera-area__dot" style={{ background: connected ? "#34d399" : "#f59e0b" }} />
                      {connected ? "Conectado" : "Conectando..."}
                    </div>
                    <button className="dash-camera-area__stop" onClick={onStopCamera}>
                      <span className="material-symbols-rounded">videocam_off</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Missions */}
              <div className="dash-missions-section">
                <h3>Misiones disponibles</h3>
                <div className="dash-missions-grid">
                  <button className="dash-card dash-mission" onClick={onStartPostura} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--green">visibility</span>
                    <h4>Monitor de Postura</h4>
                    <p>Detecta mala postura en tiempo real con IA</p>
                    <span className="dash-mission__reward">+10 XP</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartPausa} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--blue">self_improvement</span>
                    <h4>Pausa Activa</h4>
                    <p>Ejercicio guiado de giro de cuello</p>
                    <span className="dash-mission__reward">+10 XP</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartPingPong} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--orange">sports_tennis</span>
                    <h4>AR Ping Pong</h4>
                    <p>Juega ping pong con tus manos en AR</p>
                    <span className="dash-mission__reward">+20 XP</span>
                  </button>
                </div>
                {!cameraActive && <p className="dash-missions-section__hint">Activa la cámara para comenzar una misión</p>}
              </div>

              {/* Stats */}
              <div className="dash-stats-row">
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top">
                    <span className="dash-stat__label">XP Total</span>
                    <span className="material-symbols-rounded dash-stat__icon dash-stat__icon--purple">star</span>
                  </div>
                  <span className="dash-stat__value">{points.toLocaleString()}</span>
                  <span className="dash-stat__sub">+{Math.min(points, 120)} XP hoy</span>
                </div>
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top">
                    <span className="dash-stat__label">Nivel</span>
                    <span className="material-symbols-rounded dash-stat__icon dash-stat__icon--green">trending_up</span>
                  </div>
                  <span className="dash-stat__value">{level}</span>
                  <span className="dash-stat__sub">{levelName}</span>
                </div>
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top">
                    <span className="dash-stat__label">Misiones</span>
                    <span className="material-symbols-rounded dash-stat__icon dash-stat__icon--blue">target</span>
                  </div>
                  <span className="dash-stat__value">{missionsCompleted}</span>
                  <span className="dash-stat__sub">esta semana</span>
                </div>
              </div>

              {/* Timer */}
              <div className="dash-card dash-timer-big">
                <span className="dash-timer__label">Tiempo de enfoque</span>
                <div className="dash-timer__display">
                  <span className="dash-timer__time">{formatTime(timerSeconds)}</span>
                  <svg className="dash-timer__ring" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1f1f3a" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#7c3aed" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                  </svg>
                </div>
                <div className="dash-timer__controls">
                  <span className="dash-timer__session">Sesión de {sessionMinutes} min</span>
                  <button className="dash-timer__btn" onClick={toggleTimer}>
                    {timerRunning ? "Pausar sesión" : "Iniciar sesión"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
