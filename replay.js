"use strict";

// Store only changes in player intent. Bots run the same decision code during replay.
const RivetReplay = (() => {
  const wire = typeof module !== "undefined" ? require("./protocol") : RivetWire;
  const yard = typeof module !== "undefined" ? require("./match") : Yard;
  const rules = "kiln-02.4";
  const stride = wire.maxMask + 1;
  const limit = 60 * 420;
  function inputCode(input) {
    if (!input) return -1;
    const aim =
      Number.isInteger(input.aim) && input.aim >= 0 && input.aim < 256 ? input.aim + 1 : 0;
    return wire.encode(input) + stride * aim;
  }
  function inputFrom(code) {
    return { ...wire.decode(code % stride), aim: Math.floor(code / stride) - 1 };
  }
  function signature(game) {
    // Compare the replicated state at a tick, including positions, HP, economy and results.
    const text = JSON.stringify(wire.pack(game));
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function recorder(game) {
    const pilots = game.units.filter((u) => u.kind === "pilot").sort((a, b) => a.seat - b.seat);
    const last = pilots.map(() => -1),
      changes = [];
    return {
      capture(tick, inputs) {
        for (const p of pilots) {
          const code = inputCode(inputs[p.seat]);
          if (code !== last[p.seat]) {
            changes.push([tick, p.seat, code]);
            last[p.seat] = code;
          }
        }
      },
      export(game) {
        return {
          format: "rivet-rush",
          rules,
          protocol: wire.version,
          kits: pilots.map((p) => p.kit),
          ticks: game.tick,
          changes,
          winner: game.winner,
          signature: signature(game),
        };
      },
    };
  }
  function load(record) {
    if (
      record?.format !== "rivet-rush" ||
      record.rules !== rules ||
      record.protocol !== wire.version
    )
      throw Error("Replay requires the matching Rivet Rush build.");
    if (
      !Array.isArray(record.kits) ||
      ![2, 4].includes(record.kits.length) ||
      record.kits.some((k) => typeof k !== "string" || !Object.hasOwn(yard.kits, k))
    )
      throw Error("Invalid replay roster.");
    if (
      !Number.isInteger(record.ticks) ||
      record.ticks < 1 ||
      record.ticks > limit ||
      !Array.isArray(record.changes) ||
      record.changes.length > record.ticks * record.kits.length
    )
      throw Error("Invalid replay length.");
    let previous = -1;
    for (const change of record.changes) {
      if (!Array.isArray(change) || change.length !== 3 || !change.every(Number.isInteger))
        throw Error("Invalid replay input.");
      const [tick, seat, code] = change,
        order = tick * 4 + seat;
      if (
        tick < 0 ||
        tick >= record.ticks ||
        seat < 0 ||
        seat >= record.kits.length ||
        order <= previous ||
        code < -1 ||
        code >= stride * 257
      )
        throw Error("Invalid replay sequence.");
      previous = order;
    }
    const game = yard.create({ teamSize: record.kits.length / 2, kits: record.kits });
    const inputs = {};
    let cursor = 0;
    function advance() {
      if (game.tick >= record.ticks || game.winner !== null) return false;
      while (cursor < record.changes.length && record.changes[cursor][0] === game.tick) {
        const [, seat, code] = record.changes[cursor++];
        if (code === -1) delete inputs[seat];
        else inputs[seat] = inputFrom(code);
      }
      yard.stepSeats(game, inputs);
      return true;
    }
    return {
      game,
      advance,
      verified: () =>
        game.tick === record.ticks &&
        game.winner === record.winner &&
        signature(game) === record.signature,
    };
  }
  return { recorder, load, rules, signature };
})();
if (typeof module !== "undefined") module.exports = RivetReplay;
