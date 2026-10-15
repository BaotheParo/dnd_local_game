/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleType = "Scout" | "Engineer" | "Guardian";
export type SquadId = "pathfinder" | "mechanics" | "logistics";

export interface SquadDef {
  id: SquadId;
  name: string;
  symbol: string;
  color: string;
  accentColor: string;
  description: string;
}

export const ROLE_NAMES: Record<RoleType, string> = {
  Scout: "Trinh Sát",
  Engineer: "Kỹ Sư",
  Guardian: "Hộ Vệ",
};

export const SQUADS: Record<SquadId, SquadDef> = {
  pathfinder: {
    id: "pathfinder",
    name: "Đội Dẫn Đường",
    symbol: "🧭",
    color: "#0284c7", // sky-600
    accentColor: "#38bdf8",
    description: "Nhận biết các biểu tượng định hướng, mốc địa giới và lộ trình an toàn",
  },
  mechanics: {
    id: "mechanics",
    name: "Đội Cơ Khí",
    symbol: "⚙️",
    color: "#d97706", // amber-600
    accentColor: "#fbbf24",
    description:
      "Theo dõi độ bền thân xe, tải trọng chịu lực và máy móc cổ tự",
  },
  logistics: {
    id: "logistics",
    name: "Đội Hậu Cần",
    symbol: "📦",
    color: "#059669", // emerald-600
    accentColor: "#34d399",
    description: "Quản lý lương thảo tiếp tế, điều kiện sương mù và hành khách",
  },
};

export const PHASE_NAMES: Record<PhaseType, string> = {
  title: "Màn hình chính",
  lobby: "Tập hợp đội ngũ",
  intro: "Khởi hành",
  reading: "Tìm hiểu tình huống",
  selection: "Đưa ra quyết định",
  resolution: "Tổng kết kết quả",
  consequences: "Biến chuyển & Hậu quả",
  guardian_reaction: "Phản xạ Hộ Vệ",
  victory: "Thắng lợi hoàn thành",
  game_over: "Đoàn xe thất thủ",
};

export const SCENE_TYPE_NAMES: Record<SceneType, string> = {
  lobby: "Tập hợp đội ngũ",
  narrative_choice: "Quyết định tình huống",
  clue_puzzle: "Giải mã manh mối",
  group_prediction: "Phán đoán tập thể",
  rest_stop: "Trạm dừng chân",
  storm_challenge: "Vượt bão sương",
  mission_delivery: "Đích đến an toàn",
};

export interface Player {
  id: string;
  seatIndex: number; // 0 to 8 (seats 1 to 9)
  name: string;
  avatar: string;
  squad: SquadId;
  role: RoleType;
  effortAvailable: boolean; // 1 Effort per mission
  roleAbilityAvailable: boolean; // 1 Role ability use per mission
  isHost: boolean;
  isConnected: boolean;
  reconnectToken: string;
  ready: boolean;
  selectedAction?: string;
  goalCard?: string;
}

export type PhaseType =
  | "title"
  | "lobby"
  | "intro"
  | "reading"
  | "selection"
  | "resolution"
  | "consequences"
  | "guardian_reaction"
  | "victory"
  | "game_over";

export interface Resources {
  supplies: number; // 0 to 12 (default 6)
  integrity: number; // 0 to 6 (default 5)
  alarm: number; // 0 to 6 (default 0)
}

export interface ClueCard {
  id: string;
  number: number;
  assignedSquad?: SquadId;
  assignedRole?: RoleType;
  title: string;
  fact: string;
  corroboration: string;
}

export interface SharedClue {
  cardId: string;
  sharedByPlayerName: string;
  sharedByPlayerSeat: number;
  sharedAt: number;
  card: ClueCard;
}

export interface RiskTestResult {
  dc: number;
  rawRoll: number;
  effortCount: number;
  contributors: string[];
  total: number;
  success: boolean;
  timestamp: number;
}

export interface StormRoundState {
  resolved?: boolean;
  roundNumber: number; // 1, 2, 3
  threatenedSquads: SquadId[];
  extraShieldRequiredLastSquad: boolean; // If family aboard in rd 2
  purchasedShields: Record<SquadId, number>; // squadId -> number of purchased shields
  playerAssignments: Record<string, "Shield" | "Supply" | "Repel">;
  lossesGenerated: Record<SquadId, number>;
  guardianCancelled: Partial<Record<SquadId, string>>; // squadId -> guardian player name
  powerRoundSucceeded: boolean;
  repelThresholdMet: boolean;
  alarmChanged: number;
  integrityChanged: number;
  suppliesChanged: number;
}

export interface SceneOption {
  id: string;
  title: string;
  description: string;
  costDescription?: string;
  suppliesCost?: number;
  alarmCost?: number;
  requiresCondition?: (state: GameState) => boolean;
  isRiskTest?: boolean;
  riskDc?: number;
  nextSceneId: string;
  effectsSummary: string;
}

export interface MissionEnding {
  conditionType: "normal" | "emergency_alarm" | "emergency_evacuation";
  title: string;
  narrative: string;
  routeUnlocked?: string;
  seasonDebt?: string;
  journalEntry: string;
}

export interface SeasonRecord {
  crewName: string;
  emblem: string;
  guidingPrinciple: string;
  unlockedRoutes: string[];
  relationships: string[];
  mementos: string[];
  journal: Array<{
    missionId: string;
    missionTitle: string;
    date: string;
    summary: string;
    crewNotes: string;
  }>;
}

export interface ContentPack {
  id: string;
  version: string;
  title: string;
  synopsis: string;
  playerRange: [number, number];
  scenes: Record<string, SceneDef>;
  entrySceneId: string;
  initialResources: Resources;
}

export type SceneType =
  | "lobby"
  | "narrative_choice"
  | "clue_puzzle"
  | "group_prediction"
  | "rest_stop"
  | "storm_challenge"
  | "mission_delivery";

export interface SceneDef {
  id: string;
  type: SceneType;
  title: string;
  subtitle: string;
  publicNarration: string;
  options?: SceneOption[];
  clues?: ClueCard[];
  puzzleConfig?: {
    correctBridgeId: "north";
    maxIncorrectAttempts: number;
    hints: Array<{
      level: number;
      text: string;
      alarmCost: number;
    }>;
  };
  predictionConfig?: {
    question: string;
    options: string[];
  };
  stormConfig?: {
    totalRounds: number;
    targetPowerRounds: number;
  };
  nextSceneId?: string;
}

export interface GameState {
  roomId: string;
  packId: string;
  packVersion: string;
  phase: PhaseType;
  isPaused: boolean;
  phaseTimeRemaining: number; // seconds
  phaseDuration: number;
  currentSceneId: string;
  pendingNextSceneId?: string;
  sceneInstanceId: string;
  roundId: number;
  revision: number;

  crewName: string;
  emblem: string;
  guidingPrinciple: string;

  players: Player[];
  resources: Resources;

  // Scene state flags
  flags: {
    familyAboard: boolean;
    familyRescuedByGear: boolean;
    familySignaledOnly: boolean;
    bridgeSolved: boolean;
    bridgeAttempts: number;
    hintsUnlocked: number;
    bellBehaviorLearned: boolean; // from investigating tracks
    successfulPowerRounds: number; // storm
    lateDelivery: boolean;
    restRepaired: boolean;
    [key: string]: any;
  };

  // Clues currently shared to TV
  sharedClues: SharedClue[];

  // Voting and submissions
  votes: Record<string, string>; // playerId -> optionId
  puzzleCandidates: Record<SquadId, string>; // squadId -> candidate bridge
  predictionAnswers: Record<string, string>; // playerId -> chosen answer
  predictionGuesses: Record<string, string>; // playerId -> predicted popular answer
  predictionResults?: {
    counts: Record<string, number>;
    winningAnswers: string[];
    squadScores: Record<
      SquadId,
      { correct: number; total: number; passed: boolean }
    >;
    awardedSupply: boolean;
  };

  // Effort pledged for upcoming risk test
  pledgedEffort: string[]; // playerIds

  // Active risk test
  lastRiskTest?: RiskTestResult;

  // Storm state
  currentStormRound: number;
  stormRoundsHistory: StormRoundState[];
  currentStormActions: Record<string, "Shield" | "Supply" | "Repel">;
  currentRoundPurchasedShields: Record<SquadId, number>;
  guardianReactionTimer: number; // 10s countdown

  // Consequence log for TV presentation
  lastConsequence?: {
    title: string;
    details: string[];
    resourceChanges: {
      supplies?: number;
      integrity?: number;
      alarm?: number;
    };
  };

  // Final outcome
  ending?: MissionEnding;
  seasonRecord: SeasonRecord;
}
