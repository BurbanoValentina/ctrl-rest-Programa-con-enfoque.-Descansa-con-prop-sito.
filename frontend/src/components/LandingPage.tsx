import "./LandingPage.css";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp">
      {/* ===== NAVBAR ===== */}
      <nav className="lp-nav">
        <div className="lp-nav__logo">
          <span className="material-symbols-rounded lp-nav__logo-icon">pets</span>
          <span className="lp-nav__logo-text">ctrl<span className="lp-nav__logo-plus">+</span>rest</span>
        </div>
        <div className="lp-nav__links">
          <a className="lp-nav__link active" onClick={() => scrollTo("inicio")}>Inicio</a>
          <a className="lp-nav__link" onClick={() => scrollTo("como-funciona")}>¿Cómo funciona?</a>
          <a className="lp-nav__link" onClick={() => scrollTo("documentacion")}>Documentación</a>
          <a className="lp-nav__link" onClick={() => scrollTo("equipo")}>Equipo</a>
          <a className="lp-nav__link" onClick={() => scrollTo("contacto")}>Contacto</a>
        </div>
        <button className="lp-nav__cta" onClick={onStart}>
          Iniciar sesión <span className="material-symbols-rounded">arrow_forward</span>
        </button>
      </nav>

      {/* ===== HERO ===== */}
      <section id="inicio" className="lp-hero">
        <img className="lp-hero__bg" src="/banner-inicial.png" alt="" />
        <div className="lp-hero__overlay">
          <div className="lp-hero__content">
            <h1 className="lp-hero__title">
              Programa con <span className="gradient-text">enfoque.</span><br />
              Descansa con <span className="gradient-text">propósito.</span>
            </h1>
            <p className="lp-hero__subtitle">
              Ctrl + Rest convierte tus pausas activas en misiones interactivas para cuidar tu bienestar
              físico y mental, mientras ganas BreakPoints.
            </p>
            <div className="lp-hero__btns">
              <button className="lp-btn lp-btn--primary" onClick={onStart}>
                Iniciar sesión <span className="material-symbols-rounded">arrow_forward</span>
              </button>
              <button className="lp-btn lp-btn--outline" onClick={() => scrollTo("demo")}>
                Ver demostración <span className="material-symbols-rounded">play_circle</span>
              </button>
            </div>
            <div className="lp-hero__devs">
              <div className="lp-hero__avatars">
                <img src="/Integrants/valentina.png" alt="Valentina" className="lp-hero__avatar-img" />
                <img src="/Integrants/jesus.png" alt="Jesus" className="lp-hero__avatar-img" />
                <img src="/Integrants/andrea.png" alt="Andrea" className="lp-hero__avatar-img" />
                <img src="/Integrants/caro.png" alt="Diana" className="lp-hero__avatar-img" />
              </div>
              <span className="lp-hero__devs-text">Hecho por desarrolladores, para desarrolladores.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUÉ ES ===== */}
      <section className="lp-quees">
        <h2 className="lp-section-title">¿Qué es <span className="gradient-text">Ctrl + Rest</span>?</h2>
        <p className="lp-section-desc">
          Es una plataforma web que ayuda a los desarrolladores a mantener un equilibrio saludable
          entre productividad y bienestar. A través de pausas activas gamificadas, misiones interactivas
          y recompensas, fomentamos hábitos que mejoren tu calidad de vida.
        </p>
        <div className="lp-quees__grid">
          <div className="lp-quees__card">
            <div className="lp-quees__icon lp-quees__icon--pink">
              <span className="material-symbols-rounded">favorite</span>
            </div>
            <h3>Bienestar</h3>
            <p>Reduce el estrés y previene el burnout con pausas guiadas.</p>
          </div>
          <div className="lp-quees__card">
            <div className="lp-quees__icon lp-quees__icon--purple">
              <span className="material-symbols-rounded">sports_esports</span>
            </div>
            <h3>Gamificación</h3>
            <p>Cada pausa es una misión que te recompensa con BreakPoints.</p>
          </div>
          <div className="lp-quees__card">
            <div className="lp-quees__icon lp-quees__icon--blue">
              <span className="material-symbols-rounded">trending_up</span>
            </div>
            <h3>Productividad</h3>
            <p>Mejora tu concentración y rendimiento a largo plazo.</p>
          </div>
          <div className="lp-quees__card">
            <div className="lp-quees__icon lp-quees__icon--cyan">
              <span className="material-symbols-rounded">memory</span>
            </div>
            <h3>Tecnología</h3>
            <p>Impulsado por AWS y Kiro para ofrecerte una experiencia única.</p>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como-funciona" className="lp-steps">
        <h2 className="lp-section-title">¿Cómo funciona?</h2>
        <div className="lp-steps__timeline">
          <div className="lp-steps__item">
            <div className="lp-steps__circle">
              <span className="material-symbols-rounded">code</span>
            </div>
            <h4>Programa</h4>
            <p>Comienza tu sesión de enfoque.</p>
          </div>
          <div className="lp-steps__line"></div>
          <div className="lp-steps__item">
            <div className="lp-steps__circle">
              <span className="material-symbols-rounded">pause_circle</span>
            </div>
            <h4>Descansa</h4>
            <p>El temporizador detecta que es momento de un BreakPoint.</p>
          </div>
          <div className="lp-steps__line"></div>
          <div className="lp-steps__item">
            <div className="lp-steps__circle">
              <span className="material-symbols-rounded">task_alt</span>
            </div>
            <h4>Completa una misión</h4>
            <p>Elige una misión y tómate un tiempo para ti.</p>
          </div>
          <div className="lp-steps__line"></div>
          <div className="lp-steps__item">
            <div className="lp-steps__circle">
              <span className="material-symbols-rounded">star</span>
            </div>
            <h4>Gana BreakPoints</h4>
            <p>Recibe puntos y sube de nivel.</p>
          </div>
          <div className="lp-steps__line"></div>
          <div className="lp-steps__item">
            <div className="lp-steps__circle">
              <span className="material-symbols-rounded">replay</span>
            </div>
            <h4>Continúa</h4>
            <p>Vuelve con más energía y sigue programando.</p>
          </div>
        </div>
      </section>

      {/* ===== DEMOSTRACIÓN ===== */}
      <section id="demo" className="lp-demo">
        <div className="lp-demo__wrapper">
          <div className="lp-demo__video">
            <iframe
              src="https://www.youtube.com/embed/CNs0XHjKadk"
              title="Ctrl+Rest Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="lp-demo__iframe"
            />
          </div>
          <div className="lp-demo__text">
            <h2 className="lp-section-title lp-section-title--left">Demostración</h2>
            <p>
              Descubre cómo las misiones, los BreakPoints y Blizzy te acompañan para que programar
              sea más saludable y divertido.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ARQUITECTURA CON AWS ===== */}
      <section className="lp-arch">
        <h2 className="lp-section-title">Arquitectura con AWS</h2>
        <div className="lp-arch__flow">
          <div className="lp-arch__item">
            <div className="lp-arch__icon"><span className="material-symbols-rounded">web</span></div>
            <span>Frontend<br />(React)</span>
          </div>
          <div className="lp-arch__arrow"><span className="material-symbols-rounded">arrow_forward</span></div>
          <div className="lp-arch__item">
            <div className="lp-arch__icon"><span className="material-symbols-rounded">cloud_upload</span></div>
            <span>AWS<br />Amplify</span>
          </div>
          <div className="lp-arch__arrow"><span className="material-symbols-rounded">arrow_forward</span></div>
          <div className="lp-arch__item">
            <div className="lp-arch__icon"><span className="material-symbols-rounded">api</span></div>
            <span>API<br />Gateway</span>
          </div>
          <div className="lp-arch__arrow"><span className="material-symbols-rounded">arrow_forward</span></div>
          <div className="lp-arch__item">
            <div className="lp-arch__icon"><span className="material-symbols-rounded">function</span></div>
            <span>AWS<br />Lambda</span>
          </div>
          <div className="lp-arch__arrow"><span className="material-symbols-rounded">arrow_forward</span></div>
          <div className="lp-arch__item">
            <div className="lp-arch__icon"><span className="material-symbols-rounded">database</span></div>
            <span>DynamoDB</span>
          </div>
        </div>
        <p className="lp-arch__desc">Infraestructura serverless, escalable y segura en la nube de AWS</p>
      </section>

      {/* ===== DOCUMENTACIÓN ===== */}
      <section id="documentacion" className="lp-docs">
        <h2 className="lp-section-title">Documentación</h2>
        <div className="lp-docs__grid">
          <div className="lp-docs__card">
            <div className="lp-docs__card-icon"><span className="material-symbols-rounded">description</span></div>
            <h4>Documentación</h4>
            <p>Descripción general, objetivos y funcionalidades.</p>
          </div>
          <div className="lp-docs__card">
            <div className="lp-docs__card-icon"><span className="material-symbols-rounded">architecture</span></div>
            <h4>Arquitectura</h4>
            <p>Diagrama y explicación de la solución en AWS.</p>
          </div>
          <div className="lp-docs__card">
            <div className="lp-docs__card-icon"><span className="material-symbols-rounded">edit_note</span></div>
            <h4>Especificaciones Kiro</h4>
            <p>Requisitos, prompts y flujo de trabajo con Kiro.</p>
          </div>
          <div className="lp-docs__card">
            <div className="lp-docs__card-icon"><span className="material-symbols-rounded">code</span></div>
            <h4>Código fuente</h4>
            <p>Repositorio del proyecto en GitHub.</p>
          </div>
          <div className="lp-docs__card">
            <div className="lp-docs__card-icon"><span className="material-symbols-rounded">slideshow</span></div>
            <h4>Presentación</h4>
            <p>Pitch del proyecto para el hackathon.</p>
          </div>
        </div>
      </section>

      {/* ===== EQUIPO ===== */}
      <section id="equipo" className="lp-team">
        <h2 className="lp-section-title">Equipo</h2>
        <div className="lp-team__grid">
          <div className="lp-team__card">
            <img src="/Integrants/valentina.png" alt="Valentina Burbano" className="lp-team__photo" />
            <h4>Valentina Burbano</h4>
            <span className="lp-team__role">Backend Developer</span>
            <p>Apasionada por la lógica, las API y construir soluciones escalables con Python y AWS.</p>
          </div>
          <div className="lp-team__card">
            <img src="/Integrants/jesus.png" alt="Jesus Manuera" className="lp-team__photo" />
            <h4>Jesus Manuera</h4>
            <span className="lp-team__role">DevOps Engineer</span>
            <p>Encargado de la infraestructura, CI/CD y la integración de servicios en la nube.</p>
          </div>
          <div className="lp-team__card">
            <img src="/Integrants/andrea.png" alt="Andrea Granados" className="lp-team__photo" />
            <h4>Andrea Granados</h4>
            <span className="lp-team__role">UI/UX Designer</span>
            <p>Diseñadora apasionada por crear experiencias intuitivas y visuales que conecten.</p>
          </div>
          <div className="lp-team__card">
            <img src="/Integrants/caro.png" alt="Diana Argüello" className="lp-team__photo" />
            <h4>Diana Argüello</h4>
            <span className="lp-team__role">Frontend Developer</span>
            <p>Desarrolladora frontend con amor por los detalles y las interfaces accesibles.</p>
          </div>
        </div>
      </section>

      {/* ===== BLIZZY CTA → CONTÁCTANOS ===== */}
      <section id="contacto" className="lp-contact">
        <div className="lp-contact__wrapper">
          <div className="lp-contact__card">
            <h2 className="lp-section-title">Contáctanos</h2>
            <p className="lp-contact__desc">¿Tienes dudas, sugerencias o quieres saber más? Déjanos tu mensaje y te responderemos.</p>
            <form className="lp-contact__form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Tu nombre" className="lp-contact__input" />
              <input type="email" placeholder="Tu correo electrónico" className="lp-contact__input" />
              <textarea placeholder="Tu mensaje..." className="lp-contact__textarea" rows={4}></textarea>
              <button type="submit" className="lp-btn lp-btn--primary lp-btn--lg">
                Enviar mensaje <span className="material-symbols-rounded">send</span>
              </button>
            </form>
          </div>
          <div className="lp-contact__image">
            <img src="/tu-bienestar.png" alt="Tu bienestar, tu mejor código" />
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer__top">
          <div className="lp-footer__logo">
            <span className="material-symbols-rounded">pets</span>
            <span className="lp-footer__logo-text">ctrl<span className="lp-nav__logo-plus">+</span>rest</span>
          </div>
          <div className="lp-footer__social">
            <span className="material-symbols-rounded">tag</span>
            <span className="material-symbols-rounded">photo_camera</span>
            <span className="material-symbols-rounded">work</span>
            <span className="material-symbols-rounded">smart_display</span>
          </div>
        </div>
        <div className="lp-footer__banner">
          <img src="/pie-de-pagina.png" alt="Pie de página Ctrl+Rest" />
          <div className="lp-footer__connect">
            <h3>Conecta con nosotros</h3>
            <div className="lp-footer__links">
              <a href="https://www.linkedin.com/in/valentina-burbano-salazar-2473a2327" target="_blank" rel="noopener noreferrer" className="lp-footer__link">
                <span className="lp-footer__link-name">Valentina Burbano</span>
                <span className="lp-footer__link-badge">LinkedIn →</span>
              </a>
              <a href="https://www.linkedin.com/in/jesus-múnera-3702962aa" target="_blank" rel="noopener noreferrer" className="lp-footer__link">
                <span className="lp-footer__link-name">Jesus Manuera</span>
                <span className="lp-footer__link-badge">LinkedIn →</span>
              </a>
              <a href="https://www.linkedin.com/in/andrea-valentina-granados-garcia-game-developer" target="_blank" rel="noopener noreferrer" className="lp-footer__link">
                <span className="lp-footer__link-name">Andrea Granados</span>
                <span className="lp-footer__link-badge">LinkedIn →</span>
              </a>
              <a href="https://www.linkedin.com/in/14diana-carolina-arguello-casallas/" target="_blank" rel="noopener noreferrer" className="lp-footer__link">
                <span className="lp-footer__link-name">Diana Argüello</span>
                <span className="lp-footer__link-badge">LinkedIn →</span>
              </a>
            </div>
          </div>
        </div>
        <p className="lp-footer__copy">© 2026 Ctrl + Rest. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
