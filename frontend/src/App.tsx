import { useState, useEffect, useCallback, useRef } from "react";
import { PausaScreen } from "./components/PausaScreen";
import { PingPongGame } from "./components/PingPongGame";
import { ARPaintGame } from "./components/ARPaintGame";
import { MemeGenerator } from "./components/MemeGenerator";
import { StretchChallenge } from "./components/StretchChallenge";
import { LandingPage } from "./components/LandingPage";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { usePostureSensor } from "./hooks/usePostureSensor";
import { getCurrentUser, signOut } from "./services/auth";
import { getPerfil, actualizarPerfil } from "./services/api";
import type { AuthUser } from "./services/auth";
import "./App.css";

type AppScreen = "landing" | "auth" | "home" | "postura" | "pausa" | "pingpong" | "paint" | "memes" | "stretch";

function App() {
  const {
    state,
    connected,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    startExercise,
    stopExercise,
    startPingPong,
    stopPingPong,
    videoRef,
    canvasRef,
  } = usePostureSensor();

  const [screen, setScreen] = useState<AppScreen>("landing");
  const [points, setPoints] = useState(0);
  const [coins, setCoins] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [lastReward, setLastReward] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const displayVideoRef = useRef<HTMLVideoElement>(null);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        setScreen("home");
        // Cargar perfil del backend
        getPerfil().then((perfil) => {
          setPoints(perfil.puntos || 0);
          setCoins(perfil.monedas || 0);
          setMissionsCompleted(perfil.misionesCompletadas || 0);
        }).catch(() => {
          // Si falla la API, seguimos con datos locales
          console.warn("No se pudo cargar el perfil del servidor");
        });
      }
    });
  }, []);

  const currentStream = videoRef.current?.srcObject as MediaStream | null;

  // Assign stream to display video
  useEffect(() => {
    const video = displayVideoRef.current;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  });

  // Auto trigger pausa
  useEffect(() => {
    if (state.triggerPause && screen === "postura" && state.mode === "postura") {
      setScreen("pausa");
      startExercise();
    }
  }, [state.triggerPause, screen, state.mode, startExercise]);

  // Navigation
  const goToPostura = useCallback(() => setScreen("postura"), []);
  const goToPingPong = useCallback(() => { setScreen("pingpong"); startPingPong(); }, [startPingPong]);
  const goToPaint = useCallback(() => { setScreen("paint"); startPingPong(); }, [startPingPong]);
  const goToMemes = useCallback(() => setScreen("memes"), []);
  const goToStretch = useCallback(() => { setScreen("stretch"); startExercise(); }, [startExercise]);
  const goHome = useCallback(() => {
    if (screen === "pausa" || screen === "stretch") stopExercise();
    else if (screen === "pingpong" || screen === "paint") stopPingPong();
    setScreen("home");
  }, [screen, stopExercise, stopPingPong]);
  const forcePausa = useCallback(() => { setScreen("pausa"); startExercise(); }, [startExercise]);

  const handlePausaCompleted = useCallback(() => {
    const earned = 15;
    setPoints((p) => {
      const newPts = p + earned;
      actualizarPerfil({ puntos: newPts }).catch(() => {});
      return newPts;
    });
    setCoins((c) => {
      const newCoins = c + earned;
      actualizarPerfil({ monedas: newCoins }).catch(() => {});
      return newCoins;
    });
    setMissionsCompleted((m) => m + 1);
    setLastReward("+15 XP • +15 monedas 🎉");
    stopExercise();
    setScreen("home");
    setTimeout(() => setLastReward(null), 3000);
  }, [stopExercise]);

  const handlePausaBack = useCallback(() => { stopExercise(); setScreen("home"); }, [stopExercise]);

  const handlePingPongBack = useCallback(() => {
    const earned = state.game?.record ? Math.max(state.game.record * 2, 20) : 20;
    stopPingPong();
    setPoints((p) => {
      const newPts = p + earned;
      actualizarPerfil({ puntos: newPts }).catch(() => {});
      return newPts;
    });
    setCoins((c) => {
      const newCoins = c + earned;
      actualizarPerfil({ monedas: newCoins }).catch(() => {});
      return newCoins;
    });
    setMissionsCompleted((m) => m + 1);
    setLastReward(`+${earned} XP • +${earned} monedas 🏓`);
    setTimeout(() => setLastReward(null), 3000);
    setScreen("home");
  }, [stopPingPong, state.game]);

  const goToApp = useCallback(() => setScreen("auth"), []);
  const goToLanding = useCallback(() => setScreen("landing"), []);
  const handleLogin = useCallback((u: AuthUser) => {
    setUser(u);
    setScreen("home");
    // Cargar perfil del backend después del login
    getPerfil().then((perfil) => {
      setPoints(perfil.puntos || 0);
      setMissionsCompleted(perfil.misionesCompletadas || 0);
    }).catch(() => {
      console.warn("No se pudo cargar el perfil del servidor");
    });
  }, []);

  return (
    <>
      {/* Video oculto — SIEMPRE montado para que el hook funcione */}
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      {/* Reward toast */}
      {lastReward && <div className="reward-toast">{lastReward}</div>}

      {/* Landing */}
      {screen === "landing" && <LandingPage onStart={goToApp} />}

      {/* Auth */}
      {screen === "auth" && (
        <AuthScreen onLogin={handleLogin} onBack={goToLanding} />
      )}

      {/* Dashboard */}
      {screen === "home" && (
        <Dashboard
          points={points}
          coins={coins}
          missionsCompleted={missionsCompleted}
          cameraActive={cameraActive}
          cameraError={cameraError}
          connected={connected}
          state={state}
          videoRef={videoRef}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onStartPostura={goToPostura}
          onStartPausa={forcePausa}
          onStartPingPong={goToPingPong}
          onStartPaint={goToPaint}
          onStartMemes={goToMemes}
          onStartStretch={goToStretch}
          onBackToLanding={goToLanding}
          onLogout={() => { signOut(); setUser(null); setPoints(0); setCoins(0); setMissionsCompleted(0); setScreen("landing"); }}
          onAddPoints={(pts: number) => setPoints((p) => p + pts)}
          onAddMission={() => setMissionsCompleted((m) => m + 1)}
          onAddCoins={(c: number) => setCoins((prev) => prev + c)}
          userName={user?.name || "Dev"}
        />
      )}

      {/* Postura — fullscreen con sidebar integrado */}
      {screen === "postura" && (
        <div className="postura-fullscreen">
          <div className="postura-fullscreen__camera">
            <video ref={displayVideoRef} autoPlay playsInline muted className="postura-fullscreen__video" />
            <div className="postura-fullscreen__badge">
              <span className="postura-fullscreen__dot" style={{ background: connected ? "#34d399" : "#f59e0b" }} />
              {connected ? "En vivo" : "Conectando..."}
            </div>
            {state.status === "ok" && state.landmarks && <PostureOverlay state={state} />}
          </div>
          <div className="postura-fullscreen__panel">
            <button className="postura-fullscreen__back" onClick={goHome}>
              <span className="material-symbols-rounded">arrow_back</span> Dashboard
            </button>
            <div className="postura-fullscreen__header">
              <span className="material-symbols-rounded">visibility</span>
              <h2>Monitor de Postura</h2>
              <span className="postura-fullscreen__pts">{points} XP</span>
            </div>
            <div className="postura-fullscreen__status">
              {state.isGood ? (
                <div className="postura-fullscreen__good">
                  <span className="material-symbols-rounded">check_circle</span>
                  <span>Buena postura</span>
                </div>
              ) : (
                <div className="postura-fullscreen__bad">
                  <span className="material-symbols-rounded">warning</span>
                  <span>Corrige tu postura</span>
                </div>
              )}
              {!state.isGood && state.reason && <p className="postura-fullscreen__reason">{state.reason}</p>}
            </div>
            {state.status === "ok" && (
              <div className="postura-fullscreen__metrics">
                <div className="postura-fullscreen__metric"><span>Ángulo cuello</span><b>{state.neckAngle}°</b></div>
                <div className="postura-fullscreen__metric"><span>Encorvamiento</span><b>{state.slouchRatio}</b></div>
                <div className="postura-fullscreen__metric"><span>Inclinación</span><b>{state.shoulderTilt}</b></div>
                <div className="postura-fullscreen__metric"><span>Cabeza</span><b>{state.headDrop}</b></div>
              </div>
            )}
            {state.status === "no_person" && (
              <p className="postura-fullscreen__searching">
                <span className="material-symbols-rounded">person_search</span> Buscando persona...
              </p>
            )}
            {state.triggerPause && (
              <div className="postura-fullscreen__alert">
                <span className="material-symbols-rounded">notifications_active</span> ¡Hora de una PausaActiva!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pausa */}
      {screen === "pausa" && (
        <PausaScreen
          exercise={state.exercise}
          landmarks={state.landmarks}
          connected={connected}
          stream={currentStream}
          onCompleted={handlePausaCompleted}
          onBack={handlePausaBack}
        />
      )}

      {/* Ping Pong */}
      {screen === "pingpong" && (
        <PingPongGame
          game={state.game}
          connected={connected}
          stream={currentStream}
          onBack={handlePingPongBack}
        />
      )}

      {/* AR Paint */}
      {screen === "paint" && (
        <ARPaintGame
          game={state.game}
          connected={connected}
          stream={currentStream}
          onBack={() => {
            stopPingPong();
            setPoints((p) => {
              const newPts = p + 15;
              actualizarPerfil({ puntos: newPts }).catch(() => {});
              return newPts;
            });
            setCoins((c) => {
              const newCoins = c + 15;
              actualizarPerfil({ monedas: newCoins }).catch(() => {});
              return newCoins;
            });
            setMissionsCompleted((m) => m + 1);
            setScreen("home");
          }}
        />
      )}

      {/* Meme Generator */}
      {screen === "memes" && (
        <MemeGenerator
          connected={connected}
          stream={currentStream}
          srcVideoRef={videoRef}
          state={state}
          landmarks={state.landmarks}
          onBack={() => {
            setPoints((p) => {
              const newPts = p + 10;
              actualizarPerfil({ puntos: newPts }).catch(() => {});
              return newPts;
            });
            setCoins((c) => {
              const newCoins = c + 10;
              actualizarPerfil({ monedas: newCoins }).catch(() => {});
              return newCoins;
            });
            setMissionsCompleted((m) => m + 1);
            setScreen("home");
          }}
        />
      )}

      {/* Stretch Challenge */}
      {screen === "stretch" && (
        <StretchChallenge
          state={state}
          landmarks={state.landmarks}
          connected={connected}
          stream={currentStream}
          srcVideoRef={videoRef}
          onCompleted={() => {
            setPoints((p) => {
              const newPts = p + 20;
              actualizarPerfil({ puntos: newPts }).catch(() => {});
              return newPts;
            });
            setCoins((c) => {
              const newCoins = c + 20;
              actualizarPerfil({ monedas: newCoins }).catch(() => {});
              return newCoins;
            });
            setMissionsCompleted((m) => m + 1);
            stopExercise();
            setScreen("home");
          }}
          onBack={() => { stopExercise(); setScreen("home"); }}
        />
      )}
    </>
  );
}

function PostureOverlay({ state }: { state: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.landmarks) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const color = state.isGood ? "#34d399" : "#f87171";
    if (state.landmarks.connections) {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (const conn of state.landmarks.connections) {
        ctx.beginPath(); ctx.moveTo((1 - conn.x1) * w, conn.y1 * h); ctx.lineTo((1 - conn.x2) * w, conn.y2 * h); ctx.stroke();
      }
    }
    if (state.landmarks.points) {
      for (const pt of state.landmarks.points) {
        ctx.beginPath(); ctx.arc((1 - pt.x) * w, pt.y * h, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      }
    }
  }, [state]);
  return <canvas ref={canvasRef} width={640} height={480} className="postura-fullscreen__overlay" />;
}

export default App;
