"use strict";
// A fixed allowlist keeps local logs, test downloads and credentials out of artifacts.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const files = [
  "index.html",
  "arena.css",
  "match.js",
  "maps.js",
  "heroes.js",
  "abilities.js",
  "protocol.js",
  "replay.js",
  "online.js",
  "yard.js",
  "sound.js",
  "package.json",
  "package-lock.json",
  "THIRD_PARTY.md",
  "server/host.js",
  "tools/release.cjs",
  "assets/arc-runner.jpg",
  "assets/kiln-yard.jpg",
];
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const identity = (hashes) =>
  sha(JSON.stringify(Object.entries(hashes).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
function verify(directory) {
  const folder = path.resolve(directory);
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, "release.json"), "utf8"));
  if (
    manifest.format !== "rivet-release" ||
    manifest.schema !== 1 ||
    !manifest.files ||
    Object.keys(manifest.files).sort().join("|") !== [...files].sort().join("|")
  )
    throw Error("Unsupported or incomplete release manifest");
  for (const file of files) {
    const actual = sha(fs.readFileSync(path.join(folder, file)));
    if (actual !== manifest.files[file]) throw Error("Release file differs: " + file);
  }
  if (identity(manifest.files) !== manifest.artifact) throw Error("Release identity differs");
  const pkg = JSON.parse(fs.readFileSync(path.join(folder, "package.json"), "utf8"));
  if (pkg.version !== manifest.build) throw Error("Release build differs");
  return manifest;
}
function build(destination) {
  const content = new Map(files.map((file) => [file, fs.readFileSync(path.join(root, file))]));
  const hashes = Object.fromEntries([...content].map(([file, bytes]) => [file, sha(bytes)]));
  const artifact = identity(hashes),
    version = require("../package.json").version;
  let commit = null,
    dirty = null;
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    dirty = !!execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    /* A source archive still has a complete file identity. */
  }
  const folder = path.resolve(
    destination || path.join(root, ".releases", version + "-" + artifact.slice(0, 12)),
  );
  if (fs.existsSync(folder)) {
    const existing = verify(folder);
    if (existing.artifact !== artifact)
      throw Error("Destination contains a different release; choose an empty directory");
    return { folder, manifest: existing };
  }
  fs.mkdirSync(folder, { recursive: true });
  for (const [file, bytes] of content) {
    fs.mkdirSync(path.dirname(path.join(folder, file)), { recursive: true });
    fs.writeFileSync(path.join(folder, file), bytes, { flag: "wx" });
  }
  const manifest = {
    format: "rivet-release",
    schema: 1,
    build: version,
    artifact,
    sourceCommit: commit,
    sourceDirty: dirty,
    createdAt: new Date().toISOString(),
    files: hashes,
  };
  fs.writeFileSync(path.join(folder, "release.json"), JSON.stringify(manifest, null, 2) + "\n", {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(folder, "START.txt"),
    "Rivet Rush release " +
      version +
      "\nArtifact " +
      artifact +
      "\n\n" +
      "From this folder with Node 22+:\n  node tools/release.cjs verify .\n  npm ci --omit=dev --ignore-scripts\n  npm start\n\n" +
      "Default listener: http://127.0.0.1:8080. Configure PORT and BIND_ADDRESS for your host.\n" +
      "Put the site and /arena behind the same HTTPS/WSS proxy. Never split rooms across instances.\n" +
      "Before replacing a build, drain between matches. Keep the last good folder and its dependencies.\n" +
      "Rollback switches the client AND server together. In-memory rooms do not survive a restart.\n" +
      "Full runbook: https://github.com/SeanFrankel/rivet-rush/blob/master/docs/hosting.md\n",
  );
  verify(folder);
  return { folder, manifest };
}
if (require.main === module) {
  try {
    if (process.argv[2] === "build") {
      const result = build(process.argv[3]);
      console.log(
        JSON.stringify(
          {
            folder: result.folder,
            artifact: result.manifest.artifact,
            build: result.manifest.build,
            sourceDirty: result.manifest.sourceDirty,
          },
          null,
          2,
        ),
      );
    } else if (process.argv[2] === "verify") {
      const result = verify(process.argv[3] || root);
      console.log(
        JSON.stringify({
          verified: true,
          artifact: result.artifact,
          build: result.build,
        }),
      );
    } else
      throw Error(
        "Use node tools/release.cjs build [empty directory] OR verify <release directory>",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { build, verify, files };
