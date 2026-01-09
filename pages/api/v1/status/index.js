import database from "../../../../infra/database.js";

console.log("antes da função status");

async function status(request, response) {
  const result = await database.query("SELECT 1 + 1 as sum;");
  console.log("Resultado da query:", result.rows);
  response.status(200).json({ mensagem: "teste status ok" });
}

export default status;
