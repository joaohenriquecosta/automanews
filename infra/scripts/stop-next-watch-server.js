const fs = require("node:fs");
const path = require("node:path");

const pidFile = path.resolve(__dirname, "..", "..", ".next-test-watch.pid");

if (!fs.existsSync(pidFile)) {
  process.exit(0);
}

const pid = Number.parseInt(fs.readFileSync(pidFile, "utf8"), 10);

fs.rmSync(pidFile, { force: true });

if (Number.isNaN(pid)) {
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
} catch (error) {
  if (error.code !== "ESRCH") {
    throw error;
  }
}
