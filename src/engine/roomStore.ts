/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MISSION_1_PACK } from "../content/mission1";
import { MISSION_2_PACK } from "../content/mission2";
import { sound } from "../audio/synth";
import {
  applyStormOutcome,
  checkEmergency,
  clampResources,
  evaluatePredictions,
  evaluateStormRound,
  getSquadConfigForCount,
  resolveRiskTest,
} from "./rules";
import {
  ContentPack,
  GameState,
  Player,
  RoleType,
  SceneDef,
  SquadId,
  StormRoundState,
} from "../types/game";

const STORAGE_KEY = "mistbound_state_v2";
const BROADCAST_NAME = "mistbound_room_channel";

// Default initial roster for testing / quick start
export function createDefaultPlayers(count: number = 9): Player[] {
  count = Math.max(3, Math.min(9, Math.trunc(count) || 9));
  const squadConfig = getSquadConfigForCount(count);
  const players: Player[] = [];

  const defaultNames = [
    {
      name: "Rowan Swift",
      avatar: "🦅",
      role: "Scout" as RoleType,
      squad: "pathfinder" as SquadId,
    },
    {
      name: "Bram Ironhand",
      avatar: "⚒️",
      role: "Engineer" as RoleType,
      squad: "mechanics" as SquadId,
    },
    {
      name: "Kaelen Shield",
      avatar: "🛡️",
      role: "Guardian" as RoleType,
      squad: "logistics" as SquadId,
    },
    {
      name: "Lyra Moonpath",
      avatar: "🌙",
      role: "Scout" as RoleType,
      squad: "pathfinder" as SquadId,
    },
    {
      name: "Torin Cog",
      avatar: "⚙️",
      role: "Engineer" as RoleType,
      squad: "mechanics" as SquadId,
    },
    {
      name: "Vael Sentinel",
      avatar: "🗡️",
      role: "Guardian" as RoleType,
      squad: "logistics" as SquadId,
    },
    {
      name: "Elora Wayfarer",
      avatar: "🧭",
      role: "Scout" as RoleType,
      squad: "pathfinder" as SquadId,
    },
    {
      name: "Doran Rivet",
      avatar: "🔧",
      role: "Engineer" as RoleType,
      squad: "mechanics" as SquadId,
    },
    {
      name: "Sariel Warden",
      avatar: "🕯️",
      role: "Guardian" as RoleType,
      squad: "logistics" as SquadId,
    },
  ];

  for (let i = 0; i < count; i++) {
    const template = defaultNames[i % defaultNames.length];
    // Assign squad according to squadConfig if count < 6 (2 squads)
    const assignedSquad: SquadId =
      i < squadConfig.sizes.pathfinder
        ? "pathfinder"
        : i < squadConfig.sizes.pathfinder + squadConfig.sizes.mechanics
          ? "mechanics"
          : "logistics";

    players.push({
      id: `p_${i + 1}`,
      seatIndex: i,
      name: template.name,
      avatar: template.avatar,
      squad: assignedSquad,
      role: template.role,
      effortAvailable: true,
      roleAbilityAvailable: true,
      isHost: i === 0,
      isConnected: true,
      reconnectToken: `tok_${i + 1}_${Math.random().toString(36).substring(2, 8)}`,
      ready: false,
    });
  }

  return players;
}

export function createInitialState(
  pack: ContentPack = MISSION_1_PACK,
): GameState {
  return {
    roomId: "CARAVAN_LAN_1",
    packId: pack.id,
    packVersion: pack.version,
    phase: "title",
    isPaused: false,
    phaseTimeRemaining: 60,
    phaseDuration: 60,
    currentSceneId: pack.entrySceneId,
    sceneInstanceId: `inst_${Date.now()}`,
    roundId: 1,
    revision: 1,

    crewName: "Đoàn Hoa Đăng Rạng Đông",
    emblem: "✨",
    guidingPrinciple: "Ưu tiên cứu hộ đồng bào",

    players: createDefaultPlayers(9),
    resources: { ...pack.initialResources },

    flags: {
      familyAboard: false,
      familyRescuedByGear: false,
      familySignaledOnly: false,
      bridgeSolved: false,
      bridgeAttempts: 0,
      hintsUnlocked: 0,
      bellBehaviorLearned: false,
      successfulPowerRounds: 0,
      lateDelivery: false,
      restRepaired: false,
    },

    sharedClues: [],
    votes: {},
    puzzleCandidates: {
      pathfinder: "",
      mechanics: "",
      logistics: "",
    },
    predictionAnswers: {},
    predictionGuesses: {},
    pledgedEffort: [],

    currentStormRound: 1,
    stormRoundsHistory: [],
    currentStormActions: {},
    currentRoundPurchasedShields: {
      pathfinder: 0,
      mechanics: 0,
      logistics: 0,
    },
    guardianReactionTimer: 0,

    seasonRecord: {
      crewName: "Đoàn Hoa Đăng Rạng Đông",
      emblem: "✨",
      guidingPrinciple: "Ưu tiên cứu hộ đồng bào",
      unlockedRoutes: ["Đường Mòn Vành Đai Trạm Đèn"],
      relationships: ["Hội Giữ Đèn Cổ"],
      mementos: ["La Bàn Đồng của Chuyến Thám Hiểm Tiên Phong"],
      journal: [
        {
          missionId: "setup",
          missionTitle: "Lễ Thành Lập Đoàn Lữ Hành",
          date: "14 Th10 2026",
          summary:
            "Toàn đoàn tập hợp tại Trạm Hoa Đăng, xác nhận độ bền đoàn xe nguyên vẹn trước khi xuất phát.",
          crewNotes:
            "Ba phân đội tuyên thệ cùng nhau giữ vững ngọn đèn trước màn sương dữ dội.",
        },
      ],
    },
  };
}

export class RoomStore {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private timerInterval: any = null;
  private packRegistry: Record<string, ContentPack> = {
    last_lantern_delivery: MISSION_1_PACK,
    the_switched_signs: MISSION_2_PACK,
  };

  constructor(options: { clock?: boolean } = {}) {
    this.state = this.loadPersistedState() || createInitialState();
    this.initBroadcast();
    if (options.clock !== false) this.startClock();
  }

  private initBroadcast() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (
          event.data &&
          event.data.type === "STATE_UPDATE" &&
          event.data.state
        ) {
          if (event.data.state.revision > this.state.revision) {
            this.state = event.data.state;
            this.notify();
          }
        }
      };
    }
  }

  private startClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.isPaused) return;

      // Countdown phase timer during timed phases
      if (
        ["reading", "selection", "guardian_reaction"].includes(
          this.state.phase,
        ) &&
        this.state.phaseTimeRemaining > 0
      ) {
        this.state.phaseTimeRemaining -= 1;
        if (this.state.phaseTimeRemaining <= 0) {
          // Timer expired -> auto resolve
          this.handleTimeout();
        } else {
          this.notify();
        }
      }
    }, 1000);
  }

  private handleTimeout() {
    if (this.state.phase === "guardian_reaction") {
      this.finishStormRoundResolution();
    } else if (this.state.phase === "selection") {
      this.closeAndResolve();
    }
  }

  private loadPersistedState(): GameState | null {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as GameState;
        const pack = this.packRegistry[state.packId];
        if (
          !pack ||
          pack.version !== state.packVersion ||
          !pack.scenes[state.currentSceneId] ||
          !Array.isArray(state.players) ||
          state.players.length < 3 ||
          state.players.length > 9
        )
          return null;
        if (["selection", "reading", "guardian_reaction"].includes(state.phase))
          state.isPaused = true;
        return state;
      }
    } catch (e) {
      console.warn("Failed to parse saved game state", e);
    }
    return null;
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to persist state", e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
    this.persist();
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "STATE_UPDATE",
        state: this.state,
      });
    }
  }

  public subscribe(listener: (state: GameState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public dispose() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.broadcastChannel?.close();
    this.listeners.clear();
  }

  public getState(): GameState {
    return this.state;
  }

  public getCurrentPack(): ContentPack {
    return this.packRegistry[this.state.packId] || MISSION_1_PACK;
  }

  public getCurrentScene(): SceneDef {
    const pack = this.getCurrentPack();
    return (
      pack.scenes[this.state.currentSceneId] || pack.scenes[pack.entrySceneId]
    );
  }

  // --- ACTIONS & MUTATIONS ---

  public startGameFromTitle() {
    if (this.state.phase !== "title") return;
    this.state.revision++;
    this.state.phase = "lobby";
    sound.playRuneActivation();
    this.notify();
  }

  public updateCrewIdentity(
    crewName: string,
    emblem: string,
    guidingPrinciple: string,
  ) {
    this.state.revision++;
    this.state.crewName = crewName;
    this.state.emblem = emblem;
    this.state.guidingPrinciple = guidingPrinciple;
    Object.assign(this.state.seasonRecord, {
      crewName,
      emblem,
      guidingPrinciple,
    });
    this.notify();
  }

  public setPartyCount(count: number) {
    if (!["title", "lobby"].includes(this.state.phase)) return;
    this.state.revision++;
    this.state.players = createDefaultPlayers(count);
    this.notify();
  }

  public updatePlayer(playerId: string, updates: Partial<Player>) {
    if (!["title", "lobby"].includes(this.state.phase)) return;
    this.state.revision++;
    this.state.players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, ...updates } : p,
    );
    this.notify();
  }

  public setPlayerReady(playerId: string, ready: boolean) {
    if (
      this.state.isPaused ||
      !["lobby", "selection"].includes(this.state.phase)
    )
      return;
    this.state.revision++;
    this.state.players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, ready } : p,
    );
    sound.playClick(500);

    // If in lobby and all players ready, transition to first mission scene
    if (
      this.state.phase === "lobby" &&
      this.state.players.every((p) => p.ready)
    ) {
      this.startMission();
      return;
    }

    this.notify();
  }

  public startMission() {
    if (this.state.phase !== "lobby") return;
    this.state.revision++;
    const pack = this.getCurrentPack();
    // Start at first narrative scene after lobby (ferry_rescue)
    this.state.currentSceneId = "ferry_rescue";
    this.state.sceneInstanceId = `inst_${Date.now()}`;
    this.state.phase = "selection";
    this.state.phaseDuration = 90;
    this.state.phaseTimeRemaining = 90;
    this.resetSceneInputs();
    sound.playRuneActivation();
    this.notify();
  }

  private resetSceneInputs() {
    this.state.sharedClues = [];
    this.state.lastRiskTest = undefined;
    this.state.votes = {};
    this.state.puzzleCandidates = {
      pathfinder: "",
      mechanics: "",
      logistics: "",
    };
    this.state.predictionAnswers = {};
    this.state.predictionGuesses = {};
    this.state.pledgedEffort = [];
    this.state.currentStormActions = {};
    this.state.currentRoundPurchasedShields = {
      pathfinder: 0,
      mechanics: 0,
      logistics: 0,
    };
    this.state.players.forEach((p) => {
      p.ready = false;
      delete p.selectedAction;
    });
  }

  public shareClue(playerId: string, clueId: string) {
    const scene = this.getCurrentScene();
    if (!scene.clues) return;
    const clue = scene.clues.find((c) => c.id === clueId);
    if (!clue) return;

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (this.state.sharedClues.some((sc) => sc.cardId === clueId)) return;

    this.state.revision++;
    this.state.sharedClues.push({
      cardId: clueId,
      sharedByPlayerName: player.name,
      sharedByPlayerSeat: player.seatIndex + 1,
      sharedAt: Date.now(),
      card: clue,
    });
    sound.playBell(740);
    this.notify();
  }

  public castVote(playerId: string, optionId: string) {
    if (!this.acceptsInput(playerId)) return;
    const option = this.getCurrentScene().options?.find(
      (opt) => opt.id === optionId,
    );
    if (
      !option ||
      (option.suppliesCost || 0) > this.state.resources.supplies ||
      (option.requiresCondition && !option.requiresCondition(this.state))
    )
      return;
    this.state.revision++;
    this.state.votes[playerId] = optionId;
    const player = this.state.players.find((p) => p.id === playerId);
    if (player) player.selectedAction = optionId;
    sound.playClick(440);
    this.notify();
  }

  public submitPuzzleCandidate(squadId: SquadId, candidate: string) {
    if (
      this.state.phase !== "selection" ||
      this.state.isPaused ||
      this.getCurrentScene().type !== "clue_puzzle" ||
      !this.state.players.some((p) => p.squad === squadId) ||
      !["north", "middle", "south"].includes(candidate)
    )
      return;
    this.state.revision++;
    this.state.puzzleCandidates[squadId] = candidate;
    sound.playClick(580);
    this.notify();
  }

  public submitPredictionAnswer(playerId: string, answer: string) {
    if (
      !this.acceptsInput(playerId) ||
      !this.getCurrentScene().predictionConfig?.options.includes(answer)
    )
      return;
    this.state.revision++;
    this.state.predictionAnswers[playerId] = answer;
    sound.playClick(480);
    this.notify();
  }

  public submitPredictionGuess(playerId: string, guess: string) {
    if (
      !this.acceptsInput(playerId) ||
      !this.getCurrentScene().predictionConfig?.options.includes(guess)
    )
      return;
    this.state.revision++;
    this.state.predictionGuesses[playerId] = guess;
    sound.playClick(520);
    this.notify();
  }

  public toggleEffort(playerId: string) {
    if (!this.acceptsInput(playerId)) return;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.effortAvailable) return;

    this.state.revision++;
    const idx = this.state.pledgedEffort.indexOf(playerId);
    if (idx >= 0) {
      this.state.pledgedEffort.splice(idx, 1);
    } else {
      this.state.pledgedEffort.push(playerId);
      sound.playChime();
    }
    this.notify();
  }

  public useScoutHintAbility(playerId: string) {
    if (
      !this.acceptsInput(playerId) ||
      this.getCurrentScene().type !== "clue_puzzle" ||
      this.state.flags.hintsUnlocked !== 0
    )
      return;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.role !== "Scout" || !player.roleAbilityAvailable)
      return;
    if (this.state.flags.hintsUnlocked >= 3) return;

    this.state.revision++;
    player.roleAbilityAvailable = false;
    // Scout ability: unlocks the first hint without adding Alarm!
    this.state.flags.hintsUnlocked = Math.max(
      1,
      this.state.flags.hintsUnlocked + 1,
    );
    sound.playChime();
    this.notify();
  }

  public unlockStandardHint() {
    if (
      this.state.phase !== "selection" ||
      this.state.isPaused ||
      this.getCurrentScene().type !== "clue_puzzle"
    )
      return;
    if (this.state.flags.hintsUnlocked >= 3) return;
    this.state.revision++;
    this.state.flags.hintsUnlocked += 1;
    this.state.resources.alarm = Math.min(6, this.state.resources.alarm + 1);
    sound.playAlarmPulse();
    if (
      checkEmergency(
        this.state.resources.integrity,
        this.state.resources.alarm,
      ) !== "none"
    ) {
      this.triggerEnding(
        this.state.resources.integrity <= 0
          ? "emergency_evacuation"
          : "emergency_alarm",
      );
      return;
    }
    this.notify();
  }

  public purchaseStormShield(squadId: SquadId, engineerPlayerId?: string) {
    if (
      this.state.phase !== "selection" ||
      this.state.isPaused ||
      this.getCurrentScene().type !== "storm_challenge" ||
      !this.state.players.some((p) => p.squad === squadId)
    )
      return;
    const current = this.state.currentRoundPurchasedShields[squadId] || 0;
    if (current >= 1) return; // Max 1 purchase per squad per round

    // Cost is 2 supplies, or 1 supply if investigated bell tracks
    const firstDiscount =
      this.state.flags.bellBehaviorLearned &&
      !this.state.flags.bellDiscountUsed;
    let cost = firstDiscount ? 1 : 2;
    let discountedBy: Player | undefined;

    // Check Engineer ability discount (reduces cost by 1 Supply, minimum cost 1)
    if (engineerPlayerId) {
      const eng = this.state.players.find((p) => p.id === engineerPlayerId);
      if (
        eng &&
        eng.role === "Engineer" &&
        eng.roleAbilityAvailable &&
        cost > 1
      ) {
        cost -= 1;
        discountedBy = eng;
      }
    }

    if (this.state.resources.supplies < cost) return;
    if (discountedBy) discountedBy.roleAbilityAvailable = false;
    if (firstDiscount) this.state.flags.bellDiscountUsed = true;

    this.state.revision++;
    this.state.resources.supplies -= cost;
    this.state.currentRoundPurchasedShields[squadId] = 1;
    sound.playShieldClash();
    if ((window as any).triggerWorldImpact) {
      (window as any).triggerWorldImpact("shield");
    }
    this.notify();
  }

  public submitStormAction(
    playerId: string,
    action: "Shield" | "Supply" | "Repel",
  ) {
    if (
      !this.acceptsInput(playerId) ||
      this.getCurrentScene().type !== "storm_challenge" ||
      !["Shield", "Supply", "Repel"].includes(action)
    )
      return;
    this.state.revision++;
    this.state.currentStormActions[playerId] = action;
    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      player.selectedAction = action;
      player.ready = true;
    }
    sound.playClick(
      action === "Shield" ? 440 : action === "Supply" ? 660 : 880,
    );
    this.notify();
  }

  public useGuardianAbility(guardianPlayerId: string, targetSquadId: SquadId) {
    if (this.state.phase !== "guardian_reaction" || this.state.isPaused) return;
    const guardian = this.state.players.find((p) => p.id === guardianPlayerId);
    if (
      !guardian ||
      guardian.role !== "Guardian" ||
      !guardian.roleAbilityAvailable
    )
      return;
    if (guardian.squad !== targetSquadId) return; // Guardian can only protect their own squad

    const currentHistory =
      this.state.stormRoundsHistory[this.state.currentStormRound - 1];
    if (!currentHistory || currentHistory.lossesGenerated[targetSquadId] <= 0)
      return;
    if (currentHistory.guardianCancelled[targetSquadId]) return;

    this.state.revision++;
    guardian.roleAbilityAvailable = false;
    currentHistory.guardianCancelled[targetSquadId] = guardian.name;
    currentHistory.lossesGenerated[targetSquadId] = 0;
    sound.playShieldClash();
    if ((window as any).triggerWorldImpact) {
      (window as any).triggerWorldImpact("shield");
    }
    this.notify();
  }

  // RESOLUTION ENGINE
  private acceptsInput(playerId: string) {
    return (
      this.state.phase === "selection" &&
      !this.state.isPaused &&
      this.state.players.some((p) => p.id === playerId)
    );
  }

  public resolveCurrentPhase() {
    if (!this.state.players.every((p) => p.ready)) return;
    this.closeAndResolve();
  }

  private closeAndResolve() {
    if (this.state.phase !== "selection" || this.state.isPaused) return;
    const scene = this.getCurrentScene();
    this.state.phase = "resolution";
    this.state.revision++;

    if (scene.type === "narrative_choice") {
      this.resolveNarrativeChoice(scene);
    } else if (scene.type === "clue_puzzle") {
      this.resolvePuzzle(scene);
    } else if (scene.type === "group_prediction") {
      this.resolvePrediction(scene);
    } else if (scene.type === "rest_stop") {
      this.resolveRestStop(scene);
    } else if (scene.type === "storm_challenge") {
      this.resolveStormRound();
    }
  }

  private resolveNarrativeChoice(scene: SceneDef) {
    if (!scene.options || scene.options.length === 0) return;
    const legalOptions = scene.options.filter(
      (opt) =>
        (opt.suppliesCost || 0) <= this.state.resources.supplies &&
        (!opt.requiresCondition || opt.requiresCondition(this.state)),
    );
    if (legalOptions.length === 0) {
      this.state.phase = "selection";
      this.notify();
      return;
    }

    // Tally votes
    const voteCounts: Record<string, number> = {};
    scene.options.forEach((opt) => (voteCounts[opt.id] = 0));
    Object.values(this.state.votes).forEach((optId) => {
      if (voteCounts[optId] !== undefined) voteCounts[optId]++;
    });

    // Find winning option (highest votes; if tied, first option in declared priority order)
    let winningOpt = legalOptions[0];
    let highestVotes = -1;
    legalOptions.forEach((opt) => {
      if (voteCounts[opt.id] > highestVotes) {
        highestVotes = voteCounts[opt.id];
        winningOpt = opt;
      }
    });

    const suppliesCost = winningOpt.suppliesCost || 0;
    const alarmCost = winningOpt.alarmCost || 0;

    let integrityDelta = 0;
    let alarmDelta = alarmCost;
    let suppliesDelta = -suppliesCost;
    const consequenceDetails: string[] = [];
    this.state.pendingNextSceneId = winningOpt.nextSceneId;

    // Apply specific scene flags and mechanics
    if (scene.id === "ferry_rescue") {
      if (winningOpt.id === "rescue_aboard") {
        this.state.flags.familyAboard = true;
        consequenceDetails.push(
          "Gia đình thợ thủ công đã được đón lên xe an toàn.",
        );
        consequenceDetails.push(
          "+1 Tải trọng xe. Cần thêm 1 khiên phòng hộ ở hiệp bão thứ hai!",
        );
      } else if (winningOpt.id === "rescue_gear") {
        this.state.flags.familyRescuedByGear = true;
        consequenceDetails.push(
          "Đã trang bị tời chịu lực và bùa nổi cho sà lan của họ.",
        );
        consequenceDetails.push(
          "Gia đình xuôi dòng an toàn mà không gây áp lực tải trọng lên đoàn xe.",
        );
      } else if (winningOpt.id === "rescue_signal") {
        this.state.flags.familySignaledOnly = true;
        consequenceDetails.push(
          "Đã bắn pháo sáng khẩn cấp. Báo động cho đội tuần tra sông (+1 Báo động).",
        );
      }
    } else if (scene.id === "bridge_crossing") {
      if (winningOpt.id === "repair_span") {
        consequenceDetails.push(
          "Các dầm gỗ tiếp cận đã được gia cố vững chắc bằng gỗ xẻ và sắt giằng.",
        );
        consequenceDetails.push(
          "Vượt cầu thuận lợi, không gây chút tổn hại nào cho xe.",
        );
      } else if (winningOpt.id === "detour_gorge") {
        consequenceDetails.push(
          "Đoàn xe men theo bãi sỏi thấp xuyên qua làn sương dày đặc.",
        );
        consequenceDetails.push("Mất nhiều thời gian khiến sương tối dần (+2 Báo động).");
      } else if (winningOpt.id === "pull_span") {
        // Risk test DC 13
        const risk = resolveRiskTest(
          13,
          this.state.pledgedEffort,
          this.state.players,
          (this.state.roundId - 1) % this.state.players.length,
        );
        this.state.lastRiskTest = risk;
        // Consume spent effort
        risk.contributors.forEach((pid) => {
          const p = this.state.players.find((pl) => pl.id === pid);
          if (p) p.effortAvailable = false;
        });
        sound.playDiceRoll();

        if (risk.success) {
          consequenceDetails.push(
            `Thử Thách Rủi Ro THÀNH CÔNG (Đổ được ${risk.rawRoll} + ${risk.effortCount} Nỗ Lực = ${risk.total} so với DC 13).`,
          );
          consequenceDetails.push(
            "Cỗ xe phóng vút qua những thanh gỗ rung chuyển một cách an toàn!",
          );
        } else {
          integrityDelta = -2;
          consequenceDetails.push(
            `Thử Thách Rủi Ro THẤT BẠI (Đổ được ${risk.rawRoll} + ${risk.effortCount} Nỗ Lực = ${risk.total} so với DC 13).`,
          );
          consequenceDetails.push(
            "Một thanh gỗ mục gãy vụn! Thân xe đập mạnh vào gờ đá (-2 Độ bền xe).",
          );
          if ((window as any).triggerWorldImpact)
            (window as any).triggerWorldImpact("damage");
        }
      }
    } else if (scene.id === "creature_tracks") {
      if (winningOpt.id === "investigate_tracks") {
        this.state.flags.bellBehaviorLearned = true;
        consequenceDetails.push(
          "Khảo sát kỹ các vết chuông đồng và sải bước vuốt cào.",
        );
        consequenceDetails.push(
          "Nắm bắt tập tính quái chuông: khiên bảo hộ đầu tiên trong bão chỉ tốn 1 Lương thảo thay vì 2!",
        );
      } else if (winningOpt.id === "hurry_past") {
        consequenceDetails.push(
          "Vội vã vượt qua cột chuông tiến vào cánh rừng chập choạng tối (+1 Báo động).",
        );
      } else if (winningOpt.id === "scare_creature") {
        const risk = resolveRiskTest(
          13,
          this.state.pledgedEffort,
          this.state.players,
          (this.state.roundId - 1) % this.state.players.length,
        );
        this.state.lastRiskTest = risk;
        risk.contributors.forEach((pid) => {
          const p = this.state.players.find((pl) => pl.id === pid);
          if (p) p.effortAvailable = false;
        });
        sound.playDiceRoll();

        if (risk.success) {
          consequenceDetails.push(
            `Thử Thách Rủi Ro THÀNH CÔNG (Tổng ${risk.total} so với DC 13). Tiếng còi vang dội đã xua đuổi quái thú!`,
          );
        } else {
          integrityDelta = -1;
          consequenceDetails.push(
            `Thử Thách Rủi Ro THẤT BẠI (Tổng ${risk.total} so với DC 13). Quái thú vồ trúng mạn xe (-1 Độ bền xe)!`,
          );
          if ((window as any).triggerWorldImpact)
            (window as any).triggerWorldImpact("damage");
        }
      }
    }

    if (
      scene.type === "rest_stop" &&
      winningOpt.id === "perform_repair" &&
      !this.state.flags.restRepaired
    ) {
      this.state.flags.restRepaired = true;
      integrityDelta = this.state.resources.integrity < 6 ? 1 : 0;
      consequenceDetails.push(
        "Đội ngũ gia cố thân xe bên lò sưởi ấm cúng (+1 Độ bền xe).",
      );
    } else if (consequenceDetails.length === 0) {
      consequenceDetails.push(winningOpt.effectsSummary);
    }

    // Apply resource deltas & clamping
    this.state.resources.supplies = Math.max(
      0,
      this.state.resources.supplies + suppliesDelta,
    );
    this.state.resources.integrity = Math.max(
      0,
      this.state.resources.integrity + integrityDelta,
    );
    this.state.resources.alarm = Math.min(
      6,
      this.state.resources.alarm + alarmDelta,
    );
    this.state.resources = clampResources(this.state.resources);

    this.state.lastConsequence = {
      title: winningOpt.title,
      details: consequenceDetails,
      resourceChanges: {
        supplies: suppliesDelta,
        integrity: integrityDelta,
        alarm: alarmDelta,
      },
    };

    this.state.phase = "consequences";
    this.state.phaseDuration = 30;
    this.state.phaseTimeRemaining = 30;

    // Check emergency
    const emergency = checkEmergency(
      this.state.resources.integrity,
      this.state.resources.alarm,
    );
    if (emergency !== "none") {
      this.triggerEnding(
        emergency === "evacuation" ? "emergency_evacuation" : "emergency_alarm",
      );
    }

    this.notify();
  }

  private resolvePuzzle(scene: SceneDef) {
    // Check squad candidate submissions
    const candidates = Object.values(this.state.puzzleCandidates).filter(
      Boolean,
    );
    const counts = Object.fromEntries(
      ["north", "middle", "south"].map((id) => [
        id,
        candidates.filter((c) => c === id).length,
      ]),
    );
    const majorityCandidate = ["north", "middle", "south"].sort(
      (a, b) => counts[b] - counts[a],
    )[0];

    const isCorrect =
      candidates.length > 0 &&
      majorityCandidate === scene.puzzleConfig?.correctBridgeId;
    const consequenceDetails: string[] = [];
    let alarmDelta = 0;

    if (isCorrect) {
      this.state.flags.bridgeSolved = true;
      consequenceDetails.push(
        "Cầu Phía Bắc chính xác: Sức tải 8 đơn vị, phù hiệu Cổng Thái Dương, không bị ảnh hưởng bởi lũ thượng nguồn!",
      );
      consequenceDetails.push(
        "Cầu Ở Giữa đã bị mưa lũ thu lại, còn Cầu Phía Nam dẫn về Cổng Diệp Lục cách xa đích đến.",
      );
      sound.playChime();
    } else {
      this.state.flags.bridgeAttempts++;
      alarmDelta = 1;
      this.state.resources.alarm = Math.min(6, this.state.resources.alarm + 1);
      sound.playAlarmPulse();

      if (
        this.state.flags.bridgeAttempts >=
        (scene.puzzleConfig?.maxIncorrectAttempts ?? 2)
      ) {
        this.state.flags.bridgeSolved = true;
        consequenceDetails.push(
          `Lựa chọn không chính xác. Kỹ sư tra cứu văn thư tiền trạm: Cầu Phía Bắc là con đường duy nhất khả thi.`,
        );
        consequenceDetails.push(
          `Cầu Ở Giữa bị mưa thu gọn, Cầu Phía Nam sai phù hiệu (+1 Báo động do chậm trễ).`,
        );
      } else {
        consequenceDetails.push(
          `Cây cầu đã chọn không chịu được tải hoặc dẫn sai hướng! Tăng +1 Báo động.`,
        );
        consequenceDetails.push(
          `Hãy đối chiếu các thẻ manh mối: kiểm tra tải trọng xe hiện tại và biểu tượng cổng đến.`,
        );
      }
    }

    this.state.lastConsequence = {
      title: isCorrect ? "Đã Giải Mã Thành Công Lộ Trình Cầu!" : "Chọn Sai Nhịp Cầu",
      details: consequenceDetails,
      resourceChanges: { alarm: alarmDelta },
    };

    // If solved or max attempts, move to bridge crossing
    if (this.state.flags.bridgeSolved) {
      this.state.pendingNextSceneId = scene.nextSceneId;
    } else {
      this.state.pendingNextSceneId = scene.id;
    }

    this.state.phase = "consequences";
    this.state.phaseDuration = 25;
    this.state.phaseTimeRemaining = 25;

    const emergency = checkEmergency(
      this.state.resources.integrity,
      this.state.resources.alarm,
    );
    if (emergency !== "none") {
      this.triggerEnding(
        emergency === "evacuation" ? "emergency_evacuation" : "emergency_alarm",
      );
    }

    this.notify();
  }

  private resolvePrediction(scene: SceneDef) {
    const results = evaluatePredictions(
      this.state.predictionAnswers,
      this.state.predictionGuesses,
      this.state.players,
    );

    this.state.predictionResults = results;

    let suppliesDelta = 0;
    const consequenceDetails: string[] = [
      `Lựa Chọn Phổ Biến Nhất: "${results.winningAnswers.join(" / ")}" với ${results.counts[results.winningAnswers[0]] || 0} phiếu.`,
    ];

    if (results.awardedSupply) {
      suppliesDelta = 1;
      this.state.resources.supplies = Math.min(
        12,
        this.state.resources.supplies + 1,
      );
      consequenceDetails.push(
        "Có ít nhất một đội đã thấu hiểu đồng đội chính xác! Nhận được +1 Lương thảo.",
      );
      sound.playChime();
    } else {
      consequenceDetails.push(
        "Ý kiến của đoàn xe phân tán. Không nhận được thêm lương thảo, nhưng tình đồng đội thêm gắn kết.",
      );
    }

    this.state.lastConsequence = {
      title: "Tiếng Vọng Chợ Không Lời",
      details: consequenceDetails,
      resourceChanges: { supplies: suppliesDelta },
    };

    this.state.phase = "consequences";
    this.state.phaseDuration = 30;
    this.state.phaseTimeRemaining = 30;
    this.notify();
  }

  private resolveRestStop(scene: SceneDef) {
    this.resolveNarrativeChoice(scene);
  }

  private resolveStormRound() {
    const roundState = evaluateStormRound(
      this.state.currentStormRound,
      this.state,
    );
    this.state.stormRoundsHistory.push(roundState);

    // Check if any guardian can react to an underprotected squad
    const hasUnprotectedLoss = Object.values(roundState.lossesGenerated).some(
      (loss) => loss > 0,
    );
    const availableGuardians = this.state.players.filter(
      (p) =>
        p.role === "Guardian" &&
        p.roleAbilityAvailable &&
        roundState.lossesGenerated[p.squad] > 0,
    );

    if (hasUnprotectedLoss && availableGuardians.length > 0) {
      // Enter 10-second Guardian reaction window
      this.state.phase = "guardian_reaction";
      this.state.guardianReactionTimer = 10;
      this.state.phaseDuration = 10;
      this.state.phaseTimeRemaining = 10;
      sound.playAlarmPulse();
      this.notify();
    } else {
      this.finishStormRoundResolution();
    }
  }

  public finishStormRoundResolution() {
    const roundIndex = this.state.currentStormRound - 1;
    const roundState = this.state.stormRoundsHistory[roundIndex];
    if (
      !roundState ||
      roundState.resolved ||
      !["resolution", "guardian_reaction"].includes(this.state.phase) ||
      this.state.isPaused
    )
      return;
    roundState.resolved = true;
    const before = { ...this.state.resources };
    this.state.resources = applyStormOutcome(before, roundState);

    let integrityDelta = 0;
    let alarmDelta = 0;
    let suppliesDelta = 0;
    const consequenceDetails: string[] = [];

    // Sum uncancelled losses
    Object.entries(roundState.lossesGenerated).forEach(([squadId, loss]) => {
      if (loss > 0) {
        integrityDelta -= loss;
        const squadName =
          squadId === "pathfinder"
            ? "Đội Dẫn Đường"
            : squadId === "mechanics"
              ? "Đội Cơ Khí"
              : "Đội Hậu Cần";
        consequenceDetails.push(
          `${squadName} bị tổn hại kết cấu (-1 Độ bền xe)!`,
        );
      }
    });

    if (integrityDelta < 0) {
      if ((window as any).triggerWorldImpact)
        (window as any).triggerWorldImpact("damage");
    }

    // If integrity reaches 0 -> emergency evacuation
    if (this.state.resources.integrity <= 0) {
      this.triggerEnding("emergency_evacuation");
      return;
    }

    // If any loss remains in round, add +1 Alarm for the whole round
    if (integrityDelta < 0) {
      alarmDelta += 1;
      consequenceDetails.push(
        "Quái thú xuyên thủng kết giới bảo vệ (+1 Báo động do hoảng loạn gia tăng).",
      );
    }

    // Supply power evaluation
    if (roundState.powerRoundSucceeded) {
      suppliesDelta += 1;
      this.state.flags.successfulPowerRounds += 1;
      consequenceDetails.push(
        "Đạt ngưỡng năng lượng động cơ! Thu được +1 Lương thảo & Thành công Hiệp Động Lực!",
      );
      sound.playRuneActivation();
      if ((window as any).triggerWorldImpact)
        (window as any).triggerWorldImpact("power");
    }

    // Repel evaluation
    if (roundState.repelThresholdMet) {
      alarmDelta -= 1;
      consequenceDetails.push(
        "Pháo sáng mặt trời đã đẩy lùi xúc tu sương mù! Giảm -1 Báo động.",
      );
      sound.playShieldClash();
    }

    integrityDelta = this.state.resources.integrity - before.integrity;
    alarmDelta = this.state.resources.alarm - before.alarm;
    suppliesDelta = this.state.resources.supplies - before.supplies;

    roundState.integrityChanged = integrityDelta;
    roundState.alarmChanged = alarmDelta;
    roundState.suppliesChanged = suppliesDelta;

    this.state.lastConsequence = {
      title: `Hiệp Bão Sương Thứ ${this.state.currentStormRound} Đã Khép Lại`,
      details: consequenceDetails,
      resourceChanges: {
        supplies: suppliesDelta,
        integrity: integrityDelta,
        alarm: alarmDelta,
      },
    };

    // Check emergency
    const emergency = checkEmergency(
      this.state.resources.integrity,
      this.state.resources.alarm,
    );
    if (emergency !== "none") {
      this.triggerEnding(
        emergency === "evacuation" ? "emergency_evacuation" : "emergency_alarm",
      );
      return;
    }

    // Advance round or finish storm
    if (
      this.state.currentStormRound <
      (this.getCurrentScene().stormConfig?.totalRounds ?? 3)
    ) {
      this.state.pendingNextSceneId = this.state.currentSceneId;
      this.state.phase = "consequences";
      this.state.phaseDuration = 25;
      this.state.phaseTimeRemaining = 25;
    } else {
      // 3 rounds finished! Check if >= 2 successful power rounds
      if (
        this.state.flags.successfulPowerRounds <
        (this.getCurrentScene().stormConfig?.targetPowerRounds ?? 2)
      ) {
        this.state.flags.lateDelivery = true;
        this.state.resources.alarm = Math.min(
          6,
          this.state.resources.alarm + 2,
        );
        consequenceDetails.push(
          "Động cơ thiếu lực buộc phải kéo xe bằng tay (+2 Báo động, Ghi nhận Giao Hàng Chậm).",
        );
        this.state.lastConsequence.resourceChanges.alarm =
          this.state.resources.alarm - before.alarm;
        if (
          checkEmergency(
            this.state.resources.integrity,
            this.state.resources.alarm,
          ) !== "none"
        ) {
          this.triggerEnding("emergency_alarm");
          return;
        }
      }

      this.state.phase = "consequences";
      this.state.phaseDuration = 25;
      this.state.phaseTimeRemaining = 25;
      this.state.pendingNextSceneId = this.getCurrentScene().nextSceneId;
    }

    this.notify();
  }

  public advanceToNextScene() {
    if (this.state.phase !== "consequences" || this.state.isPaused) return;
    this.state.revision++;
    const scene = this.getCurrentScene();

    const nextId = this.state.pendingNextSceneId || scene.nextSceneId;
    const nextScene = nextId ? this.getCurrentPack().scenes[nextId] : undefined;
    if (
      nextScene?.type === "mission_delivery" ||
      scene.type === "mission_delivery"
    ) {
      const emergency = checkEmergency(
        this.state.resources.integrity,
        this.state.resources.alarm,
      );
      this.triggerEnding(
        emergency === "evacuation"
          ? "emergency_evacuation"
          : emergency === "urgent_alarm"
            ? "emergency_alarm"
            : "normal",
      );
      return;
    }

    if (scene.type === "storm_challenge" && nextId === scene.id) {
      // Next storm round
      this.state.phase = "selection";
      this.state.currentStormRound++;
      this.state.roundId++;
      this.resetSceneInputs();
      this.state.pendingNextSceneId = undefined;
      this.state.phaseDuration = 60;
      this.state.phaseTimeRemaining = 60;
      this.notify();
      return;
    }

    if (nextId && nextScene) {
      this.state.currentSceneId = nextId;
      this.state.pendingNextSceneId = undefined;
      this.state.roundId++;
      this.state.sceneInstanceId = `inst_${Date.now()}`;
      this.state.phase = "selection";
      this.state.phaseDuration = 90;
      this.state.phaseTimeRemaining = 90;
      this.resetSceneInputs();
      sound.playRuneActivation();
      this.notify();
    }
  }

  public triggerEnding(
    type: "normal" | "emergency_alarm" | "emergency_evacuation",
  ) {
    if (this.state.ending) return;
    this.state.revision++;
    if (type === "normal") {
      this.state.phase = "victory";
      this.state.ending = {
        conditionType: "normal",
        title: "Hoàn Thành Sứ Mệnh: Ngọn Đèn Thiêng Tỏa Sáng Rực Rỡ",
        narrative:
          "Cánh cổng Trạm Trú Ẩn Rừng Thông Thì Thầm mở toang trong niềm hân hoan. Ngọn đèn pha lê được đặt lên đỉnh hải đăng trên núi, tỏa ra vầng hào quang hoàng kim bảo bọc khắp thung lũng.",
        routeUnlocked: "Tuyến Đường Đèn Phía Bắc",
        journalEntry:
          "Đã giao tim đèn nguyên vẹn. Tuyến đường được mở với đầy đủ vinh danh.",
      };
      sound.playVictory();
    } else if (type === "emergency_alarm") {
      this.state.phase = "victory";
      this.state.ending = {
        conditionType: "emergency_alarm",
        title: "Cập Cổng Cứu Hộ Khẩn Cấp",
        narrative:
          "Cỗ xe tông vào tường lũy khẩn cấp của tiền trạm ngay khi sương mù ập tới. Những người gác trạm phải dùng cạn kho nhiên liệu dự phòng để kéo hàng hóa và đoàn người vào trong an toàn.",
        routeUnlocked: "Tuyến Đường Đèn Phía Bắc (Cạn Kiệt Dự Trữ Tiền Trạm)",
        journalEntry:
          "Phá cửa khẩn cấp vào trạm. Tuyến đường được mở, nhưng kho dự trữ tiền trạm đã cạn kiệt.",
      };
      sound.playVictory();
    } else {
      this.state.phase = "game_over";
      this.state.ending = {
        conditionType: "emergency_evacuation",
        title: "Bỏ Lại Đoàn Xe: Sơ Tán Khẩn Cấp",
        narrative:
          "Khi thân xe vỡ nát, đội ngũ đã phải bỏ lại khung xe và đi bộ mang tim đèn thiết yếu về phía trước. Trinh sát tiền trạm đã thu hồi được hàng, nhưng cỗ xe giờ nằm bất động trong màn sương mù.",
        seasonDebt: "Nợ Sửa Chữa Xe: 4 Lương thảo",
        journalEntry:
          'Xe bị bỏ lại tại đèo cao. Mở nhiệm vụ giải cứu "Bánh Răng Cổ Tự Thất Lạc".',
      };
      sound.playStormRumble();
    }

    // Record in Season Journal
    this.state.seasonRecord.journal.push({
      missionId: this.state.packId,
      missionTitle: this.getCurrentPack().title,
      date: new Date().toISOString().slice(0, 10),
      summary: this.state.ending.narrative,
      crewNotes: `Ending: ${this.state.ending.title} · Final Supplies: ${this.state.resources.supplies}, Integrity: ${this.state.resources.integrity}, Alarm: ${this.state.resources.alarm}`,
    });

    if (
      this.state.ending.routeUnlocked &&
      !this.state.seasonRecord.unlockedRoutes.includes(
        this.state.ending.routeUnlocked,
      )
    ) {
      this.state.seasonRecord.unlockedRoutes.push(
        this.state.ending.routeUnlocked,
      );
    }

    this.notify();
  }

  public pauseRoom() {
    this.state.revision++;
    this.state.isPaused = !this.state.isPaused;
    sound.playClick(400);
    this.notify();
  }

  public extendTime(seconds: number = 30) {
    this.state.revision++;
    this.state.phaseTimeRemaining += seconds;
    this.state.phaseDuration += seconds;
    sound.playClick(600);
    this.notify();
  }

  public loadPack(packId: string) {
    const pack = this.packRegistry[packId];
    if (!pack) return;
    const previous = this.state;
    this.state = createInitialState(pack);
    this.state.seasonRecord = structuredClone(previous.seasonRecord);
    this.state.crewName = previous.crewName;
    this.state.emblem = previous.emblem;
    this.state.guidingPrinciple = previous.guidingPrinciple;
    this.state.players = previous.players.map((player) => ({
      ...player,
      ready: false,
      effortAvailable: true,
      roleAbilityAvailable: true,
      selectedAction: undefined,
    }));
    this.state.revision = previous.revision + 1;
    this.notify();
  }

  public resetMission() {
    this.loadPack(this.state.packId);
  }
}

export const roomStore = new RoomStore();
