# Implementation and verification

| Boundary | Responsibility | First place to check |
| --- | --- | --- |
| Browser entry | Offline asset loading, overlay, control legend and canvas | [index.html](../index.html) |
| Presentation and input | Keyboard edges versus held actions, fixed-step accumulator, camera, HUD, pause and restart | [yard.js](../yard.js) |
| Rules | Match factory and step function, targeting, physics, collision, spawns, cooldowns and resolution | [match.js](../match.js) |
| Regression suite | Node tests drive the same rules as the browser at 60 Hz | [match.test.js](../tests/match.test.js) |

From the repository root, run `node --test tests/match.test.js` and `node tools/check-docs.cjs`. Use Node 22 for parity with CI. Open `index.html` in a desktop browser using the instructions in the [player README](../README.md). The simulation needs no server or installed packages. Artwork uses a separate seeded random generator so rendering does not set match outcomes.

## Manual smoke pass

| Action | Expected result |
| --- | --- |
| Deploy, move both ways, turn before firing and jump twice. | Camera follows within the yard bounds. Gun follows facing. Second jump gains height; landing restores jumps. |
| Push with a wave, fire and pulse a group. | A dashed sentry line stays fixed as you jump; the following rivet travels along it. Shots stop on a hit. Health drops. Pulse becomes ready after its cooldown. |
| Cross the lower ledge to the upper crane, activate and wait. | The bridge appears, supports a crossing and expires. The switch gives feedback for an out-of-range attempt. |
| Earn 12 scrap, buy, die and return. | Scrap drops by 12, gun tier rises, and the tier survives respawn. |
| Pause, resume and switch focus. | Waves and cooldowns stop while paused. Losing focus pauses local play. |
| End the match and replay. | Winner is shown, then the new match starts with full reactors, first wave and base equipment. |

The four current automated tests cover a sentry lock with paired stationary/jumping targets, crane access/expiry, a winning upgraded push with a frozen end state, and an idle loss. They do not exercise browser rendering, multiplayer or human engagement. For regressions, record commit, OS/browser, steps, expected/observed behavior, severity and reproduction count. Add a simulation test for a stable rule or a browser test for an input/UI regression as appropriate. Release criteria and candidate evidence belong in the [roadmap](roadmap.md).
