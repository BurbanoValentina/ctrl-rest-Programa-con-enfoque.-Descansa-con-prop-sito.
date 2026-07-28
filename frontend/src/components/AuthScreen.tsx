import { useState } from "react";
import "./AuthScreen.css";

interface AuthScreenProps {
  onLogin: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

export function AuthScreen({ onLogin, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!name.trim()) { setError("Ingresa tu nombre"); return; }
      if (!email.trim()) { setError("Ingresa tu correo"); return; }
      if (password.length < 4) { setError("La contraseña debe tener al menos 4 caracteres"); return; }
      if (password !== confirmPass) { setError("Las contraseñas no coinciden"); return; }
      // Save to localStorage
      const user = { name: name.trim(), email: email.trim(), password };
      localStorage.setItem("ctrlrest_user", JSON.stringify(user));
      onLogin({ name: user.name, email: user.email });
    } else {
      if (!email.trim()) { setError("Ingresa tu correo"); return; }
      if (!password) { setError("Ingresa tu contraseña"); return; }
      // Check localStorage
      const saved = localStorage.getItem("ctrlrest_user");
      if (saved) {
        const user = JSON.parse(saved);
        if (user.email === email.trim() && user.password === password) {
          onLogin({ name: user.name, email: user.email });
          return;
        }
      }
      setError("Correo o contraseña incorrectos");
    }
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
            <h1>¡Únete a nosotros!</h1>
            <p>Cuida tu bienestar mientras programas. Gana XP, completa misiones y descansa con propósito.</p>
          </div>
          <div className="auth__tabs">
            <button className={`auth__tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
              Iniciar sesión
            </button>
            <button className={`auth__tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>
              Registrarse
            </button>
          </div>

          <form className="auth__form" onSubmit={handleSubmit}>
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
            {error && <p className="auth__error">{error}</p>}
            <button type="submit" className="auth__submit">
              {mode === "login" ? "Entrar" : "Crear cuenta"}
              <span className="material-symbols-rounded">arrow_forward</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
