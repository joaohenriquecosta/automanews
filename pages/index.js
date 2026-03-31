export default function Home() {
  return (
    <>
      <div className="page">
        <div className="container">
          {/* Navbar */}
          <nav className="nav" aria-label="Principal">
            <div className="brand">
              <div className="logo" aria-hidden="true" />
              <span>AutomaNews</span>
            </div>
            <div className="nav-actions">
              <button
                className="btn outline"
                onClick={() => alert("Em breve: login da comunidade!")}
              >
                Entrar
              </button>
              <button
                className="btn"
                onClick={() => alert("Em breve: criar conta!")}
              >
                Criar conta
              </button>
            </div>
          </nav>

          {/* Hero */}
          <header className="hero">
            <span className="kicker">Automação residencial & IoT</span>
            <h1 className="title">🛠️ Em construção...</h1>
            <p className="subtitle">
              Um novo local na internet para <strong>instaladores</strong> e{" "}
              <strong>entusiastas</strong> de automação. Seu hub de conteúdos
              que fazem a diferença <strong>de verdade</strong>.
            </p>
            <div className="cta">
              <button
                className="btn"
                onClick={() => (window.location.hash = "#features")}
              >
                Explorar conteúdos
              </button>
              <button
                className="btn outline"
                onClick={() => (window.location.hash = "#setup")}
              >
                Começar a contribuir
              </button>
            </div>
          </header>

          {/* Features */}
          <section id="features" className="section">
            <div className="grid">
              <article className="card">
                <h3>📢 Notícias</h3>
                <p>
                  Novidades sobre Smart Home, Matter, Zigbee, Z-Wave e mais.
                </p>
              </article>
              <article className="card">
                <h3>📚 Tutoriais</h3>
                <p>Guias com exemplos práticos e passo a passo.</p>
              </article>
              <article className="card">
                <h3>🛠️ Reviews</h3>
                <p>
                  Análises e comparativos de dispositivos, hubs e assistentes.
                </p>
              </article>
              <article className="card">
                <h3>💬 Comunidade</h3>
                <p>Espaço aberto para compartilhar experiências.</p>
              </article>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            🚧 Site em construção — em breve mais conteúdos para você!
          </footer>
        </div>
      </div>

      {/* CSS global */}
      <style jsx global>{`
        :root {
          --bg: #0b1020;
          --card: #121831;
          --muted: #a7b0c0;
          --text: #e9ecf1;
          --brand: #6ee7ff;
          --brand-2: #7c3aed;
          --ring: rgba(110, 231, 255, 0.35);
        }

        * {
          box-sizing: border-box;
        }

        /* remove as bordas brancas/padding do documento */
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #0b1020;
        }
        body {
          overflow-x: hidden;
        }

        .page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background:
            radial-gradient(
              1200px 600px at 10% -10%,
              rgba(124, 58, 237, 0.25),
              transparent 60%
            ),
            radial-gradient(
              900px 500px at 100% 0%,
              rgba(110, 231, 255, 0.2),
              transparent 55%
            ),
            var(--bg);
          color: var(--text);
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            Segoe UI,
            Roboto,
            Ubuntu,
            Cantarell,
            Noto Sans,
            Arial,
            "Apple Color Emoji",
            "Segoe UI Emoji";
          -webkit-font-smoothing: antialiased;
        }

        .container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 24px;
          flex: 1;
          width: 100%;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--brand), var(--brand-2));
          box-shadow:
            0 10px 25px -10px var(--ring),
            inset 0 0 0 1px rgba(255, 255, 255, 0.15);
        }
        .nav-actions {
          display: flex;
          gap: 12px;
        }
        .btn {
          border: 0;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, var(--brand), var(--brand-2));
          color: #0a0f1e;
          box-shadow: 0 10px 25px -10px var(--ring);
        }
        .btn.outline {
          background: transparent;
          color: var(--text);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .btn:active {
          transform: translateY(1px);
        }

        .hero {
          padding: 48px 0 24px;
          text-align: center;
        }
        .kicker {
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 10px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        .title {
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.05;
          margin: 0 0 14px;
          letter-spacing: -0.02em;
        }
        .subtitle {
          margin: 0 auto 24px;
          max-width: 760px;
          color: var(--muted);
          font-size: 18px;
          line-height: 1.6;
        }
        .tabnews {
          color: var(--brand);
          text-decoration: none;
          font-weight: 600;
        }
        .tabnews:hover {
          text-decoration: underline;
        }
        .cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .section {
          padding: 32px 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }
        .card {
          grid-column: span 12;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.03),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 30px -18px rgba(0, 0, 0, 0.6);
        }
        .card h3 {
          margin: 0 0 8px;
        }
        .card p {
          margin: 0;
          color: var(--muted);
          line-height: 1.6;
        }
        @media (min-width: 720px) {
          .card {
            grid-column: span 6;
          }
        }
        @media (min-width: 980px) {
          .card {
            grid-column: span 3;
          }
        }

        .footer {
          background: var(--card);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--muted);
          text-align: center;
          font-size: 14px;
          padding: 16px;
        }
      `}</style>
    </>
  );
}
