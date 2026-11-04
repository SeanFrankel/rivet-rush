"use strict";
const { defineConfig } = require("@playwright/test");
const fs = require("node:fs");
const installedEdge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath =
  process.env.RIVET_BROWSER || (fs.existsSync(installedEdge) ? installedEdge : undefined);
module.exports = defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: "list",
  outputDir: ".tmp/browser-results",
  use: {
    baseURL: "http://127.0.0.1:8189",
    viewport: { width: 1280, height: 800 },
    browserName: process.env.RIVET_ENGINE === "firefox" ? "firefox" : "chromium",
    launchOptions: {
      executablePath: process.env.RIVET_ENGINE === "firefox" ? undefined : executablePath,
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node server/host.js",
    env: { PORT: "8189", BIND_ADDRESS: "127.0.0.1" },
    url: "http://127.0.0.1:8189/health",
    reuseExistingServer: false,
  },
});
