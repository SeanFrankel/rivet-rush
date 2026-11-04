# Third-party code

The seeded generator used to draw the repeatable shipyard skyline in `yard.js` is adapted from [d3-random v3.0.1](https://github.com/d3/d3-random/blob/v3.0.1/src/lcg.js). The adaptation uses one fixed integer seed. The upstream [ISC license](https://github.com/d3/d3-random/blob/v3.0.1/LICENSE) follows.

Copyright 2010-2021 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
## Multiplayer and QA

The multiplayer host uses ws 8.22.1 under the MIT license. The project locks the dependency in `package-lock.json`. Installing the host includes the license in the distributed ws package. [Upstream ws](https://github.com/websockets/ws) · [license](https://github.com/websockets/ws/blob/8.22.1/LICENSE)

Playwright 1.64.1 and its test runner are development dependencies under Apache-2.0. They drive real browsers in QA. [Upstream Playwright](https://github.com/microsoft/playwright) · [license](https://github.com/microsoft/playwright/blob/main/LICENSE)

The Arc Runner title illustration and Kiln Yard background are original AI-generated placeholder assets made for this repository. The pilot silhouettes, playable geometry and effects are implemented in Canvas. The game uses short original Web Audio synth patches.
