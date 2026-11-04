"use strict";
const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");
const el = (id) => document.getElementById(id);
const palette = ["#64e4ce", "#ff8864", "#ffcd69"],
  dark = ["#285b62", "#784452", "#795933"];
let match = Yard.create({ teamSize: 2 }),
  mode = "ready",
  camera = 0,
  last = 0,
  debt = 0,
  teamSize = 2;
const held = new Set(),
  pressed = new Set();
const mouse = { x: 0, y: 0, fire: false, inside: false };
let signals = [],
  signalAt = -Infinity;
let farmSample = null,
  farmPopups = [];
let tipsEnabled = true;
try {
  tipsEnabled = localStorage.getItem("rivet-tips") !== "off";
} catch {}
const sounds = new YardSound();
const yardArt = new Image();
yardArt.src = "assets/kiln-yard.jpg";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lesson = 0,
  localKind = "skirmish",
  uiKey = "",
  inviteCode = "",
  selectedKit = "runner";
let recording = null;
let playback = null,
  replaySpeed = 1;
const gates = [
  [416, 275],
  [690, 208],
  [890, 149],
  [1090, 208],
  [1364, 275],
  [1605, 345],
];
let trial = null;
function box(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function line(x, y, a, b, color, w = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(a, b);
  ctx.stroke();
}
function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}
function poly(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function label(t, x, y, color = "#e6e3d8", size = 10) {
  ctx.fillStyle = color;
  ctx.font = "bold " + size + "px monospace";
  ctx.fillText(t, x, y);
}
// Integer-seed adaptation of d3-random's randomLcg. See THIRD_PARTY.md.
let seed = 219;
function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
const towers = Array.from({ length: 70 }, (_, i) => ({
  x: i * 38,
  w: 16 + random() * 52,
  h: 20 + random() * 100,
}));
const stars = Array.from({ length: 120 }, () => [
  random() * 1200,
  random() * 190,
  1 + random() * 1.4,
]);
function backdrop() {
  if (yardArt.complete && yardArt.naturalWidth) {
    ctx.drawImage(yardArt, -camera * 0.21, 0, 1160, 365);
    return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, "#17263e");
  sky.addColorStop(0.65, "#595570");
  sky.addColorStop(1, "#cb876d");
  box(0, 0, 960, 440, sky);
  for (const [x, y, r] of stars) box(x - camera * 0.08, y, r, r, "#cab4ad");
  const sx = 714 - camera * 0.09;
  circle(sx, 104, 56, "#eab27e");
  for (let i = 0; i < 4; i++) box(sx - 58, 128 + i * 6, 118, 2 + i, "#6f6174");
  for (let i = 0; i < 2; i++) {
    const offset = camera * (0.13 + i * 0.12);
    for (const t of towers) {
      const x = t.x - offset;
      if (x + t.w < 0 || x > 960) continue;
      const bottom = 277 + i * 39,
        y = bottom - t.h * (0.63 + i * 0.27);
      box(x, y, t.w, bottom - y, i ? "#354052" : "#55556b");
      line(x + 4, y, x + 4, y - 13, "#4d4d63");
      box(x + 6, y + 7, 7, 2, "#987872");
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = i * 430 - camera * 0.43 - 80;
    line(x, 305, x + 35, 116, "#31394b", 8);
    line(x + 68, 305, x + 35, 116, "#31394b", 7);
    line(x - 33, 149, x + 167, 86, "#31394b", 8);
    line(x + 35, 116, x + 61, 68, "#31394b", 4);
    line(x + 61, 68, x + 167, 86, "#31394b", 2);
    line(x + 158, 91, x + 158, 161, "#404151", 2);
    box(x + 151, 162, 15, 5, "#454455");
  }
}
function deck(x, y, w, ground = false) {
  box(x, y, w, ground ? 100 : 15, "#192a36");
  box(x, y, w, 5, "#95939a");
  box(x, y + 5, w, 3, "#4b6170");
  for (let i = 0; i < w; i += 42) {
    box(x + i + 3, y + 1, 13, 3, "#d4ab6b");
    if (ground) {
      line(x + i, y + 14, x + i + 35, y + 51, "#30434e", 5);
      box(x + i, y + 55, 35, 5, "#334954");
    }
  }
}
function drawUnit(u) {
  if (!u.hp) return;
  const c = u.flash > 0 ? "#fff4cd" : palette[u.team],
    d = dark[u.team];
  ctx.save();
  ctx.translate(Math.round(u.x), Math.round(u.y));
  ctx.scale(u.dir, 1);
  if (u.kind === "pilot") {
    const stride = u.moving && u.grounded ? Math.sin(match.time * 18) * 4 : 0;
    const boost = u.dashLeft > 0,
      air = !u.grounded;
    if (u.slideLeft > 0) ctx.scale(1.13, 0.69);
    if (boost) {
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.26 - i * 0.06;
        poly(
          [
            [-8 - i * 11, -29],
            [-39 - i * 11, -24],
            [-15 - i * 11, -18],
          ],
          c,
        );
      }
      ctx.globalAlpha = 1;
    }
    ctx.rotate(boost ? 0.19 : u.slamming ? -0.12 : 0);
    // Rear boot and front boot separate in the air so jumps read at a glance.
    poly(
      [
        [-8, -16],
        [-1, -15],
        [-4 - stride, -5],
        [-9 - stride, air ? -7 : -2],
        [-13 - stride, air ? -10 : -2],
      ],
      "#263547",
    );
    poly(
      [
        [2, -16],
        [9, -14],
        [7 + stride, air ? -9 : -4],
        [12 + stride, air ? -7 : -3],
        [11 + stride, air ? -5 : 0],
        [1 + stride, air ? -7 : 0],
      ],
      "#b9afa4",
    );
    poly(
      [
        [-12, -30],
        [-5, -32],
        [-5, -12],
        [-13, -13],
        [-16, -19],
      ],
      "#203142",
    );
    box(-14, -27, 6, 9, "#bb875b");
    if (air || boost)
      poly(
        [
          [-14, -17],
          [-9, -17],
          [boost ? -30 : -11, boost ? -14 : -5],
        ],
        "#ffc67e",
      );
    poly(
      [
        [-9, -29],
        [4, -30],
        [12, -24],
        [8, -12],
        [-4, -11],
        [-10, -18],
      ],
      d,
    );
    poly(
      [
        [-8, -28],
        [4, -30],
        [9, -25],
        [4, -22],
        [-7, -23],
      ],
      c,
    );
    box(-5, -18, 13, 3, "#aeb0a2");
    // Swept helmet, cream faceplate, bright eye slit and copper scarf.
    poly(
      [
        [-9, -35],
        [-4, -41],
        [6, -40],
        [12, -34],
        [8, -27],
        [-6, -27],
      ],
      "#202e3b",
    );
    poly(
      [
        [-8, -35],
        [-3, -39],
        [6, -38],
        [10, -34],
        [3, -32],
        [-8, -32],
      ],
      "#d4c1a0",
    );
    box(0, -34, 11, 3, c);
    box(4, -30, 4, 2, "#e6dfca");
    poly(
      [
        [-5, -28],
        [-11, -30],
        [-17, -28],
        [-24, -31],
        [-18, -24],
        [-8, -25],
      ],
      "#d5955f",
    );
    const recoil = u.cd > u.rate - 0.07 ? -3 : 0;
    poly(
      [
        [3, -25],
        [10, -23],
        [13, -19],
        [6, -17],
        [0, -21],
      ],
      c,
    );
    box(8 + recoil, -23, 15, 7, "#39434b");
    box(12 + recoil, -24, 12, 3, "#c6b79d");
    box(20 + recoil, -23, 6, 5, c);
    if (u.kit === "warden") {
      poly(
        [
          [-14, -29],
          [-6, -36],
          [4, -34],
          [8, -27],
          [0, -19],
          [-13, -22],
        ],
        "#374959",
      );
      poly(
        [
          [-12, -28],
          [-6, -33],
          [2, -31],
          [3, -27],
          [-4, -23],
        ],
        c,
      );
      box(7, -24, 16, 9, "#c5946b");
      box(17, -25, 10, 10, d);
      box(24, -24, 4, 8, c);
    }
    if (recoil)
      poly(
        [
          [25, -24],
          [35, -21],
          [25, -19],
        ],
        "#ffdb8b",
      );
  } else if (u.kind === "keeper") {
    if (u.charge > 0) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffce73";
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(0, -20, u.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    poly(
      [
        [-18, -16],
        [-13, -33],
        [0, -44],
        [14, -32],
        [19, -15],
        [8, -5],
        [-9, -5],
      ],
      "#4a4042",
    );
    poly(
      [
        [-13, -22],
        [0, -36],
        [13, -22],
        [0, -9],
      ],
      "#9b7343",
    );
    poly(
      [
        [-7, -22],
        [0, -29],
        [7, -22],
        [0, -15],
      ],
      u.charge > 0 ? "#fff4c9" : c,
    );
    box(-22, -8, 43, 8, "#394b52");
  } else if (u.kind === "breaker") {
    box(-21, -9, 43, 9, "#15242c");
    for (const x of [-14, -4, 6, 15]) circle(x, -5, 4, "#84949b");
    poly(
      [
        [-21, -9],
        [-15, -24],
        [0, -29],
        [14, -26],
        [22, -13],
        [16, -8],
      ],
      d,
    );
    box(-12, -24, 19, 4, c);
    box(3, -21, 24, 6, "#d0bc9f");
    box(18, -22, 8, 8, c);
    line(-9, -19, -4, -14, "#f9ce7b", 2);
    line(-4, -19, 1, -14, "#f9ce7b", 2);
  } else if (u.kind === "crawler") {
    box(-14, -8, 29, 8, "#15242c");
    for (const x of [-9, 0, 9]) circle(x, -4, 3, "#6d7780");
    poly(
      [
        [-14, -8],
        [-9, -18],
        [5, -18],
        [14, -10],
        [12, -6],
      ],
      d,
    );
    box(-6, -16, 13, 4, c);
    box(7, -13, 13, 3, "#d7c9ae");
  } else if (u.kind === "sentry") {
    if (u.aim) {
      const dx = (u.aim.x - u.x) * u.dir,
        dy = u.aim.y - (u.y - Yard.height(u) / 2);
      const length = Math.hypot(dx, dy) || 1;
      ctx.save();
      ctx.setLineDash([6, 6]);
      line(
        0,
        -24,
        (dx / length) * (u.range + 24),
        -24 + (dy / length) * (u.range + 24),
        "#ffe2aa",
        2,
      );
      ctx.restore();
      circle(0, -48, 4, "#fff1c9");
    }
    poly(
      [
        [-24, 0],
        [-13, -13],
        [-9, -43],
        [10, -43],
        [14, -13],
        [23, 0],
      ],
      "#344552",
    );
    box(-13, -46, 23, 17, d);
    box(-8, -43, 16, 4, c);
    box(4, -36, 26, 8, "#bbc1bc");
    box(-13, -14, 25, 5, c);
  } else {
    box(-29, -9, 58, 9, "#1c2d38");
    poly(
      [
        [-22, -9],
        [-18, -66],
        [-8, -78],
        [12, -78],
        [23, -64],
        [23, -9],
      ],
      "#243745",
    );
    box(-16, -64, 33, 51, d);
    for (let y = -59; y < -20; y += 9) box(-10, y, 20, 5, c);
    box(-21, -67, 42, 6, "#a5b1ad");
    box(-21, -15, 42, 5, "#879598");
    if (u.shielded) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.setLineDash([9, 6]);
      ctx.beginPath();
      ctx.ellipse(0, -32, 33, 50, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (u.barrier > 0 || u.spawnGuard > 0) {
    ctx.save();
    ctx.strokeStyle = "#b6ffeb";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.ellipse(u.x, u.y - Yard.height(u) / 2, 19, Yard.height(u) / 2 + 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const y = u.y - Yard.height(u) - 12,
    w = u.kind === "reactor" ? 52 : 28;
  box(u.x - w / 2, y, w, 3, "#172b37");
  box(u.x - w / 2, y, (w * u.hp) / u.max, 3, c);
  if (u.kind === "breaker")
    label(
      u.mortarCharge > 0 ? "SIEGE SHOT  " + u.mortarCharge.toFixed(1) : "BREAKER",
      u.x - 21,
      y - 4,
      c,
      9,
    );
  if (u.kind === "keeper")
    label(u.charge > 0 ? "DISCHARGE" : "VAULT KEEPER", u.x - 31, y - 6, c, 9);
  if (u.repairing) label("+", u.x + 13, y - 4, "#8ff5c2", 15);
  if (u.kind === "pilot") {
    const tag =
      u === match.player
        ? "YOU"
        : match.training
          ? "TARGET"
          : u.team === match.player.team
            ? "ALLY"
            : "RIVAL";
    label(tag + " · " + Yard.kits[u.kit].name, u.x - 28, y - 5, c, 9);
  }
}

function drawEffect(f) {
  const t = 1 - f.life / f.duration,
    color = palette[f.team],
    radius = Math.max(1, f.size * t);
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = Math.min(1, (1 - t) * 1.7);
  if (f.kind === "dash" || f.kind === "lunge") {
    ctx.scale(f.dir, 1);
    for (let i = 0; i < 4; i++)
      line(-15 - t * 20, -10 + i * 6, 22 - t * 45, -12 + i * 6, i % 2 ? color : "#ffe1ad", 2);
  } else if (f.kind === "slash") {
    ctx.scale(f.dir, 1); ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, f.size * .85, -1.4, 1.4); ctx.stroke();
  } else if (f.kind === "kick") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 1, radius, 3 + t * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (f.kind === "prime") {
    line(-16 + t * 9, 0, 0, 12, color, 3);
    line(16 - t * 9, 0, 0, 12, color, 3);
  } else {
    ctx.strokeStyle = f.kind === "burst" ? "#ffb270" : color;
    ctx.lineWidth = f.kind === "slam" ? 5 : 3;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      radius,
      Math.max(1, radius * (f.kind === "slam" ? 0.46 : 1)),
      0,
      f.kind === "slam" ? Math.PI : 0,
      Math.PI * 2,
    );
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = f.kind === "slam" ? Math.PI + (i * Math.PI) / 7 : (i * Math.PI) / 4 + f.id;
      const r = radius * (0.8 + (i % 3) * 0.1),
        tail = Math.max(0, r - 9);
      line(
        Math.cos(angle) * tail,
        Math.sin(angle) * tail,
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        i % 2 ? color : "#ffdf9a",
        2,
      );
    }
  }
  ctx.restore();
}
function worldHUD() {
  for (const core of match.units.filter((u) => u.kind === "reactor")) {
    const x = core.team ? 752 : 16;
    box(x, 14, 192, 36, "#162735");
    label(
      (core.team ? "CINDER" : "TORCH") + (core.shielded ? " · SHIELDED" : " · EXPOSED"),
      x + 8,
      29,
      palette[core.team],
    );
    box(x + 8, 35, 176, 5, dark[core.team]);
    box(x + 8, 35, (176 * core.hp) / core.max, 5, palette[core.team]);
  }
  box(348, 14, 264, 34, "#172935");
  label(
    match.training
      ? "PRACTICE"
      : match.time >= 300
        ? "REACTOR MELTDOWN"
        : "WAVE " + match.wave + (match.wave % 3 === 0 ? " · BREAKER" : ""),
    358,
    28,
  );
  const seconds = Math.floor(match.time);
  label(Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"), 565, 28, "#f0cb95");
  line(359, 38, 600, 38, "#70828a");
  for (const u of match.units) {
    if (!u.hp) continue;
    const x = 359 + (u.x / Yard.width) * 241;
    if (u.kind === "pilot")
      poly(
        [
          [x, 32],
          [x + 3, 36],
          [x, 40],
          [x - 3, 36],
        ],
        u === match.player ? "#fff4cb" : palette[u.team],
      );
    else box(x, 36, 3, 4, palette[u.team]);
  }
  if (!match.training) {
    const team = match.player.team;
    const tower = match.units.find((u) => u.kind === "sentry" && u.team !== team);
    const target =
      tower?.hp > 0 && match.time < 300
        ? tower
        : match.units.find((u) => u.kind === "reactor" && u.team !== team);
    if (target) {
      box(14, 365, 202, 44, "#132633ef");
      label(
        target.kind === "sentry" ? "PUSH · ENEMY SENTRY" : "FINISH · ENEMY REACTOR",
        23,
        381,
        "#ffe4aa",
        10,
      );
      box(23, 389, 145, 4, "#354754");
      box(23, 389, (145 * target.hp) / target.max, 4, palette[target.team]);
      label(Math.ceil(target.hp), 175, 394, "#e6e2d9", 10);
      const keeper = match.units.find((u) => u.kind === "keeper");
      label(
        keeper
          ? "UPPER VAULT · ACTIVE"
          : match.drops.some((d) => d.type === "cell")
            ? "UPPER VAULT · CELL LOOSE"
            : "NEXT VAULT · " + Math.max(0, Math.ceil(match.neutralAt - match.time)) + "s",
        23,
        404,
        "#abbec2",
        9,
      );
    }
    const ally = match.units.find(
      (u) => u.kind === "pilot" && u.team === team && u.seat !== match.player.seat,
    );
    if (ally) {
      box(738, 365, 208, 44, "#132633ef");
      label("ALLY · " + Yard.kits[ally.kit].name.toUpperCase(), 747, 380, palette[team], 10);
      label(
        ally.hp
          ? Math.ceil(ally.hp) + "/" + ally.max + " HP · RIG " + ally.rank
          : "REDEPLOY " + Math.ceil(ally.respawn) + "s",
        747,
        394,
        "#e6e2d9",
        10,
      );
      label(
        ally.hp
          ? (ally.x < match.player.x - 80
              ? "← LEFT"
              : ally.x > match.player.x + 80
                ? "RIGHT →"
                : "NEARBY") + " · G rally / H retreat"
          : "Hold the wave until they return",
        747,
        405,
        "#abbec2",
        9,
      );
    }
  }
}
function receiveSignal(signal) {
  signals = signals.filter((s) => s.seat !== signal.seat && s.until > match.time);
  signals.push(signal);
  el("teamSignal").textContent =
    (signal.seat === match.player.seat ? "You" : "Teammate") +
    (signal.kind === "retreat" ? ": retreat" : ": rally here");
}
function sendSignal(kind) {
  if (mode !== "play" || match.training || match.time - signalAt < 3) return;
  signalAt = match.time;
  const x = Math.round(
    Math.max(20, Math.min(Yard.width - 20, mouse.inside ? mouse.x + camera : match.player.x)),
  );
  const y = Math.round(
    Math.max(55, Math.min(Yard.floor, mouse.inside ? mouse.y : match.player.y - 44)),
  );
  if (room.phase === "play") room.send({ type: "signal", matchId: room.matchId, kind, x, y });
  else
    receiveSignal({
      seat: match.player.seat,
      kind,
      x,
      y,
      until: match.time + 5,
    });
}
function drawSignals() {
  signals = signals.filter((s) => s.until > match.time);
  if (!signals.length) el("teamSignal").textContent = "";
  for (const s of signals) {
    const x = Math.max(30, Math.min(930, s.x - camera)),
      y = Math.max(92, Math.min(322, s.y));
    const color = s.kind === "retreat" ? "#ffd591" : "#b5ffee";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (s.kind === "rally") ctx.arc(x, y, 12, 0, Math.PI * 2);
    else {
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 12, y + 10);
      ctx.lineTo(x - 12, y + 10);
      ctx.closePath();
    }
    ctx.stroke();
    label(s.kind === "rally" ? "+" : "!", x - 4, y + 4, color, 13);
    ctx.textAlign = "center";
    label(
      (s.x - camera < 30 ? "← " : "") +
        (s.kind === "rally" ? "RALLY" : "RETREAT") +
        (s.x - camera > 930 ? " →" : ""),
      x,
      y - 18,
      color,
      10,
    );
    ctx.textAlign = "left";
  }
}
function drawFarmFeedback() {
  const p = match.player;
  if (farmSample && farmSample.seat === p.seat && match.tick > farmSample.tick && mode === "play") {
    const hits = p.lastHits - farmSample.hits,
      gain = p.farmScrap - farmSample.scrap;
    if (gain > 0) {
      farmPopups.push({
        x: p.x,
        y: p.y - 52,
        at: match.time,
        text:
          "+" +
          gain +
          " SCRAP · " +
          (hits > 0 ? "LAST HIT" + (gain > hits * 2 ? " + SALVAGE" : "") : "SALVAGE"),
      });
      farmPopups = farmPopups.slice(-3);
    }
  } else if (!farmSample || farmSample.seat !== p.seat || match.tick < farmSample.tick)
    farmPopups = [];
  farmSample = {
    seat: p.seat,
    tick: match.tick,
    hits: p.lastHits,
    scrap: p.farmScrap,
  };
  farmPopups = farmPopups.filter((f) => match.time - f.at < 1.5);
  ctx.textAlign = "center";
  for (const [i, f] of farmPopups.entries()) {
    const age = match.time - f.at;
    ctx.globalAlpha = Math.min(1, (1.5 - age) * 2);
    label(f.text, f.x, f.y - i * 14 - (reducedMotion ? 0 : age * 16), "#fff0a6", 10);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}
const lessonText = [
  "Double jump, then press Shift in the air",
  "Hold J and dash through the target",
  "Try all four abilities: Q / E / R / F",
  "Training complete · Field menu to deploy",
];
function draw() {
  const p = match.player;
  const watching =
    !p.hp && mode !== "replay"
      ? match.units.find((u) => u.kind === "pilot" && u.team === p.team && u.hp)
      : null;
  camera = Math.max(0, Math.min(Yard.width - 960, (watching || p).x - 450));
  backdrop();
  ctx.save();
  ctx.translate(-camera, 0);
  deck(0, Yard.floor, Yard.width, true);
  for (const [a, b, y] of Yard.platforms(match)) deck(a, y, b - a);
  if (trial && trial.gate < gates.length) {
    const [x, y] = gates[trial.gate];
    ctx.strokeStyle = "#ffdc85";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 21, 15, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    label(String(trial.gate + 1), x - 4, y - 17, "#fff4cf", 14);
  }
  for (const x of Yard.switches) {
    box(x - 5, 178, 9, 30, "#253a47");
    box(x - 11, 173, 23, 13, "#eebb68");
    label("C", x - 3, 183, "#19252d");
  }
  label("KILN  //  07", 805, 404, "#72828c", 21);
  for (const z of match.zones || []) {
    ctx.save(); ctx.strokeStyle = palette[z.team]; ctx.lineWidth = 2;
    ctx.setLineDash(z.delay > 0 ? [5, 5] : z.trigger ? [2, 4] : []);
    ctx.fillStyle = palette[z.team] + "18";
    ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    label(z.delay > 0 ? "ARMING" : z.trigger ? "TRAP" : z.heal || z.shield ? "SUPPORT" : "DANGER", z.x - 20, z.y - z.radius - 5, palette[z.team], 9);
    ctx.restore();
  }
  for (const u of match.units) {
    if (u.hp && u.anchor) {
      ctx.save(); ctx.strokeStyle = palette[u.team]; ctx.setLineDash([4, 4]);
      ctx.strokeRect(u.anchor.x - 10, u.anchor.y - 30, 20, 30);
      label("ANCHOR " + Math.ceil(u.anchor.left), u.anchor.x - 25, u.anchor.y - 36, palette[u.team], 9);
      ctx.restore();
    }
    drawUnit(u);
  }
  for (const d of match.drops) {
    const y = d.y + (reducedMotion ? 0 : Math.sin(match.time * 5 + d.id) * 2),
      r = d.type === "cell" ? 10 : 5;
    poly(
      [
        [d.x, y - r],
        [d.x + r, y],
        [d.x, y + r],
        [d.x - r, y],
      ],
      "#ffc878",
    );
    box(d.x - 1, y - 2, 2, 4, "#6f4a39");
    if (d.type === "cell") label("CLAIM", d.x - 14, y - 15, "#fff0ba");
  }
  for (const s of match.shots) {
    line(s.x, s.y, s.x - s.vx * 0.021, s.y - s.vy * 0.021, dark[s.team], 5);
    line(s.x, s.y, s.x - s.vx * 0.013, s.y - s.vy * 0.013, palette[s.team], 2);
    box(s.x - 1, s.y - 1, 3, 3, "#fff0bf");
  }
  for (const shell of match.mortars) {
    const core = match.units.find((u) => u.id === shell.target);
    if (!core) continue;
    const t = 1 - shell.left / 0.85,
      x = shell.x + (core.x - shell.x) * t;
    const y = shell.y + (core.y - 35 - shell.y) * t - Math.sin(t * Math.PI) * 120;
    circle(x, y, 6, palette[shell.team]);
    circle(x, y, 3, "#fff0bb");
  }
  for (const f of match.fx) drawEffect(f);
  drawFarmFeedback();
  ctx.restore();
  worldHUD();
  drawSignals();
  if (watching) {
    ctx.textAlign = "center";
    label("WATCHING ALLY · " + Yard.kits[watching.kit].name.toUpperCase(), 480, 88, "#c8e7df", 10);
    ctx.textAlign = "left";
  }
  if (match.announcementUntil > match.time && !held.has("Tab")) {
    ctx.textAlign = "center";
    box(240, 54, 480, 19, "#172735e8");
    label(match.announcement, 480, 67, "#ffd591", 10);
    ctx.textAlign = "left";
  }
  if (held.has("Tab") && !match.training) {
    drawScores();
    pilotHUD();
    return;
  }
  if (trial) {
    const duration = trial.start === null ? 0 : (match.tick - trial.start) / 60;
    const message =
      trial.start === null
        ? "Move to start · follow the gold gates"
        : "GATE " +
          Math.min(gates.length, trial.gate + 1) +
          "/" +
          gates.length +
          "   " +
          duration.toFixed(2) +
          "s   ·   R restart";
    box(220, 380, 520, 27, "#172935");
    ctx.textAlign = "center";
    label(message, 480, 398, "#ffe1ac", 14);
    ctx.textAlign = "left";
  } else if (match.training) {
    box(196, 380, 568, 27, "#172935");
    ctx.textAlign = "center";
    label((lesson < 3 ? lesson + 1 + "/3   " : "") + lessonText[lesson], 480, 398, "#ffe1ac", 14);
    ctx.textAlign = "left";
  } else if (match.notice > 0 || !p.hp) {
    box(225, p.hp ? 365 : 295, 510, p.hp ? 30 : 64, "#172935f5");
    ctx.textAlign = "center";
    label(
      !p.hp
        ? "DOWNED BY " + p.downedBy.toUpperCase() + "  ·  REDEPLOY " + Math.ceil(p.respawn) + "s"
        : match.note,
      480,
      p.hp ? 385 : 313,
      "#ffd696",
      13,
    );
    if (!p.hp) {
      const recap = (p.recap || [])
        .slice(0, 3)
        .map(([source, amount]) => source + " " + Math.round(amount))
        .join(" · ");
      label("LAST 6s HP LOST · " + recap, 480, 332, "#c6d6d8", 10);
      const tip =
        p.downedBy === "sentry"
          ? "Let crawlers take the sightline; jump the locked shot."
          : p.downedBy === "keeper"
            ? "Leave the Keeper's warning circle before it discharges."
            : p.downedBy === "reactor"
              ? "Bring a surviving wave to absorb the reactor's shots."
              : "Regroup with your ally; save a clean dash to escape.";
      label(tip, 480, 349, "#ffe0a8", 10);
    }
    ctx.textAlign = "left";
  }
  pilotHUD();
}
function pilotHUD() {
  const p = match.player;
  el("fieldTip").hidden = !tipsEnabled || match.training || mode !== "play";
  if (!el("fieldTip").hidden) {
    const tower = match.units.find((u) => u.kind === "sentry" && u.team !== p.team);
    const cell = match.drops.some((d) => d.type === "cell");
    const keeper = match.units.some((u) => u.kind === "keeper" && u.hp);
    const tip = !p.hp
      ? "Use this reset to regroup. Your mods and unspent scrap are kept."
      : p.hp < p.max * 0.35
        ? "LOW HEALTH · Retreat near your reactor. Repair starts after 2 seconds without damage."
        : cell
          ? "SIEGE CELL LOOSE · Touch it on the upper vault deck to reinforce your next wave."
          : keeper && Math.abs(p.x - 890) < 300 && p.y <= 230
            ? "VAULT · Fire from the upper decks. Leave the warning circle before the Keeper attacks."
            : p.farmScrap === 0 && match.time < 50
              ? "FIRST WAVE · Last-hit enemy crawlers, then collect their glowing salvage for extra scrap."
              : tower?.hp && match.time < 300
                ? "SIEGE · Escort a Breaker into the sentry. Friendly crawlers can intercept enemy shots."
                : "REACTOR EXPOSED · Turn a won fight into base damage. KOs alone do not win the match.";
    if (el("fieldTip").textContent !== tip) el("fieldTip").textContent = tip;
  }
  const dash = Math.ceil(p.dash * 10) / 10,
    pulse = Math.ceil(p.pulse * 10) / 10;
  const key = [
    mode,
    p.kit,
    Math.ceil(p.hp),
    p.max,
    dash,
    pulse,
    p.scrap,
    p.rank,
    p.driveRank,
    p.coilRank,
    p.grounded,
    ...p.cooldowns.map((v) => Math.ceil(v * 10)),
    p.anchor ? Math.ceil(p.anchor.left * 10) : 0,
  ].join("|");
  if (key === uiKey) return;
  uiKey = key;
  el("pilot").textContent = Math.ceil(p.hp) + " / " + p.max + " HP";
  el("pilotName").textContent = Yard.kits[p.kit].name.toUpperCase();
  el("dash").textContent = dash ? dash.toFixed(1) + "s" : "Ready";
  el("dashFill").style.width =
    100 * (1 - p.dash / (Yard.kits[p.kit].recharge - 0.25 * p.driveRank)) + "%";
  Yard.skills[p.kit].forEach((skill, slot) => {
    const button = el("ability" + slot), remaining = Yard.skillCooldown(p, slot);
    const returning = slot === 1 && p.anchor;
    button.textContent = ["Q", "E", "R", "F"][slot] + " · " + skill.name + " · " +
      (returning ? "Return " + Math.ceil(p.anchor.left) + "s" : remaining > 0 ? remaining.toFixed(1) + "s" : "Ready");
    button.title = skill.description + " Counterplay: " + skill.counterplay;
    button.disabled = !p.hp || (remaining > 0 && !returning) || mode !== "play";
  });
  const cost = Yard.upgradeCost(p);
  el("scrap").textContent = p.scrap + " scrap";
  el("status").textContent = cost ? "RIG " + p.rank + "/6 · NEXT " + cost : "RIG COMPLETE";
  for (const [id, tier] of [
    ["gunMod", p.rank - p.driveRank - p.coilRank],
    ["driveMod", p.driveRank],
    ["coilMod", p.coilRank],
  ]) {
    const available = cost > 0 && p.scrap >= cost && tier < 3 && p.hp > 0 && mode === "play";
    el(id).classList.toggle("available", available);
    el(id).disabled = !available;
    const names = { gunMod: "Rivets", driveMod: "Drive", coilMod: "Coils" };
    const descriptions = {
      gunMod: "+4 basic attack damage",
      driveMod: "+18 HP, dash recharge −0.25s",
      coilMod: "+4 ability damage, recharge −0.2s" + (p.kit === "warden" ? ", +5 barrier" : ""),
    };
    el(id).innerHTML =
      "<kbd>" +
      { gunMod: 1, driveMod: 2, coilMod: 3 }[id] +
      "</kbd> " +
      names[id] +
      " " +
      tier +
      "/3";
    el(id).title =
      tier === 3
        ? "Track complete"
        : descriptions[id] + (cost ? " · " + cost + " scrap" : " · Rig complete");
    el(id).setAttribute("aria-label", names[id] + " " + tier + " of 3. " + el(id).title);
  }
  el("buildHint").textContent = !cost
    ? "Build complete · turn your advantage into reactor damage."
    : !p.hp
      ? "Mods and scrap survive a death. Plan your next push."
      : p.scrap >= cost
        ? "MOD READY · 1 damage · 2 health / dash · 3 ability"
        : cost - p.scrap + " more scrap to next mod · last-hit NPCs and collect salvage.";
}
function clearInput() {
  held.clear();
  pressed.clear();
  mouse.fire = false;
}
function showPanel(state, title, brief, button) {
  el("panel").dataset.mode = state;
  mode = state;
  clearInput();
  document.body.classList.remove("playing");
  el("headline").textContent = title;
  el("brief").textContent = brief;
  el("tag").textContent = "RIVET RUSH   /   KILN YARD";
  el("message").textContent = "";
  el("panel").hidden = false;
  el("mainActions").hidden = !button;
  el("start").textContent = button || "Play skirmish";
  el("roomActions").hidden = true;
  el("extras").hidden = state !== "ready";
  el("private").hidden = state !== "ready";
  el("kits").hidden = el("kitInfo").hidden = state !== "ready" && state !== "lobby";
  el("leave").hidden = state === "ready";
  el("inviteWrap").hidden = true;
  el("saveReplay").hidden = state !== "end";
  el("saveReplay").disabled = false;
  el("saveReport").hidden = !["end", "pause", "online-menu"].includes(state);
  if (button) el("start").focus({ preventScroll: true });
}
function title() {
  signals = [];
  signalAt = -Infinity;
  farmSample = null;
  farmPopups = [];
  inviteCode = "";
  trial = null;
  playback = null;
  el("replayTools").hidden = true;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  el("private").textContent = "Private room";
  match = Yard.create({ teamSize, kits: { 0: selectedKit } });
  uiKey = "";
  showPanel(
    "ready",
    "The Kiln Yard",
    "Farm scrap with your crew, break the sentry, then finish the exposed reactor.",
    "Play skirmish ↗",
  );
  showKit(selectedKit);
  el("connection").textContent = "LOCAL";
}
function beginPlay() {
  mode = "play";
  debt = 0;
  last = 0;
  clearInput();
  el("panel").hidden = true;
  document.body.classList.add("playing");
  sounds.unlock();
}
function startLocal(kind) {
  signals = [];
  signalAt = -Infinity;
  farmSample = null;
  farmPopups = [];
  localKind = kind;
  trial = null;
  match =
    kind === "skirmish"
      ? Yard.create({ teamSize, kits: { 0: selectedKit } })
      : Yard.createTraining(selectedKit);
  recording = kind === "skirmish" ? RivetReplay.recorder(match) : null;
  if (kind === "trial") {
    match.units = [match.player];
    match.player.x = 165;
    trial = { gate: 0, start: null };
  }
  lesson = 0;
  sounds.seen.clear();
  uiKey = "";
  beginPlay();
}
function pause() {
  if (mode === "replay") {
    showPanel(
      "replay-pause",
      "Replay paused",
      "Resume playback or return to the title.",
      "Resume replay",
    );
    return;
  }
  if (mode !== "play") return;
  if (room.phase === "play") {
    showPanel(
      "online-menu",
      "Field menu",
      "The room is live. Your pilot holds position until you return.",
      "Resume fight",
    );
    room.input({});
  } else
    showPanel(
      "pause",
      "Shift paused",
      "Resume your current fight or return to the title.",
      "Resume fight",
    );
}
function finish() {
  const p = match.player,
    won = match.winner === p.team,
    draw = match.winner === 2;
  const score =
    p.kills +
    " pilot KOs · " +
    p.deaths +
    " deaths · " +
    p.lastHits +
    " last hits · " +
    Math.round(p.objectiveDamage) +
    " objective damage · " +
    match.contracts[p.team] +
    " siege cells";
  const network = room.phase === "end";
  showPanel(
    "end",
    draw
      ? match.endReason === "time"
        ? "Both bases held"
        : "Mutual shutdown"
      : won
        ? "Yard secured"
        : "Reactor lost",
    score,
    network ? (room.lobby.host === room.seat ? "Back to room" : "") : "Play again ↗",
  );
  if (network && room.lobby.host !== room.seat)
    el("message").textContent = "Waiting for the host to reopen the room.";
  sounds.finish(won);
}
function roomLobby(lobby) {
  if (location.hash !== "#room=" + room.room) history.replaceState(null, "", "#room=" + room.room);
  el("connection").textContent = "PRIVATE ROOM";
  if (lobby.phase === "end" && mode === "end") {
    const host = lobby.host === room.seat;
    el("mainActions").hidden = !host;
    el("start").textContent = "Back to room";
    el("message").textContent = host ? "" : "Waiting for the host to reopen the room.";
  }
  if (lobby.phase !== "lobby") return;
  showPanel("lobby", "Crew quarters", "Pick a seat and ready up. Empty seats deploy as bots.", "");
  el("roomActions").hidden = false;
  const list = el("seats");
  list.replaceChildren();
  for (const i of [0, 1, 2, 3]) {
    const s = lobby.seats[i],
      b = document.createElement("button");
    b.textContent =
      (i % 2 ? "Cinder " : "Torch ") +
      (Math.floor(i / 2) + 1) +
      " · " +
      (s
        ? !s.online
          ? "rejoining"
          : i === room.seat
            ? s.ready
              ? "you ✓"
              : "you"
            : s.ready
              ? "ready"
              : "pilot"
        : "take seat");
    b.disabled = !!s;
    b.classList.toggle("own", i === room.seat);
    b.onclick = () => room.send({ type: "seat", slot: i });
    list.append(b);
  }
  const me = lobby.seats[room.seat];
  el("ready").textContent = me?.ready ? "Cancel ready" : "Ready up";
  showKit(me?.kit || "runner");
  el("deploy").hidden = lobby.host !== room.seat;
  el("deploy").disabled = !lobby.seats.every((s) => !s || (s.ready && s.online));
  el("tag").textContent =
    "PRIVATE ROOM   /   " + lobby.seats.filter((s) => s?.online).length + " OF 4 PILOTS";
}
const room = new RivetRoom({
  connecting: (text) => showPanel("connecting", "Opening comms", text, ""),
  error: (text) => {
    if (room.phase === "offline" && mode === "connecting")
      showPanel(
        "ready",
        "The Kiln Yard",
        "Play offline or open another private room.",
        "Play skirmish ↗",
      );
    el("message").textContent = text;
    if (room.phase === "offline" && inviteCode) {
      el("private").hidden = false;
      el("private").textContent = "Join invite";
    }
  },
  lobby: roomLobby,
  state: (game, fresh) => {
    match = game;
    if (fresh) {
      signals = [];
      signalAt = -Infinity;
      farmSample = null;
      farmPopups = [];
    }
    if (fresh || mode === "connecting" || mode === "lobby") {
      beginPlay();
      el("connection").textContent = "LIVE · PRIVATE";
    }
    if (room.phase === "end" && mode !== "end") finish();
  },
  replay: downloadReplay,
  signal: receiveSignal,
  left: title,
});
function downloadReplay(record) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([JSON.stringify(record)], { type: "application/json" }));
  link.href = url;
  link.download = "rivet-" + record.signature + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  el("message").textContent = "Match replay saved.";
}
el("saveReplay").onclick = () => {
  if (room.phase === "end") {
    el("saveReplay").disabled = true;
    room.send({ type: "replay" });
  } else if (recording) downloadReplay(recording.export(match));
};
el("saveReport").onclick = async () => {
  // Deliberate allowlist: invites, seat secrets, URLs and personal identifiers never enter a report.
  const report = {
    format: "rivet-playtest",
    localSeat: match.player.seat,
    fieldTips: tipsEnabled,
    reducedMotion,
    version: 1,
    rules: RivetReplay.rules,
    protocol: RivetWire.version,
    recordedAt: new Date().toISOString(),
    mode: room.phase === "offline" ? localKind : "private room",
    matchId: room.matchId || null,
    tick: match.tick,
    winner: match.winner,
    endReason: match.endReason,
    browser: navigator.userAgent,
    viewport: [innerWidth, innerHeight],
    pilots: match.units
      .filter((u) => u.kind === "pilot")
      .map((p) => ({
        seat: p.seat,
        kit: p.kit,
        kills: p.kills,
        deaths: p.deaths,
        lastHits: p.lastHits,
        farmScrap: p.farmScrap,
        objectiveDamage: Math.round(p.objectiveDamage),
        shieldGiven: Math.round(p.shieldGiven),
        mods: {
          rivets: p.rank - p.driveRank - p.coilRank,
          drive: p.driveRank,
          coils: p.coilRank,
        },
      })),
    observations: {
      whatHappened: "",
      expected: "",
      stepsToRepeat: "",
      movementFeel: "",
      nextFightIdea: "",
      wouldRematch: "",
    },
  };
  if (room.supported) {
    try {
      const response = await fetch("/health", {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        const health = await response.json();
        report.host = {
          build: health.build,
          revision: health.revision,
          artifact: health.artifact || null,
          protocol: health.protocol,
          uptimeSeconds: health.uptimeSeconds,
          tickP95ms: health.tickP95ms,
        };
      }
    } catch {
      /* Offline reports remain useful without host metadata. */
    }
  }
  const link = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
  link.href = url;
  link.download = "rivet-playtest-" + (report.matchId || "solo") + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  el("message").textContent =
    "Report saved. Add your observations before sharing it with the host.";
};
function showKit(kit) {
  for (const b of el("kits").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.kit === kit));
  el("kitInfo").textContent = Yard.kits[kit].summary + " " +
    Yard.skills[kit].map((skill, slot) => ["Q", "E", "R", "F"][slot] + " · " + skill.name).join(" / ");
}
el("kits").replaceChildren(...Object.entries(Yard.kits).map(([id, kit]) => {
  const button = document.createElement("button"), detail = document.createElement("small");
  button.dataset.kit = id; button.textContent = kit.name;
  detail.textContent = kit.attackType.toUpperCase() + " · " + kit.role;
  button.append(detail); return button;
}));
showKit(selectedKit);
for (let slot = 0; slot < 4; slot++) el("ability" + slot).onclick = () => {
  if (mode === "play") pressed.add(["KeyQ", "KeyE", "KeyR", "KeyF"][slot]);
};
for (const b of el("kits").querySelectorAll("button"))
  b.onclick = () => {
    selectedKit = b.dataset.kit;
    room.preference = selectedKit;
    showKit(selectedKit);
    if (room.phase === "lobby") room.send({ type: "kit", kit: selectedKit });
    else {
      match = Yard.create({ teamSize, kits: { 0: selectedKit } });
      uiKey = "";
    }
  };
function drawScores() {
  box(115, 96, 730, 206, "#10212df5");
  label("CREW SCORE", 137, 123, "#ffe2a8", 16);
  label(
    "PILOT                        KO / DOWN    LAST HITS   FARM SCRAP   SIEGE DMG   SHIELD GIVEN",
    137,
    151,
    "#b3c8c8",
    10,
  );
  const pilots = match.units
    .filter((u) => u.kind === "pilot")
    .sort((a, b) => a.team - b.team || a.seat - b.seat);
  for (const [i, p] of pilots.entries()) {
    const y = 174 + i * 28,
      c = palette[p.team];
    label((p === match.player ? "YOU · " : "") + Yard.kits[p.kit].name, 137, y, c, 12);
    label(p.kills + " / " + p.deaths, 320, y);
    label(p.lastHits, 415, y);
    label(p.farmScrap, 500, y);
    label(Math.round(p.objectiveDamage), 595, y);
    label(Math.round(p.shieldGiven), 700, y);
  }
}
function mainAction() {
  sounds.unlock();
  if (mode === "replay-pause") {
    beginPlay();
    mode = "replay";
  } else if (mode === "pause" || mode === "online-menu") beginPlay();
  else if (mode === "end" && room.phase === "end") room.send({ type: "rematch" });
  else startLocal(mode === "end" || mode === "trial-end" ? localKind : "skirmish");
}
el("start").onclick = mainAction;
el("format").onclick = () => {
  teamSize = teamSize === 2 ? 1 : 2;
  el("format").textContent = "Crew size · " + teamSize + "v" + teamSize;
};
el("private").onclick = () => room.connect(inviteCode);
el("ready").onclick = () => room.send({ type: "ready", ready: !room.lobby.seats[room.seat].ready });
el("deploy").onclick = () => room.send({ type: "start" });
el("training").onclick = () => startLocal("training");
el("trial").onclick = () => startLocal("trial");
el("watch").onclick = () => el("replayFile").click();
el("replayFile").onchange = async () => {
  const file = el("replayFile").files[0];
  el("replayFile").value = "";
  if (!file) return;
  try {
    if (file.size > 4 * 1024 * 1024) throw Error("Replay is too large.");
    const loaded = RivetReplay.load(JSON.parse(await file.text()));
    playback = loaded;
    match = playback.game;
    recording = null;
    replaySpeed = 1;
    uiKey = "";
    el("replayTools").hidden = false;
    el("replaySpeed").textContent = "Playback · 1×";
    el("connection").textContent = "REPLAY";
    beginPlay();
    mode = "replay";
  } catch (error) {
    el("message").textContent = error.message;
  }
};
el("replaySpeed").onclick = () => {
  replaySpeed = replaySpeed === 4 ? 1 : replaySpeed * 2;
  el("replaySpeed").textContent = "Playback · " + replaySpeed + "×";
};
el("replaySeat").onclick = () => {
  if (!playback) return;
  const seats = match.units.filter((u) => u.kind === "pilot").length;
  Yard.follow(match, (match.player.seat + 1) % seats);
  uiKey = "";
};
el("copy").onclick = async () => {
  const url = new URL(location.href);
  url.hash = "room=" + room.room;
  el("inviteLink").value = url.href;
  try {
    await navigator.clipboard.writeText(url.href);
    el("message").textContent = "Invite copied.";
  } catch {
    el("inviteWrap").hidden = false;
    el("inviteLink").select();
    el("message").textContent = "Copy the selected invite link.";
  }
};
el("leave").onclick = () => (room.phase === "offline" ? title() : room.leave());
el("menuBtn").onclick = () => {
  if (mode === "play" || mode === "replay") pause();
  else if (["pause", "online-menu", "replay-pause"].includes(mode)) mainAction();
};
function soundButton() {
  el("sound").textContent = sounds.enabled ? "Sound on" : "Sound off";
  el("sound").setAttribute("aria-pressed", String(sounds.enabled));
}
function tipsButton() {
  el("tips").textContent = tipsEnabled ? "Tips on" : "Tips off";
  el("tips").setAttribute("aria-pressed", String(tipsEnabled));
}
el("tips").onclick = () => {
  tipsEnabled = !tipsEnabled;
  try {
    localStorage.setItem("rivet-tips", tipsEnabled ? "on" : "off");
  } catch {}
  tipsButton();
};
tipsButton();
el("sound").onclick = () => {
  sounds.toggle();
  soundButton();
};
soundButton();
el("gunMod").onclick = () => {
  if (mode === "play") pressed.add("Digit1");
};
el("driveMod").onclick = () => {
  if (mode === "play") pressed.add("Digit2");
};
el("coilMod").onclick = () => {
  if (mode === "play") pressed.add("Digit3");
};
const keys = new Set([
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "KeyJ",
  "KeyK",
  "KeyQ",
  "KeyR",
  "KeyF",
  "KeyC",
  "KeyE",
  "Digit1",
  "Digit2",
  "Digit3",
  "Space",
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "ShiftLeft",
  "ShiftRight",
]);
window.addEventListener("keydown", (e) => {
  if (mode === "play" && ["KeyG", "KeyH"].includes(e.code) && !e.repeat) {
    e.preventDefault();
    sendSignal(e.code === "KeyG" ? "rally" : "retreat");
    return;
  }
  if (trial && e.code === "KeyR" && !e.repeat) {
    e.preventDefault();
    startLocal("trial");
    return;
  }
  if (e.code === "Escape" && !e.repeat) {
    if (["pause", "online-menu", "replay-pause"].includes(mode)) mainAction();
    else pause();
    return;
  }
  if (mode !== "play" || !keys.has(e.code)) return;
  e.preventDefault();
  if (!held.has(e.code)) pressed.add(e.code);
  if (!e.repeat && ["KeyW", "ArrowUp", "Space"].includes(e.code)) pressed.delete("JumpRelease");
  if (
    !e.repeat &&
    (e.code === "ShiftLeft" || e.code === "ShiftRight") &&
    (held.has("KeyJ") || mouse.fire)
  )
    pressed.add("Strike");
  held.add(e.code);
});
window.addEventListener("keyup", (e) => {
  held.delete(e.code);
  if (
    mode === "play" &&
    ["KeyW", "ArrowUp", "Space"].includes(e.code) &&
    !["KeyW", "ArrowUp", "Space"].some((key) => held.has(key))
  )
    pressed.add("JumpRelease");
});
window.addEventListener("blur", () => {
  clearInput();
  if (room.phase === "play") room.input({});
  else pause();
});
function pointer(e) {
  mouse.inside = true;
  const bounds = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - bounds.left) * canvas.width) / bounds.width;
  mouse.y = ((e.clientY - bounds.top) * canvas.height) / bounds.height;
}
canvas.addEventListener("pointermove", pointer);
canvas.addEventListener("pointerleave", () => {
  mouse.inside = false;
});
canvas.addEventListener("pointerdown", (e) => {
  if (mode !== "play") return;
  pointer(e);
  sounds.unlock();
  e.preventDefault();
  if (e.button === 0) {
    mouse.fire = true;
    pressed.add("Mouse0");
  }
  if (e.button === 2) pressed.add("KeyK");
});
window.addEventListener("pointerup", (e) => {
  if (e.button === 0) mouse.fire = false;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
function readInput() {
  const p = match.player,
    angle = Math.atan2(mouse.y - (p.y - Yard.height(p) / 2), mouse.x + camera - p.x);
  return {
    left: held.has("KeyA") || held.has("ArrowLeft"),
    right: held.has("KeyD") || held.has("ArrowRight"),
    down: held.has("KeyS") || held.has("ArrowDown"),
    fire: held.has("KeyJ") || mouse.fire,
    fireTap: pressed.has("KeyJ") || pressed.has("Mouse0") || pressed.has("Strike"),
    aim:
      mouse.fire || pressed.has("Mouse0") || (mouse.inside && ["KeyQ", "KeyK", "KeyE", "KeyR", "KeyF"].some((key) => pressed.has(key)))
        ? (Math.round((angle * 128) / Math.PI) + 256) % 256
        : null,
    jump: ["KeyW", "Space", "ArrowUp"].some((k) => pressed.has(k)),
    dash: pressed.has("ShiftLeft") || pressed.has("ShiftRight"),
    jumpRelease: pressed.has("JumpRelease"),
    pulse: pressed.has("KeyQ") || pressed.has("KeyK"),
    skill2: pressed.has("KeyE"),
    skill3: !trial && pressed.has("KeyR"),
    ultimate: pressed.has("KeyF"),
    crane: pressed.has("KeyC"),
    buy: pressed.has("Digit1"),
    drive: pressed.has("Digit2"),
    coil: pressed.has("Digit3"),
  };
}
function frame(now) {
  if (mode === "replay") {
    debt += last ? Math.min(0.1, (now - last) / 1000) * replaySpeed : 0;
    while (debt >= Yard.stepSeconds && mode === "replay") {
      if (!playback.advance()) {
        const matched = playback.verified();
        el("replayTools").hidden = true;
        showPanel(
          "replay-end",
          matched ? "Replay complete" : "Replay differs",
          matched
            ? "The recorded result and final state match this playback."
            : "A rule or input differs from the recorded build.",
          "",
        );
      }
      debt -= Yard.stepSeconds;
    }
  }
  if (mode === "play" || mode === "online-menu") {
    debt += last ? Math.min(0.1, (now - last) / 1000) : 0;
    while (debt >= Yard.stepSeconds && (mode === "play" || mode === "online-menu")) {
      const input = mode === "online-menu" ? {} : readInput();
      if (room.phase === "play") room.input(input);
      else if (match.training) {
        Yard.stepSeats(match, { 0: input, 1: {} });
        const p = match.player;
        if (trial) updateTrial(input);
        else if (lesson === 0 && p.jumps >= 2 && p.dashLeft > 0) lesson++;
        else if (lesson === 1 && p.lungesLanded > 0) {
          lesson++;
          p.slamsLanded = 0; p.castMask = 0;
        } else if (lesson === 2 && p.castMask === 15) lesson++;
      } else {
        recording?.capture(match.tick, { 0: input });
        Yard.step(match, input);
      }
      pressed.clear();
      debt -= Yard.stepSeconds;
      if (match.winner !== null && room.phase === "offline") finish();
    }
  }
  if (room.phase === "play" && room.game) match = room.sample(now);
  if (mode === "play") sounds.observe(match);
  last = now;
  draw();
  requestAnimationFrame(frame);
}
function updateTrial(input) {
  if (trial.start === null && (input.left || input.right || input.jump || input.dash))
    trial.start = match.tick - 1;
  if (trial.start === null) return;
  const [x, y] = gates[trial.gate],
    p = match.player;
  if (Math.hypot(p.x - x, p.y - y) > 32) return;
  trial.gate++;
  sounds.event("salvage");
  if (trial.gate < gates.length) return;
  const seconds = (match.tick - trial.start) / 60;
  const key = "rivet-lap-02-" + p.kit;
  let best = seconds;
  try {
    const previous = Number(localStorage.getItem(key));
    if (previous > 0) best = Math.min(previous, best);
    localStorage.setItem(key, String(best));
  } catch {}
  showPanel(
    "trial-end",
    "Run complete",
    Yard.kits[p.kit].name +
      "   ·   " +
      seconds.toFixed(2) +
      "s   ·   Personal best " +
      best.toFixed(2) +
      "s",
    "Race again ↗",
  );
}
const supplied = new URLSearchParams(location.hash.slice(1)).get("room");
if (supplied && /^[A-Za-z0-9_-]{16}$/.test(supplied)) {
  inviteCode = supplied;
  room.connect(inviteCode);
}
requestAnimationFrame(frame);
