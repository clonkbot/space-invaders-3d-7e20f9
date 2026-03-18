import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Text, Float } from "@react-three/drei";
import * as THREE from "three";

interface GameProps {
  onGameOver: (stats: { score: number; wave: number; aliensDestroyed: number }) => void;
  onPause: () => void;
}

interface Alien {
  id: number;
  position: [number, number, number];
  type: number;
  alive: boolean;
}

interface Bullet {
  id: number;
  position: [number, number, number];
  isPlayer: boolean;
}

// Player spaceship component
function PlayerShip({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Main body */}
      <mesh>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.4]} />
        <meshStandardMaterial color="#0088ff" emissive="#0044ff" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.8} transparent opacity={0.8} />
      </mesh>
      {/* Engine glow */}
      <pointLight position={[0, -0.5, 0]} color="#00ffff" intensity={2} distance={2} />
    </group>
  );
}

// Alien invader component
function AlienInvader({ position, type, alive }: { position: [number, number, number]; type: number; alive: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current && alive) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4 + position[0]) * 0.1;
    }
  });

  if (!alive) return null;

  const colors = ["#ff0044", "#ff8800", "#ffff00"][type % 3];
  const sizes = [0.35, 0.3, 0.25][type % 3];

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={meshRef} position={position}>
        {/* Body */}
        <mesh>
          <octahedronGeometry args={[sizes, 0]} />
          <meshStandardMaterial color={colors} emissive={colors} emissiveIntensity={0.6} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.1, 0.05, sizes + 0.01]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.1, 0.05, sizes + 0.01]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        {/* Glow */}
        <pointLight color={colors} intensity={1} distance={1.5} />
      </group>
    </Float>
  );
}

// Bullet component
function BulletMesh({ position, isPlayer }: { position: [number, number, number]; isPlayer: boolean }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial
        color={isPlayer ? "#00ffff" : "#ff0044"}
        emissive={isPlayer ? "#00ffff" : "#ff0044"}
        emissiveIntensity={2}
      />
      <pointLight color={isPlayer ? "#00ffff" : "#ff0044"} intensity={3} distance={1} />
    </mesh>
  );
}

// Explosion effect
function Explosion({ position, onComplete }: { position: [number, number, number]; onComplete: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0.1);

  useFrame(() => {
    if (scale < 1.5) {
      setScale((s) => s + 0.15);
    } else {
      onComplete();
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color="#ff8800"
        emissive="#ff4400"
        emissiveIntensity={3 - scale * 2}
        transparent
        opacity={1 - scale / 1.5}
      />
      <pointLight color="#ff4400" intensity={5 - scale * 3} distance={3} />
    </mesh>
  );
}

// Main game logic component
function GameLogic({
  onGameOver,
  onPause,
  setScore,
  setWave,
  setLives,
  setAliensDestroyed,
  controls,
}: {
  onGameOver: (stats: { score: number; wave: number; aliensDestroyed: number }) => void;
  onPause: () => void;
  setScore: (s: number | ((n: number) => number)) => void;
  setWave: (w: number | ((n: number) => number)) => void;
  setLives: (l: number | ((n: number) => number)) => void;
  setAliensDestroyed: (a: number | ((n: number) => number)) => void;
  controls: { left: boolean; right: boolean; fire: boolean };
}) {
  const playerX = useRef(0);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, -4, 0]);
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [alienDirection, setAlienDirection] = useState(1);
  const lastFireTime = useRef(0);
  const alienFireTime = useRef(0);
  const bulletIdCounter = useRef(0);
  const explosionIdCounter = useRef(0);
  const waveRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const aliensDestroyedRef = useRef(0);
  const gameOverRef = useRef(false);

  const { size } = useThree();
  const isMobile = size.width < 768;
  const gameWidth = isMobile ? 4 : 6;

  // Initialize aliens for a wave
  const initWave = useCallback((waveNum: number) => {
    const newAliens: Alien[] = [];
    const rows = Math.min(3 + Math.floor(waveNum / 2), 5);
    const cols = Math.min(6 + waveNum, 10);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newAliens.push({
          id: row * cols + col,
          position: [
            (col - (cols - 1) / 2) * 0.9,
            3 - row * 0.8,
            0,
          ],
          type: row % 3,
          alive: true,
        });
      }
    }
    setAliens(newAliens);
    setAlienDirection(1);
  }, []);

  // Initialize first wave
  useEffect(() => {
    initWave(1);
  }, [initWave]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPause]);

  // Game loop
  useFrame((state) => {
    if (gameOverRef.current) return;

    const time = state.clock.elapsedTime;
    const speed = 0.08 + waveRef.current * 0.005;

    // Player movement
    if (controls.left) {
      playerX.current = Math.max(playerX.current - 0.12, -gameWidth);
    }
    if (controls.right) {
      playerX.current = Math.min(playerX.current + 0.12, gameWidth);
    }
    setPlayerPosition([playerX.current, -4, 0]);

    // Player shooting
    if (controls.fire && time - lastFireTime.current > 0.25) {
      lastFireTime.current = time;
      setBullets((prev) => [
        ...prev,
        {
          id: bulletIdCounter.current++,
          position: [playerX.current, -3.5, 0],
          isPlayer: true,
        },
      ]);
    }

    // Alien shooting
    const aliveAliens = aliens.filter((a) => a.alive);
    if (time - alienFireTime.current > Math.max(1.5 - waveRef.current * 0.1, 0.5) && aliveAliens.length > 0) {
      alienFireTime.current = time;
      const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
      setBullets((prev) => [
        ...prev,
        {
          id: bulletIdCounter.current++,
          position: [...shooter.position] as [number, number, number],
          isPlayer: false,
        },
      ]);
    }

    // Move aliens
    setAliens((prevAliens) => {
      let needsReverse = false;
      const movedAliens = prevAliens.map((alien) => {
        if (!alien.alive) return alien;
        const newX = alien.position[0] + speed * alienDirection * 0.3;
        if (Math.abs(newX) > gameWidth - 0.5) needsReverse = true;
        return {
          ...alien,
          position: [newX, alien.position[1], alien.position[2]] as [number, number, number],
        };
      });

      if (needsReverse) {
        setAlienDirection((d) => -d);
        return movedAliens.map((alien) => ({
          ...alien,
          position: [alien.position[0], alien.position[1] - 0.3, alien.position[2]] as [number, number, number],
        }));
      }
      return movedAliens;
    });

    // Move bullets and check collisions
    setBullets((prevBullets) => {
      return prevBullets
        .map((bullet) => ({
          ...bullet,
          position: [
            bullet.position[0],
            bullet.position[1] + (bullet.isPlayer ? 0.25 : -0.15),
            bullet.position[2],
          ] as [number, number, number],
        }))
        .filter((bullet) => {
          // Remove off-screen bullets
          if (bullet.position[1] > 5 || bullet.position[1] < -5) return false;

          // Player bullet hitting aliens
          if (bullet.isPlayer) {
            for (const alien of aliens) {
              if (
                alien.alive &&
                Math.abs(bullet.position[0] - alien.position[0]) < 0.4 &&
                Math.abs(bullet.position[1] - alien.position[1]) < 0.4
              ) {
                setAliens((prev) =>
                  prev.map((a) => (a.id === alien.id ? { ...a, alive: false } : a))
                );
                setExplosions((prev) => [
                  ...prev,
                  { id: explosionIdCounter.current++, position: [...alien.position] as [number, number, number] },
                ]);
                const points = (3 - alien.type) * 100 * waveRef.current;
                scoreRef.current += points;
                aliensDestroyedRef.current += 1;
                setScore((s) => s + points);
                setAliensDestroyed((a) => a + 1);
                return false;
              }
            }
          } else {
            // Alien bullet hitting player
            if (
              Math.abs(bullet.position[0] - playerX.current) < 0.5 &&
              Math.abs(bullet.position[1] - (-4)) < 0.5
            ) {
              livesRef.current -= 1;
              setLives(livesRef.current);
              setExplosions((prev) => [
                ...prev,
                { id: explosionIdCounter.current++, position: [playerX.current, -4, 0] },
              ]);
              if (livesRef.current <= 0) {
                gameOverRef.current = true;
                setTimeout(() => {
                  onGameOver({
                    score: scoreRef.current,
                    wave: waveRef.current,
                    aliensDestroyed: aliensDestroyedRef.current,
                  });
                }, 500);
              }
              return false;
            }
          }
          return true;
        });
    });

    // Check for wave completion
    if (aliens.length > 0 && aliens.every((a) => !a.alive)) {
      waveRef.current += 1;
      setWave(waveRef.current);
      initWave(waveRef.current);
    }

    // Check if aliens reached bottom
    if (aliens.some((a) => a.alive && a.position[1] < -3)) {
      gameOverRef.current = true;
      onGameOver({
        score: scoreRef.current,
        wave: waveRef.current,
        aliensDestroyed: aliensDestroyedRef.current,
      });
    }
  });

  return (
    <>
      <PlayerShip position={playerPosition} />

      {aliens.map((alien) => (
        <AlienInvader
          key={alien.id}
          position={alien.position}
          type={alien.type}
          alive={alien.alive}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletMesh key={bullet.id} position={bullet.position} isPlayer={bullet.isPlayer} />
      ))}

      {explosions.map((explosion) => (
        <Explosion
          key={explosion.id}
          position={explosion.position}
          onComplete={() => setExplosions((prev) => prev.filter((e) => e.id !== explosion.id))}
        />
      ))}

      {/* Boundaries */}
      <mesh position={[-gameWidth - 0.5, 0, 0]}>
        <boxGeometry args={[0.1, 10, 0.1]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
      <mesh position={[gameWidth + 0.5, 0, 0]}>
        <boxGeometry args={[0.1, 10, 0.1]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
    </>
  );
}

// HUD Component
function HUD({
  score,
  wave,
  lives,
  onPause,
}: {
  score: number;
  wave: number;
  lives: number;
  onPause: () => void;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none z-10">
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hud-panel px-3 py-1 sm:px-4 sm:py-2 rounded">
          <span className="text-cyan-400/60 font-mono text-[10px] sm:text-xs mr-1 sm:mr-2">SCORE</span>
          <span className="font-orbitron font-bold text-base sm:text-xl text-cyan-400">{score.toLocaleString()}</span>
        </div>
        <div className="hud-panel px-3 py-1 sm:px-4 sm:py-2 rounded">
          <span className="text-purple-400/60 font-mono text-[10px] sm:text-xs mr-1 sm:mr-2">WAVE</span>
          <span className="font-orbitron font-bold text-base sm:text-xl text-purple-400">{wave}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hud-panel px-3 py-1 sm:px-4 sm:py-2 rounded flex items-center gap-1 sm:gap-2">
          <span className="text-red-400/60 font-mono text-[10px] sm:text-xs">LIVES</span>
          <div className="flex gap-0.5 sm:gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`text-sm sm:text-lg ${i < lives ? "text-red-500" : "text-gray-700"}`}
              >
                ♥
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onPause}
          className="hud-panel px-3 py-1 sm:px-4 sm:py-2 rounded pointer-events-auto hover:bg-cyan-900/30 transition-colors"
        >
          <span className="font-mono text-xs sm:text-sm text-cyan-400">ESC</span>
        </button>
      </div>
    </div>
  );
}

// Touch Controls
function TouchControls({
  onControl,
}: {
  onControl: (control: "left" | "right" | "fire", active: boolean) => void;
}) {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 pointer-events-none z-10 sm:hidden">
      <div className="flex gap-3 pointer-events-auto">
        <button
          className="touch-control"
          onTouchStart={() => onControl("left", true)}
          onTouchEnd={() => onControl("left", false)}
          onMouseDown={() => onControl("left", true)}
          onMouseUp={() => onControl("left", false)}
          onMouseLeave={() => onControl("left", false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          className="touch-control"
          onTouchStart={() => onControl("right", true)}
          onTouchEnd={() => onControl("right", false)}
          onMouseDown={() => onControl("right", true)}
          onMouseUp={() => onControl("right", false)}
          onMouseLeave={() => onControl("right", false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <button
        className="touch-control w-20 rounded-full"
        onTouchStart={() => onControl("fire", true)}
        onTouchEnd={() => onControl("fire", false)}
        onMouseDown={() => onControl("fire", true)}
        onMouseUp={() => onControl("fire", false)}
        onMouseLeave={() => onControl("fire", false)}
      >
        <span className="font-orbitron text-xs">FIRE</span>
      </button>
    </div>
  );
}

export function Game3D({ onGameOver, onPause }: GameProps) {
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [aliensDestroyed, setAliensDestroyed] = useState(0);
  const [controls, setControls] = useState({ left: false, right: false, fire: false });

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") setControls((c) => ({ ...c, left: true }));
      if (e.key === "ArrowRight" || e.key === "d") setControls((c) => ({ ...c, right: true }));
      if (e.key === " ") {
        e.preventDefault();
        setControls((c) => ({ ...c, fire: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") setControls((c) => ({ ...c, left: false }));
      if (e.key === "ArrowRight" || e.key === "d") setControls((c) => ({ ...c, right: false }));
      if (e.key === " ") setControls((c) => ({ ...c, fire: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleTouchControl = useCallback((control: "left" | "right" | "fire", active: boolean) => {
    setControls((c) => ({ ...c, [control]: active }));
  }, []);

  return (
    <div className="flex-1 relative">
      <HUD score={score} wave={wave} lives={lives} onPause={onPause} />

      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        className="!absolute inset-0"
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#000011"]} />
        <fog attach="fog" args={["#000011", 10, 30]} />

        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />

        <GameLogic
          onGameOver={onGameOver}
          onPause={onPause}
          setScore={setScore}
          setWave={setWave}
          setLives={setLives}
          setAliensDestroyed={setAliensDestroyed}
          controls={controls}
        />

        {/* Wave indicator */}
        <Text
          position={[0, 4.5, 0]}
          fontSize={0.3}
          color="#ff00ff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff2"
        >
          {`WAVE ${wave}`}
        </Text>
      </Canvas>

      <TouchControls onControl={handleTouchControl} />
    </div>
  );
}
