"use strict";

class RivetRoom {
  constructor(events) {
    this.events = events;
    this.socket = null;
    this.room = "";
    this.seat = -1;
    this.sequence = 0;
    this.retryTimer = 0;
    this.lastPacketAt = 0;
    this.history = [];
    this.phase = "offline";
  }

  get supported() {
    return ["http:", "https:"].includes(location.protocol);
  }

  saved(room) {
    try {
      const saved = JSON.parse(sessionStorage.getItem("rivet-seat") || "null");
      return saved?.room === room ? saved : null;
    } catch {
      return null;
    }
  }

  remember(record) {
    try {
      if (record) sessionStorage.setItem("rivet-seat", JSON.stringify(record));
      else sessionStorage.removeItem("rivet-seat");
    } catch {
      /* A private browser may disable storage. Live play still works. */
    }
  }

  connect(room = "", restoring = false) {
    if (!this.supported) {
      this.events.error(
        "To play together, open the invite link from the person hosting your room.",
      );
      return;
    }
    this.disconnectSocket();
    this.phase = "connecting";
    this.events.connecting(restoring ? "Reconnecting to your seat…" : "Connecting to the yard…");
    let socket;
    try {
      const url = new URL("/arena", location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
    } catch {
      this.phase = "offline";
      this.events.error("Could not open a room connection.");
      return;
    }
    this.socket = socket;
    if (!restoring) this.retryUntil = 0;
    socket.onopen = () => {
      if (socket !== this.socket) return;
      const saved = room && this.saved(room);
      const secret = saved?.secret || (room === this.room ? this.secret : undefined);
      this.send(
        room
          ? {
              type: "join",
              room,
              secret,
              kit: this.preference,
              version: RivetWire.version,
            }
          : {
              type: "create",
              kit: this.preference,
              version: RivetWire.version,
            },
      );
    };
    socket.onmessage = (e) => {
      if (socket !== this.socket) return;
      this.receive(JSON.parse(e.data));
    };
    socket.onclose = (e) => {
      if (socket !== this.socket) return;
      this.socket = null;
      if (this.room && e.code !== 4001) {
        if (!this.retryUntil) this.retryUntil = Date.now() + 55000;
        if (Date.now() < this.retryUntil) {
          this.phase = "connecting";
          this.events.connecting("Connection lost. Rejoining your seat…");
          this.retryTimer = setTimeout(() => this.connect(this.room, true), 1300);
          return;
        }
      }
      this.reset();
      this.events.error(
        e.code === 4001
          ? "Your seat opened in another tab."
          : "Room server unavailable. Check the host address or play a solo match.",
      );
    };
    socket.onerror = () => {}; // close supplies the actionable recovery message
  }

  disconnectSocket() {
    clearTimeout(this.retryTimer);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  reset() {
    this.disconnectSocket();
    this.remember(null);
    this.room = "";
    this.secret = "";
    this.seat = -1;
    this.phase = "offline";
    this.game = null;
    this.state = null;
    this.lobby = null;
    this.matchId = null;
    this.history = [];
    this.retryUntil = 0;
  }

  leave() {
    if (this.socket?.readyState === WebSocket.OPEN) this.send({ type: "leave" });
    this.reset();
    this.events.left();
  }

  send(msg) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg));
  }

  receive(msg) {
    if (msg.type === "signal" && this.phase === "play" && msg.matchId === this.matchId) {
      this.events.signal?.(msg);
      return;
    }
    if (msg.type === "replay" && this.phase === "end" && msg.matchId === this.matchId) {
      this.events.replay(msg.record);
      return;
    }
    if (msg.type === "error") {
      if (this.phase === "connecting") this.reset();
      this.events.error(msg.message);
      return;
    }
    if (msg.type === "seat") {
      this.room = msg.room;
      this.seat = msg.seat;
      this.secret = msg.secret;
      this.sequence = 0;
      this.history = [];
      this.retryUntil = 0;
      this.remember({ room: this.room, secret: this.secret });
      return;
    }
    if (msg.type === "lobby") {
      this.lobby = msg;
      this.phase = msg.phase;
      if (msg.phase === "lobby") {
        this.state = null;
        this.matchId = null;
        this.history = [];
      }
      this.events.lobby(msg);
      return;
    }
    if (msg.type !== "state") return;
    const fresh = this.matchId !== msg.matchId || !this.state;
    this.matchId = msg.matchId;
    this.phase = msg.phase;
    this.previous = fresh ? null : this.state;
    this.state = RivetWire.unpack(msg.game, Yard.stats, Yard.kits);
    this.lastPacketAt = performance.now();
    const source = this.state.units.find((u) => u.seat === this.seat);
    const previousDisplay = fresh ? null : this.game?.player;
    const estimate = fresh ? null : this.predicted;
    this.predicted = { ...source, struck: [...source.struck], cooldowns: [...source.cooldowns], anchor: source.anchor ? {...source.anchor} : null };
    this.history = this.history.filter((h) => h.seq > msg.ack[this.seat]);
    for (const h of this.history) Yard.predictPilot(this.state, this.predicted, h.input);
    this.lastCorrection =
      estimate && estimate.hp > 0 && source.hp > 0
        ? Math.hypot(estimate.x - this.predicted.x, estimate.y - this.predicted.y)
        : null;
    this.offsetX = previousDisplay ? previousDisplay.x - this.predicted.x : 0;
    this.offsetY = previousDisplay ? previousDisplay.y - this.predicted.y : 0;
    if (Math.abs(this.offsetX) > 85 || Math.abs(this.offsetY) > 85 || !source.hp)
      this.offsetX = this.offsetY = 0;
    this.game = Yard.follow(
      {
        ...this.state,
        units: this.state.units.map((u) => ({ ...u })),
        shots: this.state.shots.map((s) => ({ ...s })),
      },
      this.seat,
    );
    this.prevUnits = new Map(this.previous?.units.map((u) => [u.id, u]));
    this.prevShots = new Map(this.previous?.shots.map((s) => [s.id, s]));
    this.sample(this.lastPacketAt);
    this.events.state(this.game, fresh);
  }

  input(input) {
    if (this.phase !== "play" || !this.state) return;
    const seq = ++this.sequence;
    this.send({
      type: "input",
      seq,
      matchId: this.matchId,
      mask: RivetWire.encode(input),
      aim: input.aim,
    });
    this.history.push({ seq, input });
    if (this.history.length > 48) this.history.shift();
    Yard.predictPilot(this.state, this.predicted, input);
  }

  sample(now) {
    if (!this.game || !this.state) return this.game;
    const alpha = Math.min(1, Math.max(0, (now - this.lastPacketAt) / 50));
    for (const [i, view] of this.game.units.entries()) {
      const next = this.state.units[i],
        prev = this.prevUnits.get(view.id);
      if (view.seat === this.seat && next.hp && this.phase === "play") {
        view.x = this.predicted.x + this.offsetX * (1 - alpha);
        view.y = this.predicted.y + this.offsetY * (1 - alpha);
        view.dir = this.predicted.dir;
        view.dashLeft = this.predicted.dashLeft;
        view.slamming = this.predicted.slamming;
        view.grounded = this.predicted.grounded;
        view.slideLeft = this.predicted.slideLeft;
        view.vx = this.predicted.vx;
        view.anchor = this.predicted.anchor;
        view.skillDash = this.predicted.skillDash;
        view.skillEvade = this.predicted.skillEvade;
      } else if (prev && prev.hp && next.hp && Math.abs(prev.x - next.x) < 120) {
        view.x = prev.x + (next.x - prev.x) * alpha;
        view.y = prev.y + (next.y - prev.y) * alpha;
      }
    }
    for (const [i, s] of this.game.shots.entries()) {
      const next = this.state.shots[i],
        prev = this.prevShots.get(s.id);
      if (prev) {
        s.x = prev.x + (next.x - prev.x) * alpha;
        s.y = prev.y + (next.y - prev.y) * alpha;
      }
    }
    return this.game;
  }
}
