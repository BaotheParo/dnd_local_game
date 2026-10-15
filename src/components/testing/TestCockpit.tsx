/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GameState, SQUADS, ROLE_NAMES } from "../../types/game";
import { roomStore } from "../../engine/roomStore";
import { Users, CheckCheck, PlayCircle } from "lucide-react";

interface TestCockpitProps {
  state: GameState;
  activePlayerId: string;
  onSelectPlayer: (id: string) => void;
  onClose?: () => void;
}

export const TestCockpit: React.FC<TestCockpitProps> = ({
  state,
  activePlayerId,
  onSelectPlayer,
  onClose,
}) => {
  const scene = roomStore.getCurrentScene();

  // Helper to mark all players ready
  const markAllReady = () => {
    state.players.forEach((p) => {
      roomStore.setPlayerReady(p.id, true);
    });
  };

  // Helper to autofill plausible decisions for all players
  const autofillSceneInputs = () => {
    if (scene.type === "narrative_choice" || scene.type === "rest_stop") {
      const firstOpt = scene.options?.[0]?.id;
      if (firstOpt) {
        state.players.forEach((p) => roomStore.castVote(p.id, firstOpt));
      }
    } else if (scene.type === "clue_puzzle") {
      roomStore.submitPuzzleCandidate("pathfinder", "north");
      roomStore.submitPuzzleCandidate("mechanics", "north");
      roomStore.submitPuzzleCandidate("logistics", "north");
      // Share a couple clues to TV
      if (scene.clues && scene.clues.length >= 2) {
        roomStore.shareClue(state.players[0].id, scene.clues[0].id);
        roomStore.shareClue(state.players[1].id, scene.clues[1].id);
      }
    } else if (scene.type === "group_prediction" && scene.predictionConfig) {
      const opts = scene.predictionConfig.options;
      state.players.forEach((p, idx) => {
        const choice = opts[idx % opts.length];
        roomStore.submitPredictionAnswer(p.id, choice);
        roomStore.submitPredictionGuess(p.id, opts[0]);
      });
    } else if (scene.type === "storm_challenge") {
      // Balanced distribution: 2 shield in each squad, 1 supply, 1 repel
      state.players.forEach((p, idx) => {
        const action =
          idx % 3 === 0 ? "Shield" : idx % 3 === 1 ? "Supply" : "Repel";
        roomStore.submitStormAction(p.id, action);
      });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-[420px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col font-sans text-slate-100 select-none">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="font-serif font-bold text-purple-200 text-sm">
              Buồng Mô Phỏng Đa Người Chơi
            </h2>
            <div className="text-[10px] text-slate-400">
              Mô phỏng nội bộ · điều khiển tất cả vị trí để thử nghiệm
            </div>
          </div>
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
        {/* QUICK SIMULATION ACTIONS */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Thao Tác Nhanh
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={markAllReady}
              className="py-2 px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40"
            >
              <CheckCheck className="w-4 h-4" />
              Sẵn Sàng Tất Cả
            </button>
            <button
              onClick={autofillSceneInputs}
              className="py-2 px-2.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold flex items-center justify-center gap-1.5 border border-purple-500/40"
            >
              <PlayCircle className="w-4 h-4" />
              Tự Động Điền Lựa Chọn
            </button>
          </div>
        </div>

        {/* PARTY SEAT MATRIX */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Danh Sách Vị Trí ({state.players.length} Chỗ)</span>
            <span className="text-slate-500 font-normal">
              Nhấp để đổi điều khiển
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {state.players.map((p) => {
              const squadInfo = SQUADS[p.squad];
              const isSelected = p.id === activePlayerId;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-950/70 border-purple-400 shadow-md ring-1 ring-purple-500/40"
                      : "bg-slate-950/80 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.avatar}</span>
                    <div>
                      <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <span>
                          Chỗ {p.seatIndex + 1}: {p.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-purple-500 text-slate-950 px-1 py-0.2 rounded font-black">
                            ĐANG CHỌN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span style={{ color: squadInfo?.accentColor }}>
                          {squadInfo?.name}
                        </span>
                        <span>·</span>
                        <span>{ROLE_NAMES[p.role] || p.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {scene.type === "storm_challenge" ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {state.currentStormActions[p.id] === "Shield"
                          ? "Dựng Khiên"
                          : state.currentStormActions[p.id] === "Supply"
                          ? "Nạp Động Cơ"
                          : state.currentStormActions[p.id] === "Repel"
                          ? "Xua Đuổi Quái"
                          : "Dựng Khiên (Mặc định)"}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.ready
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {p.ready ? "Sẵn sàng" : "Chờ"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

