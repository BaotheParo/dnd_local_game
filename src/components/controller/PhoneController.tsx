/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState, Player, SQUADS, SquadId, ROLE_NAMES } from "../../types/game";
import { roomStore } from "../../engine/roomStore";
import { TitleScreen } from "../tv/TitleScreen";
import {
  Shield,
  Zap,
  Sun,
  Share2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Flame,
  AlertCircle,
  Compass,
  Heart,
  Package,
  Wrench,
  ChevronRight,
} from "lucide-react";

interface PhoneControllerProps {
  state: GameState;
  activePlayerId: string;
  onSelectPlayer: (id: string) => void;
  onSwitchToTV?: () => void;
}

export const PhoneController: React.FC<PhoneControllerProps> = ({
  state,
  activePlayerId,
  onSelectPlayer,
  onSwitchToTV,
}) => {
  const [activeTab, setActiveTab] = useState<"action" | "clues" | "profile">(
    "action",
  );
  const player =
    state.players.find((p) => p.id === activePlayerId) || state.players[0];
  const scene = roomStore.getCurrentScene();
  const squad = SQUADS[player.squad];

  // Filter clues for this player
  const playerClues = (scene.clues || []).filter(
    (c) =>
      c.assignedSquad === player.squad ||
      c.assignedRole === player.role ||
      (c.number - 1) % state.players.length === player.seatIndex,
  );

  const isStorm = scene.type === "storm_challenge";
  const hasVoted = !!state.votes[player.id];
  const selectedStormAction = state.currentStormActions[player.id];
  const isPledgedEffort = state.pledgedEffort.includes(player.id);

  // Guardian reaction check
  const roundState =
    isStorm && state.stormRoundsHistory[state.currentStormRound - 1];
  const isGuardianWindow = state.phase === "guardian_reaction";
  const canGuardianReact =
    isGuardianWindow &&
    player.role === "Guardian" &&
    player.roleAbilityAvailable &&
    roundState &&
    roundState.lossesGenerated[player.squad] > 0;

  if (state.phase === "title") return <TitleScreen />;

  return (
    <div className="controller-shell w-full max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans border-x border-slate-800 shadow-2xl">
      {/* SEAT SWITCHER HEADER & IDENTITY BAR */}
      <header className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{player.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5">
              {/* Seat Selector Dropdown */}
              <select
                value={player.id}
                onChange={(e) => onSelectPlayer(e.target.value)}
                aria-label="Chọn vị trí người chơi"
                className="bg-slate-800 border border-slate-700 text-xs font-bold text-amber-200 rounded px-2 py-0.5"
              >
                {state.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    Vị trí {p.seatIndex + 1}: {p.name} ({ROLE_NAMES[p.role] || p.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span
                style={{ color: squad.accentColor }}
                className="font-semibold"
              >
                {squad.symbol} {squad.name}
              </span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                {ROLE_NAMES[player.role] || player.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onSwitchToTV && (
            <button
              onClick={onSwitchToTV}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
            >
              Màn hình TV
            </button>
          )}
        </div>
      </header>

      {/* QUICK STATUS TICKER (Supplies, Integrity, Alarm) */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950 text-center text-xs border-b border-slate-800/80 font-mono">
        <div className="bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40">
          <span className="text-slate-400 text-[10px]">LƯƠNG THẢO:</span>{" "}
          <strong className="text-emerald-400 font-bold">
            {state.resources.supplies}
          </strong>
        </div>
        <div className="bg-sky-950/40 p-1.5 rounded border border-sky-900/40">
          <span className="text-slate-400 text-[10px]">ĐỘ BỀN:</span>{" "}
          <strong className="text-sky-400 font-bold">
            {state.resources.integrity}
          </strong>
        </div>
        <div
          className={`p-1.5 rounded border ${
            state.resources.alarm >= 4
              ? "bg-rose-950/60 border-rose-600 text-rose-300 font-bold"
              : "bg-amber-950/40 border-amber-900/40 text-amber-400"
          }`}
        >
          <span className="text-slate-400 text-[10px]">BÁO ĐỘNG:</span>{" "}
          <strong>{state.resources.alarm}</strong>
        </div>
      </div>

      <div className="input-status" role="status" aria-live="polite">
        {state.isPaused
          ? "Chuyến đi đang tạm dừng. Các lựa chọn của bạn vẫn an toàn; vui lòng chờ trưởng đoàn tiếp tục."
          : state.phase === "selection"
            ? player.ready
              ? "Đã sẵn sàng. Bạn vẫn có thể thay đổi lựa chọn cho đến khi mở kết quả."
              : "Đọc tình huống, bàn bạc kế hoạch, sau đó chọn hành động và bấm Sẵn Sàng."
            : state.phase === "lobby"
              ? "Nhận vị trí trạm và bấm Sẵn Sàng khi bạn đã nắm rõ vai trò của mình."
              : "Thời gian đưa ra quyết định đã kết thúc. Hãy nhìn lên màn hình chung để xem kết quả."}
      </div>

      {/* GUARDIAN EMERGENCY REACTION POPUP (10s window) */}
      {canGuardianReact && (
        <div className="m-3 p-4 bg-rose-950 border-2 border-rose-500 rounded-xl shadow-2xl animate-pulse text-center">
          <div className="text-xs font-bold text-rose-200 uppercase tracking-wider mb-1">
            ⚠️ CAN THIỆP KHẨN CẤP CỦA HỘ VỆ ({state.phaseTimeRemaining}s)
          </div>
          <p className="text-xs text-rose-100 mb-3">
            Trạm {squad.name} của bạn đang bị tổn hại kết cấu! Bạn có muốn dùng kỹ năng
            Hộ Vệ để chặn đứng thiệt hại này không?
          </p>
          <button
            onClick={() =>
              roomStore.useGuardianAbility(player.id, player.squad)
            }
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 text-slate-950 font-bold text-sm rounded-lg shadow-lg"
          >
            🛡️ DỰNG KHIÊN BẢO VỆ TRẠM (CHẶN 1 TỔN THẤT)
          </button>
        </div>
      )}

      {/* CONTROLLER NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 bg-slate-900/60">
        <button
          onClick={() => setActiveTab("action")}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            activeTab === "action"
              ? "text-amber-300 border-b-2 border-amber-400 bg-slate-800/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Hành Động & Bình Chọn
        </button>
        <button
          onClick={() => setActiveTab("clues")}
          className={`flex-1 py-2.5 text-xs font-bold relative transition-colors ${
            activeTab === "clues"
              ? "text-amber-300 border-b-2 border-amber-400 bg-slate-800/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Manh Mối Riêng ({playerClues.length})
          {playerClues.length > 0 && (
            <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 inline-block" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            activeTab === "profile"
              ? "text-amber-300 border-b-2 border-amber-400 bg-slate-800/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Kỹ Năng & Mục Tiêu
        </button>
      </div>

      {/* MAIN BODY ACCORDING TO TAB */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        <div>
          <span className="eyebrow">CHƯƠNG TIẾP THEO CỦA BẠN</span>
          <h2 className="font-serif text-lg text-amber-200 mt-2">
            {scene.title}
          </h2>
        </div>
        <fieldset
          className="space-y-4"
          disabled={
            state.isPaused ||
            (activeTab === "action" &&
              !["lobby", "selection"].includes(state.phase))
          }
        >
          {activeTab === "action" ? (
            <>
              {/* LOBBY PHASE */}
              {state.phase === "lobby" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-3xl">{player.avatar}</span>
                    <h3 className="font-serif font-bold text-amber-200 text-lg mt-1">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Được phân công vào{" "}
                      <strong style={{ color: squad.accentColor }}>
                        {squad.name}
                      </strong>{" "}
                      với vai trò là{" "}
                      <strong className="text-amber-300">{ROLE_NAMES[player.role] || player.role}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">
                      Luyện tập thao tác:
                    </div>
                    <button
                      onClick={() =>
                        roomStore.setPlayerReady(player.id, !player.ready)
                      }
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        player.ready
                          ? "bg-emerald-600 text-slate-950 shadow-md"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {player.ready
                        ? "ĐÃ SẴN SÀNG (Bấm để hủy)"
                        : "XÁC NHẬN SẴN SÀNG"}
                    </button>
                  </div>
                </div>
              )}

              {/* STORM CHALLENGE ALLOCATION (Shield / Supply / Repel) */}
              {isStorm && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl">
                    <div className="text-xs font-bold text-rose-300 flex items-center justify-between">
                      <span>⚡ HIỆP BÃO {state.currentStormRound} / 3</span>
                      <span className="font-mono text-slate-300">
                        Thời gian: {state.phaseTimeRemaining}s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Hãy chọn nhiệm vụ cho hiệp này. Phối hợp nhịp nhàng cùng đồng đội!
                    </p>
                  </div>

                  {/* Primary Action Buttons (44px+ touch targets) */}
                  <div className="space-y-2.5">
                    {/* SHIELD */}
                    <button
                      onClick={() =>
                        roomStore.submitStormAction(player.id, "Shield")
                      }
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all min-h-[58px] cursor-pointer ${
                        selectedStormAction === "Shield"
                          ? "bg-sky-950 border-sky-400 text-sky-100 shadow-lg ring-2 ring-sky-500/40"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-sky-900/60 text-sky-400">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            Dựng Khiên Phòng Hộ
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Bảo vệ {squad.name} chống lại các đợt xâm nhập
                          </div>
                        </div>
                      </div>
                      {selectedStormAction === "Shield" && (
                        <span className="text-xs bg-sky-500 text-slate-950 font-black px-2 py-1 rounded">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </button>

                    {/* SUPPLY */}
                    <button
                      onClick={() =>
                        roomStore.submitStormAction(player.id, "Supply")
                      }
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all min-h-[58px] cursor-pointer ${
                        selectedStormAction === "Supply"
                          ? "bg-amber-950 border-amber-400 text-amber-100 shadow-lg ring-2 ring-amber-500/40"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-amber-900/60 text-amber-400">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">Nạp Động Cơ</div>
                          <div className="text-[11px] text-slate-400">
                            Tiếp năng lượng cho cỗ xe; đóng góp vào ngưỡng Lương thảo
                          </div>
                        </div>
                      </div>
                      {selectedStormAction === "Supply" && (
                        <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-1 rounded">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </button>

                    {/* REPEL */}
                    <button
                      onClick={() =>
                        roomStore.submitStormAction(player.id, "Repel")
                      }
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all min-h-[58px] cursor-pointer ${
                        selectedStormAction === "Repel"
                          ? "bg-emerald-950 border-emerald-400 text-emerald-100 shadow-lg ring-2 ring-emerald-500/40"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-400">
                          <Sun className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">Xua Đuổi Quái Sương</div>
                          <div className="text-[11px] text-slate-400">
                            Bắn tan xúc tu quái vật sương mù; giảm 1 Báo động
                          </div>
                        </div>
                      </div>
                      {selectedStormAction === "Repel" && (
                        <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2 py-1 rounded">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Optional Purchased Shield for this squad */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Gia Cố Khiên Bảo Hộ Của Đội
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Chi phí:{" "}
                          {state.flags.bellBehaviorLearned &&
                          !state.flags.bellDiscountUsed
                            ? "1 Lương thảo"
                            : "2 Lương thảo"}
                          . Tăng +1 Khiên cho {squad.name}.
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          roomStore.purchaseStormShield(
                            player.squad,
                            player.role === "Engineer" ? player.id : undefined,
                          )
                        }
                        disabled={
                          state.resources.supplies <
                            (state.flags.bellBehaviorLearned ? 1 : 2) ||
                          (state.currentRoundPurchasedShields[player.squad] ||
                            0) >= 1
                        }
                        className="px-3 py-2 bg-sky-900 hover:bg-sky-800 disabled:opacity-40 text-sky-200 text-xs font-bold rounded-lg border border-sky-500/40"
                      >
                        {(state.currentRoundPurchasedShields[player.squad] ||
                          0) >= 1
                          ? "Khiên Đang Bật"
                          : "Mua Khiên"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PUZZLE BRIDGE CANDIDATE SELECTION */}
              {scene.type === "clue_puzzle" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-amber-300">
                      Chọn Nhịp Cầu Đề Cử Cho {squad.name}:
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hãy cùng đồng đội phân tích manh mối. Chỉ một cây cầu duy nhất
                      thỏa mãn cả tải trọng, thời tiết và đích đến!
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {(["north", "middle", "south"] as const).map(
                        (bridgeId) => {
                          const isCandidate =
                            state.puzzleCandidates[player.squad] === bridgeId;
                          const bridgeLabel =
                            bridgeId === "north"
                              ? "Cầu Bắc"
                              : bridgeId === "middle"
                                ? "Cầu Giữa"
                                : "Cầu Nam";
                          return (
                            <button
                              key={bridgeId}
                              onClick={() =>
                                roomStore.submitPuzzleCandidate(
                                  player.squad,
                                  bridgeId,
                                )
                              }
                              className={`py-3 px-2 rounded-xl border font-bold text-xs uppercase transition-all ${
                                isCandidate
                                  ? "bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                              }`}
                            >
                              {bridgeLabel}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Hint Request Controls */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Gợi Ý Khả Dụng ({state.flags.hintsUnlocked} / 3)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mở gợi ý chuẩn sẽ tăng +1 Báo động. Kỹ năng Trinh Sát
                          mở gợi ý đầu tiên miễn phí!
                        </div>
                      </div>

                      {player.role === "Scout" &&
                      player.roleAbilityAvailable &&
                      state.flags.hintsUnlocked === 0 ? (
                        <button
                          onClick={() =>
                            roomStore.useScoutHintAbility(player.id)
                          }
                          className="px-3 py-1.5 bg-sky-900 hover:bg-sky-800 text-sky-200 text-xs font-bold rounded-lg border border-sky-400"
                        >
                          Gợi Ý Trinh Sát (MIỄN PHÍ)
                        </button>
                      ) : (
                        <button
                          onClick={() => roomStore.unlockStandardHint()}
                          disabled={state.flags.hintsUnlocked >= 3}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-200 text-xs font-bold rounded-lg border border-slate-700"
                        >
                          +1 Gợi Ý (+1 Báo Động)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GROUP PREDICTION VOTE */}
              {scene.type === "group_prediction" && scene.predictionConfig && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-left">
                    <div className="text-xs font-bold text-amber-300">
                      Câu hỏi:
                    </div>
                    <p className="text-xs text-slate-200 mt-1 italic">
                      "{scene.predictionConfig.question}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400">
                      Bước 1: Lựa Chọn Bí Mật Của Bạn
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {scene.predictionConfig.options.map((opt) => {
                        const isChosen =
                          state.predictionAnswers[player.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() =>
                              roomStore.submitPredictionAnswer(player.id, opt)
                            }
                            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                              isChosen
                                ? "bg-amber-950 border-amber-400 text-amber-200 font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-300"
                            }`}
                          >
                            {isChosen ? "✓ " : ""}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-xs font-bold text-slate-400">
                      Bước 2: Dự Đoán Câu Trả Lời Phổ Biến Nhất
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {scene.predictionConfig.options.map((opt) => {
                        const isGuess =
                          state.predictionGuesses[player.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() =>
                              roomStore.submitPredictionGuess(player.id, opt)
                            }
                            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                              isGuess
                                ? "bg-sky-950 border-sky-400 text-sky-200 font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-300"
                            }`}
                          >
                            {isGuess ? "★ " : ""}Dự đoán: {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* NARRATIVE CHOICE SCENE (e.g. Ferry Rescue, Crossing, Tracks, Rest Stop) */}
              {scene.type === "narrative_choice" ||
              scene.type === "rest_stop" ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300">
                    Bình chọn quyết định cho Đoàn Xe:
                  </div>

                  {(scene.options || []).map((opt) => {
                    const isVoted = state.votes[player.id] === opt.id;
                    const canAfford =
                      !opt.suppliesCost ||
                      state.resources.supplies >= opt.suppliesCost;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (canAfford) roomStore.castVote(player.id, opt.id);
                        }}
                        disabled={!canAfford}
                        className={`w-full p-4 rounded-xl border text-left transition-all min-h-[58px] cursor-pointer ${
                          !canAfford
                            ? "bg-slate-900/40 border-slate-850 opacity-40 cursor-not-allowed"
                            : isVoted
                              ? "bg-amber-950 border-amber-400 text-amber-100 shadow-lg ring-2 ring-amber-500/40"
                              : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-100">
                            {opt.title}
                          </span>
                          {isVoted && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded">
                              ĐÃ BÌNH CHỌN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          {opt.description}
                        </p>
                        <div className="text-[11px] font-mono text-amber-300/90 font-medium">
                          {opt.effectsSummary}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* PERSONAL EFFORT TOKEN PLEDGE (for risk tests) */}
              {scene.options?.some((option) => option.isRiskTest) && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Token Nỗ Lực Cá Nhân:
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {player.effortAvailable
                          ? "Cống hiến 1 Nỗ Lực (+1 vào Thử Thách Rủi Ro chung, tối đa 4 Nỗ Lực)"
                          : "Token Nỗ Lực đã được dùng trong chuyến đi này"}
                      </div>
                    </div>

                    <button
                      onClick={() => roomStore.toggleEffort(player.id)}
                      disabled={!player.effortAvailable}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !player.effortAvailable
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : isPledgedEffort
                            ? "bg-amber-500 text-slate-950 shadow"
                            : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                      }`}
                    >
                      {isPledgedEffort ? "ĐÃ CỐNG HIẾN" : "DỐC SỨC"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === "clues" ? (
            /* PRIVATE CLUES TAB */
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Thẻ Bài Tình Báo Của Bạn</span>
                <span className="text-slate-500">
                  {playerClues.length} Khả dụng
                </span>
              </div>

              {playerClues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-900 rounded-xl border border-slate-800">
                  Không có manh mối riêng cho tình huống này. Hãy lắng nghe
                  đồng đội của bạn!
                </div>
              ) : (
                playerClues.map((clue) => {
                  const isShared = state.sharedClues.some(
                    (sc) => sc.cardId === clue.id,
                  );
                  return (
                    <div
                      key={clue.id}
                      className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-amber-400 font-bold">
                          THẺ SỐ #{clue.number}
                        </span>
                        <span className="text-slate-500">
                          {clue.corroboration}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-100">
                        {clue.title}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        {clue.fact}
                      </p>

                      <button
                        onClick={() => roomStore.shareClue(player.id, clue.id)}
                        disabled={isShared}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isShared
                            ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default"
                            : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer"
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        {isShared
                          ? "ĐÃ PHÁT LÊN MÀN HÌNH CHUNG ✓"
                          : "CHIA SẺ LÊN MÀN HÌNH CHUNG"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* PROFILE, ROLE & GOAL TAB */
            <div className="space-y-3 text-left">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{player.avatar}</span>
                  <div>
                    <h3 className="font-serif font-bold text-amber-200 text-base">
                      {player.name}
                    </h3>
                    <div className="text-xs text-slate-400">
                      Trạm: {squad.name} · Vai trò: {ROLE_NAMES[player.role] || player.role}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-300">
                    Kỹ Năng Dùng Một Lần Mỗi Chuyến Đi:
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                    {player.role === "Scout" && (
                      <>
                        <strong>Ưng Nhãn Tiền Tiêu:</strong> Mở gợi ý câu đố
                        đầu tiên của cảnh mà không làm tăng mức Báo động của
                        đoàn xe.
                      </>
                    )}
                    {player.role === "Engineer" && (
                      <>
                        <strong>Thợ Máy Cổ Tự:</strong> Giảm 1 Lương thảo chi
                        phí khi mua khiên bão hoặc sửa chữa thân xe.
                      </>
                    )}
                    {player.role === "Guardian" && (
                      <>
                        <strong>Lá Chắn Kiên Cố:</strong> Hóa giải 1 tổn thất Độ
                        bền ở đội của bạn sau khi kết quả hiệp bão được công bố.
                      </>
                    )}
                    <div className="mt-2 text-[11px] font-mono">
                      Trạng thái:{" "}
                      <strong
                        className={
                          player.roleAbilityAvailable
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      >
                        {player.roleAbilityAvailable
                          ? "SẴN SÀNG SỬ DỤNG"
                          : "ĐÃ SỬ DỤNG"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-400">
                    Mục Tiêu Cá Nhân:
                  </div>
                  <div className="text-xs text-slate-300 italic">
                    "{player.goalCard || "Vận chuyển tim đèn an toàn đến trạm trú ẩn và duy trì độ bền thân xe trên 3 đơn vị."}"
                  </div>
                </div>
              </div>
            </div>
          )}
        </fieldset>
        {state.phase === "selection" && (
          <button
            disabled={state.isPaused}
            onClick={() => roomStore.setPlayerReady(player.id, !player.ready)}
            className="brass-button w-full"
          >
            <CheckCircle2 size={18} />
            {player.ready
              ? "Sẵn sàng — chạm để tiếp tục thảo luận"
              : "Tôi đã chọn xong"}
          </button>
        )}
      </main>

      {/* FOOTER */}
      <footer className="p-2.5 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
        Vị trí {player.seatIndex + 1} / {state.players.length} · Phòng:{" "}
        {state.roomId}
      </footer>
    </div>
  );
};
