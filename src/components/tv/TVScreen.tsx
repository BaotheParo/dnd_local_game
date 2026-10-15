/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  GameState,
  SQUADS,
  SquadId,
  ROLE_NAMES,
  PHASE_NAMES,
  SCENE_TYPE_NAMES,
} from "../../types/game";
import { WorldBackdrop as WorldCanvas } from "../canvas/WorldBackdrop";
import { TitleScreen } from "./TitleScreen";
import { JourneyRoute } from "./JourneyRoute";
import { roomStore } from "../../engine/roomStore";
import {
  getSquadConfigForCount,
  getThreatenedSquads,
} from "../../engine/rules";
import {
  Shield,
  Zap,
  Sun,
  Flame,
  AlertTriangle,
  Heart,
  Package,
  Clock,
  Compass,
  Volume2,
  VolumeX,
  Share2,
} from "lucide-react";
import { sound } from "../../audio/synth";

interface TVScreenProps {
  state: GameState;
  onSwitchToPhone?: () => void;
  onOpenTestCockpit?: () => void;
}

export const TVScreen: React.FC<TVScreenProps> = ({
  state,
  onSwitchToPhone,
  onOpenTestCockpit,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const scene = roomStore.getCurrentScene();
  const currentPack = roomStore.getCurrentPack();

  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?view=phone`
      : "";

  useEffect(() => {
    QRCode.toDataURL(currentUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: "#0f172a",
        light: "#f8fafc",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [currentUrl]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard shortcut listener for Enter / Space / Esc
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input, select, textarea, button")
      )
        return;
      if (e.key === "Escape" && state.phase !== "title") {
        e.preventDefault();
        roomStore.pauseRoom();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase]);

  const isStorm = scene.type === "storm_challenge";
  const squadConfig = getSquadConfigForCount(state.players.length);
  const threatenedSquads = isStorm
    ? getThreatenedSquads(state.currentStormRound, squadConfig.squadCount)
    : [];

  const readyCount = state.players.filter((p) => p.ready).length;

  if (state.phase === "title") return <TitleScreen />;

  return (
    <div className="game-tv relative w-full min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* 60fps Isolated Interactive Canvas Background */}
      <WorldCanvas
        sceneType={scene.type}
        integrity={state.resources.integrity}
        alarm={state.resources.alarm}
        isStormActive={isStorm}
        threatenedSquadCount={threatenedSquads.length}
      />

      {/* Low-Occlusion UI Wrapper: pointer-events-none on root so 85%+ playfield is unobstructed */}
      <div className="tv-layout relative min-h-screen flex flex-col justify-between p-6 pointer-events-none z-10">
        {/* TOP STATUS CLUSTER (World-Matched Palette, Tabular Numbers) */}
        <header className="tv-header flex items-center justify-between pointer-events-auto">
          {/* Caravan & Location Identity */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-none">
            <span className="text-2xl">{state.emblem}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-amber-200 tracking-wide text-lg">
                  {state.crewName}
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                  {currentPack.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {scene.subtitle} · {state.guidingPrinciple}
              </p>
            </div>
          </div>

          {/* Three Shared Meters: Supplies (0-12), Integrity (0-6), Alarm (0-6) */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-700/60 rounded-xl px-5 py-2.5 shadow-2xl">
            {/* Supplies */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold">
                  Lương thảo
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-200">
                  {state.resources.supplies}
                  <span className="text-xs text-slate-500 font-normal">
                    /12
                  </span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            {/* Integrity */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-sky-400/80 font-bold">
                  Độ bền
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-sky-200">
                  {state.resources.integrity}
                  <span className="text-xs text-slate-500 font-normal">/6</span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            {/* Alarm */}
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg border text-amber-400 transition-colors ${
                  state.resources.alarm >= 4
                    ? "bg-rose-950/90 border-rose-500/60 text-rose-400 animate-pulse"
                    : "bg-amber-950/80 border-amber-500/40"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">
                  Báo động
                </div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums ${
                    state.resources.alarm >= 4
                      ? "text-rose-300 font-black"
                      : "text-amber-200"
                  }`}
                >
                  {state.resources.alarm}
                  <span className="text-xs text-slate-500 font-normal">/6</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Audio Mute & Quick View Toggles */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/60 rounded-xl p-1.5 shadow-2xl">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-colors"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onSwitchToPhone}
              className="px-3 py-1.5 rounded-lg bg-sky-950/80 border border-sky-500/40 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>📱</span> Điện thoại
            </button>
            <button
              onClick={onOpenTestCockpit}
              className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>⚡</span> Buồng mô phỏng
            </button>
          </div>
        </header>

        <JourneyRoute sceneId={state.currentSceneId} />

        {/* PAUSED BANNER */}
        {state.isPaused && (
          <div className="pointer-events-auto self-center bg-amber-500/90 text-slate-950 font-bold px-8 py-3 rounded-full text-lg shadow-2xl animate-pulse">
            TẠM DỪNG · Nhấn ESC hoặc dùng Bảng Trưởng Đoàn để tiếp tục
          </div>
        )}

        {/* CENTER STAGE ACCORDING TO PHASE */}
        {state.phase === "lobby" ? (
          <div className="max-w-4xl mx-auto w-full my-auto pointer-events-auto bg-slate-950/85 border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                Tiền Trạm Đèn Lồng · Tập Hợp Đội Ngũ
              </span>
              <h2 className="font-serif text-3xl font-bold text-amber-100 mt-2">
                Mọi chuyến đi đều khởi đầu từ một đội ngũ
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Chọn vị trí phân công trong buồng mô phỏng, sẵn sàng dõi theo
                ánh hoa đăng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* QR Code & Direct Link */}
              <div className="flex flex-col items-center justify-center bg-slate-900/90 p-5 rounded-xl border border-slate-800 text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Join QR Code"
                    className="w-36 h-36 rounded-lg shadow-md mb-3"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    Đang tải mã QR...
                  </div>
                )}
                <div className="text-xs text-slate-400 font-mono break-all px-2">
                  {currentUrl}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Liên kết xem trước. Điện thoại riêng lẻ chưa đồng bộ cùng phiên
                  duyệt này.
                </p>
                <div className="text-[11px] text-amber-400 font-bold mt-2">
                  PHÒNG: {state.roomId}
                </div>
              </div>

              {/* Roster & Squad Breakdown */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-slate-800">
                  <span>DANH SÁCH ĐỘI NGŨ ({state.players.length} Vị trí)</span>
                  <span className="text-emerald-400 font-bold">
                    {readyCount}/{state.players.length} ĐÃ SẴN SÀNG
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {state.players.map((p) => {
                    const squadInfo = SQUADS[p.squad];
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          p.ready
                            ? "bg-emerald-950/50 border-emerald-500/60 shadow-sm"
                            : "bg-slate-900/80 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{p.avatar}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
                            style={{
                              backgroundColor: `${squadInfo?.color}25`,
                              color: squadInfo?.accentColor,
                            }}
                          >
                            {squadInfo?.name}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                          <span>{ROLE_NAMES[p.role] || p.role}</span>
                          <span
                            className={
                              p.ready
                                ? "text-emerald-400 font-bold"
                                : "text-slate-600"
                            }
                          >
                            {p.ready ? "✓ SẴN SÀNG" : "Đang chờ"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Ai cũng có một vị trí trên cỗ xe này.
                  </span>
                  <button
                    onClick={() => roomStore.startMission()}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    XUẤT PHÁT RỜI TRẠM ĐÈN →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : state.phase === "victory" || state.phase === "game_over" ? (
          /* VICTORY OR RESCUE ENDING MODAL */
          <div className="max-w-2xl mx-auto my-auto pointer-events-auto bg-slate-950/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center">
            <div className="text-5xl mb-3">
              {state.ending?.conditionType === "normal"
                ? "🏆"
                : state.ending?.conditionType === "emergency_alarm"
                  ? "⚡"
                  : "🛡️"}
            </div>
            <h2 className="font-serif text-3xl font-black text-amber-200 mb-2">
              {state.ending?.title}
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              {state.ending?.narrative}
            </p>

            {state.ending?.routeUnlocked && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 mb-4 text-emerald-200 text-sm font-semibold flex items-center justify-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span>MỞ KHÓA MÙA GIẢI: {state.ending.routeUnlocked}</span>
              </div>
            )}

            {state.ending?.seasonDebt && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 mb-4 text-rose-200 text-sm font-semibold flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>HẬU QUẢ MÙA GIẢI: {state.ending.seasonDebt}</span>
              </div>
            )}

            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-left text-xs text-slate-300 mb-6 space-y-1 font-mono">
              <div className="text-amber-400 font-bold mb-1">
                NHẬT KÝ LỮ HÀNH:
              </div>
              <div>• {state.ending?.journalEntry}</div>
              <div>
                • Tình trạng gia đình:{" "}
                {state.flags.familyAboard
                  ? "Được chở an toàn trên xe"
                  : state.flags.familyRescuedByGear
                    ? "Được cứu bằng thuyền"
                    : "Đã báo tuần tra"}
              </div>
              <div>
                • Tài nguyên cuối: {state.resources.supplies} Lương thảo ·{" "}
                {state.resources.integrity} Độ bền · {state.resources.alarm}{" "}
                Báo động
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => roomStore.resetMission()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-transform active:scale-95"
              >
                CHƠI LẠI NHIỆM VỤ
              </button>
              <button
                onClick={() => roomStore.loadPack("the_switched_signs")}
                className="px-6 py-2.5 bg-sky-900 hover:bg-sky-800 text-sky-200 font-bold rounded-xl border border-sky-500/40 shadow-lg transition-transform active:scale-95"
              >
                CHƠI NHIỆM VỤ TIẾP THEO (BIỂN CHỈ DẪN BỊ ĐỔI)
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE PLAYING VIEW */
          <div className="w-full max-w-5xl mx-auto my-auto pointer-events-auto space-y-4">
            {/* SCENE HEADER & OBJECTIVE */}
            <div className="bg-slate-950/85 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                    {SCENE_TYPE_NAMES[scene.type]?.toUpperCase() ||
                      scene.type.replace("_", " ").toUpperCase()}
                  </span>
                  <h2 className="font-serif text-2xl font-black text-amber-100 mt-1">
                    {scene.title}
                  </h2>
                </div>

                {/* Phase Timer */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 font-bold tabular-nums">
                    {state.phaseTimeRemaining}s
                  </span>
                </div>
              </div>

              <p className="text-sm md:text-base text-slate-300 mt-3 leading-relaxed font-sans font-normal">
                {scene.publicNarration}
              </p>
            </div>

            {/* DYNAMIC SCENE CONTENT */}
            {state.phase === "selection" && scene.options && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scene.options.map((option, index) => (
                  <article
                    key={option.id}
                    className="bg-slate-950/90 border border-slate-700/60 rounded-xl p-5"
                  >
                    <span className="eyebrow">
                      LỰA CHỌN {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif text-amber-200 text-base mt-3 mb-2">
                      {option.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {option.description}
                    </p>
                    <p className="text-xs text-amber-300 mt-4">
                      {option.effectsSummary}
                    </p>
                  </article>
                ))}
              </div>
            )}
            {scene.type === "storm_challenge" ? (
              /* TACTICAL STORM SQUAD DISPLAY */
              <div className="bg-slate-950/85 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛈️</span>
                    <span className="font-serif font-bold text-amber-200 text-lg">
                      Phòng Thủ Bão Sương: Hiệp {state.currentStormRound} / 3
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    Hiệp Động Lực Thành Công: {state.flags.successfulPowerRounds}
                    /2 Mục Tiêu
                  </div>
                </div>

                {/* Squad Stations Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["pathfinder", "mechanics", "logistics"] as SquadId[]).map(
                    (squadId) => {
                      const squad = SQUADS[squadId];
                      if (
                        squadConfig.squadCount === 2 &&
                        squadId === "logistics"
                      )
                        return null;

                      const isThreatened = threatenedSquads.includes(squadId);
                      const baseNeed = squadConfig.baseShieldNeeds[squadId];
                      const extraNeed =
                        state.flags.familyAboard &&
                        state.currentStormRound === 2 &&
                        (squadConfig.squadCount === 3
                          ? squadId === "logistics"
                          : squadId === "mechanics")
                          ? 1
                          : 0;
                      const totalNeed = baseNeed + extraNeed;

                      // Count contributed shields in this squad
                      const revealed =
                        state.phase === "consequences" ||
                        state.phase === "guardian_reaction";
                      const round = state.stormRoundsHistory.at(-1);
                      const contributedShields =
                        revealed && round
                          ? (round.purchasedShields[squadId] || 0) +
                            state.players.filter(
                              (p) =>
                                p.squad === squadId &&
                                round.playerAssignments[p.id] === "Shield",
                            ).length
                          : null;

                      return (
                        <div
                          key={squadId}
                          className={`p-4 rounded-xl border relative transition-all ${
                            isThreatened
                              ? "bg-rose-950/40 border-rose-500/70 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                              : "bg-slate-900/80 border-slate-800"
                          }`}
                        >
                          {isThreatened && (
                            <span className="absolute -top-2.5 right-3 bg-rose-600 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                              BỊ ĐE DỌA
                            </span>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{squad.symbol}</span>
                            <div>
                              <div className="font-serif font-bold text-slate-200 text-sm">
                                Trạm {squad.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {squadConfig.sizes[squadId]} thành viên phụ
                                trách
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mt-2">
                            <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                              <Shield className="w-4 h-4 text-sky-400" /> Cấp độ
                              Khiên:
                            </span>
                            <span className="font-mono font-bold text-sm">
                              <span
                                className={
                                  contributedShields !== null &&
                                  contributedShields >= totalNeed
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }
                              >
                                {contributedShields ?? "Đang ẩn"}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {" "}
                                / {totalNeed} Yêu cầu
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Global Action Meters */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" /> Nạp Năng Lượng
                        Động Cơ
                      </span>
                      <span className="font-mono text-slate-400">
                        Ngưỡng: {squadConfig.globalThreshold} Hành động
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đạt ngưỡng sẽ nhận +1 Lương thảo & tính 1 hiệp động lực
                      thành công.
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-sky-300 font-bold flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-sky-400" /> Pháo Sáng Xua
                        Đuổi Quái Thú
                      </span>
                      <span className="font-mono text-slate-400">
                        Ngưỡng: {squadConfig.globalThreshold} Hành động
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đạt ngưỡng sẽ xua tan xúc tu sương mù và giảm 1 Báo động.
                    </div>
                  </div>
                </div>
              </div>
            ) : scene.type === "clue_puzzle" ? (
              /* SHARED CLUES BOARD (TV Display) */
              <div className="bg-slate-950/85 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span className="font-serif font-bold text-amber-200 text-sm">
                      Bảng Tin Tình Báo Đoàn Xe ({state.sharedClues.length} /{" "}
                      {scene.clues?.length ?? 0} Manh Mối Đã Chia Sẻ)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Người chơi có thể bấm "Chia sẻ manh mối" trên tay cầm để
                    ghim thông tin lên đây!
                  </span>
                </div>

                {state.sharedClues.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm font-serif italic">
                    Chưa có manh mối nào được phát lên màn hình chung. Hãy xem
                    thẻ bài trên tay cầm của bạn!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {state.sharedClues.map((sc) => (
                      <div
                        key={sc.cardId}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md text-left"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="text-amber-400 font-bold">
                            THẺ SỐ #{sc.card.number}
                          </span>
                          <span>Chia sẻ bởi {sc.sharedByPlayerName}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 mb-1">
                          {sc.card.title}
                        </div>
                        <div className="text-xs text-slate-300 leading-snug">
                          {sc.card.fact}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* RESOLUTION CONSEQUENCES DISPLAY */}
            {state.phase === "consequences" && state.lastConsequence && (
              <div className="bg-amber-950/50 border border-amber-500/60 rounded-2xl p-6 shadow-2xl text-left">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                  <h3 className="font-serif font-black text-amber-200 text-xl">
                    {state.lastConsequence.title}
                  </h3>
                  <div className="flex items-center gap-3 font-mono text-xs font-bold">
                    {state.lastConsequence.resourceChanges.supplies !==
                      undefined && (
                      <span
                        className={
                          state.lastConsequence.resourceChanges.supplies >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {state.lastConsequence.resourceChanges.supplies >= 0
                          ? "+"
                          : ""}
                        {state.lastConsequence.resourceChanges.supplies} Lương
                        thảo
                      </span>
                    )}
                    {state.lastConsequence.resourceChanges.integrity !==
                      undefined && (
                      <span
                        className={
                          state.lastConsequence.resourceChanges.integrity >= 0
                            ? "text-sky-400"
                            : "text-rose-400"
                        }
                      >
                        {state.lastConsequence.resourceChanges.integrity >= 0
                          ? "+"
                          : ""}
                        {state.lastConsequence.resourceChanges.integrity} Độ bền
                      </span>
                    )}
                    {state.lastConsequence.resourceChanges.alarm !==
                      undefined && (
                      <span
                        className={
                          state.lastConsequence.resourceChanges.alarm <= 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {state.lastConsequence.resourceChanges.alarm >= 0
                          ? "+"
                          : ""}
                        {state.lastConsequence.resourceChanges.alarm} Báo động
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                  {state.lastConsequence.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => roomStore.advanceToNextScene()}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer text-sm"
                  >
                    TIẾP TỤC HÀNH TRÌNH →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM HUD STATUS BAR */}
        <footer className="flex items-center justify-between text-xs text-slate-400 pointer-events-auto bg-slate-950/80 border border-slate-700/60 rounded-xl px-5 py-2.5">
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-300">
              CHƠI THỬ NỘI BỘ:{" "}
              <strong className="text-amber-400">{state.roomId}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Đội ngũ:{" "}
              <strong className="text-slate-200">
                {state.players.length} Vị trí
              </strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Giai đoạn:{" "}
              <strong className="text-slate-200">
                {PHASE_NAMES[state.phase] || state.phase.replace("_", " ")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {state.phase === "selection" && (
              <button
                onClick={() => roomStore.resolveCurrentPhase()}
                disabled={
                  !state.players.every((p) => p.ready) || state.isPaused
                }
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
              >
                {readyCount === state.players.length
                  ? "MỞ KẾT QUẢ ĐỒNG ĐỘI"
                  : `${readyCount}/${state.players.length} ĐÃ SẴN SÀNG`}
              </button>
            )}
            <span className="text-[11px] text-slate-500 font-mono">
              Đoàn Lữ Hành Xuyên Sương v2.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
