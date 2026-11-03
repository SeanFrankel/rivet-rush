# Working on Rivet Rush

These rules apply throughout this repository, including changes made directly on a branch. Start with the [documentation index](docs/README.md) and the [update matrix](docs/updating.md).

1. Before changing play, read the [current rules](docs/gameplay.md) and [design and playtest guide](docs/playtesting.md). Name the decision the player will face, what the opponent can do, and how a tester could distinguish improvement from extra complexity.
2. In the same change, update every affected reader's page using the matrix. Describe shipped behavior in present tense, proposed work as a hypothesis, and observed play with its build and sample. Correct stale instructions wherever a player sees them, including the in-game prompts.
3. Run the checks in [verification](docs/verification.md). Report which gates passed, which need human sessions, and any remaining uncertainty. A winning bot script establishes reachability. Only human play can establish whether a choice is satisfying.
4. Before merging, review the diff against the matrix. Include doc paths and evidence in the pull request or direct-push handoff. For an internal-only change, record the specific reason existing pages still hold. The change author owns this work through merge.
