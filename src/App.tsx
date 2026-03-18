import { useConvexAuth } from "convex/react";
import { AuthScreen } from "./components/AuthScreen";
import { GameScreen } from "./components/GameScreen";
import "./styles.css";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-cyan-400 font-mono text-lg tracking-widest animate-pulse">
            INITIALIZING DEFENSE GRID...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {isAuthenticated ? <GameScreen /> : <AuthScreen />}
      <footer className="py-3 text-center border-t border-purple-900/30 bg-black/80 backdrop-blur-sm">
        <p className="text-purple-400/40 text-xs font-mono tracking-wider">
          Requested by <span className="text-purple-400/60">@web-user</span> · Built by <span className="text-purple-400/60">@clonkbot</span>
        </p>
      </footer>
    </div>
  );
}
