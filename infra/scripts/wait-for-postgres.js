const { exec } = require("node:child_process");

function checkPostgres() {
  exec(
    "docker exec local_postgres pg_isready --host localhost",
    (error, stdout) => {
      if (!stdout.includes("accepting connections")) {
        process.stdout.write("▫️");
        checkPostgres();
        return;
      }

      console.log("\n\n✅ Postgres pronto e aceitando conexões!\n\n");
    },
  );
}

console.log("\n\n⭕ Aguardando Postgres aceitar conexões...\n");
checkPostgres();
