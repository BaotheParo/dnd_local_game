# Review contract — 15 October 2026

Historical v2 simulator review. The v3 LAN room follows [P00-GM-expansion.md](P00-GM-expansion.md) and INSTRUCTION2.md instead. This file does not describe the new server.

Source of truth: `INSTRUCTION.md`, version 2.0. This pass prioritizes the requested art direction, readable interfaces, and verified corrections to the existing browser prototype. It does not claim to complete the LAN release milestones.

## Rules contract

- Three through nine players, including the host; two squads below six players, otherwise three. Squad sizes follow section 11.
- Supplies 0–12, Integrity 0–6, Alarm 0–6. Evacuation takes priority over urgent Alarm.
- Input remains editable during selection. Manual resolution requires all seats Ready; expiration uses the accepted input or published default. Closed inputs cannot mutate a result.
- Shield defaults to the player's squad. Global thresholds are `ceil(N / 3)`. Family aboard adds one Shield requirement to the last squad in storm round two.
- Storm order: losses, Guardian reactions, Integrity, evacuation check, Supply, Alarm for losses, Repel, emergency check. Repel applies once. Fewer than two power rounds adds two Alarm after round three, followed immediately by an emergency check.
- Scout only opens the first hint free. Engineer discounts must have an actual affordable effect before consuming an ability. The NPC discount applies to the first storm shield only.
- Risk uses d20 plus up to four available, distinct, consenting Effort contributions, selected by rotating seat order.

## Phase contract

Current prototype: `title → lobby → selection → consequences → next selection → ending`, with a ten-second `guardian_reaction` between storm selection and consequences. Pause freezes input and time. Recovered timed phases resume paused. `reading` and an explicit discussion/commitment split remain release work; do not claim the current timer meets section 5.

## Content contract

Existing TypeScript `ContentPack` contains identity/version, player range, initial resources, entry scene, scenes, options, clues, puzzle hints, predictions, and storm configuration. It currently embeds executable conditions and shares author data with clients. A safe import schema with allowlisted conditions/effects, digests, version pinning, and validation is still required. Mission two is a prototype, not evidence that engine/story separation is complete.

## Screen inventory and art direction

- Title: original illustrated forest and rescue caravan, lantern identity, clear start/continue, concise play description, mission preview, how-to-play dialog.
- Shared screen: same illustrated world, visible resource meters and route progress, readable narrative, hidden simultaneous assignments until reveal.
- Controller: comfortably tappable actions, distinct private clues, clear paused/closed state, consistent forest/bronze palette.
- Operating view: pause, time extension, resolution readiness, roster controls restricted to lobby, and honest prototype status.
- Simulator: explicitly labeled local testing; never presented as secure player authentication.

Palette: deep pine, desaturated teal mist, warm parchment, aged brass, amber lantern light. Art is decorative; no clue solution is encoded in it. Assets and fonts must load locally.

## Acceptance mapping

| Specification                                             | This pass                              | Evidence/remaining work                                                              |
| --------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| 3, 13, 25 original art and readable UI                    | Implement                              | Local generated art, responsive review, asset provenance                             |
| 6, 11 resource and storm rules                            | Correct                                | Meaningful regression checks for order, thresholds, repeated resolution, emergencies |
| 4, 7 squads and personal resources                        | Correct selected defects               | Verify all roster sizes and eligible Effort; voting arbitration remains incomplete   |
| 5, 7 no late input or repeated effects                    | Guard prototype mutations              | Phase/readiness/paused checks; no server security claim                              |
| 13, 15 local assets                                       | Remove runtime CDN font requests       | Local font files or system fallback; built bundle inspection                         |
| P01, P04 authoritative LAN, SQLite, permissions/reconnect | Review only                            | Requires a server implementation and multi-device testing                            |
| P03 first mission                                         | Review and correct progression defects | Full authored branch coverage still required                                         |
| P05 content packs                                         | Review only                            | Mission-specific engine branches and importer remain outstanding                     |
| P06 group validation                                      | Not measured                           | Actual room, TV viewing distance, and phones require human testing                   |

## Assumptions

The user explicitly prioritizes visual improvements to this existing game. Preserve the custom rescue adventure and existing local simulator. Make bounded rules fixes now and document larger architectural gaps rather than replacing the entire application during an art/design pass. No external publication or live AI gameplay is authorized or needed.
