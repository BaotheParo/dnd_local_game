/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { GameState } from "./types/game";
import { roomStore } from "./engine/roomStore";
import { TVScreen } from "./components/tv/TVScreen";
import { PhoneController } from "./components/controller/PhoneController";
import { HostControls } from "./components/host/HostControls";
import { TestCockpit } from "./components/testing/TestCockpit";
import { Tv, Smartphone, Sliders, Users, Columns, Flame } from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(roomStore.getState());
  const [activePlayerId, setActivePlayerId] = useState<string>(
    roomStore.getState().players[0]?.id || "p_1",
  );

  // Check URL params or screen width to determine initial mode
  const [viewMode, setViewMode] = useState<"tv" | "phone" | "split">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "phone") return "phone";
      if (params.get("view") === "tv") return "tv";
      if (params.get("view") === "split") return "split";
      // If mobile screen, default to phone view
      if (window.innerWidth < 768) return "phone";
    }
    return "tv";
  });

  const [showHostPanel, setShowHostPanel] = useState<boolean>(false);
  const [showTestCockpit, setShowTestCockpit] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = roomStore.subscribe((newState) => {
      setGameState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="app-shell w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {gameState.phase !== "title" && (
        <div className="game-wordmark">
          <Flame size={18} strokeWidth={1.4} />
          <span>ĐOÀN LỮ HÀNH XUYÊN SƯƠNG</span>
        </div>
      )}
      {/* PERSISTENT TOP APP BAR (Compact Floating Switcher) */}
      <nav
        aria-label="Chế độ xem và công cụ điều khiển"
        className="view-switcher fixed top-3 right-4 z-40 flex items-center gap-1.5 rounded-xl p-1 pointer-events-auto"
      >
        <button
          onClick={() => setViewMode("tv")}
          aria-label="Màn hình TV"
          aria-pressed={viewMode === "tv"}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            viewMode === "tv"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-300 hover:text-amber-300 hover:bg-slate-800"
          }`}
          title="Chế độ Màn hình TV / Màn hình chung"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Màn hình TV</span>
        </button>

        <button
          onClick={() => setViewMode("phone")}
          aria-label="Điện thoại"
          aria-pressed={viewMode === "phone"}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            viewMode === "phone"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-300 hover:text-amber-300 hover:bg-slate-800"
          }`}
          title="Chế độ Điều khiển Điện thoại"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Điện thoại</span>
        </button>

        <button
          onClick={() => setViewMode("split")}
          aria-label="Chia đôi màn hình"
          aria-pressed={viewMode === "split"}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            viewMode === "split"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-300 hover:text-amber-300 hover:bg-slate-800"
          }`}
          title="Chế độ Xem song song (TV & Điện thoại)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Chia đôi</span>
        </button>

        <div className="w-px h-5 bg-slate-850 mx-1" />

        {/* Cockpit Toggle */}
        <button
          onClick={() => setShowTestCockpit(!showTestCockpit)}
          aria-label="Buồng mô phỏng"
          aria-expanded={showTestCockpit}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            showTestCockpit
              ? "bg-purple-950 border border-purple-500/50 text-purple-200"
              : "text-slate-300 hover:text-purple-300 hover:bg-slate-800"
          }`}
          title="Mở Buồng thử nghiệm mô phỏng"
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Mô phỏng</span>
        </button>

        {/* Host Panel Toggle */}
        <button
          onClick={() => setShowHostPanel(!showHostPanel)}
          aria-label="Bảng Trưởng Đoàn"
          aria-expanded={showHostPanel}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            showHostPanel
              ? "bg-sky-950 border border-sky-500/50 text-sky-200"
              : "text-slate-300 hover:text-sky-300 hover:bg-slate-800"
          }`}
          title="Mở Bảng điều khiển Trưởng Đoàn"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Bảng Trưởng Đoàn</span>
        </button>
      </nav>

      {/* MAIN VIEW CONTAINER */}
      <div className="flex-1 w-full h-full">
        {(viewMode === "tv" ||
          (viewMode === "split" && gameState.phase === "title")) && (
          <TVScreen
            state={gameState}
            onSwitchToPhone={() => setViewMode("phone")}
            onOpenTestCockpit={() => setShowTestCockpit(true)}
          />
        )}

        {viewMode === "phone" && (
          <div className="min-h-screen py-2 bg-slate-950">
            <PhoneController
              state={gameState}
              activePlayerId={activePlayerId}
              onSelectPlayer={setActivePlayerId}
              onSwitchToTV={() => setViewMode("tv")}
            />
          </div>
        )}

        {viewMode === "split" && gameState.phase !== "title" && (
          <div className="split-layout grid grid-cols-1 lg:grid-cols-12 lg:h-screen lg:overflow-hidden">
            {/* TV Screen in Left 7 cols */}
            <div className="lg:col-span-8 h-full relative lg:overflow-y-auto">
              <TVScreen
                state={gameState}
                onSwitchToPhone={() => setViewMode("phone")}
                onOpenTestCockpit={() => setShowTestCockpit(true)}
              />
            </div>
            {/* Phone in Right 5 cols */}
            <div className="lg:col-span-4 h-full border-l border-slate-800 bg-slate-950 overflow-y-auto">
              <PhoneController
                state={gameState}
                activePlayerId={activePlayerId}
                onSelectPlayer={setActivePlayerId}
              />
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY HOST CONTROLS PANEL */}
      {showHostPanel && (
        <HostControls
          state={gameState}
          onClose={() => setShowHostPanel(false)}
        />
      )}

      {/* OVERLAY TEST BENCH COCKPIT */}
      {showTestCockpit && (
        <TestCockpit
          state={gameState}
          activePlayerId={activePlayerId}
          onSelectPlayer={(id) => {
            setActivePlayerId(id);
            if (viewMode === "tv") setViewMode("split");
          }}
          onClose={() => setShowTestCockpit(false)}
        />
      )}
    </div>
  );
}
