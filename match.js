"use strict";

const Yard = (() => {
  const heroes = typeof module !== "undefined" ? require("./heroes") : RivetHeroes;
  const abilityEngine = typeof module !== "undefined" ? require("./abilities") : RivetAbilities;
  const mapCatalog = typeof module !== "undefined" ? require("./maps") : RivetMaps;
  const mapFor = m => mapCatalog.get(m.mapId);
  const width = 1780;
  const floor = 345;
  const stepSeconds = 1 / 60;
  const switches = mapCatalog.maps.kiln.switches;
  const stats = {
    pilot: {
      max: 150,
      speed: 205,
      range: 248,
      damage: 10,
      rate: 0.26,
      height: 34,
      radius: 12,
    },
    crawler: {
      max: 48,
      speed: 46,
      range: 142,
      damage: 7,
      rate: 0.95,
      height: 19,
      radius: 12,
    },
    breaker: {
      max: 125,
      speed: 41,
      range: 182,
      damage: 10,
      rate: 1.1,
      height: 29,
      radius: 17,
    },
    keeper: {
      max: 245,
      speed: 0,
      range: 125,
      damage: 22,
      rate: 2.15,
      height: 40,
      radius: 18,
    },
    sentry: {
      max: 320,
      speed: 0,
      range: 238,
      damage: 12,
      rate: 0.82,
      height: 48,
      radius: 18,
    },
    reactor: {
      max: 540,
      speed: 0,
      range: 120,
      damage: 8,
      rate: 1.1,
      height: 70,
      radius: 23,
    },
  };
  const kits = heroes.profiles;
  const dashDuration = 0.18;
  const slamWindup = 0.15;
  const sentryWindup = 0.42;
  const prices = [12, 20, 28, 36, 44, 52];
  const upgradeCost = (u) => prices[u.rank] ?? 0;
  const limitX = (x) => Math.min(width - 20, Math.max(20, x));
  const height = (u) => (u.kind === "pilot" && u.slideLeft > 0 ? 21 : stats[u.kind].height);
  const middle = (u) => u.y - height(u) / 2;
  const distance = (u, other) => Math.hypot(other.x - u.x, middle(other) - middle(u));
  const mirror = (team, x) => (team === 0 ? x : width - x);
  const approach = (value, amount) => Math.max(0, value - amount);
  const abilities = abilityEngine.create({ heroes, effect, note, middle, distance, width, floor });

  function addUnit(m, kind, team, spawn) {
    const config = stats[kind];
    const u = {
      id: ++m.serial,
      kind,
      team,
      spawn,
      x: mirror(team, spawn),
      y: floor,
      ...config,
      hp: config.max,
      cd: 0,
      vy: 0,
      knock: 0,
      dir: team === 0 ? 1 : -1,
      jumps: 0,
      flash: 0,
      grounded: true,
      damagedAt: -10,
      barrier: 0,
      barrierTime: 0,
      slow: 1,
      slowTime: 0,
    };
    m.units.push(u);
    return u;
  }

  function addPilot(m, team, slot, selected) {
    const u = addUnit(m, "pilot", team, slot === 0 ? 165 : 122);
    const kit = Object.hasOwn(kits, selected) ? selected : slot === 0 ? "runner" : "warden";
    const profile = kits[kit];
    Object.assign(u, {
      kit,
      max: profile.max,
      hp: profile.max,
      speed: profile.speed,
      range: profile.range,
      damage: profile.damage,
      rate: profile.rate,
    });
    Object.assign(u, {
      seat: slot * 2 + team,
      scrap: 0,
      rank: 0,
      driveRank: 0,
      coilRank: 0,
      dash: 0,
      dashLeft: 0,
      dashDir: u.dir,
      lunge: false,
      struck: [],
      pulse: 0,
      cooldowns: [0, 0, 0],
      castMask: 0,
      anchor: null,
      skillDash: false,
      skillEvade: false,
      skillDashSpeed: 0,
      skillDashVy: null,
      skillDashDamage: 0,
      skillDashForce: 0,
      skillDashLift: 0,
      slamming: false,
      windup: 0,
      recovery: 0,
      respawn: 0,
      spawnGuard: 0,
      downedBy: "",
      recentHits: [],
      recap: [],
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      lungesLanded: 0,
      slamsLanded: 0,
      lastHits: 0,
      farmScrap: 0,
      shieldGiven: 0,
      objectiveDamage: 0,
      vx: 0,
      jumpBuffer: 0,
      coyote: 0,
      dropTime: 0,
      dropY: 0,
      repairing: false,
      slideLeft: 0,
      slideCooldown: 0,
      slideLatched: false,
      canShortHop: false,
      note: "",
      notice: 0,
      moving: false,
      retreating: false,
      botThink: 0,
      botOrder: {},
    });
  }

  function wave(m) {
    m.wave++;
    for (const team of [0, 1]) {
      for (let i = 0; i < 3; i++) addUnit(m, "crawler", team, 120 + i * 28);
      if (m.wave % 3 === 0 || m.tick >= 60 * 300) addUnit(m, "breaker", team, 108);
      if (m.convoy[team]) {
        addUnit(m, "breaker", team, 88);
        m.convoy[team] = false;
      }
    }
    m.nextWave = 12;
  }

  // Local aliases are excluded from snapshots. Each client follows its own seat.
  function follow(m, seat = 0) {
    const pilot = m.units.find((u) => u.kind === "pilot" && u.seat === seat);
    Object.defineProperty(m, "player", { configurable: true, value: pilot });
    for (const key of ["pulse", "scrap", "rank", "notice", "note"]) {
      Object.defineProperty(m, key, {
        configurable: true,
        get: () => pilot[key],
      });
    }
    return m;
  }

  function create(options = {}) {
    const objective = mapCatalog.get(options.mapId).objective;
    const m = {
      mapId: mapCatalog.valid(options.mapId) ? options.mapId : "kiln",
      relay: { team: -1, progress: 0, next: objective.first },
      surgeUntil: [0, 0],
      camps: (objective.camps || []).map(() => ({ next: objective.first })),
      units: [],
      shots: [],
      fx: [],
      tick: 0,
      time: 0,
      serial: 0,
      wave: 0,
      nextWave: 0,
      bridge: 0,
      drops: [],
      mortars: [],
      zones: [],
      delayed: [],
      winner: null,
      endReason: null,
      neutralAt: objective.kind === "vault" ? objective.first : null,
      convoy: [false, false],
      contracts: [0, 0],
      announcement: "",
      announcementUntil: 0,
    };
    for (const team of [0, 1]) {
      addUnit(m, "reactor", team, 65).shielded = true;
      addUnit(m, "sentry", team, 365);
      addPilot(m, team, 0, options.kits?.[team]);
      if (options.teamSize === 2)
        addPilot(
          m,
          team,
          1,
          options.kits?.[team + 2] ?? (options.kits?.[team] === "warden" ? "runner" : "warden"),
        );
    }
    wave(m);
    return follow(m);
  }

  function createTraining(kit, mapId = "kiln") {
    const m = create({ kits: { 0: kit }, mapId });
    m.training = true;
    m.units = m.units.filter((u) => u.kind === "pilot");
    m.player.x = 550;
    const dummy = m.units.find((u) => u.team === 1);
    dummy.x = 800;
    dummy.spawn = width - 800;
    dummy.hp = dummy.max = 300;
    return m;
  }

  function effect(m, kind, u, size, duration, y = middle(u)) {
    m.fx.push({
      id: ++m.serial,
      kind,
      team: u.team,
      dir: u.dir,
      x: u.x,
      y,
      size,
      duration,
      life: duration,
    });
  }
  function announce(m, message) {
    m.announcement = message;
    m.announcementUntil = m.time + 3.2;
  }

  function hit(m, u, damage, attacker) {
    if (u.hp <= 0 || u.spawnGuard > 0) return;
    if (u.shielded) {
      if (m.time - u.damagedAt > 0.16) effect(m, "shield", u, 40, 0.22);
      u.damagedAt = m.time;
      return;
    }
    u.damagedAt = m.time;
    if (u.barrier > 0) {
      const absorbed = Math.min(u.barrier, damage);
      u.barrier -= absorbed;
      damage -= absorbed;
    }
    if (damage <= 0) return;
    if (attacker?.kind === "pilot") attacker.damageDealt += Math.min(damage, u.hp);
    if (attacker?.kind === "pilot" && u.speed === 0)
      attacker.objectiveDamage += Math.min(damage, u.hp);
    if (u.kind === "pilot") {
      const source =
        attacker?.kind === "pilot" ? kits[attacker.kit].name : attacker?.kind || "enemy fire";
      u.recentHits = u.recentHits.filter((h) => m.tick - h[0] <= 360);
      u.recentHits.push([m.tick, source, Math.min(damage, u.hp)]);
    }
    u.hp = Math.max(0, u.hp - damage);
    u.flash = 0.12;
    if (u.hp > 0) return;
    effect(m, "burst", u, u.kind === "pilot" ? 44 : 28, 0.38);
    if (u.kind === "keeper") {
      m.drops.push({
        id: ++m.serial,
        type: mapFor(m).objective.kind === "camps" ? "supply" : "cell",
        x: u.x,
        y: u.y - 17,
        amount: 0,
        life: 10,
        team: 2,
      });
      if (mapFor(m).objective.kind === "camps") {
        m.camps[u.campId].next = m.time + mapFor(m).objective.respawn;
        announce(m, "Supply cache loose · either crew can claim it");
      } else {
        m.neutralAt = m.time + 75;
        announce(m, "Siege cell loose · claim the upper deck");
      }
      return;
    }
    const bounty = { crawler: 2, breaker: 5, pilot: 8, sentry: 15, reactor: 0 }[u.kind];
    for (const ally of m.units) {
      if (ally.kind === "pilot" && ally.team !== u.team) ally.scrap += bounty;
    }
    if (u.kind === "crawler" || u.kind === "breaker") {
      if (attacker?.kind === "pilot") {
        attacker.lastHits++;
        attacker.scrap += 2;
        attacker.farmScrap += 2;
      }
      m.drops.push({
        id: ++m.serial,
        x: u.x,
        y: u.y - 12,
        amount: u.kind === "breaker" ? 4 : 2,
        life: 6,
        team: 1 - u.team,
      });
    }
    if (u.kind === "pilot") {
      u.respawn = Math.min(9, 5 + Math.floor(m.time / 75));
      u.deaths++;
      const totals = new Map();
      for (const [, source, amount] of u.recentHits)
        totals.set(source, (totals.get(source) || 0) + amount);
      u.recap = [...totals].sort((a, b) => b[1] - a[1]);
      u.downedBy =
        attacker?.kind === "pilot" ? kits[attacker.kit].name : attacker?.kind || "enemy fire";
      if (attacker?.kind === "pilot") attacker.kills++;
    }
    if (u.kind === "sentry") {
      const core = m.units.find((unit) => unit.team === u.team && unit.kind === "reactor");
      if (core) core.shielded = false;
      announce(m, (u.team === 0 ? "Torch" : "Cinder") + " sentry down · reactor exposed");
    }
  }

  function fire(m, u, x, y) {
    if (u.cd > 0) return;
    const dx = x - u.x,
      dy = y - middle(u);
    const length = Math.hypot(dx, dy) || 1;
    m.shots.push({
      id: ++m.serial,
      source: u.id,
      x: u.x,
      y: middle(u),
      vx: (dx / length) * 600,
      vy: (dy / length) * 600,
      team: u.team,
      damage: u.damage,
      siege: u.kind === "breaker",
      upperShot: u.kind === "pilot" && u.y <= 230,
      originY: u.y,
      left: u.range + 24,
    });
    u.cd = u.rate;
  }

  function fireAt(m, u, target) {
    fire(m, u, target ? target.x : u.x + u.dir, target ? middle(target) : middle(u));
  }

  function targetFor(m, u, range, front = false) {
    let best = null,
      nearest = range;
    for (const other of m.units) {
      if (
        other.team === u.team ||
        other.hp <= 0 ||
        other.spawnGuard > 0 ||
        (front && (other.x - u.x) * u.dir < 0)
      )
        continue;
      if (other.kind === "keeper" && (u.kind !== "pilot" || u.y > other.y + 81)) continue;
      const d = distance(u, other);
      if (d <= nearest) {
        best = other;
        nearest = d;
      }
    }
    return best;
  }

  function sentryStep(m, u, dt) {
    if (u.aim) {
      u.aim.remaining -= dt;
      if (u.aim.remaining <= 0) {
        fire(m, u, u.aim.x, u.aim.y);
        u.aim = null;
        u.cd -= sentryWindup;
      }
    } else if (u.cd <= 0) {
      const target = targetFor(m, u, u.range);
      if (target) {
        u.dir = Math.sign(target.x - u.x) || u.dir;
        u.aim = { x: target.x, y: middle(target), remaining: sentryWindup };
      }
    }
  }

  function platforms(m) {
    const arena = mapFor(m);
    return m.bridge > 0 && arena.bridge ? [...arena.platforms, arena.bridge] : arena.platforms;
  }

  function keeperStep(m, u, dt, hits) {
    if (u.charge > 0) {
      u.charge = approach(u.charge, dt);
      if (u.charge === 0) {
        effect(m, "pulse", u, u.range, 0.36);
        for (const pilot of m.units) {
          if (pilot.kind === "pilot" && pilot.hp > 0 && distance(u, pilot) <= u.range)
            hits.push({
              target: pilot,
              source: u,
              damage: u.damage,
              dir: Math.sign(pilot.x - u.x) || 1,
              force: 115,
              lift: 80,
            });
        }
        u.cd = u.rate;
      }
    } else if (
      u.cd <= 0 &&
      m.units.some((p) => p.kind === "pilot" && p.hp > 0 && distance(u, p) <= u.range)
    ) {
      u.charge = 0.65;
    }
  }

  function vertical(m, u, dt) {
    const old = u.y;
    u.vy += 1050 * dt;
    u.y += u.vy * dt;
    let landing = floor;
    for (const [a, b, y] of platforms(m)) {
      if (u.dropTime > 0 && u.dropY === y) continue;
      if (u.x >= a && u.x <= b && old <= y && u.y >= y) landing = Math.min(landing, y);
    }
    u.grounded = u.y >= landing;
    if (u.grounded) {
      u.y = landing;
      u.jumps = 0;
      u.vy = 0;
    }
  }

  function push(u, dir, force, lift) {
    if (u.speed === 0 || u.hp <= 0 || u.spawnGuard > 0) return;
    u.knock = dir * force;
    u.vy = -lift;
    u.grounded = false;
  }

  function blast(m, u, landing, hits) {
    const rally = u.kit === "warden";
    const size = rally ? 138 : landing ? 116 : 110;
    effect(
      m,
      rally ? "rally" : landing ? "slam" : "pulse",
      u,
      size,
      0.36,
      landing ? u.y : middle(u),
    );
    for (const other of m.units) {
      if (other.hp <= 0 || distance(u, other) > size) continue;
      if (other.kind === "keeper" && u.y > other.y + 81) continue;
      if (other.team === u.team) {
        if (rally && other.speed > 0) {
          const strength = 32 + 5 * u.coilRank;
          u.shieldGiven += Math.max(0, strength - other.barrier);
          other.barrier = Math.max(other.barrier, strength);
          other.barrierTime = 2.4;
        }
        continue;
      }
      hits.push({
        target: other,
        damage: (rally ? (landing ? 27 : 18) : landing ? 44 : 32) + 4 * u.coilRank,
        source: u,
        dir: Math.sign(other.x - u.x) || u.dir,
        force: landing ? 260 : 170,
        lift: landing ? 235 : 100,
      });
      if (landing && other.kind === "pilot") u.slamsLanded++;
    }
  }

  function note(u, message) {
    u.note = message;
    u.notice = 1.8;
  }

  function upgrade(u, track) {
    const cost = upgradeCost(u);
    if (!cost) return note(u, "Rig fully upgraded");
    const tier =
      track === "drive"
        ? u.driveRank
        : track === "coil"
          ? u.coilRank
          : u.rank - u.driveRank - u.coilRank;
    if (tier >= 3) return note(u, "Track complete · choose another mod");
    if (u.scrap < cost) return note(u, "Next mod costs " + cost + " scrap");
    u.scrap -= cost;
    u.rank++;
    if (track === "drive") {
      u.driveRank++;
      u.max += 18;
      u.hp += 18;
      note(u, "Drive tuned · quicker dash recharge");
    } else if (track === "coil") {
      u.coilRank++;
      note(u, "Shock coil tuned");
    } else {
      u.damage += 4;
      note(u, "Rivet damage increased");
    }
  }

  function pilotStep(m, u, k, dt, actions) {
    const kit = kits[u.kit];
    const firing = k.fire || k.fireTap;
    const axis = Number(!!k.right) - Number(!!k.left);
    u.moving = axis !== 0;
    u.spawnGuard = firing || k.pulse || k.skill2 || k.skill3 || k.ultimate ? 0 : approach(u.spawnGuard, dt);
    u.cooldowns = u.cooldowns.map((value) => approach(value, dt));
    if (u.anchor && (u.anchor.left -= dt) <= 0) u.anchor = null;
    for (const key of [
      "dash",
      "pulse",
      "recovery",
      "notice",
      "jumpBuffer",
      "dropTime",
      "slideLeft",
      "slideCooldown",
    ])
      u[key] = approach(u[key], dt);
    if (!k.down) u.slideLatched = false;
    u.coyote = u.grounded ? 0.085 : approach(u.coyote, dt);
    if (!u.grounded && u.coyote === 0 && u.jumps === 0) u.jumps = 1;
    if (k.jump) u.jumpBuffer = 0.11;
    if (k.down && u.grounded && u.y < floor) {
      u.dropY = u.y;
      u.dropTime = 0.18;
      u.grounded = false;
      u.coyote = 0;
      u.vy = 65;
    }
    if (k.buy || k.drive || k.coil) upgrade(u, k.drive ? "drive" : k.coil ? "coil" : "gun");
    if (k.crane && mapFor(m).switches.some((x) => Math.abs(u.x - x) < 65) && Math.abs(u.y - mapFor(m).switchY) < 35) {
      m.bridge = 10;
      note(u, "Crossing open");
    } else if (k.crane) note(u, "Reach an upper crane switch");

    if (axis && u.dashLeft <= 0) u.dir = axis;
    if (u.slamming) {
      u.windup = approach(u.windup, dt);
      u.vy = u.windup > 0 ? 0 : 740;
    } else if (u.recovery <= 0) {
      if (k.dash && u.dash <= 0 && u.dashLeft <= 0) {
        u.skillDash = false;
        u.skillEvade = false;
        u.dash = kit.recharge - 0.25 * u.driveRank;
        u.dashLeft = dashDuration;
        u.dashDir = u.dir;
        u.lunge = !!firing;
        u.slideLeft = 0;
        u.struck = [];
        effect(m, u.lunge ? "lunge" : "dash", u, 46, 0.23);
      }
      if (u.jumpBuffer > 0 && u.jumps < 2) {
        const boost = u.dashLeft > 0 && !u.lunge;
        if (boost) u.vx = u.dashDir * u.speed * 1.78;
        if (!u.lunge || u.dashLeft <= 0) {
          effect(m, boost ? "boost" : "kick", u, boost ? 30 : 20, 0.22, u.y);
          u.dashLeft = 0;
          u.slideLeft = 0;
          const jet = u.grounded && u.y === floor && mapFor(m).jets.some(x => Math.abs(u.x - x) < 28);
          u.vy = jet ? -620 : -kit.jumpSpeed;
          u.jumps++;
          u.jumpBuffer = 0;
          u.grounded = false;
          u.canShortHop = !jet;
        }
      }
      if (k.jumpRelease && u.canShortHop) {
        u.vy = Math.max(u.vy, -185);
        u.canShortHop = false;
      }
      abilities.tryCast(m, u, k, actions);
    }

    const dashing = u.dashLeft > 0;
    if (k.down && !u.grounded && !u.slamming && !dashing && u.vy >= 0) u.vy = Math.max(u.vy, 370);
    if (
      k.down &&
      u.grounded &&
      u.y === floor &&
      !dashing &&
      !u.slamming &&
      !u.slideLatched &&
      u.slideCooldown <= 0 &&
      Math.abs(u.vx) >= u.speed * 0.72
    ) {
      u.slideLeft = 0.38;
      u.slideCooldown = 0.85;
      u.slideLatched = true;
      u.vx = Math.sign(u.vx) * Math.max(Math.abs(u.vx), u.speed * 1.38);
      effect(m, "slide", u, 24, 0.22, u.y);
    }
    if (dashing) {
      u.vx = u.dashDir * (u.skillDash ? u.skillDashSpeed : kit.burstSpeed);
      u.vy = u.skillDash ? (u.skillDashVy ?? u.vy) : 0;
    } else {
      if (axis * u.vx < 0) {
        u.slideLeft = 0;
        // A deliberate countersteer brakes the pilot's own movement immediately.
        // External knockback and a committed attack still have their full effect.
        if (!u.slamming && u.recovery <= 0) u.vx = axis * Math.min(50, Math.abs(u.vx));
      }
      let target = axis * u.speed * (u.slow || 1) * (m.surgeUntil?.[u.team] > m.time ? 1.2 : 1);
      if (u.slamming || u.recovery > 0) target *= 0.24;
      let acceleration = u.grounded ? 2600 : 1550;
      if (!u.grounded && !axis) acceleration = Math.abs(u.vx) > u.speed * 1.04 ? 180 : 680;
      if (!u.grounded && axis === Math.sign(u.vx) && Math.abs(u.vx) > u.speed) acceleration = 150;
      if (u.slideLeft > 0) {
        target = 0;
        acceleration = 175;
      }
      u.vx += Math.sign(target - u.vx) * Math.min(Math.abs(target - u.vx), acceleration * dt);
    }
    u.x = limitX(u.x + (u.vx + u.knock) * dt);
    vertical(m, u, dt);
    if (u.grounded) u.canShortHop = false;
    if (dashing) {
      if (u.lunge) actions.push({ type: "lunge", u });
      u.dashLeft = approach(u.dashLeft, dt);
      if (u.dashLeft === 0 && !u.skillDash) u.vx = u.dashDir * u.speed * 1.48;
    } else if (u.slamming && u.grounded && u.windup <= 0) {
      u.slamming = false;
      u.recovery = 0.21;
      actions.push({ type: "slam", u });
    } else if (firing && !u.slamming && u.recovery <= 0) {
      if (Number.isInteger(k.aim) && k.aim >= 0 && k.aim < 256) {
        const angle = k.aim * ((2 * Math.PI) / 256);
        u.dir = Math.cos(angle) < 0 ? -1 : 1;
        actions.push({ type: "aim", u, angle });
      } else actions.push({ type: "rivet", u });
    }
  }

  function botInput(m, u, dt) {
    u.botThink -= dt;
    if (u.botThink > 0) return u.botOrder;
    u.botThink = 0.19 + Math.floor(u.seat / 2) * 0.026;
    const target = targetFor(m, u, 315);
    const skillOrders = {};
    for (const [slot, key] of [[1, "skill2"], [2, "skill3"], [3, "ultimate"]]) {
      const skill = heroes.skills[u.kit][slot];
      const gap = target ? distance(u, target) : Infinity;
      if (u.anchor && slot === 1) skillOrders[key] = u.hp < u.max * .45;
      else if (abilities.cooldown(u, slot) <= 0) {
        skillOrders[key] = skill.intent === "defense" ? !!target && u.hp < u.max * .7
          : skill.intent === "mobility" ? !!target && gap > u.range * .7 && gap < skill.range
          : !!target && gap <= skill.range && (slot < 3 || target.kind === "pilot" || target.kind === "sentry");
      }
    }
    const advance = u.team === 0 ? 1 : -1;
    const build =
      u.kit === "warden"
        ? ["coil", "drive", "buy", "coil", "drive", "coil"]
        : ["buy", "drive", "buy", "coil", "buy", "drive"];
    const purchase = u.rank < 6 && u.scrap >= upgradeCost(u) ? { [build[u.rank]]: true } : {};
    const home = mirror(u.team, 65);
    if (u.hp < u.max * 0.24) u.retreating = true;
    if (u.hp >= u.max * 0.78) u.retreating = false;
    if (u.retreating) {
      const back = Math.sign(home - u.x);
      const travel = Math.abs(home - u.x) > 75;
      u.botOrder = {
        left: travel && back < 0,
        right: travel && back > 0,
        down: true,
        fire: !!target,
      };
      if (target) {
        const angle = Math.atan2(middle(target) - middle(u), target.x - u.x);
        u.botOrder.aim = (Math.round((angle * 128) / Math.PI) + 256) % 256;
      }
      return {
        ...u.botOrder,
        ...purchase,
        ...skillOrders,
        dash: travel && !target && u.dash <= 0,
      };
    }
    // New arenas keep one pilot in lane while the other contests their secondary reward.
    const arena = mapFor(m), objective = arena.objective;
    if (arena !== mapCatalog.maps.kiln && u.seat < 2 && u.hp > u.max * .45) {
      const ownSentry = m.units.find(v => v.kind === "sentry" && v.team === u.team);
      const threatened = ownSentry && m.units.some(v => v.hp > 0 && v.team === 1-u.team && Math.abs(v.x-ownSentry.x)<180);
      const prizes = m.drops.filter(d => d.type === "supply");
      const guards = m.units.filter(v => v.kind === "keeper" && v.hp > 0);
      const goals = [...prizes.map(d => ({x:d.x,y:d.y+17})), ...guards];
      if (objective.kind === "relay" && m.time >= m.relay.next) goals.push(objective);
      goals.sort((a,b) => Math.abs(a.x-u.x)-Math.abs(b.x-u.x));
      const goal = goals[0];
      if (goal && !threatened) {
        const dx = goal.x-u.x-u.vx*.08;
        const jump = u.y > goal.y+4 && Math.abs(dx)<190 && (u.grounded || (u.jumps===1 && u.vy>-90));
        u.botOrder = { left: dx < -8, right: dx > 8, fire: guards.length > 0,
          down: u.y < goal.y-8 && Math.abs(dx)<50 };
        return {...u.botOrder, ...purchase, ...skillOrders, jump, pulse: guards.some(g => distance(u,g)<100) && u.pulse<=0};
      }
    }
    // One pilot can rotate. Its teammate keeps pressure in the main lane.
    const prize = m.drops.find((d) => d.type === "cell");
    const keeper = m.units.find((other) => other.kind === "keeper" && other.hp > 0);
    const anchor = m.units.find((other) => other.team === u.team && other.kind === "sentry");
    if (
      mapFor(m).objective.kind === "vault" &&
      u.seat < 2 &&
      (keeper || prize) &&
      anchor?.hp > 0 &&
      !m.units.some((o) => o.team === 1 - u.team && o.hp > 0 && Math.abs(o.x - anchor.x) < 200)
    ) {
      const stage = mirror(u.team, 690);
      if (u.grounded && u.y <= 208) u.crossVault = true;
      if (u.y > 225) u.crossVault = false;
      const goal = u.crossVault ? width / 2 : stage,
        dx = goal - u.x - u.vx * 0.08;
      const jumping = u.crossVault
        ? Math.abs(u.x - width / 2) < 182 && u.y > 150
        : Math.abs(u.x - stage) < 45;
      u.botOrder = {
        left: dx < -6,
        right: dx > 6,
        fire: !!keeper && u.y <= 230,
      };
      return {
        ...u.botOrder,
        ...purchase,
        ...skillOrders,
        jump: jumping && (u.grounded || (u.jumps === 1 && u.vy > -90)),
        pulse: !!keeper && u.grounded && Math.abs(u.x - keeper.x) < 80 && u.y <= 155,
      };
    }
    const dx = target ? target.x - u.x : advance * 400;
    const direction = Math.sign(dx) || u.dir;
    const spacing = Math.min(u.seat < 2 ? 140 : 91, u.range * .7);
    const drive = Math.abs(dx) > spacing || (target && u.dir !== direction);
    const order = {
      left: drive && direction < 0,
      right: drive && direction > 0,
      fire: !!target,
    };
    u.botOrder = order;
    const opponent = target?.kind === "pilot";
    const near = target && distance(u, target) < 104;
    const aimingSentry =
      target?.kind === "sentry" &&
      target.aim &&
      target.aim.remaining < 0.29 &&
      Math.abs(target.aim.x - u.x) < 29 &&
      Math.abs(target.aim.y - middle(u)) < 14;
    return {
      ...order,
      ...purchase,
      ...skillOrders,
      pulse: near && u.pulse <= 0,
      jump:
        u.grounded && (aimingSentry || (opponent && (target.y < u.y - 25 || (u.hp < 78 && near)))),
      down: target && target.y > u.y + 30 && !near,
      dash: opponent && Math.abs(dx) > 125 && Math.abs(dx) < 185 && u.dash <= 0,
    };
  }

  function respawn(u) {
    Object.assign(u, {
      recentHits: [],
      recap: [],
      anchor: null,
      skillDash: false,
      skillEvade: false,
      slow: 1,
      slowTime: 0,
      x: mirror(u.team, u.spawn),
      y: floor,
      hp: u.max,
      vy: 0,
      vx: 0,
      knock: 0,
      dir: u.team === 0 ? 1 : -1,
      jumps: 0,
      grounded: true,
      dash: 0,
      dashLeft: 0,
      pulse: 0,
      slamming: false,
      recovery: 0,
      botThink: 0,
      moving: false,
      lunge: false,
      jumpBuffer: 0,
      coyote: 0,
      dropTime: 0,
      repairing: false,
      retreating: false,
      damagedAt: -10,
      barrier: 0,
      barrierTime: 0,
      spawnGuard: 1.1,
      slideLeft: 0,
      slideCooldown: 0,
      slideLatched: false,
      canShortHop: false,
    });
  }

  function intercept(shot, units, dx, dy) {
    let first = null,
      firstTime = Infinity;
    for (const u of units) {
      if (
        u.team === shot.team ||
        u.hp <= 0 ||
        u.spawnGuard > 0 ||
        (u.kind === "keeper" && (shot.originY === undefined ? !shot.upperShot : shot.originY > u.y + 81))
      )
        continue;
      if (shot.hitIds?.includes(u.id)) continue;
      if (u.kind === "pilot" && u.dashLeft > 0.065 && (u.skillDash ? u.skillEvade : !u.lunge)) continue;
      const radius = stats[u.kind].radius;
      const x1 = u.x - radius - shot.x,
        x2 = u.x + radius - shot.x;
      const y1 = u.y - height(u) - shot.y,
        y2 = u.y - shot.y;
      if ((!dx && (x1 > 0 || x2 < 0)) || (!dy && (y1 > 0 || y2 < 0))) continue;
      const start = Math.max(
        0,
        dx ? Math.min(x1 / dx, x2 / dx) : -Infinity,
        dy ? Math.min(y1 / dy, y2 / dy) : -Infinity,
      );
      const end = Math.min(
        1,
        dx ? Math.max(x1 / dx, x2 / dx) : Infinity,
        dy ? Math.max(y1 / dy, y2 / dy) : Infinity,
      );
      if (start <= end && start < firstTime) {
        firstTime = start;
        first = u;
      }
    }
    return first;
  }

  function stepSeats(m, inputs, dt = stepSeconds) {
    if (m.winner !== null) return;
    m.time += dt;
    m.tick++;
    if (m.tick === 60 * 270) announce(m, "Reactor meltdown in 30 seconds");
    if (m.tick === 60 * 300) announce(m, "Meltdown · both reactors exposed and losing health");
    const objective = mapFor(m).objective;
    if (!m.training && objective.kind === "vault" && m.neutralAt !== null && m.time >= m.neutralAt) {
      const keeper = addUnit(m, "keeper", 2, width / 2);
      keeper.y = 149;
      keeper.charge = 0;
      m.neutralAt = null;
      announce(m, "Vault online · siege cell on the upper deck");
    }
    if (!m.training && objective.kind === "camps") {
      m.camps.forEach((camp, index) => {
        if (camp.next !== null && m.time >= camp.next) {
          const [x, y] = objective.camps[index], guard = addUnit(m, "keeper", 2, width - x);
          Object.assign(guard, { x, y, hp: 150, max: 150, damage: 14, range: 95, charge: 0, campId: index });
          camp.next = null;
          announce(m, "Supply camps active · raid or defend the lane");
        }
      });
    }
    m.nextWave -= dt;
    if (!m.training && m.nextWave <= 0) wave(m);
    m.bridge = approach(m.bridge, dt);
    // Every pilot reads the same starting positions. Resolve impacts only after
    // movement so both sides can trade a hit, even when both hits are lethal.
    const orders = new Map();
    const actions = [],
      hits = [];
    for (const u of m.units) {
      if (u.hp <= 0) continue;
      if (u.kind === "pilot") {
        const input = inputs[u.seat] ?? botInput(m, u, dt);
        orders.set(u, { ...input, skillAim: abilities.aim(m, u, input) });
      }
      else if (u.kind !== "sentry" && u.kind !== "keeper") orders.set(u, targetFor(m, u, u.range));
    }
    for (const u of m.units) {
      u.cd -= dt;
      u.flash = approach(u.flash, dt);
      u.barrierTime = approach(u.barrierTime, dt);
      u.slowTime = approach(u.slowTime, dt);
      if (u.slowTime === 0) u.slow = 1;
      if (u.barrierTime === 0) u.barrier = 0;
      u.knock *= Math.max(0, 1 - 7 * dt);
      if (!u.hp) {
        if (u.kind === "pilot") {
          u.cooldowns = u.cooldowns.map((value) => approach(value, dt));
          if ((u.respawn -= dt) <= 0) respawn(u);
        }
        continue;
      }
      if (u.kind === "pilot") {
        pilotStep(m, u, orders.get(u), dt, actions);
        u.repairing =
          !m.training &&
          u.hp < u.max &&
          m.time - u.damagedAt >= 2 &&
          Math.abs(u.x - mirror(u.team, 65)) <= 106;
        if (u.repairing) u.hp = Math.min(u.max, u.hp + 24 * dt);
      } else if (u.kind === "sentry") {
        actions.push({ type: "sentry", u });
      } else if (u.kind === "keeper") {
        actions.push({ type: "keeper", u });
      } else {
        if (
          u.kind === "breaker" &&
          m.tick >= 18000 &&
          !u.mortarSpent &&
          (u.mortarCharge > 0 || mirror(u.team, u.x) >= width / 2 + 55)
        ) {
          u.x = limitX(u.x + u.knock * dt);
          if (!u.grounded || u.vy !== 0) vertical(m, u, dt);
          if (mirror(u.team, u.x) < width / 2 + 25) {
            u.mortarCharge = 0;
            continue;
          }
          if (!u.mortarCharge) {
            u.mortarCharge = 2.1;
            effect(m, "prime", u, 20, 0.2);
          }
          u.mortarCharge = approach(u.mortarCharge, dt);
          if (u.mortarCharge === 0) {
            u.mortarSpent = true;
            const core = m.units.find((o) => o.team !== u.team && o.kind === "reactor");
            if (core)
              m.mortars.push({
                id: ++m.serial,
                team: u.team,
                x: u.x,
                y: middle(u),
                target: core.id,
                left: 0.85,
              });
          }
          continue;
        }
        const target = orders.get(u);
        if (target) {
          u.dir = Math.sign(target.x - u.x) || u.dir;
          actions.push({ type: "auto", u, target });
        } else {
          u.dir = u.team === 0 ? 1 : -1;
          u.x = limitX(u.x + u.dir * u.speed * (u.slow || 1) * dt);
        }
        if (u.kind === "crawler" || u.kind === "breaker") {
          u.x = limitX(u.x + u.knock * dt);
          if (!u.grounded || u.vy !== 0) vertical(m, u, dt);
        }
      }
    }
    for (const action of actions) {
      const u = action.u;
      switch (action.type) {
        case "keeper":
          keeperStep(m, u, dt, hits);
          break;
        case "sentry":
          sentryStep(m, u, dt);
          break;
        case "auto":
          fireAt(m, u, action.target);
          break;
        case "aim":
          if (kits[u.kit]?.attackType === "melee") abilities.melee(m, u, hits, action.angle);
          else fire(m, u, u.x + Math.cos(action.angle), middle(u) + Math.sin(action.angle));
          break;
        case "rivet":
          if (kits[u.kit].attackType === "melee") abilities.melee(m, u, hits);
          else fireAt(m, u, targetFor(m, u, u.range, true));
          break;
        case "hero":
          abilities.resolve(m, action, hits);
          break;
        case "pulse":
        case "slam":
          blast(m, u, action.type === "slam", hits);
          break;
        case "lunge":
          for (const other of m.units) {
            if (
              other.team === u.team ||
              other.hp <= 0 ||
              u.struck.includes(other.id) ||
              distance(u, other) > 39
            )
              continue;
            u.struck.push(other.id);
            if (other.kind === "pilot") u.lungesLanded++;
            hits.push({
              target: other,
              damage: u.skillDash ? u.skillDashDamage : kits[u.kit].lungeDamage,
              source: u,
              dir: u.dashDir,
              force: u.skillDash ? u.skillDashForce : 240,
              lift: u.skillDash ? u.skillDashLift : 175,
            });
            effect(m, "strike", other, 24, 0.22);
          }
          break;
      }
    }
    abilities.step(m, dt, hits);
    for (const shot of m.shots) {
      const speed = Math.hypot(shot.vx, shot.vy) || 600;
      const travel = Math.min(dt, shot.left / speed);
      const dx = shot.vx * travel,
        dy = shot.vy * travel;
      let victim;
      while (shot.left > 0 && (victim = intercept(shot, m.units, dx, dy))) {
        const damage = shot.siege && victim.speed === 0 ? shot.damage * 3 : shot.damage;
        const source = m.units.find((u) => u.id === shot.source);
        hits.push({
          target: victim,
          damage,
          source,
          dir: shot.pull ? Math.sign((source?.x ?? shot.x) - victim.x) || 1 : Math.sign(shot.vx) || 1,
          force: shot.force || 0,
          lift: shot.lift || 0,
        });
        if (shot.pierce > 0 && victim.speed > 0) {
          shot.pierce--; shot.hitIds.push(victim.id);
        } else shot.left = 0;
      }
      shot.x += dx; shot.y += dy; shot.left -= speed * dt;
    }
    for (const h of hits) {
      hit(m, h.target, h.damage, h.source);
      if (h.force) push(h.target, h.dir, h.force, h.lift);
    }
    for (const shell of m.mortars) {
      shell.left -= dt;
      if (shell.left <= 0) {
        const core = m.units.find((u) => u.id === shell.target);
        if (core) {
          effect(m, "burst", core, 50, 0.4);
          hit(m, core, 70, null);
        }
      }
    }
    m.mortars = m.mortars.filter((shell) => shell.left > 0);
    for (const drop of m.drops) {
      drop.life -= dt;
      const cell = drop.type === "cell" || drop.type === "supply";
      if (!cell) drop.y = Math.min(floor - 13, drop.y + 65 * dt);
      let collector = null,
        nearest = 33,
        contested = false;
      for (const u of m.units) {
        if (u.kind !== "pilot" || !u.hp || (!cell && drop.team !== u.team && drop.life > 5))
          continue;
        const d = Math.hypot(u.x - drop.x, middle(u) - drop.y);
        if (d < nearest - 0.001) {
          nearest = d;
          collector = u;
          contested = false;
        } else if (collector && u.team !== collector.team && Math.abs(d - nearest) <= 0.001)
          contested = true;
      }
      if (collector && !contested) {
        if (drop.type === "supply") {
          m.contracts[collector.team]++;
          for (const ally of m.units) if (ally.kind === "pilot" && ally.team === collector.team) {
            ally.scrap += 8;
            if (ally.hp > 0) ally.hp = Math.min(ally.max, ally.hp + 40);
          }
          announce(m, (collector.team ? "Cinder" : "Torch") + " secured supplies · +8 scrap and 40 repair per pilot");
        } else if (cell) {
          m.convoy[collector.team] = true;
          m.contracts[collector.team]++;
          for (const ally of m.units)
            if (ally.kind === "pilot" && ally.team === collector.team) ally.scrap += 6;
          announce(
            m,
            (collector.team === 0 ? "Torch" : "Cinder") +
              " secured a siege cell · bonus Breaker next wave",
          );
        }
        collector.scrap += drop.amount;
        collector.farmScrap += drop.amount;
        effect(m, "salvage", collector, 13, 0.22);
        drop.life = 0;
      }
    }
    if (!m.training && objective.kind === "relay" && m.time >= m.relay.next) {
      const present = [0,1].map(team => m.units.some(u => u.kind === "pilot" && u.hp > 0 && u.team === team &&
        u.grounded && Math.abs(u.x - objective.x) <= 60 && Math.abs(u.y - objective.y) < 8));
      if (present[0] !== present[1]) {
        const team = present[0] ? 0 : 1;
        if (m.relay.team !== team) { m.relay.team = team; m.relay.progress = 0; }
        m.relay.progress += dt;
        if (m.relay.progress + 1e-8 >= objective.capture) {
          m.surgeUntil[team] = m.time + objective.duration;
          m.contracts[team]++;
          m.relay = { team: -1, progress: 0, next: m.time + objective.respawn };
          announce(m, (team ? "Cinder" : "Torch") + " owns the wind · +20% run speed for 20s");
        }
      } else if (!present[0]) {
        m.relay.progress = Math.max(0, m.relay.progress - dt);
        if (!m.relay.progress) m.relay.team = -1;
      }
    }
    m.drops = m.drops.filter((d) => d.life > 0);
    m.shots = m.shots.filter((s) => s.left > 0);
    m.units = m.units.filter(
      (u) => u.hp > 0 || u.kind === "pilot" || u.kind === "sentry" || u.kind === "reactor",
    );
    for (const f of m.fx) f.life -= dt;
    m.fx = m.fx.filter((f) => f.life > 0);
    const cores = m.units.filter((u) => u.kind === "reactor");
    if (m.tick >= 60 * 300) {
      for (const core of cores) {
        core.shielded = false;
        // Meltdown makes a last push decisive. Taking the base still requires a hit.
        if (core.hp > 0) core.hp = Math.max(1, core.hp - 6 * dt);
      }
    }
    const fallen = cores.filter((u) => !u.hp);
    if (fallen.length) {
      m.winner = fallen.length === 2 ? 2 : 1 - fallen[0].team;
      m.endReason = fallen.length === 2 ? "trade" : "reactor";
    } else if (!m.training && m.tick >= 60 * 420) {
      m.winner = 2;
      m.endReason = "time";
    }
  }

  function step(m, controls, dt = stepSeconds) {
    stepSeats(m, { 0: controls }, dt);
  }
  function predictPilot(state, pilot, controls) {
    if (!pilot.hp) return;
    // Only replay this pilot's movement. Hits and purchases come from the server.
    const local = {
      units: [pilot],
      fx: [],
      shots: [],
      serial: 0,
      bridge: state.bridge,
      mapId: state.mapId,
      time: state.time,
      surgeUntil: state.surgeUntil,
      zones: [],
      delayed: [],
    };
    pilot.knock *= 1 - 7 * stepSeconds;
    pilot.slowTime = approach(pilot.slowTime, stepSeconds);
    if (pilot.slowTime === 0) pilot.slow = 1;
    pilotStep(
      local,
      pilot,
      { ...controls, buy: false, drive: false, coil: false, crane: false },
      stepSeconds,
      [],
    );
  }
  return {
    maps: mapCatalog.maps,
    mapFor,
    width,
    floor,
    height,
    stats,
    kits,
    skills: heroes.skills,
    skillCooldown: abilities.cooldown,
    upgradeCost,
    create,
    createTraining,
    follow,
    step,
    stepSeats,
    stepSeconds,
    platforms,
    switches,
    predictPilot,
  };
})();
if (typeof module !== "undefined") module.exports = Yard;
