# P00 — GM expansion contract

Authority: INSTRUCTION2.md (15 October 2026), superseding INSTRUCTION.md wherever they differ. The old browser simulator is retained at `/simulator.html` for reference; it is not the v3 room engine.

## Resolved rules

Exactly eight player seats, two editable squads of four, plus Thái Bảo as a separate GM. Cooperative is the default. Intrigue requires an explicitly certified pack and six Loyal Crew, one Saboteur and one Independent Broker, shuffled independently of public roles. A private cooperation preference overrides the lobby's requested intrigue mode. All participants continue playing through Watch and accusation.

Supplies 6/12, Integrity 5/6, Alarm 0/6. Alarm six marks permanent urgency only after a complete effect stage; it never skips the storm. Integrity zero immediately opens a common salvage decision and disables remaining intrigue stages. Mission, security and agenda results are distinct.

Inputs remain editable until closure. Ready applies no effects. GM closure requires eight Ready; a server deadline uses abstain, Skip, Shield or Stay Hidden defaults. Ordinary plurality ties open a twenty second decision for the rotating seat, then use displayed option order. Watch/accusation require five votes. Deals, storm rounds, W2 and security are separate committed stages. Public purchases use group votes; Engineer consent and Effort are included in accepted selections. Guardians submit responses for ten seconds, then rotating priority selects one per loss.

Interpretations: Engineer repair consent is selected alongside the shared repair vote. Shield purchases use a preparation ballot before each storm round, covering each squad once, with a single discount per purchase. The first eligible voucher purchase uses its discount before Engineer. The final accusation and Theft share one input object/deadline. An all-abstaining bridge submission counts as one bounded incorrect attempt. Discussion timers can finish naturally or be advanced by the GM; unfamiliar family practice and initial reading are untimed. Complications remain disabled. Alternative approaches use the declared choices; arbitrary mechanical GM rulings are deferred.

## State machine

`lobby → reading/practice → selection → [tie] → consequences → next reading`

Allocation: `reading → shield ballot → [tie] → actions → guardian response → consequences`; repeat three rounds. W1 follows rest, then Watch nomination and optional paid confirmation. W2 follows round two's complete ordinary effects. Finale: `discussion (90 seconds) → chest ballot → accusation + Theft → ended`. Zero Integrity: `salvage selection → ended`. Save/restart restores any unresolved room paused. Disconnect detection pauses once per stage after ten seconds; GM may continue with defaults. No roster substitution during play.

## Screens and information permissions

| Surface | Permitted information and controls |
| --- | --- |
| TV `/tv` | Public narration, resources, published choices, shared evidence, neutral private-window summaries, traces, finalized outcomes. Read only. No player Ready timing during private stages. |
| Phone `/play` | Public projection plus only that seat's agenda, immutable cards, resources, acknowledged input and private explanation. Reconnect token authorizes ownership. |
| GM `/gm` | Public narration preview; answer key, private state and timeline in a visibly separate panel; start/read/resolve/pause/extend, lobby editing, invitations, token replacement, pack import, backup. No player commands. |
| Join | A per-seat invitation can issue one credential; names never reclaim seats. Reassignment rotates credentials and invalidates the old invitation. |

All views are constructed by the server. Content files, database, answers, tokens, future branches and raw snapshots are never static client assets. Authenticated evidence is copied exactly from canonical content. Claims have separate author/type labels. No one edits authenticated text.

## Persistence and content

SQLite transaction stores members, sessions, participants, private state, scene instances, accepted commands, resolved events, outcomes and snapshots. Command IDs are unique per session, bind actor/payload/instance, and replay their original acknowledgement. Stage keys prevent duplicate resolution. State, random rolls, trace groups and command result commit together before HTTP acknowledgement. Startup reloads the pinned pack digest and pauses unresolved phases. Backups contain SQLite and all installed pack versions. Ended-session flags and journal remain available for the next mission; resources reset.

JSON packs contain id/version/schemaVersion/engineRange/language/assets, mission entry/modes/roster/resources/endings, scenes, immutable evidence, options, typed conditions/effects, and intrigue certification. Only local allowlisted asset paths and bounded acyclic scene graphs are accepted. Conditions are resource comparisons or flag equality; effects are resource deltas, flags or risk tests. No evaluated code, SQL, remote fetch or executable pack data. Install validates before transaction. Saves pin id/version/SHA-256; existing versions cannot be overwritten. Second pack uses the same families without engine edits.

## Specification to acceptance

| Sections / stage | Evidence |
| --- | --- |
| 1–3 / P00 | Separate GM authorization, eight-seat roster, editable 4+4 squads, contract and screen inventory |
| 9–10 / P02 | Ferry callbacks, unique bridge at weight 6/7, two failed attempts, costs, negotiation, repair, three allocation rounds, urgency and salvage |
| 6–8 / P04 | Six/one/one, bounded W1/W2, missing input, deals/roles, four-seat traces with ≥2 intersection, Watch costs, chest, five vote threshold, Theft truth table |
| 15 / P03 | Strict validation, immutable versions/digests, second JSON mission installed without engine change |
| 16–17 / P01 | Separate HTTP clients, no secret fields in public/other seat payloads, actor authorization, retries, atomic recovery, pinned random outcomes, token invalidation, backup |
| 18 / P06+ | Automated browser/API simulations are distinct from eight real phones, TV distance, group enjoyment and balance; these require actual group testing |

No material rules contradiction blocks P00–P04. Later families, seeded variants, arbitrary rulings, campaign authoring and actual device acceptance remain separate milestones. This contract specifies intended behavior; implementation evidence is reported in README and tests.
