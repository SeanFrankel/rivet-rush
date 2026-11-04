"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { build, verify, files } = require("../tools/release.cjs");
test("a release contains only its allowlisted runtime and rejects a modified client", (t) => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "rivet-release-"));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const folder = path.join(scratch, "candidate");
  const result = build(folder),
    manifest = verify(folder);
  assert.equal(manifest.artifact, result.manifest.artifact);
  assert.deepEqual(Object.keys(manifest.files), files);
  assert.equal(fs.existsSync(path.join(folder, ".git")), false);
  assert.equal(fs.existsSync(path.join(folder, "node_modules")), false);
  assert.equal(build(folder).manifest.artifact, manifest.artifact);
  fs.appendFileSync(path.join(folder, "yard.js"), "\n// altered\n");
  assert.throws(() => verify(folder), /yard.js/);
  assert.throws(() => build(folder), /yard.js/);
});
