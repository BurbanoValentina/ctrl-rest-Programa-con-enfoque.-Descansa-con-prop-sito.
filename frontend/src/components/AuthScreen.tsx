import { useState } from "react";
import { signUp, confirmSignUp, signIn, resendConfirmationCode } from "../services/auth";
import type { AuthUser } from "../services/auth";
import "./AuthScreen.css";

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void;
  onBack: () => void;
}

type AuthMode = "login" | "register" | "confirm";

export function AuthScreen({ onLogin, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) { setError("Ingresa tu nombre"); return; }
    if (!email.trim()) { setError("Ingresa tu correo"); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirmPass) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      setMessage("¡Registro exitoso! Revisa tu correo para el código de verificación.");
      setMode("confirm");
    } catch (err: any) {
      const msg = err?.message || "Error al registrarse";
      if (msg.includes("UsernameExistsException") || msg.includes("User already exists")) {
        setError("Ya existe una cuenta con ese correo");
      } else if (msg.includes("InvalidPasswordException")) {
        setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!confirmCode.trim()) { setError("Ingresa el código de verificación"); return; }

    setLoading(true);
    try {
      await confirmSignUp(email.trim(), confirmCode.trim());
      // Auto-login después de confirmar
      const session = await signIn(email.trim(), password);
      const idToken = session.getIdToken();
      const payload = idToken.decodePayload();
      onLogin({
        name: payload["name"] || name,
        email: payload["email"] || email,
        sub: payload["sub"],
      });
    } catch (err: any) {
      const msg = err?.message || "Error al confirmar";
      if (msg.includes("CodeMismatchException")) {
        setError("Código incorrecto. Revisa tu correo e intenta de nuevo.");
      } else if (msg.includes("ExpiredCodeException")) {
        setError("El código expiró. Solicita uno nuevo.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) { setError("Ingresa tu correo"); return; }
    if (!password) { setError("Ingresa tu contraseña"); return; }

    setLoading(true);
    try {
      const session = await signIn(email.trim(), password);
      const idToken = session.getIdToken();
      const payload = idToken.decodePayload();
      onLogin({
        name: payload["name"] || "Dev",
        email: payload["email"] || email,
        sub: payload["sub"],
      });
    } catch (err: any) {
      const msg = err?.message || "Error al iniciar sesión";
      if (msg.includes("NotAuthorizedException")) {
        setError("Correo o contraseña incorrectos");
      } else if (msg.includes("UserNotConfirmedException")) {
        setError("Tu cuenta no está confirmada. Revisa tu correo.");
        setMode("confirm");
      } else if (msg.includes("UserNotFoundException")) {
        setError("No existe una cuenta con ese correo");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setMessage("");
    try {
      await resendConfirmationCode(email.trim());
      setMessage("Código reenviado. Revisa tu correo.");
    } catch (err: any) {
      setError(err?.message || "Error al reenviar código");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "register") handleRegister(e);
    else if (mode === "confirm") handleConfirm(e);
    else handleLogin(e);
  };

  return (
    <div className="auth">
      <div className="auth__left">
        <img src="/banner-inicial.png" alt="Ctrl+Rest" className="auth__bg" />
        <div className="auth__left-overlay">
          <img src="/gato sobre el compu-14.png" alt="Blizzy" className="auth__mascot" />
          <h2>Ctrl<span>+</span>Rest</h2>
          <p>Programa con enfoque. Descansa con propósito.</p>
        </div>
      </div>
      <div className="auth__right">
        <button className="auth__back" onClick={onBack}>
          <span className="material-symbols-rounded">arrow_back</span> Volver
        </button>
        <div className="auth__form-container">
          <div className="auth__welcome">
            <h1>{mode === "confirm" ? "Verifica tu correo" : "¡Únete a nosotros!"}</h1>
            <p>
              {mode === "confirm"
                ? `Enviamos un código de verificación a ${email}`
                : "Cuida tu bienestar mientras programas. Gana XP, completa misiones y descansa con propósito."}
            </p>
          </div>

          {mode !== "confirm" && (
            <div className="auth__tabs">
              <button className={`auth__tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>
                Iniciar sesión
              </button>
              <button className={`auth__tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); setMessage(""); }}>
                Registrarse
              </button>
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit}>
            {mode === "confirm" ? (
              <>
                <div className="auth__field">
                  <label>Código de verificación</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <button type="button" className="auth__resend" onClick={handleResendCode}>
                  ¿No recibiste el código? Reenviar
                </button>
              </>
            ) : (
              <>
                {mode === "register" && (
                  <div className="auth__field">
                    <label>Nombre completo</label>
                    <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}
                <div className="auth__field">
                  <label>Correo electrónico</label>
                  <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="auth__field">
                  <label>Contraseña</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {mode === "register" && (
                  <div className="auth__field">
                    <label>Confirmar contraseña</label>
                    <input type="password" placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                  </div>
                )}
              </>
            )}

            {error && <p className="auth__error">{error}</p>}
            {message && <p className="auth__message">{message}</p>}

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? (
                <>Cargando...</>
              ) : mode === "confirm" ? (
                <>Verificar <span className="material-symbols-rounded">check</span></>
              ) : mode === "login" ? (
                <>Entrar <span className="material-symbols-rounded">arrow_forward</span></>
              ) : (
                <>Crear cuenta <span className="material-symbols-rounded">arrow_forward</span></>
              )}
            </button>

            {mode === "confirm" && (
              <button type="button" className="auth__back-link" onClick={() => setMode("login")}>
                ← Volver al login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
