const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

module.exports = {
  cleanupNextDevPorts,
};

const PORTS_TO_CLEAN = [3000, 3001, 3002, 3003, 3004];
const projectRoot = path.resolve(__dirname, "..", "..");

if (require.main === module) {
  cleanupNextDevPorts();
}

function cleanupNextDevPorts() {
  if (process.platform === "win32") {
    return;
  }

  cleanupBySs();
  cleanupByLsof();
}

function cleanupBySs() {
  const ssResult = spawnSync("ss", ["-ltnp"], {
    encoding: "utf8",
  });

  if (ssResult.status !== 0 || !ssResult.stdout) {
    return;
  }

  const pids = new Set();
  const lines = ssResult.stdout.split("\n");

  for (const line of lines) {
    if (!PORTS_TO_CLEAN.some((port) => line.includes(`:${port}`))) {
      continue;
    }

    const pidMatches = line.matchAll(/pid=(\d+)/g);
    for (const match of pidMatches) {
      pids.add(Number.parseInt(match[1], 10));
    }
  }

  for (const pid of pids) {
    terminateIfNextProcess(pid);
  }
}

function cleanupByLsof() {
  for (const port of PORTS_TO_CLEAN) {
    const lsofResult = spawnSync("lsof", ["-ti", `tcp:${port}`], {
      encoding: "utf8",
    });

    if (lsofResult.status !== 0 || !lsofResult.stdout) {
      continue;
    }

    const pids = lsofResult.stdout
      .trim()
      .split("\n")
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value));

    for (const pid of pids) {
      terminateIfNextProcess(pid);
    }
  }
}

function terminateIfNextProcess(pid) {
  const psResult = spawnSync("ps", ["-p", String(pid), "-o", "command="], {
    encoding: "utf8",
  });
  const command = psResult.stdout?.trim() ?? "";
  const processCwd = getProcessCwd(pid);

  if (!command.includes("next") || !processCwd?.startsWith(projectRoot)) {
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") {
      throw error;
    }
  }
}

function getProcessCwd(pid) {
  try {
    return fs.readlinkSync(`/proc/${pid}/cwd`);
  } catch {
    return null;
  }
}
