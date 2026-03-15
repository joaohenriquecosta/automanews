const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { getNextWatchPidFilePath } = require("./next-watch-pid");

const projectRoot = path.resolve(__dirname, "..", "..");
const pidFile = getNextWatchPidFilePath();

let nextProcess;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  process.chdir(projectRoot);
  fs.rmSync(pidFile, { force: true });

  runNpmScript("services:wait:db");
  runNpmScript("migrations:up");

  nextProcess = spawn(getNpxCommand(), ["next", "dev"], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  fs.writeFileSync(pidFile, String(nextProcess.pid));

  nextProcess.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

function runNpmScript(scriptName) {
  const result = spawnSync(getNpmCommand(), ["run", scriptName], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(
      `Command npm run ${scriptName} exited with code ${result.status}.`,
    );
  }
}

function cleanup() {
  fs.rmSync(pidFile, { force: true });
}

function shutdown() {
  if (nextProcess?.pid) {
    nextProcess.kill("SIGTERM");
  }
}

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", cleanup);
