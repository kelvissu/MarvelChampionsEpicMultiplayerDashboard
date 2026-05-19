/**
 * HeroPicker — displays a grid of hero icons from src/assets/heroes/.
 * Drop any image files there; they are loaded via Vite's import.meta.glob.
 */

const heroModules = import.meta.glob<{ default: string }>(
  '../assets/heroes/*.(png|jpg|jpeg|webp)',
  { eager: true }
);

export interface HeroEntry {
  index: number;
  url: string;
  name: string;
}

export const HERO_POOL: HeroEntry[] = Object.entries(heroModules).map(
  ([path, mod], i) => {
    const filename = path.split('/').pop() ?? `Hero ${i + 1}`;
    const name = filename
      .replace(/\.[^.]+$/, '')
      .replace(/^hero[-_]?/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()) || `Hero ${i + 1}`;
    return { index: i, url: mod.default, name };
  }
);

interface HeroPickerProps {
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export function HeroPicker({ selectedIndex, onSelect }: HeroPickerProps) {
  if (HERO_POOL.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic text-center">
        Add images to <code>src/assets/heroes/</code>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {HERO_POOL.map(hero => {
        const selected = hero.index === selectedIndex;
        return (
          <button
            key={hero.index}
            type="button"
            title={hero.name}
            onClick={() => onSelect(selected ? null : hero.index)}
            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                        ${selected
                          ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                          : 'border-gray-200 hover:border-blue-300 hover:scale-105'
                        }`}
          >
            <img
              src={hero.url}
              alt={hero.name}
              className="w-full h-full object-cover object-center"
            />
          </button>
        );
      })}
    </div>
  );
}

export default HeroPicker;
