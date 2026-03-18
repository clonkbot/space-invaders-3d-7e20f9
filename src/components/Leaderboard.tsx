import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Score {
  _id: string;
  playerName: string;
  score: number;
  wave: number;
  createdAt: number;
}

export function Leaderboard() {
  const scores = useQuery(api.scores.list) as Score[] | undefined;

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
        <h2 className="font-orbitron text-lg sm:text-xl text-cyan-400 tracking-[0.3em]">
          TOP DEFENDERS
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
      </div>

      <div className="flex-1 hud-panel rounded-lg p-3 sm:p-4 overflow-hidden">
        {scores === undefined ? (
          <div className="h-full flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>
        ) : scores.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-4xl sm:text-5xl mb-4">🚀</div>
              <p className="text-cyan-400/60 font-mono text-sm">
                NO SCORES YET
              </p>
              <p className="text-cyan-400/40 font-mono text-xs mt-2">
                BE THE FIRST DEFENDER!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] lg:max-h-[400px]">
            {scores.map((score, index) => (
              <div
                key={score._id}
                className={`score-row p-3 sm:p-4 rounded-r transition-all ${
                  index === 0
                    ? "border-l-yellow-400 bg-gradient-to-r from-yellow-900/20 to-transparent"
                    : index === 1
                    ? "border-l-gray-300 bg-gradient-to-r from-gray-800/30 to-transparent"
                    : index === 2
                    ? "border-l-amber-600 bg-gradient-to-r from-amber-900/20 to-transparent"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-orbitron font-bold text-sm sm:text-base rounded ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                          ? "bg-gray-400 text-black"
                          : index === 2
                          ? "bg-amber-600 text-black"
                          : "bg-cyan-900/50 text-cyan-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-orbitron text-sm sm:text-base text-white truncate">
                        {score.playerName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-cyan-400/40 font-mono">
                        WAVE {score.wave}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div
                      className={`font-orbitron font-bold text-base sm:text-xl ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-gray-300"
                          : index === 2
                          ? "text-amber-500"
                          : "text-cyan-400"
                      }`}
                    >
                      {score.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-cyan-400/40 font-mono">PTS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-cyan-400/30 font-mono text-xs">
          SCORES UPDATE IN REAL-TIME
        </p>
      </div>
    </div>
  );
}
