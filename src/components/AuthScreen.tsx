import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymous = async () => {
    setIsSubmitting(true);
    try {
      await signIn("anonymous");
    } catch {
      setError("Could not sign in as guest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden scanlines">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-bg opacity-30"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md mx-4 p-6 sm:p-8">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-orbitron text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-magenta-500 mb-2">
            SPACE
          </h1>
          <h2 className="font-orbitron text-3xl sm:text-5xl font-black text-cyan-400 glow-cyan tracking-widest">
            INVADERS
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-cyan-400"></div>
            <span className="text-purple-400 font-mono text-xs sm:text-sm tracking-[0.3em]">3D EDITION</span>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-cyan-400"></div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="neon-border-cyan bg-black/80 backdrop-blur-xl p-6 sm:p-8 rounded-lg">
          <h3 className="font-orbitron text-lg sm:text-xl text-center text-cyan-400 mb-6">
            {flow === "signIn" ? "COMMANDER LOGIN" : "NEW RECRUIT"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="email"
                type="email"
                placeholder="EMAIL ADDRESS"
                required
                className="cyber-input w-full rounded"
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="ACCESS CODE"
                required
                minLength={6}
                className="cyber-input w-full rounded"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <div className="text-red-400 text-sm text-center font-mono bg-red-900/20 py-2 px-4 rounded border border-red-500/30">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cyber-button w-full rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "PROCESSING..." : flow === "signIn" ? "ENGAGE" : "ENLIST"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-purple-400 hover:text-purple-300 font-mono text-sm tracking-wide transition-colors"
            >
              {flow === "signIn" ? "→ CREATE NEW ACCOUNT" : "→ EXISTING COMMANDER"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-cyan-900/50">
            <button
              onClick={handleAnonymous}
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 text-purple-300 font-orbitron text-sm tracking-widest rounded hover:from-purple-800/50 hover:to-cyan-800/50 transition-all disabled:opacity-50"
            >
              PLAY AS GUEST
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-cyan-400/60 font-mono text-xs sm:text-sm">
            DEFEND EARTH FROM THE ALIEN INVASION
          </p>
          <p className="text-purple-400/40 font-mono text-xs mt-2">
            USE ← → ARROWS TO MOVE • SPACE TO FIRE
          </p>
        </div>
      </div>
    </div>
  );
}
