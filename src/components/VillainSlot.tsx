import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Villain image pool — drop images into src/assets/villains/
// Vite glob import: eager so URLs are available synchronously.
// ---------------------------------------------------------------------------

const villainModules = import.meta.glob<{ default: string }>(
  '../assets/villains/*.(png|jpg|jpeg|webp)',
  { eager: true }
);

interface VillainEntry {
  index: number;
  url: string;
  name: string;
}

const VILLAIN_POOL: VillainEntry[] = Object.entries(villainModules).map(
  ([path, mod], i) => {
    // Derive a display name from the filename, e.g. "villain-loki.png" → "Loki"
    const filename = path.split('/').pop() ?? `Villain ${i + 1}`;
    const name = filename
      .replace(/\.[^.]+$/, '')          // strip extension
      .replace(/^villain[-_]?/i, '')    // strip leading "villain-"
      .replace(/[-_]/g, ' ')            // dashes/underscores → spaces
      .replace(/\b\w/g, c => c.toUpperCase()) // title-case
      || `Villain ${i + 1}`;
    return { index: i, url: mod.default, name };
  }
);

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

let wheelAudio: HTMLAudioElement | null = null;
try {
  // Vite will resolve this at build time; if the file doesn't exist it throws
  // and we fall back to null (silent).
  const soundUrl = new URL('../assets/sounds/wheel.mp3', import.meta.url).href;
  wheelAudio = new Audio(soundUrl);
  wheelAudio.loop = true;
} catch {
  wheelAudio = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom(pool: number[], exclude: number[]): number | null {
  const available = pool.filter(i => !exclude.includes(i));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VillainSlotProps {
  /** Currently selected villain index (null = not yet spun) */
  villainIndex: number | null;
  /** Indices already defeated — excluded from next spin */
  defeatedIndices: number[];
  onVillainSelected: (index: number) => void;
  onVillainDefeated: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VillainSlot({
  villainIndex,
  defeatedIndices,
  onVillainSelected,
  onVillainDefeated,
}: VillainSlotProps) {
  const [spinning, setSpinning] = useState(false);
  const [spinDisplayIndex, setSpinDisplayIndex] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      wheelAudio?.pause();
    };
  }, []);

  if (VILLAIN_POOL.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic text-center px-2">
        Add images to <code>src/assets/villains/</code> to enable villain selection.
      </div>
    );
  }

  const allIndices = VILLAIN_POOL.map(v => v.index);
  const canSpin = pickRandom(allIndices, defeatedIndices) !== null;
  const currentVillain = villainIndex !== null ? VILLAIN_POOL[villainIndex] : null;

  function startSpin() {
    if (!canSpin || spinning) return;

    setSpinning(true);

    // Play sound
    if (wheelAudio) {
      wheelAudio.currentTime = 0;
      wheelAudio.play().catch(() => {/* autoplay blocked — silent */});
    }

    // Cycle through images rapidly
    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      // Pick any villain (including defeated ones) for the visual spin effect
      const randomIdx = Math.floor(Math.random() * VILLAIN_POOL.length);
      setSpinDisplayIndex(randomIdx);
    }, 120);

    // Duration: random between 1500ms and 5000ms
    const duration = 1500 + Math.random() * 3500;

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Stop sound
      if (wheelAudio) {
        wheelAudio.pause();
        wheelAudio.currentTime = 0;
      }

      // Pick the final villain (excluding defeated)
      const finalIndex = pickRandom(allIndices, defeatedIndices);
      if (finalIndex !== null) {
        setSpinDisplayIndex(finalIndex);
        onVillainSelected(finalIndex);
      }

      setSpinning(false);
    }, duration);
  }

  const displayIndex = spinning ? spinDisplayIndex : (villainIndex ?? spinDisplayIndex);
  const displayVillain = VILLAIN_POOL[displayIndex];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Card display area */}
      <div
        className={`relative rounded-xl overflow-hidden shadow-md transition-all duration-150
                    ${spinning ? 'scale-105 ring-4 ring-purple-400 ring-offset-2' : ''}`}
        style={{ width: 140, height: 196 }}
      >
        {(spinning || villainIndex !== null) && displayVillain ? (
          <img
            src={displayVillain.url}
            alt={displayVillain.name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          /* Placeholder before first spin */
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-4xl">🎴</span>
          </div>
        )}

        {/* Spinning overlay shimmer */}
        {spinning && (
          <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Villain name */}
      {!spinning && currentVillain && (
        <span className="text-sm font-bold text-gray-800 text-center">
          {currentVillain.name}
        </span>
      )}
      {spinning && (
        <span className="text-sm font-bold text-purple-600 animate-pulse text-center">
          Selecting…
        </span>
      )}

      {/* Buttons */}
      {!spinning && villainIndex === null && (
        <button
          type="button"
          onClick={startSpin}
          disabled={!canSpin}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500
                     text-white font-bold text-sm shadow-lg
                     hover:from-purple-600 hover:to-indigo-600
                     focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          🎲 Randomize Villain
        </button>
      )}

      {!spinning && villainIndex !== null && (
        <button
          type="button"
          onClick={() => {
            onVillainDefeated();
          }}
          className="w-full px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold
                     hover:bg-red-200 transition-colors"
        >
          Villain Defeated
        </button>
      )}

      {!spinning && !canSpin && villainIndex === null && (
        <span className="text-xs text-gray-400 italic">All villains defeated!</span>
      )}
    </div>
  );
}

export default VillainSlot;
