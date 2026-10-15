# The Mistbound Caravan

A laptop-hosted fantasy adventure for **one GM and eight players**, with two squads of four, a separate public TV, and private phone controllers. Implements the v3 GM expansion in [INSTRUCTION2.md](INSTRUCTION2.md). The earlier browser simulator remains available separately with its older rules.

The v3 implementation includes an authoritative LAN server, SQLite transactions, secure seat reconnection, server-owned deadlines, two complete JSON missions, cooperative play, and the first mission's bounded intrigue. Automated acceptance passes; actual phones, TV viewing distance, group enjoyment and balance still need a playtest.

## Launch

Use Node.js 24 (verified with 24.11.0) and the installed npm dependencies. No cloud account, hosting, AI key, or Internet connection is needed during installed gameplay.

```powershell
npm.cmd ci
npm.cmd run dev
```

`npm ci` needs Internet only if dependencies are not already installed. Skip it in this existing checkout. The server prints a **private GM link**, the public TV URL, and available LAN addresses. Open the private GM link on the laptop. Open `http://localhost:3000/tv` in a separate window on the TV, rather than mirroring the GM screen.

1. In the GM lobby, edit names, roles and squads if needed. Save the roster with four players in each squad. Thái Bảo is the separate default GM and never receives a player seat or vote.
2. Select each player's seat under Phone invitations. Choose the laptop address on the same network as the phones; a VPN or virtual adapter may also appear in the list. Have each player scan only their own QR invitation. Do not put `localhost` in a phone invitation.
3. Players may choose their public role and privately express a relationship preference. Any cooperation request overrides a requested intrigue journey; the preference owners are never shown to the GM or TV. Start cooperatively for the first session.
4. Once all eight seats have joined, depart. Read the scene and take a one-minute practice for an unfamiliar family; the GM then starts choices. Players select and mark Ready. Resolve with all eight Ready or wait for the server deadline and its printed defaults. Continue after the consequence.
5. During the storm, vote on any shield purchase before all eight normal actions. In intrigue, the two private arrangements have their own deadlines. No private arrangement replaces a normal storm action.

For installed play without development middleware:

```powershell
npm.cmd run build
npm.cmd start
```

Both commands serve the real room on port 3000. `npm run preview` is only Vite's static preview and does not run the room API. Stop an existing server before starting another on that port. `PORT` and `MISTBOUND_DATA` can select another port and data directory. Restart `npm run dev` after server code changes; browser updates can be loaded by refreshing.

## What is playable

- **The Last Lantern Delivery:** three ferry choices; eight authentic bridge facts; a unique answer at weight six or seven; bounded wrong answers and hints; repair/detour/DC 13 crossing; Ilya's bell bargain; discounted rest repair; three coordinated storm rounds; normal, urgent, or evacuation/salvage endings.
- **Intrigue on that mission:** six Loyal Crew, one Saboteur, one Independent Broker; two bounded Plots and resource-costing deals; immutable evidence and separately labeled claims; four-seat access traces leaving at least two candidates; optional five-vote Watch and paid confirmation; optional chest protection; final accusation and Theft under one deadline. Mission, security and each agenda resolve separately. A wrong accusation alone never steals the seal.
- **The Ferry Medicine Exchange:** a second complete cooperative JSON pack with three medicine offers trading money, the bell, or a return obligation, eight offer constraints, route deduction and a storm delivery. It uses the same engine without code changes. It is an original small second pack, not a claim that the future Silent Market scenario brief is finished.

Alarm reaching six after a complete effect stage makes urgency permanent; it does not skip scenes. Integrity zero stops ordinary effects immediately, opens salvage for all eight, disables later Plots and Theft, and fails delivery-dependent goals. Ready alone never applies effects.

## Recovery and backup

The database and GM credential live in `.cache/mistbound-v3/` by default. Each acknowledged command, selection, random roll, agenda, trace, effect and snapshot is persisted before its acknowledgement. Retrying an accepted command returns its original response. Commands carry scene, round and stage identity; a delayed action cannot spill into the next storm round.

Refreshing a phone reconnects using its stored device credential. Names cannot reclaim seats. Use **Replace this device** in the GM view to invalidate the old credential and issue a new invitation without changing the seat's agenda, resources or input. A timed phase pauses once after ten seconds of a detected missing phone. The GM can wait or resume using the existing roster and published defaults. If someone leaves permanently, download a backup or end the mission as interrupted; the GM cannot play their role.

Restarting the laptop server restores any unfinished mission paused, including the timer remainder at the last durable checkpoint, accepted choices and pinned content version. Server downtime does not run down that restored timer. Resume in the GM view. Saves never reroll agendas or dice. The GM's **Download private backup** produces a standalone SQLite file containing all installed pack versions, snapshots, commands, private state, outcomes and journal. Keep it private.

To restore: stop the server, preserve the current data directory, place the backup at `.cache/mistbound-v3/room.sqlite` in a **fresh** data directory, and launch using that directory with `MISTBOUND_DATA`. Do not combine a restored database with old `-wal`/`-shm` files. The server generates a new GM link if that directory has no `gm-key`; existing phone reconnect tokens are in the database.

New mission lobbies preserve member IDs and the revealed season journal, reset mission resources, and issue new seat invitations. Old session outcomes and events remain in SQLite.

## Content and implementation

The engine and authored JSON are in [server](server/); the new UI is in [src/lan](src/lan/). P00 rules, transitions, screen permissions and acceptance mapping are in [P00-GM-expansion.md](docs/P00-GM-expansion.md). The older [review contract](docs/P00-review-contract.md) and [code review](docs/CODE-REVIEW.md) describe only the retained v2 simulator and are superseded for the v3 room.

The GM can import JSON packs up to 1 MB. Validation checks exact schema fields, supported roster/modes, numeric bounds, unique IDs, safe existing local assets, graph references, acyclic continuations, reachable endings, affordable fallback paths, intrigue declarations, and bridge facts/uniqueness. Rules use allowlisted data operations, never evaluated JavaScript or SQL. Versioned content is stored in SQLite and saves pin its SHA-256 digest. An existing version cannot be overwritten with different content. Missing saved versions produce an explicit restore error. ZIP imports, arbitrary assets and migrations are outside this release.

Only server-built projections are sent to the TV and phones. The public bundle contains no authored mission answer key, other players' private cards, seat credentials or server snapshot. The development server restricts source routes too. Local artwork, QR generation and fonts are bundled; asset provenance remains in [ART-DIRECTION.md](docs/ART-DIRECTION.md), with font licenses in `public/licenses/`.

## Validation

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:ui
npm.cmd run test:ui:production
```

- **42 tests:** 27 v3 tests plus 15 retained legacy regressions. The v3 cases cover the rule truth tables, all ferry branches, bridge weights, immutable evidence, role spending, voting/ties/defaults, normal storm actions, urgency, evacuation, private windows/traces, Watch and chest, agenda results, projection permissions, concurrent HTTP seats, idempotent acknowledgements, rejected stale stages, transactional rollback, timer recovery, version pinning, backup, and full missions. Three child processes deliberately exit without closing SQLite to check acknowledged-input, round-resolution and pre-reveal recovery.
- **Browser/API acceptance:** starts its own isolated local server, joins eight independent browser contexts alongside GM and TV, uses real phone UI choices/Ready/sharing, completes cooperative, intrigue and second-pack missions through HTTP, checks phone widths 390/768/1024, blocks server/source access, and checks browser errors and external runtime requests. Requires installed Windows Chrome or `CHROME_PATH`. Artifacts: `output/lan-review/`.
- These are **simulated clients**, not evidence of eight real phones, mobile Safari compatibility, an offline group session or balanced hidden agendas. The next incomplete milestone is **P06: play with the actual group and revise pacing/clarity/balance**; P01 hardware acceptance remains part of that check.

Later investigation, exploration, auctions, assembly, procedural generation (P07), optional complication decks, arbitrary GM mechanical rulings, automatic awards/telemetry, and the remaining season briefs are not implemented. The initial release focuses on P00–P04 plus the small second-pack delivery requirement.

## Legacy simulator

`npm.cmd run dev:simulator` opens `/simulator.html` on port 3001, bound to the laptop only. This explicitly labeled v2 simulator keeps the older three-to-nine-player rules and browser-local state. It is separate from the v3 server, its saves and its security boundary. `npm.cmd run test:simulator-ui` checks that separate running simulator; `SIMULATOR_URL` can override its address. The two `test:ui` scripts always test v3 in development and production respectively.
