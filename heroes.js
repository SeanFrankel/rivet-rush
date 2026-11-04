"use strict";

// Original character kits. Operations are interpreted by abilities.js/match.js; this
// module never mutates a match, imports art, or changes shared movement rules.
const RivetHeroes = (() => {
  const profiles = {
    runner: {
      name: "Arc Runner", role: "Aerial skirmisher", attackType: "ranged",
      max: 150, speed: 205, range: 248, damage: 10, rate: 0.26,
      jumpSpeed: 450, burstSpeed: 585, recharge: 2.1, lungeDamage: 25,
      summary: "Launch a rival, dive onto their escape route, then rush the opening.",
      difficulty: "Flexible", signature: "Vertical combos and close-range pursuit",
    },
    warden: {
      name: "Kiln Warden", role: "Melee vanguard", attackType: "melee",
      max: 190, speed: 179, range: 78, damage: 22, rate: 0.48,
      jumpSpeed: 436, burstSpeed: 465, recharge: 2.6, lungeDamage: 29,
      summary: "Lead the convoy, shield your partner and force a safe place to fight.",
      difficulty: "Direct", signature: "Protecting a push while fighting up close",
    },
    vesper: {
      name: "Vesper Rail", role: "Airborne marksman", attackType: "ranged",
      max: 135, speed: 198, range: 310, damage: 9, rate: 0.32,
      jumpSpeed: 470, burstSpeed: 535, recharge: 2.4, lungeDamage: 18,
      summary: "Change height, recoil away from pressure and line up a clean firing lane.",
      difficulty: "Precise", signature: "Long sightlines and an attacking retreat",
    },
    rook: {
      name: "Magnet Rook", role: "Melee disruptor", attackType: "melee",
      max: 205, speed: 168, range: 68, damage: 26, rate: 0.56,
      jumpSpeed: 445, burstSpeed: 430, recharge: 2.8, lungeDamage: 32,
      summary: "Hook an exposed opponent off their route, then choose to lift or repel them.",
      difficulty: "Deliberate", signature: "Pull, launch and displacement choices",
    },
    fuse: {
      name: "Fuse Scrapjack", role: "Ranged trap engineer", attackType: "ranged",
      max: 155, speed: 190, range: 235, damage: 9, rate: 0.26,
      jumpSpeed: 460, burstSpeed: 520, recharge: 2.3, lungeDamage: 20,
      summary: "Prepare the next landing or wave collision, then rocket-hop to another angle.",
      difficulty: "Predictive", signature: "Delayed damage and alternate-route denial",
    },
    echo: {
      name: "Echo Vandal", role: "Melee flank duelist", attackType: "melee",
      max: 145, speed: 218, range: 84, damage: 17, rate: 0.34,
      jumpSpeed: 455, burstSpeed: 620, recharge: 2.4, lungeDamage: 21,
      summary: "Leave a return anchor, cross through a rival and choose when to disengage.",
      difficulty: "Expressive", signature: "A planned escape route and close-range crossings",
    },
  };

  const skill = (id, name, cooldown, intent, range, description, counterplay, actions, extra = {}) =>
    ({ id, name, cooldown, intent, range, description, counterplay, actions, ...extra });

  const skills = {
    runner: [
      skill("arc-pulse", "Arc Pulse / Pile Driver", 4, "offense", 116,
        "Pulse nearby enemies on the ground; commit to a launching dive in the air.",
        "Leave the landing circle during the windup, then punish the recovery.",
        [{ kind: "core" }]),
      skill("vault-kick", "Vault Kick", 6, "mobility", 82,
        "Kick nearby enemies upward and spring into the air to pursue or reach a deck.",
        "Stay outside the close kick and contest the Runner's landing instead.",
        [{ kind: "blast", radius: 82, damage: 16, force: 100, lift: 300, offsetY: -12 },
          { kind: "move", vx: 130, vy: -480, duration: 0.12 }]),
      skill("return-fire", "Return Fire", 7, "defense", 275,
        "Hop backward while throwing three close-spread bolts toward your opponent.",
        "Stop chasing the retreat line; jump the fan or use the wave as cover.",
        [{ kind: "projectile", count: 3, spread: 0.10, damage: 8, speed: 680, range: 275 },
          { kind: "move", vx: -280, vy: -140, duration: 0.16 }]),
      skill("arc-surge", "Arc Surge", 18, "offense", 260,
        "Refresh your dash, throw a short arc volley and surge through the opening behind a small barrier.",
        "Change height or let crawlers intercept the volley; the surge does not evade damage.",
        [{ kind: "guard", radius: 0, shield: 22, duration: 2.2 },
          { kind: "resetDash" },
          { kind: "projectile", count: 3, spread: 0.20, damage: 14, speed: 720, range: 240 },
          { kind: "move", vx: 620, duration: 0.24, contactDamage: 20, force: 170, lift: 100 }]),
    ],
    warden: [
      skill("rally", "Rally / Bastion Drop", 6, "offense", 138,
        "Strike nearby enemies and shield your crew; casting in the air becomes a protective landing attack.",
        "Separate the Warden from its partner or wait out the brief barrier.",
        [{ kind: "core" }]),
      skill("bulwark-charge", "Bulwark Charge", 8, "offense", 145,
        "Brace behind a personal barrier and shoulder a path through the front of the wave.",
        "Jump over the charge and attack from behind; the shield has a finite strength.",
        [{ kind: "guard", radius: 0, shield: 24, duration: 1.5 },
          { kind: "move", vx: 430, duration: 0.28, contactDamage: 18, force: 260, lift: 80 }]),
      skill("crew-rally", "Crew Rally", 11, "defense", 165,
        "Repair nearby pilots and mobile allies, add a small barrier and help allied pilots recover their dash.",
        "Force the crew to split up or pressure them after the rally is spent.",
        [{ kind: "guard", radius: 165, heal: 18, shield: 16, duration: 2, dashRefund: 0.75 }]),
      skill("hold-line", "Hold the Line", 22, "defense", 150,
        "Establish a four-second rally ground that repairs and refreshes allied barriers while slowing enemies inside.",
        "Take the upper route, displace the crew from its ground, or wait outside the small defended area.",
        [{ kind: "guard", radius: 150, shield: 28, duration: 2.4 },
          { kind: "zone", radius: 150, duration: 4, interval: 1, heal: 8, shield: 12, slow: 0.72 }]),
    ],
    vesper: [
      skill("needle-fan", "Needle Fan", 5, "offense", 340,
        "Fire three precise needles across a narrow fan. Close targets can catch more than one.",
        "Use a crawler as cover or move vertically across the narrow firing angle.",
        [{ kind: "projectile", count: 3, spread: 0.15, damage: 11, speed: 720, range: 340 }]),
      skill("recoil-vault", "Recoil Vault", 7, "mobility", 300,
        "Fire a parting shot and vault backward and upward to another firing angle.",
        "Predict the backward landing; the vault grants no damage immunity.",
        [{ kind: "projectile", count: 1, spread: 0, damage: 16, speed: 720, range: 300 },
          { kind: "move", vx: -280, vy: -410, duration: 0.14 }]),
      skill("rail-lance", "Rail Lance", 8, "offense", 520,
        "After a visible windup, fire a fast lance that can pass through one enemy into a second.",
        "Jump or drop below the locked line during its windup; one body is not complete cover.",
        [{ kind: "projectile", count: 1, spread: 0, damage: 32, speed: 950, range: 520, pierce: 1, delay: 0.30 }]),
      skill("crosswind-barrage", "Crosswind Barrage", 20, "offense", 440,
        "Release seven spreading bolts and recoil into the air. An exposed close target takes the greatest risk.",
        "Keep distance, take a different elevation or put the wave between you and the barrage.",
        [{ kind: "projectile", count: 7, spread: 0.11, damage: 10, speed: 730, range: 440 },
          { kind: "move", vx: -160, vy: -340, duration: 0.14 }]),
    ],
    rook: [
      skill("magnet-hook", "Magnet Hook", 6.5, "offense", 285,
        "Fire a short hook that pulls the first enemy toward you, opening a melee or uppercut follow-up.",
        "Dodge vertically or use a crawler to intercept the hook before it reaches you.",
        [{ kind: "projectile", count: 1, spread: 0, damage: 18, speed: 700, range: 285, pull: true, force: 290, lift: 75 }]),
      skill("piston-uppercut", "Piston Uppercut", 7, "mobility", 85,
        "Launch a nearby rival and spring up after them, turning a lane catch into an aerial fight.",
        "Space outside the short uppercut and attack the Rook's committed landing.",
        [{ kind: "blast", radius: 85, offsetX: 24, offsetY: -12, damage: 20, force: 90, lift: 360 },
          { kind: "move", vx: 70, vy: -390, duration: 0.12 }]),
      skill("repulsor", "Repulsor", 8, "defense", 130,
        "Release a short-warning magnetic shove to peel a diver or push enemies away from an objective.",
        "Hold just outside the field and re-enter after the shove; structures cannot be displaced.",
        [{ kind: "blast", radius: 130, damage: 15, force: 390, lift: 100, delay: 0.12 }]),
      skill("gravity-well", "Gravity Well", 22, "offense", 265,
        "Mark a well ahead of you. After its warning it repeatedly draws nearby enemies inward and damages them.",
        "Leave the circle during the warning or save a dash to exit between pulses.",
        [{ kind: "zone", radius: 160, offsetX: 105, duration: 2.4, interval: 0.4, damage: 7, pull: 180, slow: 0.80, delay: 0.45 }]),
    ],
    fuse: [
      skill("scrap-bomb", "Scrap Bomb", 5, "offense", 230,
        "Toss a short-fuse charge ahead at your current elevation to catch a wave collision or predicted landing.",
        "Move off the marked spot before the fuse ends, especially by changing platforms.",
        [{ kind: "blast", radius: 70, offsetX: 160, damage: 28, force: 95, lift: 130, delay: 0.38 }]),
      skill("rocket-hop", "Rocket Hop", 7, "mobility", 80,
        "Blast the ground behind you and rocket upward, trading an escape cooldown for a new route or bombing angle.",
        "Avoid the small exhaust blast and contest the landing rather than chasing straight upward.",
        [{ kind: "blast", radius: 55, offsetX: -24, damage: 12, force: 140, lift: 70 },
          { kind: "move", vx: 120, vy: -500, duration: 0.12 }]),
      skill("trip-charge", "Trip Charge", 9, "offense", 170,
        "Place a five-second charge ahead. It arms after a short delay and bursts once when an enemy enters.",
        "Send the wave through first, use another elevation, or let the charge expire.",
        [{ kind: "zone", radius: 70, offsetX: 100, duration: 5, interval: 0.2, damage: 32, force: 210, lift: 170, delay: 0.6, trigger: true, once: true }]),
      skill("demolition-run", "Demolition Run", 20, "offense", 355,
        "Mark three advancing explosions along your current lane, forcing the enemy to jump, retreat or concede the push.",
        "Take a different height or move behind the advancing blast sequence.",
        [{ kind: "blast", radius: 85, offsetX: 70, damage: 25, force: 100, lift: 100, delay: 0.35 },
          { kind: "blast", radius: 85, offsetX: 170, damage: 25, force: 100, lift: 100, delay: 0.55 },
          { kind: "blast", radius: 85, offsetX: 270, damage: 25, force: 100, lift: 100, delay: 0.75 }]),
    ],
    echo: [
      skill("echo-blade", "Echo Blade", 5, "offense", 250,
        "Throw a blade through up to two enemies to soften the approach before committing to melee.",
        "Change height or use two bodies as cover; the blade does not pull or stun.",
        [{ kind: "projectile", count: 1, spread: 0, damage: 22, speed: 650, range: 250, pierce: 1 }]),
      skill("recall-anchor", "Recall Anchor", 11, "mobility", 420,
        "Leave a seven-second return point. Press again while within its leash to return; damage and spent cooldowns stay spent.",
        "Watch the anchor, force Echo beyond its leash or wait for the return window to expire.",
        [{ kind: "anchor", duration: 7, maxDistance: 420 }], { recast: "anchor" }),
      skill("shear-step", "Shear Step", 7, "offense", 125,
        "Cut through a nearby opponent to reach the other side, retaining your shared dash for the next decision.",
        "Jump the crossing or answer with a close-range ability; this step does not evade projectiles.",
        [{ kind: "move", vx: 610, duration: 0.16, contactDamage: 24, force: 60, lift: 120 }]),
      skill("afterimage-crosscut", "Afterimage Crosscut", 20, "offense", 220,
        "Make a brief evasive crossing, leaving two warned afterimage cuts along the route for anyone who follows.",
        "Change height instead of chasing the afterimages; the brief evasion does not block melee or area attacks.",
        [{ kind: "move", vx: 760, duration: 0.16, contactDamage: 18, force: 80, lift: 100, evade: true },
          { kind: "blast", radius: 92, offsetX: 0, damage: 20, force: 100, lift: 130, delay: 0.24 },
          { kind: "blast", radius: 92, offsetX: 120, damage: 20, force: 100, lift: 130, delay: 0.40 }]),
    ],
  };

  function cast(heroId, slot, context = {}) {
    if (typeof heroId !== "string" || !Object.hasOwn(skills, heroId) ||
      !Number.isInteger(slot) || slot < 0 || slot > 3) return [];
    const definition = skills[heroId]?.[slot];
    if (!definition) return [];
    const actions = context?.grounded === false
      ? definition.airActions || definition.actions
      : definition.groundActions || definition.actions;
    // An interpreter may attach origins, ownership and timers without changing
    // definitions or another pilot's next cast.
    const damagingActions = actions.filter((action) => action.damage > 0 || action.contactDamage > 0).length;
    return actions.map((action) => {
      const copy = { ...action };
      if (action.damage > 0 || action.contactDamage > 0) {
        const instances = action.kind === "projectile" ? action.count || 1
          : action.kind === "zone" && !action.once ? Math.max(1, Math.ceil(action.duration / action.interval))
          : 1;
        copy.coilScale = 1 / (damagingActions * instances);
      }
      return copy;
    });
  }
  function freeze(value) {
    for (const item of Object.values(value)) if (item && typeof item === "object") freeze(item);
    return Object.freeze(value);
  }
  freeze(profiles);
  freeze(skills);
  return Object.freeze({ profiles, skills, cast, order: Object.freeze(Object.keys(profiles)) });
})();
if (typeof module !== "undefined") module.exports = RivetHeroes;
