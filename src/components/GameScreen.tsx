import { useState, useCallback, Suspense } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Game3D } from "./Game3D";
import { Leaderboard } from "./Leaderboard";

type GameState = "menu" | "playing" | "paused" | "gameover";

interface GameStats {
  score: number;
  wave: number;
  aliensDestroyed: number;
}

export function GameScreen() {
  const { signOut } = useAuthActions();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [playerName, setPlayerName] = useState("");

  const user = useQuery(api.users.current);
  const userHighScore = useQuery(api.scores.getUserHighScore);
  const globalStats = useQuery(api.scores.getStats);
  const submitScore = useMutation(api.scores.submit);

  const handleGameOver = useCallback((stats: GameStats) => {
    setFinalStats(stats);
    setGameState("gameover");
  }, []);

  const handleSubmitScore = async () => {
    if (!finalStats || !playerName.trim()) return;
    await submitScore({
      playerName: playerName.trim().toUpperCase(),
      score: finalStats.score,
      wave: finalStats.wave,
      aliensDestroyed: finalStats.aliensDestroyed,
    });
    setGameState("menu");
    setFinalStats(null);
    setPlayerName("");
  };

  const startGame = () => {
    setGameState("playing");
    setFinalStats(null);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background always visible */}
      <div className="absolute inset-0 grid-bg opacity-20"></div>

      {gameState === "menu" && (
        <div className="flex-1 flex flex-col relative z-10 scanlines">
          {/* Header */}
          <header className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 border-b border-cyan-900/30 bg-black/50 backdrop-blur-sm">
            <div className="text-center sm:text-left">
              <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                SPACE INVADERS 3D
              </h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-cyan-400/60 font-mono text-xs sm:text-sm">
                {user?.email ? `${user.email.split("@")[0]}` : "GUEST"}
              </span>
              <button
                onClick={() => signOut()}
                className="text-purple-400 hover:text-purple-300 font-mono text-xs tracking-wide transition-colors"
              >
                LOGOUT
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Left Panel - Stats & Start */}
            <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-block p-4 sm:p-6 neon-border-magenta rounded-lg bg-black/50 backdrop-blur-sm">
                    <div className="text-4xl sm:text-6xl mb-2">👾</div>
                    <h2 className="font-orbitron text-lg sm:text-2xl text-magenta-400 glow-magenta">
                      READY COMMANDER?
                    </h2>
                  </div>
                </div>

                {/* Personal Stats */}
                <div className="hud-panel p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
                  <h3 className="font-orbitron text-sm text-cyan-400 mb-4 tracking-widest">YOUR STATS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-orbitron font-bold text-green-400 glow-green">
                        {userHighScore?.score ?? 0}
                      </div>
                      <div className="text-xs text-cyan-400/60 font-mono mt-1">HIGH SCORE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-orbitron font-bold text-purple-400">
                        {userHighScore?.wave ?? 0}
                      </div>
                      <div className="text-xs text-cyan-400/60 font-mono mt-1">BEST WAVE</div>
                    </div>
                  </div>
                </div>

                {/* Global Stats */}
                {globalStats && (
                  <div className="hud-panel p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 bg-purple-900/20">
                    <h3 className="font-orbitron text-xs text-purple-400 mb-3 tracking-widest">GLOBAL DEFENSE</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-orbitron font-bold text-cyan-400">
                          {globalStats.totalGamesPlayed.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-cyan-400/40 font-mono">MISSIONS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-orbitron font-bold text-red-400">
                          {globalStats.totalAliensDestroyed.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-cyan-400/40 font-mono">KILLS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-orbitron font-bold text-green-400">
                          {globalStats.highestWave}
                        </div>
                        <div className="text-[10px] text-cyan-400/40 font-mono">MAX WAVE</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={startGame}
                  className="cyber-button w-full py-4 text-lg rounded-lg pulse-glow"
                >
                  START MISSION
                </button>

                {/* Controls Info */}
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-cyan-400/40 font-mono text-xs">
                    <span className="hidden sm:inline">← → MOVE • SPACE FIRE</span>
                    <span className="sm:hidden">TAP BUTTONS TO CONTROL</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel - Leaderboard */}
            <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-cyan-900/30">
              <Leaderboard />
            </div>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="loading-spinner mb-4"></div>
                <p className="text-cyan-400 font-mono tracking-widest animate-pulse">
                  LOADING BATTLE ZONE...
                </p>
              </div>
            </div>
          }
        >
          <Game3D
            onGameOver={handleGameOver}
            onPause={() => setGameState("paused")}
          />
        </Suspense>
      )}

      {gameState === "paused" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neon-border-cyan bg-black/90 p-6 sm:p-8 rounded-lg text-center max-w-sm mx-4">
            <h2 className="font-orbitron text-2xl sm:text-3xl text-cyan-400 glow-cyan mb-6 sm:mb-8">
              PAUSED
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => setGameState("playing")}
                className="cyber-button w-full rounded"
              >
                RESUME
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3 px-6 border border-purple-500/50 text-purple-400 font-orbitron text-sm tracking-widest rounded hover:bg-purple-900/30 transition-all"
              >
                ABORT MISSION
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === "gameover" && finalStats && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="neon-border-magenta bg-black/95 p-6 sm:p-8 rounded-lg text-center max-w-md w-full">
            <h2 className="font-orbitron text-3xl sm:text-4xl text-red-500 mb-6 sm:mb-8 animate-pulse">
              GAME OVER
            </h2>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-cyan-900/20 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-3xl font-orbitron font-bold text-cyan-400">
                  {finalStats.score.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-400/60 font-mono mt-1">SCORE</div>
              </div>
              <div className="bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-3xl font-orbitron font-bold text-purple-400">
                  {finalStats.wave}
                </div>
                <div className="text-xs text-purple-400/60 font-mono mt-1">WAVE</div>
              </div>
              <div className="bg-green-900/20 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-3xl font-orbitron font-bold text-green-400">
                  {finalStats.aliensDestroyed}
                </div>
                <div className="text-xs text-green-400/60 font-mono mt-1">KILLS</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-cyan-400/60 font-mono text-xs mb-2 text-left">
                ENTER YOUR CALL SIGN
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
                placeholder="COMMANDER"
                className="cyber-input w-full rounded text-center uppercase"
                maxLength={12}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSubmitScore}
                disabled={!playerName.trim()}
                className="cyber-button w-full rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SUBMIT SCORE
              </button>
              <button
                onClick={() => {
                  setGameState("menu");
                  setFinalStats(null);
                }}
                className="w-full py-3 px-6 border border-purple-500/50 text-purple-400 font-orbitron text-sm tracking-widest rounded hover:bg-purple-900/30 transition-all"
              >
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
