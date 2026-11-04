# Design and art principles

**Status: proposal awaiting the project owner's review, edits and approval. Keep the current in-game art, assets and visual direction while mechanics work continues. Do not implement the proposed style yet.**

**Proposed direction: Brightwork — a sunlit, handmade future built for fierce team competition.** The proposal envisions Rivet Rush as a festival sports poster brought to life: expressive athletes, springy utility machines, ceramic armor, taut fabric and bold printed shapes. Movement is exuberant. Fights are sharp, readable and consequential. Farming, coordinated pushes and breaking the opposing reactor remain the reason to compete.

This is the central review draft for future character art, environments, animation, effects, interface, sound and promotional work. After approval, it will become the canonical artistic direction. **Brightwork is an internal direction name, not a game rename.** The current shipyard illustrations and visual treatment remain in use and did not determine this proposal. This document defines a proposed target; it does not claim that the target is approved, implemented, popular with our players or commercially validated.

## How to use this document

Before an art-facing change, read the principles and the relevant discipline section. Identify the player's decision, the information that must survive the change, and the acceptance check. Keep the [game rules](gameplay.md) authoritative for mechanics, hitboxes and timing; use the [playtest guide](playtesting.md) to evaluate fun and the [roadmap](roadmap.md) to decide scope. Follow the [update matrix](updating.md) in the same change.

The priority order is **fair information → responsive movement → readable MOBA decisions → expressive identity → decoration**. A beautiful asset that hides a threat fails. An unfinished asset that communicates it accurately is acceptable at this stage. The current two kits and one map are sufficient to prove the direction. This document authorizes no new gameplay system, biome, character, campaign or art-production sprint by itself.

## Audience and the opportunity hypothesis

The primary audience is a friend group that enjoys expressive platform movement and coordinated competitive play, including people who prefer an inviting world to grim military or apocalyptic settings. The secondary audience is stylish-action players curious about a compact MOBA. Players seeking pressure-free building or gardening are not our assumed conversion audience. Our invitation must show combat, NPC farming and base destruction immediately.

**Research hypothesis, checked 2026-11-03:** optimistic, materially tactile future worlds have demonstrated audience interest; the specific combination of that world, graphic 2D athletic action and a farm-to-base team loop appears less directly represented in the small comparison set below. That makes it a promising differentiation experiment. It does **not** establish an uncontested market, audience overlap, willingness to pay or likely success.

| Evidence from primary sources | What it supports | What it does not establish |
| --- | --- | --- |
| Crytivo's *Autonomica* campaign describes a solarpunk-inspired farming/automation survival game and records **12,358 backers / $1,047,675 pledged**. The campaign ran April 15–May 17, 2025. [Creator campaign](https://www.kickstarter.com/projects/crytivogames/autonomica) | A concrete commitment signal for one optimistic-future game pitch. | The aesthetic caused those pledges, or those backers want a MOBA. |
| *Solarpunk*'s Steam page showed **81% positive among 2,009 English reviews** at this research snapshot. Its own description explicitly excludes PvP and competitive base attacks. [Developer store page](https://store.steampowered.com/app/1805110/Solarpunk/) | A released adjacent world with a self-selected positive review audience; a clear difference in play promise. | Market size, all-language sentiment, current player activity or appetite for competitive play. |
| *Aloft* showed **84% positive among 1,982 English reviews** and describes cooperative survival, flying islands and ecosystem restoration. [Developer store page](https://store.steampowered.com/app/1660080/Aloft/) | A second adjacent example of an optimistic world organized around cooperative exploration. | That all hopeful-world players share one taste, or that this setting is unoccupied. |
| Brawlhalla's developer celebrated **100 million lifetime players on May 18, 2023**. [Developer announcement](https://www.brawlhalla.com/news/celebrating-100-million-brawlers-patch-7-08) | Broad historical reach for approachable-looking, expressive platform competition. | An active-player count, art-driven causality or Rivet Rush's reachable audience. |
| *Lethal League Blaze* markets fast four-player competition through music and style. Team Reptile also explicitly plans more cyberfunk games. [Developer store page](https://store.steampowered.com/app/553310/Lethal_League_Blaze/) · [Studio press kit](https://team-reptile.com/presskit/) | Stylish competition already has strong neighboring identities. | That another neon street-sport treatment would be meaningfully differentiated. |
| Odyssey's *Omega Strikers* FAQ says it could not grow the game and that many players left after a few weeks; it ended planned major content releases after 2023. [Developer FAQ](https://support.odysseyinteractive.gg/hc/en-us/articles/20078372545819-Future-of-Omega-Strikers-FAQ) | Retention and repeatable group fun are real risks even for a distinctive competitive game. | A reason to copy its art, to assume its audience is available, or to diagnose the cause from art alone. |

The bounded comparison also includes [Awesomenauts](https://store.steampowered.com/app/204300/Awesomenauts/), a direct 2D platform-MOBA reference, and [Deadlock](https://store.steampowered.com/app/1422450/Deadlock/), a developing multiplayer reference. **Do not pitch this project as filling a permanently abandoned Awesomenauts vacuum:** Atari's official feed records its restored main-branch relaunch on October 28, 2025 and update 5.0.1a on December 31, 2025. [Official update history](https://steamcommunity.com/app/204300/allnews/)

This scan deliberately covers the user's mechanical references, nearby stylish PvP and adjacent optimistic-world games. It is not a census of Steam or all platforms. Store descriptions establish positioning, not visual market share. Recheck these sources before using a demand claim in a pitch or making a major production investment. Reviews, crowdfunding and lifetime players are different measures and must never be combined into a fabricated market estimate.

### Direction decision

| Candidate | Strength for this game | Main risk | Decision |
| --- | --- | --- | --- |
| Neon street-sport futurism | Immediately communicates speed, attitude and a musical identity. | Strong neighboring studio identities; easy to become a familiar derivative. | Keep athletic confidence and rhythmic animation as abstract lessons. Do not adopt its overall look. |
| Dark mechanical folklore | Strong silhouettes and dramatic threats; supports strange machines. | Low-value environments and dense ornament compete with fast projectile reading; tonal distance from an inviting friend session. | Reserve mystery for a neutral objective's behavior, without making darkness the visual foundation. |
| **Sunlit civic sport with handmade machinery** | Warm invitation, distinctive materials, strong poster graphics, space for airborne movement and legible teams. | Can imply a cozy crafting game; flowers and soft shapes can weaken combat intensity. | **Recommended for owner review.** Show decisive movement, opponents, farm waves and the base objective in the first gameplay image. |

The distinguishing combination is **printed graphic composition + visible handmade construction + serious athletic rivalry**. Greenery or a warm palette alone does not satisfy it. This choice is a recommendation for the owner's review. Once approved, changes should follow recorded evidence rather than an isolated attractive image.

## Design principles

| ID | Principle | Practical rule |
| --- | --- | --- |
| DA-01 | Moving is a reward. | Pose, follow-through and sound should make a jump, reversal and dash satisfying across an empty arena. Input and simulation remain responsive regardless of animation. |
| DA-02 | Every flourish tells the truth. | Telegraphs, damage areas, protection, landing and recovery represent actual rules. No decorative frame suggests an invulnerability window or cancel that does not exist. |
| DA-03 | The wave is the team story. | NPCs, farm rewards, ally support, towers and reactor states receive deliberate visual identities. Promotion must show the loop beyond a hero duel. |
| DA-04 | Identity survives chaos. | Each kit has one dominant silhouette feature and a distinct movement attitude. Team, kit and state must remain separable in a crowded fight. |
| DA-05 | A hopeful world can host fierce rivalry. | Treat competitors as capable, proud and inventive. Impacts have weight, setbacks are clear, and victory has stakes. Warmth comes from the world and personalities. |
| DA-06 | Make craft visible at the useful scale. | Communicate material through large seams, ribs, straps and color masses. Micro-scratches and texture cannot carry a gameplay distinction. |
| DA-07 | Build a coherent small set. | Reuse a material kit, cue vocabulary, pose system and interface tokens. Prove one complete encounter before commissioning a large asset catalog. |

Riot's published clarity guidance emphasizes silhouette recognition, matching effects to hitboxes and giving consequential spells stronger presentation. Those are relevant precedents; the rules and tests in this document are Rivet Rush's own proposed implementation contract. [Riot, Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/)

## World, tone and the match fantasy

Imagine hilltop neighborhoods connected by wind corridors and elevated public works. Their annual competitive derby turns purpose-built pressure engines, courier rigs and convoy machines into an arena sport. Participants are athletes and makers, with practical clothing customized by their crew. The built world is maintained, repaired and used. Nature appears in planted terraces and distant canopies, leaving the combat surface clear.

The match is an energetic contest to break the opposing **arena reactor**. Its defeat produces an unmistakable shutdown and victory event. Fictional safety systems can explain respawns and recoverable machines; they must never make damage, danger or winning feel inconsequential. Avoid framing the objective as destroying civilians' essential infrastructure. This premise is a presentation target, not a request to change the simulation or write a story campaign.

| Existing gameplay role | Direction for future presentation | Information that must remain obvious |
| --- | --- | --- |
| Pilot | Athletic silhouette, a single signature tool, visible spring/compression mechanisms, one crew mark. | Kit, team, facing, grounded/airborne state, attack commitment. |
| Crawler | Low, compact courier machine with one dominant motion rhythm. | Small farm unit; direction; health and last-hit opportunity. |
| Breaker | A broad, deliberate convoy engine with a visibly heavier front and charge component. | High siege value; escort target; any committed base-shot charge. |
| Sentry | A planted pressure launcher with a clean directional aperture and stable warning origin. | Defensive threat, locked shot line, destruction progress. |
| Reactor | A large, legible pressure core with clearly different protected, exposed and defeated shapes. | Primary victory objective, team ownership, vulnerability. |
| Keeper and siege cell | A neutral maintenance automaton with radial construction; the cell is a compact, hard-edged insert visibly associated with convoy machinery. | Neutral threat, safe space, loose collectible and reinforcement reward. |
| Scrap and mods | Small useful components, large purchase-category symbols and concise feedback. | Currency, pickup eligibility, price, purchased tier and effect category. |

Keep the current player-facing names unless a separately documented naming change is justified. “Farming” remains defeating NPCs and collecting rewards in this MOBA; scenery must not advertise a crop-growing mechanic. The neutral objective, a bridge or any other prop can be replaced without abandoning this world.

## Character and material language

Use bold, asymmetrical silhouettes with broad readable masses, dark structural outlines and two or three main interior value groups. The result should work as a clean drawing before texture is added. Prefer flexible fabric, glazed ceramic protection, bent timber ribs and occasional exposed metal fasteners. Show useful joints and spring mechanisms. Specular highlights are sparse and broad. Dense rust, grime and tiny sci-fi paneling are outside the direction.

The two existing kits are the first proof:

- **Arc Runner:** narrow forward-leaning torso, long springy legs and a forward tool silhouette. A short fabric vane or rigid fin may emphasize direction, but cannot masquerade as a hittable body part. Running feels elastic; a reversal visibly compresses before the new stride without delaying the input.
- **Kiln Warden:** wide low stance, a large protective forearm/shoulder mass and clearly separated feet. A braced rib or folding shield structure communicates protection. The Warden moves with stored spring force rather than sluggish animation. Its existing movement speed and timing remain unchanged.

Both must be recognizable as solid black shapes at actual gameplay size, facing either direction. Team colors sit in consistent bands or crest locations and cannot erase the kit's primary feature. Distinct body builds, faces and personalities can enrich the roster later; tiny facial detail is never the primary in-match identity. Avoid borrowing a known character's signature weapon, costume arrangement, face or silhouette.

Concept sheets should show neutral pose, run, rise, fall, dash, aerial commitment, recovery and both team treatments at game scale. Every sheet includes the real collision body and a labeled decorative-overhang layer. Large portraits may add detail, but the small sprite determines the design.

## Environment and composition

The arena's **playable layer** uses clean contours, clear platform tops and simple supporting forms. Near scenery frames the route without covering pilot silhouettes, warning shapes or pickups. Distant terraces, fabric roofs, wind vanes and planted slopes use quieter contrast and slower motion. Long diagonal shapes suggest circulation and speed; stable horizontal surfaces preserve landing readability.

Use the current map geometry as the test fixture. A visual replacement may change materials, supporting structures and distant scenery; it cannot quietly move a collision edge, hide a traversable deck or imply a wall. Any actual geometry change follows the gameplay update process. Both crews receive equivalent readability of ledges, their defenses and escape routes.

At a glance, the ground lane should read as the convoy route and the upper neutral deck as a valuable detour. The enemy reactor has a stable landmark silhouette even when its details are small. Compose a busy fight first, then add scenery only where it leaves the necessary visual space. Animated flags cannot share a projectile's silhouette, speed or tactical colors.

### Initial palette specification

These are **proposed starting tokens**, not an instruction to recolor the current build immediately. Verify every use against its actual background; a hex value by itself has no accessibility guarantee.

| Token | Starting color | Intended use |
| --- | --- | --- |
| Structural ink | `#18263D` | Outlines, type on light panels, deep shadow anchors. |
| Warm paper | `#F5E6C8` | Interface surfaces, fabric light, bright neutral body areas. |
| Clay | `#CB886A` | Quiet architecture and ceramic midtones. |
| Leaf | `#81977C` | Distant planting and low-priority scenery. |
| Sky | `#ABC8D1` | Open background, separated from actor outlines. |
| Crew A cobalt | `#3155C6` | A consistent team band, projectile accent and crest fill. |
| Crew B raspberry | `#B52F65` | Equivalent team band, projectile accent and crest fill. |
| Reward saffron | `#E8AE35` | Collectibles and purchase availability, paired with a component icon. |
| Warning light | `#FFF3D6` with structural-ink edge | Danger boundaries and high-priority state cues, with pattern and shape. |

Crew identity also has a persistent distinct crest and label. Do not rely on cobalt versus raspberry, red versus green, hue shifting or saturation alone. Decorative accents cannot reuse the exact team-projectile treatment. Protected and exposed reactors change structure/shape as well as color. Shield patterns and warning patterns have different geometry. Palette changes must update this table, implementation tokens, team variants and screenshot checks together.

## Animation and effects

Animation should reveal the physics the player already controls. Use compression, clear lines of action, a strong airborne pose and economical follow-through. Decorative cloth can lag behind; the collision body and attack tell cannot. A dash trail stays behind its moving source. A landing accents contact without making a still-recovering pilot appear ready to act.

The simulation remains at its existing fixed rate. A deliberately stepped illustration style may hold decorative poses, but position, camera and important state cues remain smooth and current. Do not add simulation pauses, hidden input delays, forced camera shake or local hit-stop to make an attack look powerful. Any change to action timing, cancel windows or collision is a gameplay change, even when requested by an animator.

| Priority | Event | Treatment |
| --- | --- | --- |
| 1 | Imminent damage and safe boundary | Clean direction/area contour, visible warning phase and unambiguous resolution. Must survive all other effects. |
| 2 | Pilot and objective state | Clear protection, commitment, exposed core and defeat transitions. Stable silhouettes throughout. |
| 3 | Useful team action and reward | Distinct ally barrier, rally/retreat shapes, farm and cell confirmation. Short, localized effects. |
| 4 | Ordinary attack and traversal | Compact impacts, directional projectiles, brief grounded dust or airflow. Keep a wave readable. |
| 5 | Atmosphere and celebration | Restrained background motion during play. Large celebratory compositions belong after the result is determined. |

Attack interiors may be translucent; the boundary that communicates danger stays clear. Decorative particles can extend beyond the effect, but must look like debris rather than damage. Give larger consequences more emphasis without turning every hit into a screen-filling burst. Test overlapping abilities, both teams' projectiles, a Breaker, a warning and a pickup together. Never judge an effect only against an empty background.

## Interface, audio and accessibility

The interface borrows from a well-made sporting program: clear blocks, crew crests, legible numbers and a few expressive heading shapes. Use ordinary readable type for controls and status; reserve irregular lettering for the logo or a large result heading. Texture stays out of text and small icons. Prices, cooldowns, health, team ownership and the base goal take precedence over fictional terminology. Keep core controls visible at the roadmap's 1280×720 reference size.

Audio combines dry percussion, spring releases, airy pressure and distinct ceramic/wood/metal impacts. A light breakbeat or syncopated instrumental bed can support momentum. Music does not impose a rhythm-game timing mechanic. Reserve identifiable cues for warnings, lost protection, a claimed objective and victory. Layering and volume must let the most important cue win; repeated crawler shots cannot bury a danger tell. Use original or properly licensed recordings and compositions. Specific artists, tracks and melodies are references only when explicitly licensed for use.

For new UI, use a 4.5:1 minimum text contrast target against the actual rendered background, and test inactive but informative text rather than making it vanish. This is a project target informed by [Xbox contrast guidance](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102) and [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); meeting it alone is not a claim of whole-game accessibility compliance.

Each critical cue needs a usable visual form with audio muted. Team, threat and protection must survive grayscale and common color-vision simulations; include shape, label or pattern. Reduced-motion settings remove decorative camera shake, excessive parallax and floating flourish while preserving essential motion and warnings. Avoid full-screen flashes and rapidly alternating high-contrast patterns. Review new animation and effects against the relevant [Xbox accessibility guidance](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines), including additional cue channels, motion and photosensitivity, before production approval. A designer's colorblindness simulation does not replace testing with affected players.

## Placeholder and asset contracts

Placeholder work should establish silhouette, allegiance, action state and collision truth cheaply. Flat polygons, simple sprites and synthesized sound are valid. Label each asset's status; a placeholder is not automatically a style precedent because it shipped first.

| Existing item | Status under this direction | Required treatment now |
| --- | --- | --- |
| `assets/arc-runner.jpg` | Prototype title illustration; outside the new target direction. | May remain while gameplay is validated. Do not use as the model for new character design. |
| `assets/kiln-yard.jpg` | Prototype background; outside the new target direction. | May remain. Its replacement must pass route and combat readability tests. |
| Canvas pilots, structures and effects | Functional readability prototypes. | Preserve verified states and geometry; evaluate their appearance against this document before an art pass. |
| Synth sound cues | Functional audio prototypes. | Preserve useful timing cues; assess layering and tonal identity during the audio pass. |

The existing generated assets retain their current provenance in [THIRD_PARTY.md](../THIRD_PARTY.md). External reference images are not licensed game assets merely because they are public. Prefer links for research. Record source, license, modifications and distribution obligations before importing anything. For commissioned or generated work, retain its author/tool, date, brief, source file and usage terms. Do not ask an artist or image tool to copy a living artist or another game's signature look; describe this document's concrete visual properties.

Every production asset handoff includes: stable asset ID; gameplay purpose; status (`placeholder`, `experiment`, `approved`, `retired`); editable source path; export path/format/size; pivot and game-scale bounds; frame/state mapping if animated; team mask/variants; owner; provenance; screenshot or clip at game scale; and the build/check that accepted it. Add an asset record table to this document when the first new-direction asset lands. Split it into a linked registry only when the list becomes difficult to maintain; do not create parallel competing style bibles.

Use a small shared material and shape kit before bespoke illustration. Build a single prototype encounter from one reusable platform module, two kit silhouettes, existing NPC/objective types and their critical cues. Runtime export budgets are measured against the existing browser performance gates, not justified by a concept image. Downscale and simplify before adding shaders, particles or large texture atlases.

## Production sequence and acceptance

| Stage | Deliverable | Exit decision |
| --- | --- | --- |
| Now: foundations | This direction and its evidence; functional placeholders continue. | Agents can make consistent decisions without reinterpreting the current placeholder art. No gameplay milestone waits for polish. |
| Direction spike | Three small composition variants within Brightwork, two kit silhouettes, a palette/value sheet and one short motion test on the existing map. No new content. | Choose the strongest variant using the readability and audience checks below. Reject confusing genre signals before finishing art. |
| Playable visual slice | Replace one encounter's graphics, including both teams and the farm-to-sentry-to-reactor information. Compare the same replay with the baseline. | Keep it only if recognition, movement feel and browser performance hold. Record contrary feedback. |
| Friends beta pass | Apply the proven vocabulary consistently across the two kits and one map. Fix misleading tells, missing states and unreadable UI first. | Meet the applicable release gates. Decorative scenery, bespoke music and extra portraits remain cuttable. |

The following are **proposed acceptance tests**, not measured results or statistical proof of market fit:

| Question | Procedure | Decision threshold / artifact |
| --- | --- | --- |
| Does the pitch attract the intended player without promising the wrong game? | Show three equally finished, randomly ordered concepts plus the same ten-second combat clip to six target players. Ask what they expect to do before explaining the design. Record background and preference. | At least 5/6 identify competitive team action; fewer than two expect a peaceful building game as the main loop. Record preferences and reasons rather than declaring a market winner. |
| Can both kits and crews be read? | At actual size, show black silhouettes, then both team versions in a crowded replay. Include facing reversal and overlap. | At least 5/6 identify each kit and its crew in the sampled situations without a facilitator cue. Fix the primary shape before adding detail. |
| Can a player recognize the MOBA loop? | Ask first-time pilots to point to a farm unit, an ally, a siege unit, the neutral reward and the enemy win objective during a real match. | At least 5/6 identify the five roles. Record errors separately; an attractive portrait cannot compensate for a missed reactor. |
| Are important effects truthful? | Overlay collision/attack geometry and examine warning start, active hit and recovery on the same recorded ticks. Check both teams and mirrored positions. | No misleading damage boundary, fake vulnerability state or delayed authoritative cue. Save before/after frames and any deliberate non-damaging particle extension. |
| Is movement still satisfying? | Run an empty-map lap and then a fight with baseline and revised presentation, in alternating order. Ask where intended movement differed from perceived movement. | No regression in input-to-motion/performance budgets; no animation suggesting an unavailable cancel. Human preference remains an observation, with count and conditions. |
| Does it remain readable with constraints? | Inspect 1280×720, grayscale, color-vision simulations, muted audio and reduced motion; include the busiest recorded wave. Measure UI contrast. | All critical states retain a non-color visual cue; core controls fit; the stated text target is met; no new essential cue disappears with sound or flourish disabled. |
| Can it ship within the project? | Run the existing browser/performance checks; inspect all delivered asset records and licenses. | No new release-budget failure, missing provenance, missing animation state or unowned temporary exception. |

An art pass passes only its applicable tests. It cannot mark the roadmap's human fun, network, reliability or beta gates complete. A failed style experiment should usually change composition, silhouette or cue design before it changes a working mechanic.

## Updating the direction

The change author owns implementation and documentation together. The project owner remains the artistic decision owner. After the owner approves this proposal, agents can make routine choices within the approved contract without asking for a separate approval. Until then, current in-game direction stays in place. A substantial direction revision needs a recorded decision and evidence, not an undocumented image swap.

| Change | Update here | Also update |
| --- | --- | --- |
| World promise, audience, primary style or character identity | Direction decision, principles and decision log. Recheck relevant market evidence. | Playtest hypotheses and roadmap scope when affected. |
| Palette, silhouette, animation, effect, UI or audio vocabulary | Relevant discipline rule, proposed tokens and applicable acceptance test. | Asset record, player guidance for changed cues, verification evidence. |
| Visual change affects collision, timing, targeting or information availability | Describe presentation intent only; let gameplay own the actual rule. | Game rules, simulation/protocol/replay checks and roadmap as required by the update matrix. |
| New/replaced asset or external material | Asset status/provenance pointer and any temporary exception. | Third-party notices and source/export records. |
| Human feedback, performance failure or new market evidence | Link a dated observation; state keep/change/cut and its trigger. | Playtest guide and the relevant roadmap gate. |

In a change description cite the relevant DA IDs, the assets/states touched, the checks performed and the remaining hypothesis. Before handoff search for stale colors, old cue descriptions, renamed assets and conflicting guidance. Run `npm run check:docs`. Update current rules in place; Git preserves old versions. Keep observation logs separate from normative rules.

### Decision log

| Date / decision | Evidence and rationale | Revisit trigger |
| --- | --- | --- |
| 2026-11-03 · AD-001 · Propose Brightwork for owner review. Approval pending; current in-game direction stays in place. | Bounded primary-source scan shows adjacent interest in optimistic future worlds and strong neighboring stylish-competition identities. A sunlit handmade civic derby offers a coherent differentiation experiment and fits two kits/one map. Competitive demand for this exact combination is unproven. | Owner edits or rejects the proposal; later, target players infer the wrong genre, fail readability tests, prefer an equally finished alternative for concrete reasons, or new competitor evidence changes the thesis. |

Open questions for the first direction spike: Do players find ceramic/cloth machinery powerful enough? Does the sport framing preserve the satisfaction of destroying a base? Can the silhouette pair carry personality at the actual small scale? Does the warm world improve invitation without weakening danger recognition? Those questions must be answered with the playable game, not only a mood board.
