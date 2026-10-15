import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  applyStormOutcome,
  checkEmergency,
  evaluatePredictions,
  evaluateStormRound,
  getSquadConfigForCount,
  resolveRiskTest,
} from "../src/engine/rules";

// Browser services are deliberately inert: these are local rule tests, not LAN tests.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => (key === "mistbound_muted" ? "true" : null),
    setItem() {},
  },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
const { createDefaultPlayers, createInitialState, RoomStore, roomStore } =
  await import("../src/engine/roomStore");
roomStore.dispose();
const stores: InstanceType<typeof RoomStore>[] = [];
after(() => stores.forEach((store) => store.dispose()));

function storeAt(sceneId: string, count = 9) {
  const store = new RoomStore({ clock: false });
  stores.push(store);
  const state = store.getState();
  state.players = createDefaultPlayers(count);
  state.currentSceneId = sceneId;
  state.phase = "selection";
  state.players.forEach((player) => {
    player.ready = true;
    player.role = "Scout";
  });
  return { store, state };
}

test("actual rosters match the section 11 squad table for every supported size", () => {
  for (let n = 3; n <= 9; n++) {
    const players = createDefaultPlayers(n);
    const config = getSquadConfigForCount(n);
    for (const squad of ["pathfinder", "mechanics", "logistics"] as const) {
      assert.equal(
        players.filter((p) => p.squad === squad).length,
        config.sizes[squad],
        `N=${n}, ${squad}`,
      );
    }
    assert.equal(config.globalThreshold, Math.ceil(n / 3));
  }
});

test("family protection modifier and missing-input Shield default work for N=3 through N=9", () => {
  for (let n = 3; n <= 9; n++) {
    const state = createInitialState();
    state.players = createDefaultPlayers(n);
    state.flags.familyAboard = true;
    state.currentStormActions = Object.fromEntries(
      state.players.map((p) => [p.id, "Supply"]),
    );
    const config = getSquadConfigForCount(n);
    const last = config.squadCount === 3 ? "logistics" : "mechanics";
    for (const squad of ["pathfinder", "mechanics", "logistics"] as const) {
      state.players
        .filter((p) => p.squad === squad)
        .slice(0, config.baseShieldNeeds[squad])
        .forEach((p) => {
          state.currentStormActions[p.id] = "Shield";
        });
    }
    let round = evaluateStormRound(2, state);
    assert.equal(
      round.lossesGenerated[last],
      1,
      `N=${n} needs the extra shield`,
    );
    state.currentRoundPurchasedShields[last] = 1;
    round = evaluateStormRound(2, state);
    assert.equal(
      round.lossesGenerated[last],
      0,
      `N=${n} purchased shield counts`,
    );
    state.currentStormActions = {};
    const defaulted = evaluateStormRound(1, state);
    assert.equal(defaulted.lossesGenerated.pathfinder, 0);
    assert.ok(
      Object.values(defaulted.playerAssignments).every(
        (action) => action === "Shield",
      ),
    );
  }
});

test("Repel applies exactly once, including Alarm at zero and at its cap", () => {
  const state = createInitialState();
  const round = evaluateStormRound(3, state);
  round.repelThresholdMet = true;
  assert.equal(
    applyStormOutcome({ supplies: 6, integrity: 5, alarm: 3 }, round).alarm,
    2,
  );
  round.lossesGenerated.pathfinder = 1;
  assert.equal(
    applyStormOutcome({ supplies: 6, integrity: 5, alarm: 0 }, round).alarm,
    0,
  );
  assert.equal(
    applyStormOutcome({ supplies: 6, integrity: 5, alarm: 6 }, round).alarm,
    5,
  );
});

test("evacuation happens before Supply rewards or Repel, with emergency priority preserved", () => {
  const state = createInitialState();
  const round = evaluateStormRound(3, state);
  round.lossesGenerated.pathfinder = 1;
  round.powerRoundSucceeded = true;
  round.repelThresholdMet = true;
  assert.deepEqual(
    applyStormOutcome({ supplies: 6, integrity: 1, alarm: 6 }, round),
    { supplies: 6, integrity: 0, alarm: 6 },
  );
  assert.equal(checkEmergency(0, 6), "evacuation");
});

test("Effort ignores duplicate, unknown and exhausted pledges and uses rotating seat priority", () => {
  const players = createDefaultPlayers(9);
  players[3].effortAvailable = false;
  const result = resolveRiskTest(
    13,
    ["p_1", "p_1", "unknown", ...players.map((p) => p.id).reverse()],
    players,
    2,
    () => 0.5,
  );
  assert.deepEqual(result.contributors, ["p_3", "p_5", "p_6", "p_7"]);
  assert.equal(result.rawRoll, 11);
  assert.equal(result.effortCount, 4);
  assert.equal(result.total, 15);
});

test("tied prediction answers are correct and the whole scene awards at most one Supply", () => {
  const players = createDefaultPlayers(3);
  const result = evaluatePredictions(
    { p_1: "silence", p_2: "speed" },
    { p_1: "silence", p_2: "speed", p_3: "speed" },
    players,
  );
  assert.deepEqual(result.winningAnswers.sort(), ["silence", "speed"]);
  assert.equal(result.awardedSupply, true);
  assert.equal(evaluatePredictions({}, {}, players).awardedSupply, false);
});

test("unaffordable choices and input after closure cannot spend supplies or change votes", () => {
  const { store, state } = storeAt("ferry_rescue");
  state.resources.supplies = 0;
  store.castVote("p_1", "rescue_aboard");
  assert.equal(state.votes.p_1, undefined);
  store.resolveCurrentPhase();
  assert.equal(state.resources.supplies, 0);
  assert.equal(state.flags.familySignaledOnly, true);
  const votes = structuredClone(state.votes);
  const resources = { ...state.resources };
  store.castVote("p_1", "rescue_signal");
  store.resolveCurrentPhase();
  assert.deepEqual(state.votes, votes);
  assert.deepEqual(state.resources, resources);
});

test("manual resolution waits for readiness and paused input remains frozen", () => {
  const { store, state } = storeAt("ferry_rescue");
  state.players[0].ready = false;
  store.resolveCurrentPhase();
  assert.equal(state.phase, "selection");
  state.isPaused = true;
  store.castVote("p_1", "rescue_signal");
  store.setPlayerReady("p_1", true);
  assert.equal(state.votes.p_1, undefined);
  assert.equal(state.players[0].ready, false);
});

test("Engineer ability is not consumed by an unaffordable shield and bell discount applies once", () => {
  const { store, state } = storeAt("storm_challenge");
  state.players[0].role = "Engineer";
  state.resources.supplies = 0;
  store.purchaseStormShield("pathfinder", "p_1");
  assert.equal(state.players[0].roleAbilityAvailable, true);
  state.resources.supplies = 6;
  state.flags.bellBehaviorLearned = true;
  store.purchaseStormShield("pathfinder", "p_1");
  assert.equal(state.resources.supplies, 5);
  assert.equal(state.players[0].roleAbilityAvailable, true);
  store.purchaseStormShield("mechanics");
  assert.equal(state.resources.supplies, 3);
});

test("Scout can only open the first free hint and standard hints trigger urgent endings", () => {
  const { store, state } = storeAt("bridge_puzzle");
  store.useScoutHintAbility("p_1");
  store.useScoutHintAbility("p_2");
  assert.equal(state.flags.hintsUnlocked, 1);
  assert.equal(state.players[1].roleAbilityAvailable, true);
  state.resources.alarm = 5;
  store.unlockStandardHint();
  assert.equal(state.ending?.conditionType, "emergency_alarm");
});

test("final underpowered storm checks its late-delivery Alarm immediately and cannot resolve twice", () => {
  const { store, state } = storeAt("storm_challenge");
  state.currentStormRound = 3;
  state.resources.alarm = 4;
  state.flags.successfulPowerRounds = 0;
  // Add earlier rounds so the stored round index matches round three.
  state.stormRoundsHistory = [
    evaluateStormRound(1, state),
    evaluateStormRound(2, state),
  ];
  store.resolveCurrentPhase();
  assert.equal(state.flags.lateDelivery, true);
  assert.equal(state.ending?.conditionType, "emergency_alarm");
  const snapshot = JSON.stringify(state);
  store.finishStormRoundResolution();
  store.triggerEnding("emergency_alarm");
  assert.equal(JSON.stringify(state), snapshot);
});

test("a complete first mission reaches the delivery ending through actual authored transitions", () => {
  const { store, state } = storeAt("ferry_rescue", 3);
  function vote(option: string) {
    state.players.forEach((p) => {
      store.castVote(p.id, option);
      store.setPlayerReady(p.id, true);
    });
    store.resolveCurrentPhase();
    store.advanceToNextScene();
  }
  vote("rescue_aboard");
  assert.equal(state.currentSceneId, "bridge_puzzle");
  store.submitPuzzleCandidate("pathfinder", "north");
  store.submitPuzzleCandidate("mechanics", "north");
  state.players.forEach((p) => store.setPlayerReady(p.id, true));
  store.resolveCurrentPhase();
  store.advanceToNextScene();
  assert.equal(state.currentSceneId, "bridge_crossing");
  vote("repair_span");
  assert.equal(state.currentSceneId, "silent_market");
  const answer = store.getCurrentScene().predictionConfig!.options[0];
  state.players.forEach((p) => {
    store.submitPredictionAnswer(p.id, answer);
    store.submitPredictionGuess(p.id, answer);
    store.setPlayerReady(p.id, true);
  });
  store.resolveCurrentPhase();
  store.advanceToNextScene();
  vote("investigate_tracks");
  state.resources.integrity = 4;
  vote("perform_repair");
  assert.equal(state.resources.integrity, 5);
  assert.equal(state.currentSceneId, "storm_challenge");
  for (let round = 1; round <= 3; round++) {
    const actions =
      round === 1
        ? ["Shield", "Supply", "Repel"]
        : round === 2
          ? ["Supply", "Supply", "Shield"]
          : ["Shield", "Repel", "Shield"];
    state.players.forEach((p, index) =>
      store.submitStormAction(
        p.id,
        actions[index] as "Shield" | "Supply" | "Repel",
      ),
    );
    store.resolveCurrentPhase();
    assert.equal(state.phase, "consequences");
    store.advanceToNextScene();
  }
  assert.equal(state.flags.successfulPowerRounds, 2);
  assert.equal(state.ending?.conditionType, "normal");
  assert.equal(
    state.seasonRecord.journal.filter(
      (entry) => entry.missionId === state.packId,
    ).length,
    1,
  );
});

test("Guardian cancels only their own loss in the reaction window and can act once", () => {
  const { store, state } = storeAt("storm_challenge", 3);
  state.players[0].role = "Guardian";
  state.players.forEach((p) => store.submitStormAction(p.id, "Supply"));
  store.resolveCurrentPhase();
  assert.equal(state.phase, "guardian_reaction");
  store.useGuardianAbility("p_1", "mechanics");
  assert.equal(state.players[0].roleAbilityAvailable, true);
  store.useGuardianAbility("p_1", "pathfinder");
  assert.equal(state.players[0].roleAbilityAvailable, false);
  store.finishStormRoundResolution();
  assert.equal(state.resources.integrity, 5);
  assert.equal(state.resources.alarm, 0);
  assert.equal(state.flags.successfulPowerRounds, 1);
  const resources = { ...state.resources };
  store.finishStormRoundResolution();
  assert.deepEqual(state.resources, resources);
});

test("wrong puzzle choices use bounded retries, and one correct squad does not override two wrong squads", () => {
  const { store, state } = storeAt("bridge_puzzle");
  store.submitPuzzleCandidate("pathfinder", "north");
  store.submitPuzzleCandidate("mechanics", "south");
  store.submitPuzzleCandidate("logistics", "south");
  store.resolveCurrentPhase();
  assert.equal(state.flags.bridgeSolved, false);
  assert.equal(state.flags.bridgeAttempts, 1);
  store.advanceToNextScene();
  assert.equal(state.currentSceneId, "bridge_puzzle");
  store.submitPuzzleCandidate("pathfinder", "middle");
  store.submitPuzzleCandidate("mechanics", "middle");
  store.submitPuzzleCandidate("logistics", "middle");
  state.players.forEach((p) => store.setPlayerReady(p.id, true));
  store.resolveCurrentPhase();
  assert.equal(state.flags.bridgeAttempts, 2);
  assert.equal(state.flags.bridgeSolved, true);
  store.advanceToNextScene();
  assert.equal(state.currentSceneId, "bridge_crossing");
});

test("reset preserves the crew, roster and season while refreshing mission resources", () => {
  const { store, state } = storeAt("ferry_rescue", 5);
  store.updateCrewIdentity("Lantern Friends", "★", "Keep promises");
  state.seasonRecord.unlockedRoutes.push("A remembered route");
  state.resources.supplies = 0;
  const revision = state.revision;
  store.resetMission();
  const next = store.getState();
  assert.equal(next.crewName, "Lantern Friends");
  assert.equal(next.players.length, 5);
  assert.equal(next.resources.supplies, 6);
  assert.ok(next.seasonRecord.unlockedRoutes.includes("A remembered route"));
  assert.ok(next.revision > revision);
});
