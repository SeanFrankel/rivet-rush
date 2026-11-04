# Characters and matchup decisions

Rivet Rush has six original kits with **four active abilities each**, in addition to their basic attack, shared dash and double jump. Three fight with melee basic attacks and three with ranged basic attacks. These are playable starting designs, not a claim of human-tested balance or fun. Keep the current placeholder assets while testing them; the [art proposal](art-direction.md) still needs owner approval.

The [game rules](gameplay.md) own the shared movement, farming, objective and reactor rules. [heroes.js](../heroes.js) owns character numbers and ability definitions; [abilities.js](../abilities.js) executes them alongside [match.js](../match.js). Change this guide when a kit's purpose, controls, timings or counterplay changes. Follow the [update matrix](updating.md) for player prompts, protocol/replay changes and verification.

## Shared controls and combat contract

Use **Q, E, R and F** for the four abilities below. K and right-click also activate Q. F is the longer-cooldown ultimate. Shift remains the shared dash; C operates the bridge. Basic attacks are separate from all four abilities. Ability bursts do not consume the shared dash, but another ability cannot normally start during a burst. An active Recall Anchor can be recalled during its window.

Cooldowns below are base seconds. The basic Coils upgrade reduces ability cooldowns and adds a damage bonus; a volley, repeated field or multi-explosion cast shares that damage bonus across its damaging instances. A missed ability still spends its cooldown. There is no mana or ultimate-charge system. Short ultimate cooldowns encourage repeated decisions during a match; they are tuning hypotheses for this small-map prototype.

Forward placements and movement use the direction the pilot faces. Shots use aim when supplied, otherwise a nearby forward enemy. Delayed area attacks mark a fixed position at the caster's current height; jumping before casting can contest a different deck. Delayed projectiles keep their chosen angle and launch from the pilot's position when released. Most mobility skills grant **no immunity**: the exception is Echo's brief ultimate projectile evasion, which still leaves melee and area attacks effective.

Melee basic attacks cleave a short forward arc instead of spawning bullets. Ranged basic attacks trade melee cleave and close damage for safer spacing. Waves intercept ordinary shots and hooks; piercing skills explicitly say when they can hit a second enemy. Structures cannot be displaced, and shared objective protection still applies to ability damage. Heals and barriers support mobile allies rather than repairing a reactor.

| Pilot | Basic attack | Starting health | Primary decision |
| --- | --- | --- | --- |
| Arc Runner | Ranged, 248 range | 150 | Spend a lift for pursuit or preserve it for the next route? |
| Kiln Warden | Melee, 78 range | 190 | Commit a charge or keep a barrier beside the wave and partner? |
| Vesper Rail | Ranged, 310 range | 135 | Keep a safe angle or get close enough to land several bolts? |
| Magnet Rook | Melee, 68 range | 205 | Pull and pursue, or shove a diver away from the objective? |
| Fuse Scrapjack | Ranged, 235 range | 155 | Farm the current wave or reserve a charge for its next collision? |
| Echo Vandal | Melee, 84 range | 145 | Continue the flank or return before the anchor becomes a trap? |

## Arc Runner: aerial skirmisher

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Arc Pulse / Pile Driver | 4 | Ground pulse; in the air, wind up and commit to the existing diving landing attack. |
| E | Vault Kick | 6 | Deal 16 nearby damage, launch enemies and spring upward. |
| R | Return Fire | 7 | Fire three 8-damage bolts and hop backward. |
| F | Arc Surge | 18 | Gain a 22-point personal barrier, refresh the shared dash, fire three 14-damage bolts and surge forward for 20 contact damage. |

**Play pattern:** farm at medium range, use E to contest a platform or launch a rival, then choose between a Q landing commitment and retreating with R. F opens a pursuit window without spending the refreshed shared dash. It is dangerous to spend E, R and F on one chase when the enemy wave is approaching your objective.

**Opponent's answer:** change height around the surge, leave the landing warning and punish the committed landing. The forward surge does not evade projectiles. A wave can absorb the bolts.

**Crew contribution:** follow Rook's catch or create a landing opening for Fuse. Judge success by whether vertical pursuit helps win a wave or objective, not just by airborne damage.

## Kiln Warden: melee vanguard

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Rally / Bastion Drop | 6 | Existing nearby strike and crew barrier; airborne casting becomes a protective landing attack. |
| E | Bulwark Charge | 8 | Gain a 24-point barrier and charge forward, dealing 18 contact damage and shoving enemies. |
| R | Crew Rally | 11 | Within 165 range, heal mobile allies for 18, grant a 16-point barrier and remove 0.75 seconds from allied pilots' dash recovery. |
| F | Hold the Line | 22 | Grant a nearby 28-point barrier, then hold a four-second field that pulses 8 healing and 12-point barriers and slows enemies inside. |

**Play pattern:** use melee cleave to escort a crawler wave. E can close the gap or displace a threat from a partner. R is strongest when a hurt teammate is close enough to receive both protection and dash recovery. F commits to a location: deploy it where the coming fight matters rather than chasing damage outside it.

**Opponent's answer:** jump the charge, separate the crew or switch elevation while the rally field expires. Barriers refresh rather than stack without limit. Warden has reach costs and cannot protect both routes at once.

**Crew contribution:** create a safe firing position for Vesper or a stable wave collision for Fuse. Test whether the partner actually uses the protected space; a high shield total alone does not demonstrate engaging support play.

## Vesper Rail: airborne marksman

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Needle Fan | 5 | Three 11-damage needles in a narrow spread. |
| E | Recoil Vault | 7 | Fire a 16-damage parting shot and vault backward and upward. |
| R | Rail Lance | 8 | After 0.30 seconds, fire a 32-damage lance up to 520 range, piercing one enemy into a second. |
| F | Crosswind Barrage | 20 | Fire seven spreading 10-damage bolts while recoiling upward and backward. |

**Play pattern:** use range and platform changes to farm while preserving E against a dive. A close Q or F can land multiple bolts, but entering that range risks the roster's lowest starting health. R rewards lining up a wave and pilot; its locked angle also lets an opponent evade during the windup.

**Opponent's answer:** approach through a different elevation, threaten the recoil landing and use the wave against ordinary volleys. One crawler is insufficient cover against R. Vesper's vault is movement, not damage immunity.

**Crew contribution:** exploit Warden's protected ground or Rook's displacement. The intended decision is choosing a firing angle, not remaining on one safe platform indefinitely.

## Magnet Rook: melee disruptor

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Magnet Hook | 6.5 | Send a 285-range, 18-damage hook that pulls the first enemy toward Rook. |
| E | Piston Uppercut | 7 | Deal 20 close damage, launch the target and spring upward after it. |
| R | Repulsor | 8 | After a 0.12-second warning, deal 15 nearby damage and strongly shove enemies away. |
| F | Gravity Well | 22 | Mark a field ahead; after 0.45 seconds it pulses damage, inward force and slow for 2.4 seconds. Each base damage pulse deals 7. |

**Play pattern:** threaten Q from beside the wave rather than through your opponent's crawler screen. After a catch, choose E and melee pursuit or R to peel a partner. F changes where a fight happens; it does not immobilize everyone inside.

**Opponent's answer:** intercept the hook with a crawler, dodge vertically, or save a dash for a gap between field pulses. Rook has the slowest run speed and shortest basic range, so a missed hook gives a real spacing opportunity.

**Crew contribution:** pull a rival into Fuse's prepared area or away from Vesper. Avoid automatically using Repulsor after a successful hook: shoving the target to safety is a possible mistake and a meaningful choice.

## Fuse Scrapjack: ranged trap engineer

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Scrap Bomb | 5 | Mark a 70-radius blast 160 ahead at current height; after 0.38 seconds deal 28 damage. |
| E | Rocket Hop | 7 | Deal 12 damage in a small blast behind Fuse and launch upward. |
| R | Trip Charge | 9 | Place a charge 100 ahead. After 0.6 seconds it arms for five seconds, exploding once for 32 damage when an enemy enters. |
| F | Demolition Run | 20 | Mark three advancing 25-damage explosions, 70/170/270 ahead, firing after 0.35/0.55/0.75 seconds. |

**Play pattern:** predict wave collisions and landings. Jump before Q to threaten an upper deck; place R before an objective fight rather than as an instant reaction. E trades escape availability for a better bombing angle. F can force enemies off a lane long enough for a wave to advance.

**Opponent's answer:** read the warnings, switch height or let a crawler trigger R. Charges do not chase opponents, and an abandoned route wastes their cooldown. A charge is a triggered area, not a separately targetable turret or pet.

**Crew contribution:** follow a Rook catch or protect the edge of Warden's rally ground. Check that opponents can identify a safe response rather than merely taking unavoidable overlapping damage.

## Echo Vandal: melee flank duelist

| Key | Ability | Cooldown | Behavior |
| --- | --- | --- | --- |
| Q | Echo Blade | 5 | Throw a 250-range, 22-damage blade through up to two enemies. |
| E | Recall Anchor | 11 | Leave a return point for seven seconds. Recast within 420 distance to return; the recast bypasses E's cooldown. |
| R | Shear Step | 7 | Cross forward briefly for 24 contact damage, without projectile evasion. |
| F | Afterimage Crosscut | 20 | Make a brief projectile-evasive crossing for 18 contact damage; leave two warned 20-damage cuts along the route. |

**Play pattern:** set E on a useful escape route, soften a wave with Q, then cross into melee with R. Choose whether to continue attacking or return while the anchor remains reachable. F is a brief crossing and delayed follow-up threat, not sustained invulnerability.

**Opponent's answer:** watch or occupy the return point, force Echo beyond the leash, or hold an area attack for the crossing. Jump away from the warned afterimage cuts. Returning restores neither health nor spent cooldowns; the initial E cast starts its cooldown even if no return occurs.

**Crew contribution:** threaten a backline pilot while the partner pushes. The anchor should support a readable flank with a punishable exit; it should not make every trade consequence-free.

## Human playtest gate

Use the session and evidence format in [playtesting](playtesting.md). Record the build, both crews, kits, familiarity and short clips of the relevant decisions. Start with mirrored players swapping sides and kits, then test mixed pairs. Automated checks establish execution and reachability; they cannot establish that these characters are enjoyable or balanced.

1. With each kit, cross both routes, clear a wave, collect farm, make a basic upgrade, contest the neutral objective and help expose and destroy the opposing reactor. Do not judge the roster from isolated duels alone.
2. Try each ability while grounded and airborne, then deliberately miss it. Record whether the failed commitment gives the opponent a useful response and whether the control does what the player expected.
3. Play Warden/Vesper against Rook/Fuse, then swap. Test whether barriers, displacement and delayed threats change positioning instead of producing an unreadable stack of effects.
4. Play Runner/Echo against a ranged pair, then swap. Record approaches, escape routes, landing punishments and whether melee can reach a meaningful fight without making ranged spacing irrelevant.
5. Ask both sides to describe one satisfying decision and one frustrating or unclear event. If they cannot identify how to answer a signature move, improve its timing or readability before adding mechanics.

Working hypotheses: every kit offers a movement decision tied to farming or objectives; melee and ranged create different spacing problems; each signature has an observable answer; teammates can capitalize on one another without a compulsory composition. Revise or remove a skill if repeated sessions show it duplicates another button, encourages ignoring the MOBA loop, or adds complexity without a useful decision. Balance numbers here are starting values and need sessions with people.

## Change and verification checklist

For a kit change, update [heroes.js](../heroes.js), this guide and affected [game rules](gameplay.md), controls/prompts and [verification](verification.md) in the same change. Changes to action execution also belong in [abilities.js](../abilities.js) or [match.js](../match.js), with the protocol/replay compatibility updates required by the handbook. Keep definition contracts in [heroes.test.js](../tests/heroes.test.js) and actual combat contracts in [abilities.test.js](../tests/abilities.test.js): distinct melee/ranged attacks, cooldowns, prediction agreement, damage ownership, warning windows, teammate support and return-anchor limits. Preserve the broader combat tests for objective protection and team symmetry. Run the repository verification gates and report which still need human sessions.
