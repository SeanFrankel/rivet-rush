"use strict";
// Original, mirrored arenas. World coordinates are shared by simulation and presentation.
const RivetMaps = (() => {
  const maps = {
    kiln: {
      name: "Kiln Yard", role: "Siege and high-ground rotations",
      summary: "A clear ground lane and a risky upper vault. Escort the wave or climb for a bonus Breaker.",
      tradeoff: "Reliable siege routes; the exposed vault costs lane presence and invites steals.",
      platforms: [[295,505,275],[565,755,208],[820,960,149],[1025,1215,208],[1275,1485,275]],
      bridge: [755,1025,208], switches: [715,1065], switchY: 208, jets: [],
      gates: [[400,275],[690,208],[890,149],[1090,208],[1364,275],[1605,345]],
      objective: { kind: "vault", name: "Siege Vault", first: 48, respawn: 75, x: 890, y: 149 },
    },
    skyway: {
      name: "Skyway Relay", role: "Vertical flanks and contested control",
      summary: "Launch pads reach split high routes. Hold the central relay for a temporary crew movement boost.",
      tradeoff: "Fast rotations and long firing angles; holding the lower relay exposes you to attacks from above.",
      platforms: [[280,480,285],[480,700,225],[640,810,155],[820,960,205],[970,1140,155],[1080,1300,225],[1300,1500,285]],
      bridge: null, switches: [], switchY: 0, jets: [400,1380],
      gates: [[400,285],[690,155],[890,205],[1090,155],[1380,285],[1605,345]],
      objective: { kind: "relay", name: "Wind Relay", first: 30, respawn: 50, x: 890, y: 205, capture: 4, duration: 20 },
    },
    foundry: {
      name: "Foundry Split", role: "Close approaches and split resources",
      summary: "Short staggered decks surround two supply camps. Raid one, contest both, or punish the rotation in lane.",
      tradeoff: "Many close-range landing options; splitting for supplies leaves fewer allies protecting the push.",
      platforms: [[270,470,285],[500,710,255],[600,760,185],[815,965,275],[1020,1180,185],[1070,1280,255],[1310,1510,285]],
      bridge: null, switches: [], switchY: 0, jets: [],
      gates: [[370,285],[660,185],[890,275],[1120,185],[1410,285],[1605,345]],
      objective: { kind: "camps", name: "Supply Camps", first: 32, respawn: 55, camps: [[620,255],[1160,255]] },
    },
  };
  function freeze(value) { for (const v of Object.values(value)) if (v && typeof v === "object") freeze(v); return Object.freeze(value); }
  freeze(maps);
  const valid = id => typeof id === "string" && Object.hasOwn(maps, id);
  return { maps, valid, get: id => maps[valid(id) ? id : "kiln"] };
})();
if (typeof module !== "undefined") module.exports = RivetMaps;
