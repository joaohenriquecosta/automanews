import useSWR from "swr";
import { useState, useEffect } from "react";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("status-theme");
    if (saved === "dark") setDark(true);
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("status-theme", next ? "dark" : "light");
      return next;
    });
  }

  return { dark, toggle };
}

export default function StatusPage() {
  const { dark, toggle } = useTheme();

  useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 1000,
    dedupingInterval: 1000,
  });

  return (
    <>
      <div className={dark ? "page dark" : "page light"}>
        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label="Alternar tema"
        >
          {dark ? "☀️" : "🌙"}
        </button>

        <h1>Estado do sistema</h1>
        <UpdatedAt />
        <hr />
        <DbStatus />
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body,
        #__next {
          height: 100%;
        }

        .page {
          min-height: 100vh;
          padding: 24px 32px;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            Segoe UI,
            Roboto,
            sans-serif;
          transition:
            background-color 0.3s,
            color 0.3s;
          position: relative;
        }

        .light {
          background-color: #ffffff;
          color: #1a1a1a;
        }

        .dark {
          background-color: #0b1020;
          color: #e9ecf1;
        }

        .theme-toggle {
          position: absolute;
          top: 20px;
          right: 24px;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(128, 128, 128, 0.3);
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background-color 0.3s,
            border-color 0.3s;
        }

        .light .theme-toggle:hover {
          background-color: #f0f0f0;
        }

        .dark .theme-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        h1 {
          font-size: 24px;
          margin-bottom: 8px;
        }

        hr {
          border: none;
          border-top: 1px solid rgba(128, 128, 128, 0.3);
          margin: 16px 0;
        }

        h3 {
          font-size: 18px;
          margin-bottom: 12px;
        }

        ul {
          list-style: disc;
          padding-left: 24px;
        }

        li {
          margin-bottom: 6px;
          line-height: 1.6;
        }
      `}</style>
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI);

  if (isLoading || !data) return <div>Carregando última atualização...</div>;

  const updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");

  return <div>Última atualização: {updatedAtText}</div>;
}

function DbStatus() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI);

  if (isLoading || !data) return <div>Verificando banco...</div>;

  const { version, max_connections, opened_connections } = data.dependencies.db;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Banco de Dados</h3>
      <ul>
        <li>
          Versão: <strong>{version}</strong>
        </li>
        <li>
          Conexões abertas: <strong>{opened_connections}</strong>
        </li>
        <li>
          Máximo de conexões: <strong>{max_connections}</strong>
        </li>
      </ul>
    </div>
  );
}
