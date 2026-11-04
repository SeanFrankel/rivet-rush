"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const Yard = require("../match"),
  Replay = require("../replay");
test("a full two-crew match reproduces from recorded inputs including bot handovers", () => {
  const m = Yard.create({ teamSize: 2, kits: { 0: "warden", 1: "runner" } });
  const capture = Replay.recorder(m);
  while (m.winner === null) {
    const controls =
      m.tick % 400 < 320
        ? {
            0: {
              right: true,
              fire: true,
              aim: 0,
              pulse: m.tick % 217 === 0,
              dash: m.tick % 131 === 0,
              coil: m.tick % 103 === 0,
            },
          }
        : {};
    capture.capture(m.tick, controls);
    Yard.stepSeats(m, controls);
  }
  const record = JSON.parse(JSON.stringify(capture.export(m)));
  assert.ok(record.changes.length < m.tick / 3);
  const replay = Replay.load(record);
  while (replay.advance()) {}
  assert.equal(replay.verified(), true);
  assert.equal(replay.game.tick, m.tick);
});
test("incompatible and out-of-order replay inputs fail before playback", () => {
  const m = Yard.create(),
    record = Replay.recorder(m);
  record.capture(0, { 0: { jump: true } });
  Yard.step(m, { jump: true });
  const data = record.export(m);
  assert.throws(() => Replay.load({ ...data, rules: "other" }), /matching/);
  assert.throws(
    () =>
      Replay.load({
        ...data,
        changes: [
          [0, 1, 0],
          [0, 0, 0],
        ],
      }),
    /sequence/,
  );
  const altered = Replay.load({ ...data, signature: "00000000" });
  altered.advance();
  assert.equal(altered.verified(), false);
});
test("the published four-browser match still reaches its recorded reactor kill", () => {
  const record = require("./fixtures/kiln-02.4-2v2.json");
  const replay = Replay.load(record);
  while (replay.advance()) {}
  assert.equal(replay.verified(), true);
  assert.equal(replay.game.endReason, "reactor");
});
