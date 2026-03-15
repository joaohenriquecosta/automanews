const os = require("node:os");
const path = require("node:path");

function getNextWatchPidFilePath() {
  return path.join(os.tmpdir(), "automanews-next-test-watch.pid");
}

module.exports = {
  getNextWatchPidFilePath,
};
