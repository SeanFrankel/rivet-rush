# Working on Rivet Rush

These rules apply throughout this repository, including changes made directly on a branch. Start with the [documentation index](docs/README.md) and the [update matrix](docs/updating.md).

Rivet Rush is a movement-driven team MOBA. A pilot should be enjoyable to steer across an empty map. In a match, connect that movement to farming NPC waves, choosing a build, protecting or fighting pilots, contesting an objective and taking the opposing reactor. Treat individual map props as replaceable experiments. Observe both crews before calling a mechanic fun or balanced.

1. Before changing play, read the [current rules](docs/gameplay.md) and [design and playtest guide](docs/playtesting.md). Name the decision the player will face, what the opponent can do, and how a tester could distinguish improvement from extra complexity.
2. In the same change, update every affected reader's page using the matrix. Describe shipped behavior in present tense, proposed work as a hypothesis, and observed play with its build and sample. Correct stale instructions wherever a player sees them, including the in-game prompts.
3. Run the checks in [verification](docs/verification.md). Report which gates passed, which need human sessions, and any remaining uncertainty. A winning bot script establishes reachability. Only human play can establish whether a choice is satisfying.
4. Before merging, review the diff against the matrix. Include doc paths and evidence in the pull request or direct-push handoff. For an internal-only change, record the specific reason existing pages still hold. The change author owns this work through merge.
5. Before art, animation, VFX, audio, interface-style or promotional work, read the [design and art principles](docs/art-direction.md) and its approval status. The new direction is a proposal awaiting the owner's review. Keep current in-game art, assets and visual direction during mechanics work; do not implement the proposal until the owner approves it. After approval, cite the applicable DA principles and verify actual-size combat readability. Preserve gameplay authority and record direction changes with their evidence.

## Current owner-directed decision pause · 2026-11-03

The owner explicitly requested completing the key roadmap decisions before further game development. During this phase, record answers and help clarify D1–D8 in [the roadmap](docs/roadmap.md); do not implement, tune, produce art or deploy game changes. Resume only when the owner instructs it. The accepted future direction is 4v4 with 15–20-minute average matches and 30-minute-plus long games; the existing 2v2/seven-minute prototype remains unchanged. D3/D4 are partial, D5–D8 are open, and Brightwork is not approved. Earlier autonomy permission does not override this pause. Documentation updates are authorized.
