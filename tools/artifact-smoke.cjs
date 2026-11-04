"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { fork } = require("node:child_process"),
  { once } = require("node:events");
const { verify } = require("./release.cjs"),
  { smoke } = require("./staging-smoke.cjs");
const { createHash } = require("node:crypto");
async function main() {
  if (!process.argv[2]) throw Error("Use node tools/artifact-smoke.cjs <release directory>");
  const folder = path.resolve(process.argv[2]),
    manifest = verify(folder);
  assert.ok(
    fs.existsSync(path.join(folder, "node_modules/ws/package.json")),
    "Install the artifact's production dependencies first",
  );
  const child = fork(path.join(__dirname, "soak-host.cjs"), [folder], {
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });
  const ready = new Promise((resolve, reject) => {
    child.once("message", resolve);
    child.once("error", reject);
    child.once("exit", (code) => reject(Error("Artifact host exited before listening: " + code)));
  });
  try {
    const { port } = await ready;
    const served = Object.keys(manifest.files).filter((file) =>
      (!file.includes("/") || file.startsWith("assets/")) && /\.(?:js|css|html|jpg|png|webp|svg)$/.test(file));
    await Promise.all(served.map(async (file) => {
      const response = await fetch("http://127.0.0.1:" + port + "/" + file);
      assert.equal(response.status, 200, "packaged route " + file);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.files[file], "served bytes " + file);
    }));
    const result = await smoke("http://127.0.0.1:" + port);
    assert.equal(result.artifact, manifest.artifact);
    console.log(JSON.stringify({ ...result, productionArtifact: true, staticFilesVerified: served.length }, null, 2));
  } finally {
    if (child.connected) {
      child.send("close");
      await once(child, "exit");
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
