import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 1000,
    dedupingInterval: 1000,
  });

  return (
    <>
      <h1>Estado do sistema</h1>
      <UpdatedAt />
      <hr />
      <DbStatus />
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
