"use strict";
// Dedicated server process for load measurement, separate from synthetic clients.
const path = require("node:path");
const { createHost } = require(
  process.argv[2] ? path.resolve(process.argv[2], "server/host.js") : "../server/host",
);
const host = createHost();
function sample() {
  process.send?.({
    port: host.server.address()?.port,
    rooms: host.rooms.size,
    metrics: host.metrics,
    rssMiB: process.memoryUsage().rss / 1048576,
    tickP95ms: host.tickCost.percentile(95) / 1e6,
    tickP99ms: host.tickCost.percentile(99) / 1e6,
  });
}
host.server.listen(0, "127.0.0.1", sample);
const timer = setInterval(sample, 1000);
process.on("message", async (message) => {
  if (message === "sample") sample();
  if (message === "close") {
    clearInterval(timer);
    await host.close();
    sample();
    process.disconnect();
  }
});
process.on("disconnect", () => {
  clearInterval(timer);
  host.close();
});
