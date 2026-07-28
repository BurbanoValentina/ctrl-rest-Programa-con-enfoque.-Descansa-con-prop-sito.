import { useState, useEffect, useRef, useCallback } from "react";
import { getPerfil, actualizarPerfil, completarPausa } from "../services/api";
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
  onStartPaint: () => void;
  onStartMemes: () => void;
  onStartStretch: () => void;
  onBackToLanding: () => void;
  onLogout: () => void;
  onAddPoints: (pts: number) => void;
  onAddMission: () => void;
  userName: string;
}

type Tab = "inicio" | "misiones" | "tienda" | "progreso" | "regalos" | "comunidad" | "relax";

const PHRASES = [
  "¡Tú puedes! Recuerda tomar descansos. 💜",
  "Un break a tiempo previene el burnout. 🌟",
  "Tu salud es tu mejor inversión. 🧘",
  "Cada pausa te hace más productivo. ⚡",
  "¡Sigue así, dev imparable! 🚀",
  "Código limpio, mente limpia. ✨",
  "Respira hondo, el bug puede esperar. 🐛",
  "¡Hoy es un gran día para codear! 🎉",
];

const CAT_IMAGES = [
  "/gato sentado-02.png",
  "/gato computador-02.png",
  "/gato sobre el compu-14.png",
  "/gato computador-02-02.png",
];

const SHOP_ITEMS = [
  { id: 1, name: "Blizzy Coder", img: "/gato computador-02.png", price: 30 },
  { id: 2, name: "Blizzy Zen", img: "/gato sentado-02.png", price: 50 },
  { id: 3, name: "Blizzy Pro", img: "/gato sobre el compu-14.png", price: 80 },
  { id: 4, name: "Blizzy Dark", img: "/gato computador-02-02.png", price: 100 },
  { id: 5, name: "Huellitas", img: "/huellitas-03.png", price: 40 },
  { id: 6, name: "Compu Gamer", img: "/computadora-17.png", price: 60 },
  { id: 7, name: "Símbolo Místico", img: "/Símbolo-12-13.png", price: 90 },
  { id: 8, name: "Símbolo Power", img: "/Símbolo-12-14.png", price: 120 },
  { id: 9, name: "Galaxia 1", img: "/g1-02.png", price: 25 },
  { id: 10, name: "Galaxia 2", img: "/g3-02.png", price: 25 },
  { id: 11, name: "Galaxia 3", img: "/g4-02.png", price: 35 },
  { id: 12, name: "Galaxia 4", img: "/g6-02.png", price: 35 },
  { id: 13, name: "Avatar Gato 1", img: "/ga1-02.png", price: 45 },
  { id: 14, name: "Avatar Gato 2", img: "/ga2-02.png", price: 45 },
  { id: 15, name: "Avatar Gato 3", img: "/ga3-02.png", price: 55 },
  { id: 16, name: "Avatar Gato 4", img: "/ga4-02.png", price: 55 },
  { id: 17, name: "Avatar Gato 5", img: "/ga6-02.png", price: 70 },
  { id: 18, name: "Avatar Gato 6", img: "/ga7-02.png", price: 70 },
  { id: 19, name: "Avatar Gato 7", img: "/ga8-02.png", price: 85 },
  { id: 20, name: "Avatar Gato 8", img: "/ga9-02.png", price: 85 },
  { id: 21, name: "Huellas 1", img: "/h1-02.png", price: 20 },
  { id: 22, name: "Huellas 2", img: "/h2-02.png", price: 20 },
  { id: 23, name: "Huellas 3", img: "/h3-02.png", price: 30 },
  { id: 24, name: "Huellas 4", img: "/h4-02.png", price: 30 },
];

const TIMER_OPTIONS = [5, 10, 15, 25, 30, 45];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const PROFILE_BG_COLORS = [
  { id: "bg1", name: "Morado", color: "#7c3aed", price: 15 },
  { id: "bg2", name: "Azul", color: "#3b82f6", price: 15 },
  { id: "bg3", name: "Verde", color: "#10b981", price: 20 },
  { id: "bg4", name: "Rosa", color: "#ec4899", price: 20 },
  { id: "bg5", name: "Naranja", color: "#f59e0b", price: 25 },
  { id: "bg6", name: "Rojo", color: "#ef4444", price: 25 },
  { id: "bg7", name: "Cyan", color: "#06b6d4", price: 30 },
  { id: "bg8", name: "Indigo", color: "#6366f1", price: 30 },
];

const THEME_COLORS = [
  { id: "th1", name: "Noche Oscura", bg: "#0c0c1e", accent: "#7c3aed", price: 0 },
  { id: "th2", name: "Océano", bg: "#0a192f", accent: "#64ffda", price: 40 },
  { id: "th3", name: "Bosque", bg: "#0d1117", accent: "#34d399", price: 40 },
  { id: "th4", name: "Atardecer", bg: "#1a0a2e", accent: "#f472b6", price: 50 },
  { id: "th5", name: "Café", bg: "#1c1410", accent: "#d97706", price: 50 },
  { id: "th6", name: "Nebula", bg: "#0f0720", accent: "#a78bfa", price: 60 },
];

export function Dashboard({
  points, missionsCompleted, cameraActive, cameraError, connected, state, videoRef,
  onStartCamera, onStopCamera, onStartPostura, onStartPausa, onStartPingPong, onStartPaint, onStartMemes, onStartStretch, onBackToLanding, onLogout,
  onAddPoints, onAddMission, userName,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [blizzyPhrase, setBlizzyPhrase] = useState(0);
  const [blizzyPose, setBlizzyPose] = useState(0);
  const [ownedAvatars, setOwnedAvatars] = useState<number[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState("/gato sentado-02.png");
  const [nickname, setNickname] = useState(userName);
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState("Dev");
  const [coins, setCoins] = useState(points);
  const [streakDays, setStreakDays] = useState([false, false, false, false, false, false, false]);
  const [showReward, setShowReward] = useState<{ xp: number; coins: number; message: string } | null>(null);
  const [levelUpReward, setLevelUpReward] = useState<string | null>(null);
  const [profileBg, setProfileBg] = useState("#7c3aed");
  const [ownedBgs, setOwnedBgs] = useState<string[]>(["bg1"]);
  const [themeBg, setThemeBg] = useState("#0c0c1e");
  const [themeAccent, setThemeAccent] = useState("#7c3aed");
  const [ownedThemes, setOwnedThemes] = useState<string[]>(["th1"]);
  const [communityMsg, setCommunityMsg] = useState("");
  const [communityPosts, setCommunityPosts] = useState([
    { id: 1, user: "DevCat99", avatar: "/ga1-02.png", text: "¡Me encanta la idea de las pausas activas! El ping pong AR es genial 🏓", time: "Hace 2h" },
    { id: 2, user: "CodeZen", avatar: "/ga3-02.png", text: "La detección de postura me ayudó mucho, ya no me encorvo tanto 🧘", time: "Hace 5h" },
    { id: 3, user: "NightOwl", avatar: "/ga6-02.png", text: "Las monedas y la tienda motivan mucho a seguir tomando pausas 💜", time: "Hace 1d" },
  ]);
  const intervalRef = useRef<number | null>(null);
  const displayVideoRef = useRef<HTMLVideoElement>(null);

  const level = Math.floor(points / 100) + 1;
  const levelName = level <= 2 ? "Dev Starter" : level <= 5 ? "Dev Mind" : level <= 8 ? "Dev Master" : "Dev Legend";
  const xpForNext = 100 - (points % 100);
  const xpProgress = (points % 100);

  // Cargar datos guardados del perfil al montar
  useEffect(() => {
    getPerfil().then((perfil) => {
      if (perfil.monedas !== undefined) setCoins(perfil.monedas);
      if (perfil.itemsComprados) setOwnedAvatars(perfil.itemsComprados.filter((i: string) => i.startsWith("av_")).map((i: string) => parseInt(i.replace("av_", ""))));
      if (perfil.itemsComprados) setOwnedBgs(perfil.itemsComprados.filter((i: string) => i.startsWith("bg")) || ["bg1"]);
      if (perfil.itemsComprados) setOwnedThemes(perfil.itemsComprados.filter((i: string) => i.startsWith("th")) || ["th1"]);
      if (perfil.avatar) setSelectedAvatar(perfil.avatar);
      if (perfil.tema) { const t = JSON.parse(perfil.tema); setThemeBg(t.bg); setThemeAccent(t.accent); }
      if (perfil.fondoPerfil) setProfileBg(perfil.fondoPerfil);
    }).catch(() => {});
  }, []);

  // Sync coins with points from parent
  useEffect(() => {
    setCoins((prev) => {
      const diff = points - prev;
      if (diff > 0) return prev + diff;
      return prev;
    });
    // Fill streak when missions are completed
    if (missionsCompleted > 0) {
      setStreakDays((sd) => {
        const filled = sd.filter(Boolean).length;
        if (filled < missionsCompleted && filled < 7) {
          const next = [...sd];
          next[filled] = true;
          return next;
        }
        return sd;
      });
    }
  }, [points, missionsCompleted]);

  // Camera stream
  useEffect(() => {
    const video = displayVideoRef.current;
    const srcVideo = videoRef.current;
    if (video && srcVideo && srcVideo.srcObject) {
      const stream = srcVideo.srcObject as MediaStream;
      if (video.srcObject !== stream) { video.srcObject = stream; video.play().catch(() => {}); }
    }
  });

  // Blizzy rotation
  useEffect(() => {
    const t = setInterval(() => {
      setBlizzyPhrase((p) => (p + 1) % PHRASES.length);
      setBlizzyPose((p) => (p + 1) % CAT_IMAGES.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Timer
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = window.setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      completeTimer();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timerSeconds]);

  // Level up check
  useEffect(() => {
    const newLevel = Math.floor(points / 100) + 1;
    if (newLevel > level && newLevel > 1) {
      const reward = SHOP_ITEMS[Math.min(newLevel - 2, SHOP_ITEMS.length - 1)];
      if (reward && !ownedAvatars.includes(reward.id)) {
        setOwnedAvatars((o) => [...o, reward.id]);
        setLevelUpReward(reward.name);
        setTimeout(() => setLevelUpReward(null), 4000);
      }
    }
  }, [points]);

  const completeTimer = () => {
    const earned = sessionMinutes >= 25 ? 30 : sessionMinutes >= 15 ? 20 : 10;
    setCoins((c) => c + earned);
    onAddPoints(earned);
    // Fill next streak day
    setStreakDays((sd) => {
      const next = [...sd];
      const idx = next.indexOf(false);
      if (idx !== -1) next[idx] = true;
      return next;
    });
    setShowReward({ xp: earned, coins: earned, message: "¡Sesión completada!" });
    setTimeout(() => setShowReward(null), 4000);
  };

  const toggleTimer = useCallback(() => {
    if (timerRunning) { setTimerRunning(false); }
    else { if (timerSeconds === 0) setTimerSeconds(sessionMinutes * 60); setTimerRunning(true); }
  }, [timerRunning, timerSeconds, sessionMinutes]);

  const selectTime = (mins: number) => {
    setSessionMinutes(mins);
    setTimerSeconds(mins * 60);
    setShowTimerPicker(false);
    setTimerRunning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60); const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timerSeconds / (sessionMinutes * 60);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  const buyItem = (id: number, price: number) => {
    if (coins >= price && !ownedAvatars.includes(id)) {
      const newCoins = coins - price;
      const newOwned = [...ownedAvatars, id];
      setCoins(newCoins);
      setOwnedAvatars(newOwned);
      // Persistir en backend
      const allItems = [
        ...newOwned.map((i) => `av_${i}`),
        ...ownedBgs,
        ...ownedThemes,
      ];
      actualizarPerfil({ monedas: newCoins, itemsComprados: allItems }).catch(() => {});
    }
  };

  const equipAvatar = (img: string) => {
    setSelectedAvatar(img);
    actualizarPerfil({ avatar: img }).catch(() => {});
  };

  const saveNick = () => {
    setNickname(nickInput);
    setEditingNick(false);
    actualizarPerfil({ nickname: nickInput }).catch(() => {});
  };

  const buyBg = (id: string, price: number) => {
    if (coins >= price && !ownedBgs.includes(id)) {
      const newCoins = coins - price;
      const newBgs = [...ownedBgs, id];
      setCoins(newCoins);
      setOwnedBgs(newBgs);
      const allItems = [
        ...ownedAvatars.map((i) => `av_${i}`),
        ...newBgs,
        ...ownedThemes,
      ];
      actualizarPerfil({ monedas: newCoins, itemsComprados: allItems }).catch(() => {});
    }
  };
  const buyTheme = (id: string, price: number) => {
    if (coins >= price && !ownedThemes.includes(id)) {
      const newCoins = coins - price;
      const newThemes = [...ownedThemes, id];
      setCoins(newCoins);
      setOwnedThemes(newThemes);
      const allItems = [
        ...ownedAvatars.map((i) => `av_${i}`),
        ...ownedBgs,
        ...newThemes,
      ];
      actualizarPerfil({ monedas: newCoins, itemsComprados: allItems }).catch(() => {});
    }
  };

  return (
    <div className="dash" style={{ background: themeBg }}>
      {/* Reward popup */}
      {showReward && (
        <div className="dash-reward-overlay">
          <div className="dash-reward-card">
            <img src="/gato sentado-02.png" alt="Blizzy" className="dash-reward__img" />
            <h2>{showReward.message}</h2>
            <div className="dash-reward__stats">
              <span className="dash-reward__xp">+{showReward.xp} XP</span>
              <span className="dash-reward__coins"><span className="material-symbols-rounded">monetization_on</span> +{showReward.coins}</span>
            </div>
            <p>¡Excelente trabajo! 🎉</p>
          </div>
        </div>
      )}

      {/* Level up popup */}
      {levelUpReward && (
        <div className="dash-levelup-toast">
          <span className="material-symbols-rounded">celebration</span>
          ¡Subiste de nivel! Desbloqueaste: {levelUpReward}
        </div>
      )}

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar__logo">
          <span className="material-symbols-rounded">pets</span>
          <span>Ctrl+Rest</span>
        </div>
        <nav className="dash-sidebar__nav">
          {([["inicio", "home", "Inicio"], ["misiones", "rocket_launch", "Misiones"], ["progreso", "person", "Perfil"], ["tienda", "storefront", "Tienda"], ["regalos", "redeem", "Regalos"], ["comunidad", "forum", "Comunidad"], ["relax", "spa", "Relax"]] as const).map(([tab, icon, label]) => (
            <button key={tab} className={`dash-sidebar__item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab as Tab)}>
              <span className="material-symbols-rounded">{icon}</span> {label}
            </button>
          ))}
        </nav>
        <div className="dash-sidebar__bottom">
          <div className="dash-sidebar__user" onClick={() => setActiveTab("progreso")}>
            <img src={selectedAvatar} alt="avatar" className="dash-sidebar__user-img" />
            <div className="dash-sidebar__user-info">
              <span className="dash-sidebar__user-name">{nickname}</span>
              <span className="dash-sidebar__user-level">Nivel {level}</span>
            </div>
          </div>
          <button className="dash-sidebar__logout" onClick={onLogout}>
            <span className="material-symbols-rounded">logout</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header__greeting">
            <h1>¡Hola, {nickname}! 👋</h1>
            <p>Estás haciendo un gran trabajo.</p>
          </div>
          <div className="dash-header__right">
            <div className="dash-header__coins">
              <span className="material-symbols-rounded">monetization_on</span> {coins}
            </div>
            <div className="dash-header__streak">
              <span className="material-symbols-rounded">local_fire_department</span>
              {streakDays.filter(Boolean).length} días
            </div>
          </div>
        </header>

        <div className="dash-content">

          {/* ===== INICIO ===== */}
          {activeTab === "inicio" && (
            <div className="dash-inicio">
              <div className="dash-inicio__top">
                <div className="dash-card dash-blizzy-bot">
                  <img src={CAT_IMAGES[blizzyPose]} alt="Blizzy" className="dash-blizzy-bot__img" />
                  <div className="dash-blizzy-bot__bubble">
                    <p key={blizzyPhrase}>{PHRASES[blizzyPhrase]}</p>
                  </div>
                </div>
                <div className="dash-card dash-racha">
                  <div className="dash-racha__header">
                    <span className="material-symbols-rounded">local_fire_department</span>
                    <h4>Racha</h4>
                  </div>
                  <div className="dash-racha__number">
                    <span className="dash-racha__big">{streakDays.filter(Boolean).length}</span>
                    <span className="dash-racha__label">días</span>
                  </div>
                  <div className="dash-racha__calendar">
                    {DAYS.map((d, i) => (
                      <div key={i} className={`dash-racha__cell ${streakDays[i] ? "active" : ""}`}>
                        <span className="dash-racha__fire">{streakDays[i] ? "🔥" : "○"}</span>
                        <span className="dash-racha__day-label">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="dash-card dash-timer-card">
                <div className="dash-timer-card__left">
                  <span className="dash-timer-card__label">Tiempo de enfoque</span>
                  <div className="dash-timer-card__time-row">
                    <span className="dash-timer-card__time">{formatTime(timerSeconds)}</span>
                    <svg className="dash-timer-card__ring" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#1f1f3a" strokeWidth="8" />
                      <circle cx="60" cy="60" r="54" fill="none" stroke={timerRunning ? "#7c3aed" : "#374151"} strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                    </svg>
                  </div>
                </div>
                <div className="dash-timer-card__right">
                  <div className="dash-timer-card__picker">
                    <button className="dash-timer-card__picker-btn" onClick={() => setShowTimerPicker(!showTimerPicker)}>
                      {sessionMinutes} min <span className="material-symbols-rounded">expand_more</span>
                    </button>
                    {showTimerPicker && (
                      <div className="dash-timer-card__dropdown">
                        {TIMER_OPTIONS.map((m) => (
                          <button key={m} onClick={() => selectTime(m)} className={sessionMinutes === m ? "active" : ""}>{m} min</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className={`dash-timer-card__start ${timerRunning ? "running" : ""}`} onClick={toggleTimer}>
                    <span className="material-symbols-rounded">{timerRunning ? "pause" : "play_arrow"}</span>
                    {timerRunning ? "Pausar" : "Iniciar"}
                  </button>
                  <span className="dash-timer-card__reward-hint">+{sessionMinutes >= 25 ? 30 : sessionMinutes >= 15 ? 20 : 10} XP al completar</span>
                </div>
              </div>

              {/* Stats */}
              <div className="dash-stats-row">
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top"><span className="dash-stat__label">XP Total</span><span className="material-symbols-rounded dash-stat__icon dash-stat__icon--purple">star</span></div>
                  <span className="dash-stat__value">{points.toLocaleString()}</span>
                  <span className="dash-stat__sub">Nivel {level} • {levelName}</span>
                </div>
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top"><span className="dash-stat__label">Monedas</span><span className="material-symbols-rounded dash-stat__icon dash-stat__icon--gold">monetization_on</span></div>
                  <span className="dash-stat__value">{coins}</span>
                  <span className="dash-stat__sub">Para la tienda</span>
                </div>
                <div className="dash-card dash-stat">
                  <div className="dash-stat__top"><span className="dash-stat__label">Misiones</span><span className="material-symbols-rounded dash-stat__icon dash-stat__icon--blue">target</span></div>
                  <span className="dash-stat__value">{missionsCompleted}</span>
                  <span className="dash-stat__sub">completadas</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== MISIONES ===== */}
          {activeTab === "misiones" && (
            <>
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
              <div className="dash-missions-section">
                <h3>Misiones disponibles</h3>
                <div className="dash-missions-grid">
                  <button className="dash-card dash-mission" onClick={onStartPostura} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--green">visibility</span>
                    <h4>Monitor de Postura</h4>
                    <p>Detecta mala postura en tiempo real con IA</p>
                    <span className="dash-mission__reward">+10 XP • +10 monedas</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartPausa} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--blue">self_improvement</span>
                    <h4>Pausa Activa</h4>
                    <p>Ejercicio guiado de giro de cuello</p>
                    <span className="dash-mission__reward">+15 XP • +15 monedas</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartPingPong} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon dash-mission__icon--orange">sports_tennis</span>
                    <h4>AR Ping Pong</h4>
                    <p>Juega ping pong con tus manos en AR</p>
                    <span className="dash-mission__reward">+20 XP • +20 monedas</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartPaint} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon" style={{color:"#f472b6"}}>brush</span>
                    <h4>AR Paint</h4>
                    <p>Dibuja en el aire con detección de manos</p>
                    <span className="dash-mission__reward">+15 XP • +15 monedas</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartMemes} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon" style={{color:"#fbbf24"}}>sentiment_very_satisfied</span>
                    <h4>Memes de Blizzy</h4>
                    <p>Crea memes con las poses del gato</p>
                    <span className="dash-mission__reward">+10 XP • +10 monedas</span>
                  </button>
                  <button className="dash-card dash-mission" onClick={onStartStretch} disabled={!cameraActive}>
                    <span className="material-symbols-rounded dash-mission__icon" style={{color:"#34d399"}}>fitness_center</span>
                    <h4>Estiramiento</h4>
                    <p>3 retos de estiramiento guiados con IA</p>
                    <span className="dash-mission__reward">+20 XP • +20 monedas</span>
                  </button>
                </div>
                {!cameraActive && <p className="dash-missions-section__hint">Activa la cámara para comenzar una misión</p>}
              </div>
            </>
          )}

          {/* ===== PROGRESO / PERFIL ===== */}
          {activeTab === "progreso" && (
            <div className="dash-progreso">
              <div className="dash-card dash-profile">
                <div className="dash-profile__avatar-wrap" style={{ background: profileBg }}>
                  <img src={selectedAvatar} alt="Avatar" className="dash-profile__avatar" />
                </div>
                <div className="dash-profile__info">
                  {editingNick ? (
                    <div className="dash-profile__edit-row">
                      <input value={nickInput} onChange={(e) => setNickInput(e.target.value)} className="dash-profile__input" maxLength={16} />
                      <button onClick={saveNick} className="dash-profile__save">✓</button>
                    </div>
                  ) : (
                    <div className="dash-profile__name-row">
                      <h3>{nickname}</h3>
                      <button onClick={() => { setEditingNick(true); setNickInput(nickname); }} className="dash-profile__edit-btn">
                        <span className="material-symbols-rounded">edit</span>
                      </button>
                    </div>
                  )}
                  <span className="dash-profile__level">Nivel {level} • {levelName}</span>
                  <div className="dash-profile__xp-bar">
                    <div className="dash-profile__xp-fill" style={{ width: `${xpProgress}%` }}></div>
                  </div>
                  <span className="dash-profile__xp-text">{xpProgress}/100 XP para nivel {level + 1}</span>
                </div>
              </div>
              <div className="dash-progreso__grid">
                <div className="dash-card dash-progreso__card"><span className="material-symbols-rounded">target</span><b>{missionsCompleted}</b><small>Misiones</small></div>
                <div className="dash-card dash-progreso__card"><span className="material-symbols-rounded">star</span><b>{points}</b><small>XP Total</small></div>
                <div className="dash-card dash-progreso__card"><span className="material-symbols-rounded">monetization_on</span><b>{coins}</b><small>Monedas</small></div>
                <div className="dash-card dash-progreso__card"><span className="material-symbols-rounded">local_fire_department</span><b>{streakDays.filter(Boolean).length}</b><small>Racha</small></div>
              </div>
              <div className="dash-profile__avatars">
                <h4>Mis avatares</h4>
                <div className="dash-profile__avatars-grid">
                  {SHOP_ITEMS.filter((it) => ownedAvatars.includes(it.id)).map((it) => (
                    <img key={it.id} src={it.img} alt={it.name}
                      className={`dash-profile__avatar-opt ${selectedAvatar === it.img ? "selected" : ""}`}
                      onClick={() => equipAvatar(it.img)} />
                  ))}
                  {ownedAvatars.length === 0 && <p className="dash-profile__no-avatars">Compra avatares en la tienda</p>}
                </div>
              </div>
            </div>
          )}

          {/* ===== TIENDA ===== */}
          {activeTab === "tienda" && (
            <div className="dash-tienda">
              <div className="dash-tienda__header">
                <h3><span className="material-symbols-rounded">storefront</span> Tienda</h3>
                <div className="dash-tienda__coins">
                  <span className="material-symbols-rounded">monetization_on</span> {coins} monedas
                </div>
              </div>

              {/* Colores de fondo de perfil */}
              <div className="dash-tienda__section">
                <h4><span className="material-symbols-rounded">palette</span> Fondo de perfil</h4>
                <div className="dash-tienda__colors">
                  {PROFILE_BG_COLORS.map((c) => (
                    <div key={c.id} className={`dash-tienda__color-item ${ownedBgs.includes(c.id) ? "owned" : ""}`}>
                      <div className="dash-tienda__color-swatch" style={{ background: c.color }} onClick={() => { if (ownedBgs.includes(c.id)) { setProfileBg(c.color); actualizarPerfil({ fondoPerfil: c.color }).catch(() => {}); } }}>
                        {profileBg === c.color && <span className="material-symbols-rounded">check</span>}
                      </div>
                      <span className="dash-tienda__color-name">{c.name}</span>
                      {!ownedBgs.includes(c.id) && (
                        <button className="dash-tienda__color-buy" onClick={() => buyBg(c.id, c.price)} disabled={coins < c.price}>
                          <span className="material-symbols-rounded">monetization_on</span>{c.price}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Temas de página */}
              <div className="dash-tienda__section">
                <h4><span className="material-symbols-rounded">dark_mode</span> Tema de la página</h4>
                <div className="dash-tienda__themes">
                  {THEME_COLORS.map((t) => (
                    <div key={t.id} className={`dash-card dash-tienda__theme ${ownedThemes.includes(t.id) ? "owned" : ""} ${themeBg === t.bg ? "active-theme" : ""}`}>
                      <div className="dash-tienda__theme-preview" style={{ background: t.bg, borderColor: t.accent }}>
                        <div className="dash-tienda__theme-accent" style={{ background: t.accent }}></div>
                      </div>
                      <span>{t.name}</span>
                      {ownedThemes.includes(t.id) ? (
                        <button className="dash-tienda__btn dash-tienda__btn--owned" onClick={() => { setThemeBg(t.bg); setThemeAccent(t.accent); actualizarPerfil({ tema: JSON.stringify({ bg: t.bg, accent: t.accent }) }).catch(() => {}); }}>
                          {themeBg === t.bg ? "✓ Activo" : "Usar"}
                        </button>
                      ) : (
                        <button className="dash-tienda__btn" onClick={() => buyTheme(t.id, t.price)} disabled={coins < t.price}>
                          <span className="material-symbols-rounded">monetization_on</span> {t.price}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatares */}
              <div className="dash-tienda__section">
                <h4><span className="material-symbols-rounded">face</span> Avatares</h4>
                <div className="dash-tienda__grid">
                  {SHOP_ITEMS.map((item) => (
                    <div key={item.id} className={`dash-card dash-tienda__item ${ownedAvatars.includes(item.id) ? "owned" : ""}`}>
                      <img src={item.img} alt={item.name} className="dash-tienda__item-img" />
                      <h4>{item.name}</h4>
                      {ownedAvatars.includes(item.id) ? (
                        <button className="dash-tienda__btn dash-tienda__btn--owned" onClick={() => equipAvatar(item.img)}>
                          {selectedAvatar === item.img ? "✓ Equipado" : "Usar"}
                        </button>
                      ) : (
                        <button className="dash-tienda__btn" onClick={() => buyItem(item.id, item.price)} disabled={coins < item.price}>
                          <span className="material-symbols-rounded">monetization_on</span> {item.price}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== REGALOS ===== */}
          {activeTab === "regalos" && (
            <div className="dash-regalos">
              <h3><span className="material-symbols-rounded">redeem</span> Regalos y Bonificaciones</h3>
              <div className="dash-regalos__grid">
                <div className="dash-card dash-regalos__qr">
                  <span className="material-symbols-rounded dash-regalos__qr-icon">qr_code_2</span>
                  <h4>Escanea el QR</h4>
                  <p>Dale like a nuestro post en LinkedIn y gana 50 monedas</p>
                  <div className="dash-regalos__qr-code">
                    <span className="material-symbols-rounded">qr_code</span>
                  </div>
                  <span className="dash-regalos__qr-hint">Escanea → Dale like → Sube captura</span>
                </div>
                <div className="dash-card dash-regalos__upload">
                  <h4><span className="material-symbols-rounded">cloud_upload</span> Sube tu captura</h4>
                  <p>Toma una captura de pantalla del like en el post y súbela aquí para reclamar tus monedas</p>
                  <label className="dash-regalos__upload-area">
                    <input type="file" accept="image/*" className="dash-regalos__upload-input" onChange={() => {
                      const newCoins = coins + 50;
                      setCoins(newCoins);
                      onAddPoints(50);
                      setShowReward({ xp: 50, coins: 50, message: "¡Captura recibida!" });
                      setTimeout(() => setShowReward(null), 4000);
                      // Persistir: sumar monedas y registrar actividad
                      actualizarPerfil({ monedas: newCoins }).catch(() => {});
                      completarPausa({ tipo: "regalo", actividad: "captura-linkedin", duracionSegundos: 10 }).catch(() => {});
                    }} />
                    <span className="material-symbols-rounded">add_photo_alternate</span>
                    <span>Haz clic o arrastra tu captura aquí</span>
                  </label>
                  <p className="dash-regalos__upload-note">Al subir la captura recibirás +50 monedas automáticamente</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== COMUNIDAD ===== */}
          {activeTab === "comunidad" && (
            <div className="dash-comunidad">
              <h3><span className="material-symbols-rounded">forum</span> Comunidad</h3>
              <p className="dash-comunidad__desc">Deja tu opinión, comparte tu experiencia o sugiere mejoras</p>
              <div className="dash-card dash-comunidad__form">
                <textarea className="dash-comunidad__textarea" placeholder="Escribe tu mensaje aquí... ¿Qué te pareció la plataforma? ¿Qué mejorarías?" rows={4} value={communityMsg} onChange={(e) => setCommunityMsg(e.target.value)}></textarea>
                <button className="dash-comunidad__send" onClick={() => { if (communityMsg.trim()) { setCommunityPosts([{ id: Date.now(), user: nickname, avatar: selectedAvatar, text: communityMsg.trim(), time: "Ahora" }, ...communityPosts]); setCommunityMsg(""); } }}>
                  <span className="material-symbols-rounded">send</span> Publicar
                </button>
              </div>
              <div className="dash-comunidad__messages">
                <h4>Opiniones recientes</h4>
                {communityPosts.map((post) => (
                  <div key={post.id} className="dash-card dash-comunidad__msg">
                    <div className="dash-comunidad__msg-header"><img src={post.avatar} alt="" className="dash-comunidad__msg-avatar" /><span>{post.user}</span><small>{post.time}</small></div>
                    <p>{post.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== RELAX ===== */}
          {activeTab === "relax" && (
            <div className="dash-relax">
              <h3><span className="material-symbols-rounded">spa</span> Zona Relax</h3>
              <p className="dash-relax__desc">Tómate un momento para respirar y relajarte. Disfruta la animación. 🕯️</p>
              <div className="dash-relax__folleto">
                <h4><span className="material-symbols-rounded">menu_book</span> Información sobre lesiones</h4>
                <iframe src="https://www.covver.com/embed/h8r1HZC2t2Ma8iTyvc1n" width="100%" height="500" style={{border:"none",borderRadius:"16px"}} allowFullScreen allow="web-share"></iframe>
              </div>
              <div className="dash-relax__folleto">
                <h4><span className="material-symbols-rounded">self_improvement</span> Guía de bienestar</h4>
                <iframe src="https://www.covver.com/embed/TFMMUI4XT3mNebCC2L7D" width="100%" height="580" style={{border:"none",borderRadius:"16px"}} allowFullScreen allow="web-share"></iframe>
              </div>
              <div className="dash-relax__candle-wrapper">
                <div className="candle-scene">
                  <div className="candle-light-wave"></div>
                  <div className="candle1">
                    <div className="candle1-body">
                      <div className="candle1-eyes"><span className="candle1-eye-one"></span><span className="candle1-eye-two"></span></div>
                      <div className="candle1-mouth"></div>
                    </div>
                    <div className="candle1-stick"></div>
                  </div>
                  <div className="candle2">
                    <div className="candle2-body">
                      <div className="candle2-eyes"><div className="candle2-eye-one"></div><div className="candle2-eye-two"></div></div>
                    </div>
                    <div className="candle2-stick"></div>
                  </div>
                  <div className="candle2-fire"></div>
                  <div className="candle-sparkles-one"></div>
                  <div className="candle-sparkles-two"></div>
                  <div className="candle-smoke-one"></div>
                  <div className="candle-smoke-two"></div>
                  <div className="candle-floor"></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
