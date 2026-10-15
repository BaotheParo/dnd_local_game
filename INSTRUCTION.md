Local Cooperative Adventure Game Design

A cooperative fantasy adventure for up to nine friends

The Mistbound Caravan

Version 2.0 • 14 October 2026

**The proposed game:** a series of cooperative rescue journeys played with phones and a shared TV, hosted entirely on a laptop over a local network. Players share clues, discuss choices, commit actions, and watch the consequences together. Speaking in character is optional.

The main configuration is **nine people in total, including the host**. Everyone controls a character. Three small squads operate one magical rescue caravan through disrupted routes, strange encounters, and coordinated challenges. Each journey finishes within a session, while meaningful decisions carry into a shared season.

This document specifies the intended experience, custom rules, a first playable mission, user interfaces, local operation, persistence, and an expandable content system. It is intended for both the developer building the game and the author creating future adventures.

| **Layer**         | **Purpose**                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| Game              | Meaningful choices, clue sharing, simultaneous actions, and shared outcomes   |
| Local application | LAN rooms, phone controls, TV display, reconnection, saves, and host controls |
| Content system    | Versioned missions, NPCs, locations, hazards, and validated minigame variants |

**Status:** a proposed design ready for implementation. Rules, pacing, balance, and experience targets have not yet been validated with the actual group. This document is not a claim that a playable application has already been built.

## Reading guide

Sections 1–8 define the game. Sections 9–11 describe the first mission, its puzzle, and its final challenge. Sections 12–19 cover progression, interfaces, operation, data, and content production. Sections 20–22 define the first season, delivery milestones, and acceptance criteria. Sections 23–25 explain the source material. Sections 26–27 provide an implementation brief for a development agent.

The mission sections include spoilers and answer keys. Someone who wants to discover the first mission alongside the group should avoid reading those sections and the authoring data. Hiding answers in a host interface cannot remove information already known by the person who wrote the mission.

The title The Mistbound Caravan is a working title. The setting, mission, resource values, and simultaneous challenge rules in this document are original design proposals informed by the supplied references.

# 1 Product decisions and scope

**Build a cooperative, choice-driven fantasy adventure with short coordination minigames and a continuing shared world.** This is a custom game inspired by D&D and tabletop design methods. It does not implement the full D&D ruleset.

| **Topic**     | **Initial decision**                                              |
| ------------- | ----------------------------------------------------------------- |
| Players       | Support 3–9; design primarily for nine people total               |
| Facilitator   | Prepared scenarios run automatically; the host also plays         |
| Roleplaying   | Buttons, ordinary speech, or optional in-character speech         |
| Relationships | Fully cooperative; no traitor or player-versus-player mode        |
| Devices       | One laptop server, its connected TV, and phone browsers           |
| Network       | Direct LAN access; no Internet required during installed gameplay |
| Session       | Approximately 60–90 minutes; save and resume when needed          |
| Failure       | Costs, changed routes, or rescue endings; no session elimination  |

Squads divide communication and tasks, not the story into independent campaigns. All squads remain in the same scene. With nine players use three squads of three. With six to eight use three squads as evenly sized as possible. With three to five use two squads. Roster and squad sizes become fixed for each scene.

## Initial release

Deliver one room, one crew season, one complete mission, three reusable minigame families, and the ability to import another content pack. Include onboarding, TV output, reconnection, save recovery, and content validation.

Defer full character classes, extensive spell lists, complex inventories, continuous open-world play, tactical grids, dynamic fog, voice chat, D&D Beyond or Atlas VTT integration, and live AI storytelling. Evaluate those features later when a specific need justifies their development.

## Changes from the earlier direction document

The previous document compared several possible motifs. This revision selects the rescue caravan as the main product. Fantasy gameshow and investigation become future mission styles within the same world.

The revision adds explicit resolution rules, party-size scaling, season continuity, versioned content packs, and acceptance checks. An automatic scenario engine handles authored possibilities. It does not promise the unrestricted improvisation of a human Dungeon Master.

Do not assign roles by gender. The host receives operating permissions but no additional votes, points, character power, or authority to choose other players' actions.

The older configuration of one DM plus nine players is not the configuration specified here. An optional dedicated facilitator mode would require its own scope, permissions, and playtesting.

# 2 The intended player experience

Every player should have something to discuss, something useful to do, and a result worth watching together. A large rule library or feature list does not create this experience by itself. The experience-first approach in The Art of Game Design and the analysis of teamwork, interaction, and downtime in Characteristics of Games guide this design \[R23, R24\].

## An effective scene

The TV shows a damaged bridge. One player knows the vehicle's weight, another understands the weather, and another knows the passengers' needs. The group discusses repair, a detour, or a risk. Each player contributes information or confirms a task. The shared display shows the caravan moving on and the cost of the decision.

## Design principles

- Every major scene presents a decision with consequences and enough information to reason about it.
- Each person contributes a clue, action, or personal resource. Merely pressing Ready is not sufficient participation.
- Players choose actions simultaneously. Do not play nine long character animations sequentially.
- A solved puzzle produces its stated result. A die roll must not invalidate a correct solution.
- Failure creates a consequence, another scene, or an ending. It does not require unlimited retries.
- Explain one example before starting a new minigame timer.
- Players retain control of their own choices. Advice is welcome; operating everyone else's phone is not a game mechanic.

## Equivalent ways to participate

Players may choose on their phone, explain a decision in ordinary language, or speak in character voluntarily. Do not award extra power for acting skill, confidence, accents, or speaking more often.

Drawing, rhythm, reflex, and performance activities should be optional additions with equivalent participation routes. The first mission does not require them.

A quiet player is not necessarily disengaged. Observe their clue sharing, choices, and ability use, and ask about their opportunity to contribute. Do not infer enjoyment only from how much someone speaks.

## Pacing

Alternate exploration, resource decisions, puzzles, and coordinated hazards. A quieter scene after tension provides room for conversation and recall. The Lazy DM books and The Ultimate RPG Gameplay Guide inform this rhythm \[R11, R13, R18\].

**Initial targets to validate:** onboarding under ten minutes; main scene narration around 60–100 words; usually three meaningful choices; most continuous passive waits under sixty seconds. These are design targets, not measured results. If the group struggles to read or understand a scene, improve the scene before adding effects.

# 3 Setting and narrative tone

**The Mistbound Caravan** transports residents and essential supplies between settlements separated by unstable magical fog. The crew operates a rune-powered rescue vehicle. Each journey has a concrete assignment, destination, and pressure.

## Six shared truths

1\. The mist changes routes and awakens old magical infrastructure.

2\. Settlements depend on small caravans to remain connected.

3\. Magic lives in useful objects: bridges, kitchens, wheels, lamps, and storage systems.

4\. Creatures and people have their own goals; many encounters allow negotiation or avoidance.

5\. Limited resources make whom to help and what to preserve consequential.

6\. The world remembers rescued people, opened routes, and fulfilled promises.

The tone combines curiosity, situational humor, and manageable danger. A sign argues with its readers; a creature collects bells because silence frightens it; a ferry operator insists on correctly labeled supplies. Humor should come from the fictional situation without making a real friend the target of humiliation.

## Build outward from the starting location

Begin with Lantern Depot, three nearby routes, and three factions. Describe distant places in one sentence until a mission actually needs them. This applies inside-out worldbuilding and spiral campaign development \[R19, R20\].

| **Faction**      | **Goal**                                    | **Potential conflict**                              |
| ---------------- | ------------------------------------------- | --------------------------------------------------- |
| Lantern Keepers  | Keep rescue stations functioning            | Allocate supplies to the most vulnerable settlement |
| Rune Wheel Guild | Repair and protect transport infrastructure | Recover machinery before saving cargo               |
| Forest Wardens   | Protect habitats from spreading mist        | Reroute traffic away from damaged living areas      |

Factions provide competing needs, not a simple good-versus-evil selection. Important NPCs have goals, offers, boundaries, and limited knowledge. Their reactions are authored against choices and state flags.

## Players shape the crew

In the lobby, players choose a crew name, emblem, and guiding principle: rescue people first, keep promises, or seek another route. This preference influences presentation; it does not forbid future choices.

At the end of a mission, the group names one memorable event for its journal. Players can optionally select short personal goal cards and replace them between missions. Long backstories are unnecessary.

Proactive roleplaying informs goals that players want to pursue \[R15\]. However, newcomers still receive a clear starting assignment. The game must not become an empty sandbox that expects inexperienced players to invent all of its direction.

# 4 Characters and useful responsibilities

Each player has a display name, avatar, role, and optional goal card. The initial game has no six-attribute character sheet, character levels, or spell catalogue. Roles provide a small, understandable difference between players.

| **Role** | **Once per mission ability**                                                  | **Typical contribution**        |
| -------- | ----------------------------------------------------------------------------- | ------------------------------- |
| Scout    | Open a scene's first hint without adding Alarm                                | Read routes and compare clues   |
| Engineer | Reduce one shield purchase or repair cost by one Supply                       | Understand mechanisms and costs |
| Guardian | Cancel one Integrity loss in their own squad after a round result is revealed | Protect a threatened position   |

Each player receives one role ability use for the entire mission. Unused abilities remain available in later scenes; they refresh at the next mission. Only one ability of the same type may affect a specific event. Different purchases or different losses count as different events.

A transaction can receive at most one unit of discount and must cost at least one Supply. An NPC discount and the Engineer ability do not stack on the same transaction. A shield costing two becomes one; a repair costing three becomes two. Consume an ability only when the server accepts its actual effect.

## A personal resource for every role

Every player also has one **Effort** token per mission. Committing it adds one to a shared risk test. At most four players may contribute to the same test. Commit before the die roll; never after seeing its outcome.

If more than four players offer Effort, use rotating seat priority to select four. Unselected tokens remain available. Do not prioritize faster network responses.

## Squad organization

At nine players, the squads are Pathfinder, Mechanics, and Logistics. A role is not tied to a squad: a Scout can join Mechanics. Suggest a varied composition but allow player choice.

Distribute information to individuals rather than exclusively to a leader. Each private clue has a Share button that publishes the clue to the TV. Do not police whether friends look at one another's screens; the objective is conversation.

## Small personal goals

Examples include rescuing a resident, opening a route, or finishing with at least two Supplies. Acknowledge these in the mission summary without creating a competitive ranking. Allow players to abandon a goal that no longer interests them.

All players retain their own input. A host or confident participant may suggest a plan but cannot force another person's committed action. Dedicated DM play is a possible future mode, not the default.

# 5 Scene flow and pacing

Scenes share a predictable interaction structure while their situations change. The describe–act–resolve rhythm is informed by D&D; simultaneous selection and resolution are custom game rules \[R01, R02, R22\].

| **Phase**       | **Purpose**                             | **Starting pacing**                           |
| --------------- | --------------------------------------- | --------------------------------------------- |
| Introduction    | Show location, objective, and pressure  | 20–40 seconds                                 |
| Private reading | Deliver clues and choices               | 20–40 seconds before timed play               |
| Discussion      | Share information and propose a plan    | 60–120 seconds                                |
| Commitment      | Submit a vote, configuration, or action | 15–30 seconds                                 |
| Resolution      | Freeze input and apply rules once       | Immediate calculation with brief presentation |
| Consequences    | Update resources and continue           | 20–40 seconds                                 |

These are adjustable defaults. Never start a challenge timer while players are still encountering its instructions for the first time. A complex scene may contain several rounds that repeat reading, discussion, and commitment.

## Make the next action clear

The phone always answers "What should I do now?" Players may continue reading or change their selection until input closes. Ready indicates preparation; it does not mean the result has already been processed.

The server closes input when everyone has marked Ready and the host chooses Resolve, or when the commitment deadline expires. Manual resolution is available only when the readiness condition is satisfied. At closure, freeze the latest server-accepted selection from each player. Reject late changes visibly.

## Scene types

A route decision aggregates individual votes. A puzzle combines clues and submitted configuration parts. A hazard aggregates simultaneous actions. An NPC encounter selects an offer or uses an explicitly owned item. A rest scene provides a brief preparation decision.

Not every scene needs a minigame. Information-only passages should not require busywork. Consequence text should mention what the crew actually chose and what changed.

## Unlisted ideas

A Suggest Another Approach control may record an idea in the journal. Automatic mode executes only alternatives declared by the content pack. If a pack has an equivalent-approach branch, players can choose it and describe their version.

Do not promise that the engine understands every imagined action. Do not use a live language model to invent rules or grant unreviewed outcomes. Open-ended facilitation would require a separately designed human-host mode.

# 6 Resources and risk rules

Use three shared meters: **Supplies, Integrity, and Alarm**. The first mission starts at six, five, and zero respectively.

| **Meter** | **Bounds** | **Rule**                                                               |
| --------- | ---------- | ---------------------------------------------------------------------- |
| Supplies  | 0–12       | Pay when a decision is committed; unaffordable choices are unavailable |
| Integrity | 0–6        | Vehicle durability; zero triggers emergency evacuation                 |
| Alarm     | 0–6        | Escalating pressure; six triggers an authored urgent ending            |

Check emergency thresholds after the current resolution event. If Integrity reaches zero and Alarm reaches six together, evacuation takes priority. Clamp values within their bounds after each change. Alarm reaching six must not reset itself or trap the room in a loop.

## Shared risk tests

Use a risk test only for an uncertain action, such as crossing an unrepaired span. Roll one fair d20 on the server and add the number of accepted Effort tokens, up to four. Success requires a total equal to or above the option's Difficulty Class.

| **Difficulty Class** | **No support** | **Two Effort** | **Four Effort** |
| -------------------- | -------------- | -------------- | --------------- |
| 10                   | 55 percent     | 65 percent     | 75 percent      |
| 13                   | 40 percent     | 50 percent     | 60 percent      |
| 16                   | 25 percent     | 35 percent     | 45 percent      |

These probabilities describe the custom rule. Natural one and twenty do not automatically override the total. Puzzle correctness and sufficient action counts do not use a die.

Before commitment, show the difficulty, support, cost, success result, and failure consequence. Pay any declared cost before rolling. Spent Effort remains spent after failure. Save the roll so refreshing, reconnecting, or restarting cannot reroll the outcome.

## Hints

A puzzle has up to three successive hints. The first directs attention, the second narrows a possibility, and the third explains the solution. Opening a normal hint adds one Alarm. A Scout can open the first hint free of Alarm. The group uses the ordinary voting rule to request a hint.

## Repairs

At an explicitly authored rest stop, pay three Supplies to restore one Integrity, once per rest stop. An Engineer can reduce that cost to two. Do not repair in the middle of resolving a loss.

# 7 Voting and simultaneous actions

Distinguish a shared choice from individual task selection. Both use server-accepted submissions and an input deadline, but their results are calculated differently.

## One shared option

Each player has one vote. Phones show costs and consequences. Before closure, display readiness counts, not the hidden vote totals. Players may revise their votes. The option with the most votes wins; an absolute majority is not required.

If tied, the scene's tie-breaker chooses among the tied options within twenty seconds. Rotate this responsibility through the fixed seat list after each shared decision. If the tie-breaker does not respond, use the first tied option in the scene's published priority order. This order is declared before voting.

Blank votes do not support any option. If all votes are blank, use the published default. Disable choices that cannot currently be afforded and recheck affordability on the server at closure. If only one option is legal, explain that situation and allow confirmation.

## Individual task selection

Each player chooses Shield, Supply, or Repel. Others cannot submit on their behalf. Discussion is unrestricted; submissions remain private until closure. Reveal the aggregate assignment together.

If a player has no accepted selection at the deadline, default to Shield in their own squad. Explain this default before the round. It preserves minimal participation without choosing an optimal action for the player.

## Abilities and common resources

Effort belongs to the individual and requires their consent. A shield purchase spends common Supplies and therefore completes an ordinary group vote before individual action selection begins.

Players request role effects. Allow only one effect of a given type on the same event. When requests conflict, resolve using rotating seat priority for the round, not network speed. Unselected requests consume nothing. Display the accepted result to each requester.

## Disconnection

Keep the scene roster and thresholds unchanged. A disconnected player's last acknowledged input remains valid. If there is no input, apply the published default at closure. Remove a seat or change squad sizes only between scenes.

These rules address ties, deadlines, and connectivity, but they do not guarantee that a forceful participant will stop directing the group. Observe whether individual agency remains real and adjust information distribution or task responsibilities if needed \[R22\].

# 8 Three reusable minigame families

Build three reusable interaction families. Future content changes the situation and parameters while retaining familiar controls. A new interaction family requires engine development rather than merely adding story text.

| **Family**        | **Interaction**                                        | **Possible mission variants**                                 |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| Clue assembly     | Read private facts and submit configuration parts      | Bridges, filters, rune locks, schedules, statements           |
| Group prediction  | Answer privately, then predict the most popular answer | Markets, station customs, strange cargo                       |
| Action allocation | Simultaneously select one of three tasks               | Storm crossing, gate defense, fire control, lifting platforms |

## Clue assembly

Provide enough information to solve the task. Each player receives facts, corroboration, or supporting context. Do not claim that every card is essential when some are redundant.

Players submit a configuration part or confirm a relevant fact. Show the final candidate solution before commitment. With nine players, squads can resolve related aspects and combine findings. With fewer players, redistribute cards so every necessary fact still reaches someone.

Validate the answer during authoring. Do not generate ambiguous arithmetic in the middle of a session.

## Group prediction

Ask a fictional question with three answers. Everyone answers privately after reading; then each squad discusses and each player predicts the most frequently selected answer. Any answer tied for the highest count is correct.

For each squad, divide correct predictions by its number of participants. A squad with at least half correct receives a playful badge. If at least one squad reaches that threshold, the crew gains one Supply, capped at one per scene. Otherwise, gain nothing and continue.

Avoid popularity votes about real friends or questions that evaluate their personalities. The question concerns the fictional situation. This family is an optional pacing change, not a mandatory element of every future mission.

## Action allocation

The scene declares threatened squads and global task needs. Resolution depends on actual assignments, not a die roll. Section 11 defines the complete first implementation.

Every pack specifies instructions, timing, data, effects, hints, and failure exits. Do not turn cooperation into a D&D trivia test or a reading-speed contest unless the intended experience specifically calls for it.

# 9 The first mission

**The Last Lantern Delivery:** deliver an essential lantern wick to a forest station before its shelter closes. Rescue choices affect load, protection needs, and later relationships. Target sixty to ninety minutes for three to nine players; urgency uses Alarm, not a real session deadline.

## Starting state

Supplies six, Integrity five, Alarm zero. Each player has one role ability and one Effort. Initial flags: family unrescued, bridge unchecked, bell behavior unknown, cargo undelivered.

| **Scene**       | **Estimate** | **Purpose**                    |
| --------------- | ------------ | ------------------------------ |
| Lobby           | 8 min        | Crew, squads, practice input   |
| Ferry rescue    | 8 min        | Choose whom and how to help    |
| Bridge puzzle   | 15 min       | Combine clues, select crossing |
| Market          | 8 min        | Predict group preferences      |
| Creature tracks | 8 min        | Investigate or hurry           |
| Rest            | 5 min        | Repair or preserve supplies    |
| Storm challenge | 15–20 min    | Three coordination rounds      |
| Delivery        | 5 min        | Ending and journal             |

## Family at the ferry

A Take them aboard: spend one Supply, rescue the family, add one weight unit. Announce one additional Shield required in the last squad during storm round two.

B Send rescue equipment: spend two Supplies. The family travels safely by boat, without extra weight or protection requirements.

C Signal another crew: add one Alarm. Rescue is pending, not confirmed. All options continue to the bridge.

## Silent market

Ask: "If the caravan sings when moving, would you trade for silence, speed, or light?" Apply section 8's prediction rule. No Integrity loss.

## Tracks beside the lamp

Investigate: spend one Supply. Learn bell behavior; the first storm shield costs one instead of two, without stacking an Engineer discount.

Hurry: add one Alarm. Scare the tracks away: DC thirteen; success changes nothing, failure loses one Integrity. Effort is available. Continue to rest unless an emergency threshold is reached.

## Rest and transitions

Offer section 6's once-per-stop repair or continue without repairing. Every branch continues or takes its declared emergency ending at zero Integrity or six Alarm.

# 10 The Three Bell Bridge puzzle

The group must identify a route across the stream. The correct answer is determined by the supplied facts. After solving it, decide how to cross. **Do not roll a die to invalidate a correct answer.**

## Author facts and answer

The vehicle weighs six units unless the family is aboard, when it weighs seven. The essential lantern cargo is already included and cannot be discarded.

| **Bridge** | **Capacity** | **Gate symbol** |
| ---------- | ------------ | --------------- |
| North      | 8            | Sun             |
| Middle     | 10           | Moon            |
| South      | 7            | Leaf            |

Rain is falling upstream. During rain, Middle retracts its span and becomes impassable. The required station is beyond the Sun gate. North accommodates both possible weights, remains usable, and reaches the correct destination. South can carry the vehicle but leads to the wrong station. **North is the unique solution.**

## Nine information cards

1 Vehicle weight is six. 2 Taking the family aboard adds one. 3 The lantern cargo cannot be discarded. 4 North carries eight and bears Sun. 5 Middle carries ten and bears Moon. 6 South carries seven and bears Leaf. 7 Upstream rain is active. 8 Rain retracts Middle. 9 The destination is beyond Sun.

Pathfinder checks the destination symbol, Mechanics confirms weight, and Logistics confirms conditions and passengers. Distribute some facts across these responsibilities to encourage exchange. Each person confirms a fact or submits part of the configuration.

Require each squad's candidate submission before final commitment. If squads disagree, use the ordinary shared-choice rule. For fewer players, bundle cards so all nine facts are delivered; validate this distribution for every supported roster size.

## Retries and hints

Allow at most two incorrect submissions. Each adds one Alarm without damaging Integrity. After the second, explain the answer and continue to the crossing decision. If Alarm reaches six, take the urgent ending.

Hint one: check the destination, not only capacity. Hint two: the destination is behind Sun. Hint three: identify North and explain the alternatives. Apply section 6's hint cost and Scout exception.

## Crossing decision

Repair North: spend two Supplies and continue without loss. Detour: spend nothing, add two Alarm. Pull across the unrepaired span: test DC thirteen; success continues, failure continues with two Integrity lost, unless evacuation is triggered. Effort can support the test.

Answer keys and author facts that have not been revealed stay server-side. A puzzle needs a clear, unique solution; it should not depend on guessing the author's unstated intention.

# 11 Hold the lamps through the storm

The Bell-Tapping Mist creature approaches, seeking to extinguish lamps and collect glowing bells. Reveal threatened squads before actions are chosen. With three squads, round one threatens the first, round two the last two, and round three all three. With two squads, threaten the first, then the last, then both.

Each player chooses Shield in their own squad, Supply, or Repel. Complete any common-resource shield purchases before action selection.

## Thresholds

A squad of k players normally needs half of k, rounded up, in Shield contributions. Each global action needs one third of the scene roster N, rounded up.

| **N** | **Squad sizes** | **Base Shield needs** | **Global threshold** |
| ----- | --------------- | --------------------- | -------------------- |
| 9     | 3 3 3           | 2 2 2                 | 3                    |
| 8     | 3 3 2           | 2 2 1                 | 3                    |
| 7     | 3 2 2           | 2 1 1                 | 3                    |
| 6     | 2 2 2           | 1 1 1                 | 2                    |
| 5     | 3 2             | 2 1                   | 2                    |
| 4     | 2 2             | 1 1                   | 2                    |
| 3     | 2 1             | 1 1                   | 1                    |

If the family is aboard, the last squad needs one additional Shield contribution in round two only. Purchased shields count toward it. A one-person squad can therefore need a purchased shield or accept a loss.

An underprotected threatened squad generates one Integrity loss. Guardians have ten seconds to cancel one loss in their own squad. If any loss remains, add one Alarm for the whole round, not one per squad.

Enough Supply actions earn one Supply and one successful power round. Enough Repel actions remove one Alarm. A purchased shield costs two Supplies and adds one Shield contribution to one squad for one round, maximum one purchase per squad per round. It never counts as Supply or Repel.

## Resolution order

Freeze input; determine losses; accept Guardian responses; apply Integrity losses. If Integrity reaches zero, evacuate immediately. Otherwise award Supply, add Alarm for remaining losses, apply Repel, then check emergency thresholds. Clamp after each change.

For nine players in the last round, two Shield and one Repel in each squad protect all positions and reduce Alarm by one. Replacing the three Repel actions with Supply earns one Supply and powers the vehicle instead.

## Completion

Achieve at least two successful power rounds within three rounds. If fewer succeed, add two Alarm after round three for pulling the vehicle by hand and record late delivery. Recheck thresholds before proceeding.

Apply the endings in section 12. Protect people and cargo; do not use monster hit points.

# 12 Endings and season continuity

Each mission finishes independently while preserving a few meaningful world consequences. A returning or new player should not need to study pages of old lore.

| **Condition**                       | **Mission outcome**                                                          | **Season record**                                      |
| ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| Integrity positive, Alarm below six | Deliver the lantern wick normally                                            | Open North Lantern Route                               |
| Integrity positive, Alarm at six    | Use the rescue entrance; the station spends reserves helping the crew        | Open the route and record depleted reserves            |
| Integrity at zero                   | Abandon the vehicle and preserve people; station rescuers recover some cargo | Record a repair debt and open a wheel recovery mission |

If the family was taken aboard or rescued by equipment, record them as safe and unlock a ferry contact. If another crew was signaled, retain rescue pending until later content confirms the outcome. Failure does not erase people already rescued.

Late delivery changes station narration and remains in the journal. Do not add an extra unannounced penalty beyond its stated two Alarm.

## Progression

Unlock routes, relationships, and mementos. Initially, mementos are narrative recognition or alternative starting configurations, not permanently stacking power bonuses.

Reset shared resources and personal abilities according to the next mission's setup. A repair debt creates an authored choice to repay or recover materials; it must not make the next mission unwinnable at the start.

Players can replace personal goals between journeys. Newcomers and returning participants receive equivalent mission resources.

## A persistent crew with a changing roster

Save the season against the crew, not against exactly the same nine people. At a later session, select the crew and confirm the current roster. Stable player identifiers distinguish seats even if display names change or collide.

Personal history records contributions without ranking friends. Add or remove people only between scenes with host confirmation. Explain the mission's relevant past in a short recap.

## Keep continuity manageable

As an authoring guideline, read approximately three important season flags and write no more than three new ones per mission. This is not an engine limit.

Branches may reconverge, but narration, resources, or relationships should retain their consequences. Replay comes from new decisions, assignments, configurations, and authored variants. A mystery whose solution is already known cannot be made entirely new just by changing names.

# 13 Phone and TV interfaces

Phones deliver private information and accept commitments. The TV holds the shared situation and consequences. Apply clear naming, scanning-friendly text, and low interaction ambiguity from Don't Make Me Think \[R25\].

| **Phone screen** | **Required information**                                      |
| ---------------- | ------------------------------------------------------------- |
| Join             | Name, room code, avatar, and reconnect option                 |
| Lobby            | Squad, role, one practice interaction, Ready                  |
| Scene            | Current objective, private clues, principal choices           |
| Commitment       | Selected action, server acknowledgement, remaining time       |
| Result           | Personal contribution, resource changes, next task            |
| Disconnected     | Last known state, reconnect status, no false success feedback |

Use specific controls such as Shield Mechanics, Spend Effort, and Share Clue. Show ability effects and remaining uses in one sentence. Communicate cost and submission status with text, not color alone.

The initial interface target is a comfortably tappable principal control, approximately forty-four CSS pixels or larger. This is a proposed product target, not a claim about a mandatory standard. Support text enlargement and browser zoom.

## Shared TV

Show the scene title, short narration, route map, three meters, and squads. During selection show readiness, not secret choices. On resolution reveal the aggregate assignment and resource changes. Allow reviewing the previous result.

Do not single out a player as the person who ruined the mission. Present missed inputs or losses neutrally. Squad colors also have names and symbols. Verify important text from the actual seats in the room.

## Host operating view

Provide pause, extend time, save, continue, seat management, and issue reporting. It should not reveal puzzle answers, hidden flags, or future branches. Authoring tools are separate.

Use extended desktop mode: TV window on the external display, operating window on the laptop. The TV client is read-only. The host can use their own phone to play like everyone else.

Audio is supplementary. All essential directions appear in text. Start audio after a user interaction and provide mute. The first mission does not require camera, microphone, motion sensors, or device installation features.

# 14 Local operation and recovery

The intended setup is opening the laptop, selecting an installed mission, scanning a code, and playing. No cloud account or rented hosting is needed. Local networking and browser behavior still require device testing.

## Before players join

Start the application, select the crew and content pack, and display the laptop's LAN address with a QR code. Open the TV view, choose the external display, and check readability and optional sound.

Phones join the same network and navigate directly to the laptop. Localhost on a phone refers to that phone. Guest networks or device isolation can prevent access. Do not open an Internet-facing port; installation guidance should explain the application's private-network firewall permission. A hotspot is a fallback only after testing the full device count.

## During play

The host participates normally. Pausing freezes deadlines using server-held remaining time. Extending a phase changes the server deadline and informs all clients. A player may request extra time; that request does not automatically extend the phase indefinitely.

Show a disconnect when detected. If a seat remains disconnected for ten seconds during a timed phase, automatically pause the room once for that phase and ask the host to continue or wait. Do not repeatedly pause because of the same disconnect. If play resumes, retain acknowledged input and apply the published default to missing input at closure.

## Rejoining and changing phones

Issue a reconnect token bound to the seat. A matching name does not reclaim it. When a token is lost or a phone changes, the host confirms reassignment and invalidates the previous token. Two devices must not control the same seat simultaneously.

## Persistence

Save each resolved round and scene. Persist acknowledged submissions as well. Save the phase, deadlines or paused remaining time, flags, resources, rolls, and pinned pack version. Resume an interrupted unresolved phase paused.

Do not resolve a completed event twice or reroll a saved outcome. If the server crashes during a database write, restore the last committed transaction. Input that never received server acknowledgement may need resubmission; do not promise recovery of data that never arrived.

## Backups

At mission end, update the season journal. Export consistent backups through the application. Do not tell users to copy only the main database file while it is actively being written.

Long pauses, food breaks, and ending a session halfway through a mission are ordinary situations. They should not create fictional penalties just because players took longer outside the game.

# 15 A compact implementation architecture

**Use one local web application with authoritative server state.** The laptop serves every interface and owns the database. Phones send intentions; the server validates permissions, applies rules, and calculates outcomes.

| **Component**   | **Responsibility**                                              |
| --------------- | --------------------------------------------------------------- |
| Room service    | Seats, permissions, phases, deadlines, and command validation   |
| Rules engine    | Votes, costs, thresholds, risk tests, abilities, and endings    |
| Content runtime | Packs, versions, conditions, and scene transitions              |
| Interfaces      | Phone, TV, operating view, and authoring tools                  |
| Persistence     | Season journal, accepted input, results, and recovery snapshots |

## Proposed stack

Use TypeScript for client and server, React for interfaces, Node.js for the server, and SQLite for local persistence. Choose supported stable versions during implementation and lock dependencies. This recommendation simplifies shared types and one rules implementation; it is not the only viable language choice.

If you prefer Java Spring Boot or a suitable existing repository already uses it, retain the same protocol and content contract with a single Spring Boot server. Do not maintain both backends.

Keep SQLite on the laptop. Phones never access the database file directly, and the database does not live on a network share. SQLite documents application-server use when the server and data occupy the same machine \[W02\]. Test this application's actual behavior rather than inferring performance from general suitability.

## Room communication

Use a same-origin WebSocket connection for room updates \[W01\]. Commands include roomId, sceneInstanceId, optional roundId, commandId, clientRevision, and action payload.

Check the token, phase, and payload before acceptance. The same commandId with the same payload returns its earlier result; reuse with a different payload is an error. Serialize room mutations and deadline events through one queue so two requests cannot spend the same resources or finish a round twice.

Public snapshots include a revision for stale-state detection.

## Offline and browser compatibility

Bundle fonts, images, sound, rules, and scenarios on the laptop. Installed play uses no CDN, analytics, cloud login, or AI API. Preparing or installing dependencies may initially require Internet.

Test LAN access and WebSocket behavior on actual Safari and Chrome devices. Secure-context and local-network rules can vary \[W03\]. If local HTTP transport does not work for the target setup, provide tested local TLS with certificate trust guidance or a tested same-origin HTTP polling transport. Do not claim that plain HTTP works everywhere.

The initial application does not need microservices, Redis, Kubernetes, vector search, or a language model running on the laptop.

# 16 State and persistence contracts

Content describes possible scenes; saved state describes what actually happened. Do not modify a content pack to record room progress.

## Phase machine

Lobby → introduction → reading and readiness → selection → input closed → resolution → results → next scene or ending. Pause retains the previous phase and remaining time. Reconnection does not restart the phase.

Create a new sceneInstanceId whenever a scene is entered. Revisiting the same sceneId still creates a new instance. Use a unique resolution key containing sceneInstanceId and roundId; sceneId alone cannot prevent duplicate application safely.

| **Record**    | **Principal fields**                                             |
| ------------- | ---------------------------------------------------------------- |
| Crew          | crewId, name, season, routes, flags, journal                     |
| Room          | roomId, crewId, packId, packVersion, phase, revision             |
| Player        | playerId, seat, name, avatar, squad, role, tokenHash             |
| Mission state | Current scene, resources, mission flags, scene counters          |
| Submission    | commandId, sceneInstanceId, roundId, playerId, payload, revision |
| Resolution    | Unique key, frozen inputs, roll, changes, next scene             |
| Snapshot      | snapshotVersion, time, revision, state                           |

Store the storm's successful power-round counter as scene state. Do not confuse it with Supplies or season progression.

Names can change or collide; identifiers and seats establish ownership. No email, birth date, or phone number is necessary. Do not expose reconnect tokens in logs or TV payloads.

## Transactional resolution

Read frozen input, calculate the outcome, apply resources and flags, select the transition, and commit the result with its snapshot in one transaction. Publish confirmed results after commit.

A crash before commit may require resolution again from stored input. Random values must already be persisted or derived from a stable gameplay seed so this cannot change the outcome. Use gameplay randomness separately from secure seat tokens; deterministic gameplay seeds must never generate access credentials.

## Server permissions

Each client receives public state and only its own private data. Answer keys, future branch details, and author notes are not included in public snapshots. Hiding content with CSS is insufficient. Asset names and URLs must not reveal puzzle answers either.

Content conditions and effects use an allowlisted data language, not arbitrary JavaScript. This supports validation and reproducible outcomes. Technical identifiers belong in developer documentation, not in ordinary player instructions.

# 17 Content pack contract

A pack is a folder or ZIP containing a manifest, missions, scenes, NPCs, variant tables, and local assets. Initially support validated import rather than requiring a complex visual editor.

| **Component**    | **Required contract**                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Manifest         | id, version, schemaVersion, engineRange, title, language, playerRange |
| Mission          | entrySceneId, initialResources, endings, tags, sourceNotes            |
| Scene            | id, type, objective, public narration, private data, hints            |
| Option           | id, label, condition, cost, effects, nextSceneId                      |
| Puzzle           | Facts, answer or validator, retry limit, hints, failure exit          |
| Action challenge | Rounds, threatened squads, thresholds, counters, completion rules     |
| NPC              | id, goal, boundaries, knowledge, authored responses                   |
| Asset            | id, relative path, type, provenance                                   |

Identifiers must be stable and unique within their namespace. Change the pack version when rules, facts, effects, or structure change. Even a text correction creates a new version so a save can identify its exact content.

## Example route scene

bridge_route is a choice scene with repair, detour, and risk options. Repair requires at least two Supplies, subtracts two, and transitions to silent_market. Detour adds two Alarm and normally reaches the same scene. Risk uses DC thirteen; failure removes two Integrity.

After an option resolves, global emergency rules take precedence over the ordinary nextSceneId. Never specify "handle failure appropriately" without an actual effect and transition.

## Visibility

publicText is visible on the TV. privateCards are allocated to player identifiers. authorNotes and answerKey are available only through authoring tools. A Share action explicitly determines which private content becomes public.

## Installing and pinning

Validate the whole pack before activation, then install atomically. Saves pin packId, packVersion, and a content digest. A room already in progress keeps its pinned version when a newer version is installed. Retain old versions needed by saves.

If the pinned pack is missing, request that exact version. Upgrade a save only through an explicit, tested migration. Do not guess matching scene identifiers.

Backups include saved state and pack dependencies; they may include the pack itself when its asset permissions allow it. Constrain paths to the pack directory, limit extraction size and file types, and reject arbitrary scripts. Packs must not fetch external assets during gameplay.

# 18 Controlled procedural content

Tome of Adventure Design uses tables to stimulate ideas and connections; a random sequence does not automatically create a coherent adventure \[R21\]. The game therefore generates variants inside validated templates.

## Three expansion levels

1 Authored content: the author specifies facts, options, scenes, and endings.

2 Template variants: choose valid parameters such as NPC, route, hazard presentation, and reward.

3 Optional AI-assisted drafting before play: generate a draft, then review, validate, and package it.

Implement level one and a limited level two first. Level three is a possible authoring tool, never a gameplay dependency.

## Variant pipeline

Choose a template and seed → select compatible tagged details → check constraints → compute answers or outcomes → validate paths → author review → version the pack → playtest.

Limit generation attempts. If no valid configuration is found, use a preapproved fallback or show an authoring error. Never leave a game room waiting indefinitely.

| **Simple variation**                | **Constrained variation**   | **Deep validation required**      |
| ----------------------------------- | --------------------------- | --------------------------------- |
| Names, mist colors, amusing objects | Location tags and NPC needs | Puzzle facts and unique solutions |
| Cosmetic vehicle details            | Costs within tested ranges  | Win and loss thresholds by roster |
| Flavor text and sound               | Tension and scene order     | Reachable endings                 |

## Bridge example

Rename North to Goldstone, replace Sun with Bell, or vary capacity within a permitted range. Still ensure exactly one bridge satisfies load, weather, and destination. Check all candidate bridges, then generate cards from the same canonical data.

Do not vary costs and thresholds arbitrarily just to claim novelty. Templates define resource limits. Verify at least one viable completion path from the initial state, while retaining valid failure and rescue endings. Not every sequence of choices must succeed.

## World consistency

An existing NPC keeps their identifier, goals, and established history. Mood and responses may change with state; past events cannot contradict themselves because a new random result was selected.

Save the seed, parameters, and chosen variant. Cosmetic substitutions do not make a known mystery new. Replay should arise from different decisions, cooperation, consequences, and genuinely new authored material.

The product supports expanding content. It does not promise infinite interesting content without authoring work.

# 19 Content authoring workflow

Authors should be able to add missions using existing scene families without changing the engine. Developers become involved when a new mechanic or schema extension is required.

## Preparation

Review players and preferences; create a clear opening; outline possible scenes; define secrets and clues; select locations; outline NPCs; choose hazards; select rewards. This adapts Return of the Lazy Dungeon Master's preparation framework \[R11\], not every numerical table in the books.

For each scene answer: What does the crew want? Who knows what? Which decision changes the result? What resolves it? Where does failure lead?

For investigations, support important conclusions with multiple independent clues. The Three Clue Rule is useful guidance \[R14\]. Do not put the only continuation behind one difficult check.

| **Review layer** | **Questions**                                                                           |
| ---------------- | --------------------------------------------------------------------------------------- |
| Structural       | Are IDs, references, assets, and schemas valid?                                         |
| Mechanical       | Are costs and effect order explicit? Does the puzzle work for N three through nine?     |
| Experiential     | Is narration concise? Does everyone contribute? Are choices informed and consequential? |

A loop is valid only when an explicit attempt limit or resource rule makes it terminate. The validator should identify unconstrained loops. A simulation can catch structural issues but cannot prove the story enjoyable.

## Mission dossier

Keep a summary, scene graph, flag list, costs, solutions, hints, roster variants, test checklist, and source notes. Identify original mechanics, adaptations, and actual imported rules separately.

Uploaded PDFs are author references, not automatically distributed game assets. Do not bundle complete commercial books, maps, or illustrations into release packs. Prefer original text and art; apply appropriate source terms when reusing SRD material.

## Revision history

Explain why changes were made: a gate symbol was confusing, a two-person squad lacked useful input, or a scene took too long. Record feedback against the scene.

Distinguish technical faults, ambiguous rules, and weak experiences. Increasing rewards is not a universal fix.

## Production rhythm

Finish one mission, add one useful variant, then write the next mission. Introduce approximately one substantial new element per mission.

Do not require memorizing all twenty-six references or implementing dozens of mechanisms before the game becomes playable. A small, complete, validated content library is a better foundation for future growth.

# 20 The first season

The first season consists of journeys from Lantern Depot. Each session stands alone, while routes and relationships connect them. These are planned missions, not six completed packs.

| **Mission**                | **Main interaction**                      | **Lasting consequence**                 |
| -------------------------- | ----------------------------------------- | --------------------------------------- |
| The Last Lantern Delivery  | Rescue, bridge clues, storm coordination  | Open a route or begin vehicle recovery  |
| The Silent Market          | Group prediction and resource negotiation | Establish a merchant relationship       |
| The Switched Signs         | Deduction and route finding               | Discover a hidden connection            |
| Bells in the Forest        | Understand a creature's goal              | Gain an ally or establish a bypass      |
| The Missing Rune Wheel     | Plan recovery and divide tasks            | Unlock an alternative vehicle setup     |
| The Night at Lantern Depot | Respond to earlier choices                | Close the season and establish the next |

## Introduce variety gradually

Mission one teaches the shared rules. Two changes theme while keeping interactions familiar. Three emphasizes reasoning. Four emphasizes NPC choices. Five varies coordination. Six recalls only a few important consequences rather than every detail.

If the group prefers gameshows, create a festival journey in this world. If they enjoy investigation, write a missing-cargo journey supported by several evidence sources. Both retain rooms, crew state, and familiar controls.

## Return to meaningful people

An NPC's goal can change because of the crew's actions. A rescued family becomes a ferry contact. A station with depleted reserves requests a supply route. NPCs should not merely congratulate players and disappear.

The connection between character goals, factions, rewards, and world responses draws on Proactive Roleplaying and the worldbuilding references \[R15, R19, R20, R26\].

## Expansion priorities

Prioritize an authoring tool that displays scene graphs and runs pack previews. Next add validated templates and a shared asset library.

Drawing, rhythm, hidden roles, tactical grids, or dedicated DM play are later modes that require explicit rules and experience validation. Their appearance in a reference book does not automatically put them in scope.

## Let friends contribute

Friends can write an NPC or an undisclosed mission so the host can discover its surprises too. Authors use separate tools; the host installs a reviewed pack. Keep credits in its manifest.

More content does not guarantee more fun. If a particular activity resonates, increase its share while retaining a clear mission goal and individual participation.

# 21 Delivery milestones

This is an implementation plan, not an application already delivered. Each milestone must produce observable behavior rather than a collection of interface mockups.

| **Milestone**        | **Deliverable**                                 | **Exit condition**                                              |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| P00 Contracts        | Rules, phases, schema, screens, mission mapping | No unresolved effect ordering or missing endings                |
| P01 LAN room         | Seats, squads, TV, operating view               | Nine phone clients join with correct permissions                |
| P02 Rules            | Voting, resources, risk, simultaneous actions   | Rule and duplicate-command checks pass for N three through nine |
| P03 Complete mission | The Last Lantern Delivery                       | Every branch reaches an actual outcome                          |
| P04 Recovery         | Saves, restart, reconnect, device replacement   | No duplicated effects or rerolls                                |
| P05 Content packs    | Import, validation, version pinning             | A second mission needs no engine change                         |
| P06 Group validation | Observe play and refine content and UI          | Everyone contributes and confusion is reduced                   |
| P07 Expansion        | Season missions, templates, author tools        | New content is versioned and testable                           |

A separate introductory D&D session is not a prerequisite. Test technical behavior with simulated clients and short runs of the developing game, then play a complete mission with friends. Human playtesting remains necessary to establish actual usability and enjoyment.

## Development order

Make networking, rules, and persistence work before producing large quantities of artwork and effects. Use the second content pack to demonstrate separation between engine and story; do not duplicate mission-specific code.

## Reports

At each milestone state what changed, how to run it, which checks passed, remaining limitations, and what is genuinely playable. A successful build does not establish that nine real phones work.

There is no fixed day estimate before the repository, developer environment, and target devices are known. Estimate after P00 by milestone and available effort.

## When to revise the design

If phone reading dominates play, reduce text or clarify diagrams. If one participant controls everyone, revise information and task distribution. If activities become repetitive, add a meaningful variant or interaction. If reconnection fails, repair recovery before expanding the content library.

Gameplay changes update the rule version, the sample content, and corresponding checks together. Do not leave the specification and content describing different behavior from the implementation.

# 22 Acceptance and playtesting

The release must complete a mission, handle repeated input safely, and support a clear process for adding content. A page that runs on one laptop is insufficient evidence.

## Technical acceptance

- Run nine player clients plus TV and operating views; test the actual group's phones at least once.
- Disconnect Internet after installation and still load assets, submit actions, and finish.
- Duplicate names cannot steal seats; TV credentials cannot issue player commands.
- Lock and reopen a phone; acknowledged input and the correct seat survive.
- Repeated identical command IDs spend resources once; changed payloads under the same ID fail.
- Late submissions cannot change a closed result.
- Restart during selection and after resolution without rerolls or duplicated effects.
- Pause, extend, and resume using server time, independent of client clocks.
- Installing a new pack does not alter a running mission; missing pinned versions produce recoverable guidance.

## Rules and content

Test N three through nine, squad thresholds, global action thresholds, and the extra round-two protection requirement when the family is aboard. Test Guardian responses, power-round counts, resource order, and simultaneous emergency thresholds.

Include unaffordable choices, tied or blank votes, competing ability requests, and disconnected seats. Prove the bridge has exactly one answer for both weights. Retries and hints always lead to continuation or a declared ending.

Every playable scene and ending should be reachable under a valid path. Mark reference-only data explicitly. Reject missing assets, invalid paths, arbitrary scripts, and unbounded loops.

Adding another mission that uses existing families must not require modifying engine code.

## Observe the group

Record meaningful individual inputs, longest passive waits, "What do I do now?" moments, and misunderstood clues. Ask afterward: favorite part, waiting part, desired additions, and willingness to play another journey.

Initial targets: useful input from everyone in each major scene, onboarding under ten minutes, and most continuous passive waits under sixty seconds. These remain targets, not measured benefits.

Quiet players may enjoy the game; laughing players may still lack useful agency. Use observed behavior and direct feedback together. Do not require everyone to express enjoyment in the same way.

A deterministic simulator validates structure and rules. It cannot certify that a story is funny, that a puzzle is intuitive, or that phones are comfortable in the actual room.

# 23 Rules and adventure references

The sources below inform decisions and support future cross-checking. Relevant sections were surveyed; this catalogue does not mean every page, table, spell, or example was studied in depth. Reopen the appropriate source when implementing a specific imported mechanic.

## Core rules

| **Code** | **Source**                                                  | **Use in this design**                                   |
| -------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| R01      | SRD CC v5.2.1                                               | Play rhythm, d20 concepts, and reference for SRD reuse   |
| R02      | Player's Handbook 2024 5.5e                                 | Basic play and roleplaying approaches                    |
| R03      | Dungeon Master's Guide 2024                                 | Preparation, large groups, pacing, encounters            |
| R04      | dnd_beyond_sae_docs                                         | Supplied Sage Advice and Errata snapshot                 |
| R05      | Advanced Dungeons and Dragons Player's Handbook 2nd Edition | Separate historical ruleset, excluded from Revised rules |

R04 is the supplied snapshot, not a guarantee of every later update. Match an erratum to its actual edition and section. Do not apply 2014 rulings to 2024 mechanics without checking.

## Adventures and tactics

| **Code** | **Source**                                      | **Use in this design**                                  |
| -------- | ----------------------------------------------- | ------------------------------------------------------- |
| R06      | Dragon Delves 2025                              | Mission structure, key NPCs, creature encounters        |
| R07      | Sly Flourish's Fantastic Adventures             | Strong openings, clues, locations, endings              |
| R08      | The Game Master's Book of Random Encounters     | Encounters and changes of pace                          |
| R09      | The Game Master's Book of Non Player Characters | Goals, secrets, boundaries, memorable details           |
| R10      | The Monsters Know What They're Doing            | Behavior derived from goals, environment, and abilities |

R10 provides the author's tactical advice, not official rulings. Apply the principle that creatures have understandable behavior, exploit their surroundings, and may retreat. Do not copy older statistics into the custom final challenge.

The supplied adventure and NPC books provide examples and methods. The setting and sample mission in this document are original proposals rather than a reproduction of a published adventure.

This revision replaces the previous document's external-product comparison with the specification for the group's own game. External commercial games are not dependencies for its LAN operation.

# 24 Preparation and storytelling references

## Preparation and pacing

| **Code** | **Source**                        | **Use in this design**                           |
| -------- | --------------------------------- | ------------------------------------------------ |
| R11      | Return of the Lazy Dungeon Master | Eight preparation steps and useful preparation   |
| R12      | The Lazy DM's Workbook            | Compact references and improvisation aids        |
| R13      | The Lazy DM's Companion           | Situations, newcomer guidance, and templates     |
| R14      | So You Want To Be A Game Master   | Clues, scene structures, and spotlight switching |

Some numerical advice in R12 and R13 reflects older 5e mechanics or house rules. This document adapts methods, not those numbers as official rules.

## Improvisation and player driven stories

| **Code** | **Source**                                          | **Use in this design**                        |
| -------- | --------------------------------------------------- | --------------------------------------------- |
| R15      | The Game Master's Handbook of Proactive Roleplaying | Goals, factions, allies, responsive worlds    |
| R16      | Improv for Gamers 2nd Edition                       | Listening, collaboration, adaptable exercises |
| R17      | Kobold Guide to Plots and Campaigns                 | Branches, NPC motivation, consequences        |
| R18      | The Ultimate RPG Gameplay Guide                     | Player audience, participation, pacing        |

Performance exercises are not automatically appropriate for a group hesitant about acting. Adapt collaboration into clues and choices, and use performance only when players want it. Yes and does not require accepting every proposal or ignoring personal boundaries.

## Worldbuilding

| **Code** | **Source**                                         | **Use in this design**                           |
| -------- | -------------------------------------------------- | ------------------------------------------------ |
| R19      | The Kobold Guide to Worldbuilding                  | Inside-out development, organizations, conflict  |
| R20      | Kobold Guide to Worldbuilding Volume 2             | Spiral development and everyday effects of magic |
| R21      | Tome of Adventure Design Revised                   | Idea prompts and informed meaningful choices     |
| R26      | The Ultimate RPG Game Master's Worldbuilding Guide | Questions and collaborative setting exercises    |

These references help authors create settings and situations. They do not provide an automatic guarantee that generated content has a solution, is balanced, or is entertaining. The content workflow therefore includes structural validation, mechanical checks, and human review.

# 25 Game design and technical references

## Game design and usability

| **Code** | **Source**                                          | **Use in this design**                                   |
| -------- | --------------------------------------------------- | -------------------------------------------------------- |
| R22      | Building Blocks of Tabletop Game Design 2nd Edition | Cooperation, simultaneous selection, private information |
| R23      | The Art of Game Design 3rd Edition                  | Essential experience, mechanics, interfaces, playtesting |
| R24      | Characteristics of Games                            | Teamwork, downtime, uncertainty, elimination             |
| R25      | Don't Make Me Think Revisited                       | Scannable text, clear controls, navigation, mobile       |

## Technical sources

W01 MDN WebSocket

<https://developer.mozilla.org/en-US/docs/Web/API/WebSocket>

W02 SQLite Appropriate Uses

<https://www.sqlite.org/whentouse.html>

W03 MDN Secure Contexts and Local Network Access

<https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts>

<https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access>

Technical pages were checked on 14 October 2026. Deadline handling, idempotency, client permissions, and persistence transactions are application requirements, not features automatically supplied by WebSocket or SQLite. Validate the chosen stack on the target devices.

## Source use in packs

Keep sourceNotes containing the reference, relevant section, type of adaptation, and asset credits. Prefer original material. If a pack reuses SRD 5.2.1 text, include the attribution specified in its Legal Information section and the CC BY 4.0 link. SRD permissions do not automatically cover entire commercial books.

Maintain a separate provenance record for maps and illustrations. A bibliography does not replace asset records. Do not install every reference PDF into a distributable pack by default.

The sample setting, NPC concepts, mission, and values are original proposals. The catalogue identifies influences and matters to cross-check, not evidence of completed implementation or proven balance.

## Edition discipline

Use D&D 2024 and SRD 5.2.1 when checking imported Revised rules. Keep AD&D 2nd Edition separate. Third-party DM guidance provides methods and ideas; its numerical rules are not automatically official mechanics.

When a custom rule replaces a source mechanic, specify its actual behavior and verify the consequences. Saying similar to D&D leaves too much ambiguity for implementation.

# 26 Development agent brief

Give the agent this document with the books available in a reference directory. Use the catalogue to locate relevant sections instead of treating every book as a feature requirement.

## Mission

You are the lead developer for The Mistbound Caravan, a local cooperative adventure game. This document is the product and gameplay specification. Support three to nine players, primarily nine people total including the host. The host is a player with operating permissions. Do not convert this into one DM plus nine players.

Build a laptop-hosted local web application. Players connect directly over LAN from phone browsers. The TV connected to the laptop displays shared state. Installed play must work without Internet. Bundle assets locally. No cloud authentication, external hosting, CDN, or runtime AI API is required.

Create cooperative play driven by choices, shared clues, and simultaneous actions. Acting is optional. Nobody is eliminated from the session. Implement the complete original first mission in sections 9–11. This is a custom ruleset; do not implement full D&D classes, spells, initiative, or tactical combat without a later explicit requirement.

## First milestone

Inspect the repository and its applicable instructions. Produce P00 before implementation: rules contract, phase state machine, content schema, screen inventory, assumptions, and specification-to-acceptance mapping. Resolve ordinary implementation choices independently. Ask only about contradictions or omissions that materially block correct behavior.

Follow the milestones in section 21. Deliver one complete playable mission before expanding the world. Default to TypeScript, React, Node.js, and SQLite. Preserve a suitable existing Java Spring Boot backend when appropriate; do not build two backends. Select supported dependencies and lock versions.

## Server contract

Keep the server authoritative. Serialize room mutations, validate all commands and permissions, and distinguish command IDs, scene instance IDs, and round IDs.

Acknowledged input must survive reconnects and restarts. Completed effects must not apply twice. Saved random outcomes must not reroll. Persist pinned content versions and transactional state.

Treat numeric values and timing as initial settings to validate. Do not silently change rules while building. Any necessary gameplay revision must update the document mapping, content, and checks together.

# 27 Development completion contract

This continues the implementation brief in section 26. Treat these requirements as part of the same task.

## Content and interfaces

Implement the three minigame families in section 8. Separate rules from mission data. Demonstrate a second pack added without changing the engine.

Validate references, assets, numeric bounds, unique puzzle solutions, reachable endings, and every supported roster. Include the family rescue protection modifier, power-round completion, ability conflicts, deadlines, defaults, and tie-breaking.

Send clients only public state and their own private information. Keep answer keys and unrevealed future content server-side. Separate authoring tools from a host operating view that can be used without spoilers.

Implement the phone, TV, pause, timeout, reconnection, and save-recovery behavior as specified. Test LAN transport on target browsers and document a tested alternative if the default transport fails.

## Verification and reporting

At each milestone report changed files, commands to run, checks passed, unresolved limitations, and what is actually playable.

Write meaningful rule, permission, duplicate-command, and recovery tests. Clearly distinguish simulated multi-client tests from real phone testing. A rendered UI or successful build alone does not establish milestone completion.

Use section 22 for release acceptance. Do not claim the game is enjoyable, balanced, offline-ready, or compatible with nine actual phones until the relevant checks have been performed.

## Source handling

Do not embed commercial books into distributable packs. Create original content and assets or use appropriately licensed material with source notes.

AI-assisted drafting may be a later authoring feature. Gameplay must remain reproducible and independent of an AI service. The automatic engine executes authored possibilities; it must not promise unrestricted human-DM improvisation.

## Delivery

Develop the specified game in the local repository. Include setup instructions, LAN joining instructions, the first mission, a second pack demonstration, and a clear limitations report.

Do not publish the game externally unless separately instructed. Preserve a simple launch-and-play workflow and prioritize a complete, stable session over an extensive unfinished feature list.