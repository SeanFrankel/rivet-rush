# Rivet Rush

A desktop-browser, single-player 2D MOBA prototype inspired by Awesomenauts. Two salvage crews escort scrap crawlers across the Kiln Yard. Break the enemy reactor before its crew breaks yours.

## Play

Open `index.html` in a desktop browser and select **Deploy pilot**. The game runs offline with no installation or build step. To serve it over localhost instead, run `python -m http.server 8000` in the project folder and open http://localhost:8000.

| Input | Action |
| --- | --- |
| A / D or arrow keys | Move and face left or right |
| W, Up or Space | Jump, then kick once in midair |
| J (hold) | Fire rivets. Your gun aims at the nearest enemy ahead within range. |
| K | Release a short-range shock pulse. Recharges in four seconds. |
| E | Operate the upper-deck crane switch to open a ten-second crossing. |
| 1 | Spend 12 crew scrap on a damage upgrade, up to three times. |
| Escape | Pause or resume |

Crawlers deploy every 12 seconds. Stay behind them while they draw sentry fire. Enemy losses earn crew scrap, even when a friendly crawler lands the final shot. Pilots return five seconds after destruction. The upper platforms offer a route over the central fight.

## Development

The prototype has one arena, one playable pilot and one opposing bot. All characters, environment art and combat rules are implemented for this project. The bot and crawlers fight along the lower deck. Multiplayer is outside this first build.

`match.js` holds the fixed-step simulation. `yard.js` handles Canvas rendering and keyboard controls. Run `node --test tests/match.test.js` to check the match rules. The seeded scenery generator credits its upstream author in [THIRD_PARTY.md](THIRD_PARTY.md). The projectile hitboxes use the axis-aligned collision approach described by [MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection).
