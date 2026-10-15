/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameState,
  Player,
  Resources,
  RiskTestResult,
  SquadId,
  StormRoundState,
} from "../types/game";

// Resource boundaries according to Section 6
export const RESOURCE_LIMITS = {
  supplies: { min: 0, max: 12, start: 6 },
  integrity: { min: 0, max: 6, start: 5 },
  alarm: { min: 0, max: 6, start: 0 },
};

export function clampResources(res: Resources): Resources {
  return {
    supplies: Math.max(
      RESOURCE_LIMITS.supplies.min,
      Math.min(RESOURCE_LIMITS.supplies.max, res.supplies),
    ),
    integrity: Math.max(
      RESOURCE_LIMITS.integrity.min,
      Math.min(RESOURCE_LIMITS.integrity.max, res.integrity),
    ),
    alarm: Math.max(
      RESOURCE_LIMITS.alarm.min,
      Math.min(RESOURCE_LIMITS.alarm.max, res.alarm),
    ),
  };
}

export type EmergencyStatus = "none" | "evacuation" | "urgent_alarm";

// Check emergency conditions. Integrity 0 takes priority over Alarm 6 if both happen simultaneously.
export function checkEmergency(
  integrity: number,
  alarm: number,
): EmergencyStatus {
  if (integrity <= 0) {
    return "evacuation";
  }
  if (alarm >= 6) {
    return "urgent_alarm";
  }
  return "none";
}

// Roll d20 with Effort tokens (max 4 Effort applied)
export function resolveRiskTest(
  dc: number,
  pledgedEffortPlayerIds: string[],
  players: Player[],
  rotatingSeat: number = 0,
  random: () => number = Math.random,
): RiskTestResult {
  // Fair d20 roll
  const rawRoll = Math.floor(random() * 20) + 1;

  // Maximum 4 Effort tokens allowed
  const pledged = new Set(pledgedEffortPlayerIds);
  const seatCount = Math.max(1, players.length);
  const eligiblePledges = players
    .filter((p) => p.effortAvailable && pledged.has(p.id))
    .sort(
      (a, b) =>
        ((a.seatIndex - rotatingSeat + seatCount) % seatCount) -
        ((b.seatIndex - rotatingSeat + seatCount) % seatCount),
    )
    .slice(0, 4)
    .map((p) => p.id);
  const effortCount = eligiblePledges.length;

  const total = rawRoll + effortCount;
  const success = total >= dc;

  return {
    dc,
    rawRoll,
    effortCount,
    contributors: eligiblePledges,
    total,
    success,
    timestamp: Date.now(),
  };
}

// Squad assignment configuration based on player count N (3 to 9)
export function getSquadConfigForCount(n: number): {
  squadCount: 2 | 3;
  sizes: Record<SquadId, number>;
  baseShieldNeeds: Record<SquadId, number>;
  globalThreshold: number;
} {
  const clampedN = Math.max(3, Math.min(9, n));

  if (clampedN >= 6) {
    // 3 squads
    let pSize = 0,
      mSize = 0,
      lSize = 0;
    if (clampedN === 9) {
      pSize = 3;
      mSize = 3;
      lSize = 3;
    } else if (clampedN === 8) {
      pSize = 3;
      mSize = 3;
      lSize = 2;
    } else if (clampedN === 7) {
      pSize = 3;
      mSize = 2;
      lSize = 2;
    } else {
      pSize = 2;
      mSize = 2;
      lSize = 2;
    } // 6

    const globalThreshold = Math.ceil(clampedN / 3);

    return {
      squadCount: 3,
      sizes: { pathfinder: pSize, mechanics: mSize, logistics: lSize },
      baseShieldNeeds: {
        pathfinder: Math.ceil(pSize / 2),
        mechanics: Math.ceil(mSize / 2),
        logistics: Math.ceil(lSize / 2),
      },
      globalThreshold,
    };
  } else {
    // 2 squads (Pathfinder and Mechanics, Logistics unused)
    let pSize = 0,
      mSize = 0;
    if (clampedN === 5) {
      pSize = 3;
      mSize = 2;
    } else if (clampedN === 4) {
      pSize = 2;
      mSize = 2;
    } else {
      pSize = 2;
      mSize = 1;
    } // 3

    const globalThreshold = Math.ceil(clampedN / 3);

    return {
      squadCount: 2,
      sizes: { pathfinder: pSize, mechanics: mSize, logistics: 0 },
      baseShieldNeeds: {
        pathfinder: Math.ceil(pSize / 2),
        mechanics: Math.ceil(mSize / 2),
        logistics: 0,
      },
      globalThreshold,
    };
  }
}

// Get threatened squads for a storm round
export function getThreatenedSquads(
  roundNumber: number,
  squadCount: 2 | 3,
): SquadId[] {
  if (squadCount === 3) {
    if (roundNumber === 1) return ["pathfinder"];
    if (roundNumber === 2) return ["mechanics", "logistics"];
    return ["pathfinder", "mechanics", "logistics"]; // round 3
  } else {
    if (roundNumber === 1) return ["pathfinder"];
    if (roundNumber === 2) return ["mechanics"];
    return ["pathfinder", "mechanics"]; // round 3
  }
}

// Evaluate a storm round
export function evaluateStormRound(
  roundNumber: number,
  state: GameState,
): StormRoundState {
  const n = Math.max(3, state.players.length);
  const squadConfig = getSquadConfigForCount(n);
  const threatened = getThreatenedSquads(roundNumber, squadConfig.squadCount);

  // Check if family is aboard -> extra shield required in last squad in round 2
  const isFamilyAboard = !!state.flags.familyAboard;
  const extraShieldLastSquad = isFamilyAboard && roundNumber === 2;
  const lastSquadId: SquadId =
    squadConfig.squadCount === 3 ? "logistics" : "mechanics";

  // Count shields contributed per squad: player assignments + purchased shields
  const shieldContributions: Record<SquadId, number> = {
    pathfinder: state.currentRoundPurchasedShields.pathfinder || 0,
    mechanics: state.currentRoundPurchasedShields.mechanics || 0,
    logistics: state.currentRoundPurchasedShields.logistics || 0,
  };

  let totalSupplyActions = 0;
  let totalRepelActions = 0;

  state.players.forEach((p) => {
    const action = state.currentStormActions[p.id] || "Shield"; // Default is Shield in own squad
    if (action === "Shield") {
      shieldContributions[p.squad] = (shieldContributions[p.squad] || 0) + 1;
    } else if (action === "Supply") {
      totalSupplyActions++;
    } else if (action === "Repel") {
      totalRepelActions++;
    }
  });

  // Calculate needed shields per squad
  const shieldNeeds: Record<SquadId, number> = {
    pathfinder: squadConfig.baseShieldNeeds.pathfinder,
    mechanics: squadConfig.baseShieldNeeds.mechanics,
    logistics: squadConfig.baseShieldNeeds.logistics,
  };

  if (extraShieldLastSquad) {
    shieldNeeds[lastSquadId] += 1;
  }

  // Determine which threatened squads were underprotected
  const lossesGenerated: Record<SquadId, number> = {
    pathfinder: 0,
    mechanics: 0,
    logistics: 0,
  };

  threatened.forEach((squadId) => {
    if ((shieldContributions[squadId] || 0) < shieldNeeds[squadId]) {
      lossesGenerated[squadId] = 1; // 1 Integrity loss per underprotected threatened squad
    }
  });

  // Global actions evaluation
  const powerRoundSucceeded = totalSupplyActions >= squadConfig.globalThreshold;
  const repelThresholdMet = totalRepelActions >= squadConfig.globalThreshold;

  return {
    roundNumber,
    threatenedSquads: threatened,
    extraShieldRequiredLastSquad: extraShieldLastSquad,
    purchasedShields: { ...state.currentRoundPurchasedShields },
    playerAssignments: Object.fromEntries(
      state.players.map((p) => [
        p.id,
        state.currentStormActions[p.id] || "Shield",
      ]),
    ),
    lossesGenerated,
    guardianCancelled: {},
    powerRoundSucceeded,
    repelThresholdMet,
    alarmChanged: 0,
    integrityChanged: 0,
    suppliesChanged: 0,
  };
}

// Section 11: clamp after each event, with evacuation before rewards.
export function applyStormOutcome(
  resources: Resources,
  round: StormRoundState,
): Resources {
  const losses = Object.values(round.lossesGenerated).reduce(
    (sum, loss) => sum + loss,
    0,
  );
  let next = clampResources({
    ...resources,
    integrity: resources.integrity - losses,
  });
  if (next.integrity === 0) return next;
  if (round.powerRoundSucceeded)
    next = clampResources({ ...next, supplies: next.supplies + 1 });
  if (losses > 0) next = clampResources({ ...next, alarm: next.alarm + 1 });
  if (round.repelThresholdMet)
    next = clampResources({ ...next, alarm: next.alarm - 1 });
  return next;
}

// Evaluate group prediction results
export function evaluatePredictions(
  answers: Record<string, string>,
  guesses: Record<string, string>,
  players: Player[],
): {
  counts: Record<string, number>;
  winningAnswers: string[];
  squadScores: Record<
    SquadId,
    { correct: number; total: number; passed: boolean }
  >;
  awardedSupply: boolean;
} {
  const counts: Record<string, number> = {};
  Object.values(answers).forEach((ans) => {
    if (ans) {
      counts[ans] = (counts[ans] || 0) + 1;
    }
  });

  // Find max count
  let maxCount = 0;
  Object.values(counts).forEach((c) => {
    if (c > maxCount) maxCount = c;
  });

  // Any answer tied for highest count is winning
  const winningAnswers = Object.keys(counts).filter(
    (k) => counts[k] === maxCount,
  );

  // Score per squad
  const squadStats: Record<SquadId, { correct: number; total: number }> = {
    pathfinder: { correct: 0, total: 0 },
    mechanics: { correct: 0, total: 0 },
    logistics: { correct: 0, total: 0 },
  };

  players.forEach((p) => {
    const guess = guesses[p.id];
    squadStats[p.squad].total++;
    if (guess && winningAnswers.includes(guess)) {
      squadStats[p.squad].correct++;
    }
  });

  const squadScores: Record<
    SquadId,
    { correct: number; total: number; passed: boolean }
  > = {
    pathfinder: {
      correct: squadStats.pathfinder.correct,
      total: squadStats.pathfinder.total,
      passed:
        squadStats.pathfinder.total > 0 &&
        squadStats.pathfinder.correct / squadStats.pathfinder.total >= 0.5,
    },
    mechanics: {
      correct: squadStats.mechanics.correct,
      total: squadStats.mechanics.total,
      passed:
        squadStats.mechanics.total > 0 &&
        squadStats.mechanics.correct / squadStats.mechanics.total >= 0.5,
    },
    logistics: {
      correct: squadStats.logistics.correct,
      total: squadStats.logistics.total,
      passed:
        squadStats.logistics.total > 0 &&
        squadStats.logistics.correct / squadStats.logistics.total >= 0.5,
    },
  };

  const awardedSupply = Object.values(squadScores).some((s) => s.passed);

  return {
    counts,
    winningAnswers,
    squadScores,
    awardedSupply,
  };
}
