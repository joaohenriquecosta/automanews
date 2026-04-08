const os = require("node:os");
const path = require("node:path");

module.exports = {
  getNextWatchPidFilePath,
};

function getNextWatchPidFilePath() {
  return path.join(os.tmpdir(), "automanews-next-test-watch.pid");
}
