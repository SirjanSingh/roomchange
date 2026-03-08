"use client";

import { useState } from "react";
import { FlappyBird } from "./FlappyBird";
import { Leaderboard } from "./Leaderboard";

export function GamesClient({ playerName }: { playerName: string }) {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Game */}
      <FlappyBird
        playerName={playerName}
        onScoreSubmitted={() => setLeaderboardKey((k) => k + 1)}
      />

      {/* Sidebar: instructions + leaderboard */}
      <div className="space-y-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-2">🎮 How to Play</h3>
          <ul className="text-gray-400 text-xs space-y-1.5">
            <li>
              • Press{" "}
              <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-gray-200 text-xs">
                Space
              </kbd>{" "}
              or{" "}
              <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-gray-200 text-xs">
                ↑
              </kbd>{" "}
              to flap
            </li>
            <li>• Tap or click the game on mobile</li>
            <li>• Dodge the pipes to keep scoring</li>
            <li>• Score auto-saves your personal best after each run</li>
            <li className="text-gray-600 pt-1">
              Custom graphics — drop PNGs into{" "}
              <span className="text-gray-500 font-mono">/public/games/</span>:
              <br />
              <span className="text-gray-600">
                bg · bird · bird1–4 · pipe · floor · profile
              </span>
            </li>
          </ul>
        </div>

        <Leaderboard game="flappy" refreshKey={leaderboardKey} />
      </div>
    </div>
  );
}
