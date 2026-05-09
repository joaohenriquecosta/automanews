const dotenv = require("dotenv");
dotenv.config({ path: ".env.development" });

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const jestConfig = createJestConfig({
  maxWorkers: 1,
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-jest.js"],
  testPathIgnorePatterns: ["<rootDir>/.claude/"],
  testTimeout: 60000, // 60 seconds
});

module.exports = jestConfig;
