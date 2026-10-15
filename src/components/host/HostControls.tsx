/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState, SQUADS } from "../../types/game";
import { roomStore } from "../../engine/roomStore";
import {
  Play,
  Pause,
  Clock,
  RotateCcw,
  Users,
  Layers,
  ChevronDown,
  ShieldAlert,
  Sliders,
  CheckCircle,
} from "lucide-react";

interface HostControlsProps {
  state: GameState;
  onClose?: () => void;
}

export const HostControls: React.FC<HostControlsProps> = ({
  state,
  onClose,
}) => {
  const [selectedPack, setSelectedPack] = useState(state.packId);

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col font-sans text-slate-100 select-none">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h2 className="font-serif font-bold text-amber-100 text-base">
            Bảng Điều Khiển Trưởng Đoàn
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {/* ROOM CONTROLS */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Trạng Thái Phòng & Thời Gian
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => roomStore.pauseRoom()}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                state.isPaused
                  ? "bg-emerald-600 text-slate-950"
                  : "bg-amber-600 hover:bg-amber-500 text-slate-950"
              }`}
            >
              {state.isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              {state.isPaused ? "Tiếp Tục Phòng" : "Tạm Dừng"}
            </button>

            <button
              onClick={() => roomStore.extendTime(30)}
              className="py-2 px-3 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              +30s Giờ
            </button>
          </div>

          <button
            onClick={() => roomStore.resolveCurrentPhase()}
            disabled={
              state.phase !== "selection" ||
              state.isPaused ||
              !state.players.every((p) => p.ready)
            }
            className="w-full py-2 px-3 rounded-lg font-bold bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-500/40"
          >
            Mở kết quả khi tất cả đã sẵn sàng
          </button>
        </div>

        {/* PARTY & SEAT MANAGEMENT */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Quy Mô Đội Ngũ ({state.players.length} Người chơi)</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[3, 4, 5, 6, 7, 8, 9].map((count) => (
              <button
                key={count}
                onClick={() => roomStore.setPartyCount(count)}
                disabled={!["title", "lobby"].includes(state.phase)}
                className={`py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  state.players.length === count
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {count} Người
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1 max-h-48 overflow-y-auto">
            {state.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900 text-[11px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{p.avatar}</span>
                  <span className="font-semibold text-slate-200 truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-400">{SQUADS[p.squad]?.name || p.squad}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      p.ready
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {p.ready ? "Sẵn sàng" : "Chờ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT PACK SELECTION (Proves Modular Content Architecture) */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Gói Nhiệm Vụ Mở Rộng</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>

          <select
            value={selectedPack}
            onChange={(e) => {
              setSelectedPack(e.target.value);
              roomStore.loadPack(e.target.value);
            }}
            aria-label="Chọn Gói Nhiệm Vụ"
            className="w-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg p-2"
          >
            <option value="last_lantern_delivery">
              Nhiệm vụ 1: Chuyến Giao Đèn Cuối Cùng (Đầy đủ)
            </option>
            <option value="the_switched_signs">
              Nhiệm vụ 2: Biển Chỉ Dẫn Bị Đổi (Gói Mở Rộng)
            </option>
          </select>
        </div>

        {/* RESET / REPLAY */}
        <div className="pt-2">
          <button
            onClick={() => roomStore.resetMission()}
            className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold rounded-xl border border-rose-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Khởi Động Lại Nhiệm Vụ Hiện Tại
          </button>
        </div>
      </div>
    </div>
  );
};
