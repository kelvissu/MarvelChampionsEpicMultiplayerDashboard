import { useGameState } from '../context/GameStateContext';
import { schemeThreshold } from '../utils/gameLogic';
import { CounterControl } from './CounterControl';
import { VillainSlot } from './VillainSlot';
import { HERO_POOL } from './HeroPicker';
import villainImg from '../assets/villain.jpg';
import schemeImg from '../assets/scheme.png';
import minionImg from '../assets/mangog.jpeg';
import sideSchemeImg from '../assets/portal.png';

// ---------------------------------------------------------------------------
// Portal animation
// ---------------------------------------------------------------------------

const PORTAL_STYLE = `
@keyframes portalSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes portalPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.08); }
}
.portal-ring {
  position: absolute;
  inset: -10px;
  border-radius: inherit;
  border: 3px solid transparent;
  background: conic-gradient(from 0deg, #a855f7, #6366f1, #06b6d4, #a855f7) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: portalSpin 2.5s linear infinite;
  pointer-events: none;
}
.portal-glow {
  position: absolute;
  inset: -14px;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%);
  animation: portalPulse 2s ease-in-out infinite;
  pointer-events: none;
}
`;

if (!document.getElementById('portal-styles')) {
  const s = document.createElement('style');
  s.id = 'portal-styles';
  s.textContent = PORTAL_STYLE;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Card image components
// ---------------------------------------------------------------------------

/** Portrait card — 5:7 ratio (villain, minion) */
function PortraitCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-md"
      style={{ width: 140, height: 196 }} // 5:7 → 140×196
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

/** Landscape card — 7:5 ratio (scheme, side scheme) */
function LandscapeCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-md"
      style={{ width: 196, height: 140 }} // 7:5 → 196×140
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PortalWrapper
// ---------------------------------------------------------------------------

function PortalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex rounded-xl">
      <div className="portal-glow" />
      <div className="portal-ring" />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RunningPhase
// ---------------------------------------------------------------------------

export function RunningPhase() {
  const { state, dispatch } = useGameState();
  const threshold = schemeThreshold(state.groupCount);

  const defeatedItems = state.groups.flatMap((g, gi) => {
    const items: { groupName: string; label: string; type: string }[] = [];
    if (g.minion?.defeated)
      items.push({ groupName: g.name, label: `${g.name} Minion`, type: 'Minion' });
    if (g.scheme?.defeated)
      items.push({ groupName: g.name, label: `${g.name} Side Scheme`, type: 'Side Scheme' });
    return items;
  });

  return (
    <div className="flex flex-col items-center gap-10 p-4 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
        Running Game
      </h1>

      {/* ── Common Area ── */}
      <section aria-label="Common Area" className="w-full">
        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
          Common Area
        </h2>
        <div className="flex flex-row justify-center gap-6 flex-wrap">

          {/* Villain */}
          <section
            className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4"
            aria-label="Villain HP"
          >
            <span className="text-base font-semibold text-gray-800">Loki, God of Lies</span>
            <PortraitCard src={villainImg} alt="Villain" />
            <CounterControl
              label="Villain HP"
              value={state.villainHP}
              onIncrement={() => dispatch({ type: 'INCREMENT_VILLAIN_HP' })}
              onDecrement={() => dispatch({ type: 'DECREMENT_VILLAIN_HP' })}
              steps={[5, 10]}
              onStepChange={delta =>
                dispatch({ type: 'ADJUST_VILLAIN_HP', delta })
              }
            />
          </section>

          {/* Main Scheme */}
          <section
            className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4"
            aria-label="Scheme Progress"
          >
            <span className="text-base font-semibold text-gray-700">Worlds Collide</span>
            <LandscapeCard src={schemeImg} alt="Main Scheme" />
            <CounterControl
              label="Scheme Progress"
              value={state.schemeProgress}
              onIncrement={() => dispatch({ type: 'INCREMENT_SCHEME_PROGRESS' })}
              hideDecrement
            />
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{state.schemeProgress}</span>
              {' / '}
              <span className="font-semibold text-gray-800">{threshold}</span>
            </p>
          </section>

        </div>
      </section>

      {/* ── Groups ── */}
      <section aria-label="Groups" className="w-full">
        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">Groups</h2>
        <div className="flex flex-row flex-wrap justify-center gap-6">
          {state.groups.map((group, gi) => {
            const minionActive = group.minion !== null && !group.minion.defeated;
            const schemeActive = group.scheme !== null && !group.scheme.defeated;

            return (
              <div
                key={gi}
                className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 min-w-[240px]"
              >
                {/* Editable group name */}
                <input
                  type="text"
                  value={group.name}
                  onChange={e =>
                    dispatch({ type: 'SET_GROUP_NAME', groupIndex: gi, name: e.target.value })
                  }
                  aria-label={`Group ${gi + 1} name`}
                  className="text-center text-base font-bold text-gray-800 border-b border-transparent
                             hover:border-gray-300 focus:border-blue-500 focus:outline-none
                             bg-transparent w-full transition-colors"
                />

                {/* Villain randomizer */}
                <VillainSlot
                  villainIndex={group.villainIndex}
                  defeatedIndices={group.defeatedVillainIndices}
                  onVillainSelected={index =>
                    dispatch({ type: 'SET_VILLAIN', groupIndex: gi, villainIndex: index })
                  }
                  onVillainDefeated={() =>
                    dispatch({ type: 'DEFEAT_GROUP_VILLAIN', groupIndex: gi })
                  }
                />

                {/* Players */}
                {group.players.length > 0 && (
                  <div className="w-full">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center mb-2">
                      Players
                    </p>
                    <div className="flex flex-row flex-wrap justify-center gap-3">
                      {group.players.map((player, pi) => {
                        const hero = player.heroIndex !== null ? HERO_POOL[player.heroIndex] : null;
                        return (
                          <button
                            key={pi}
                            type="button"
                            title={hero ? `${hero.name} — click to toggle eliminated` : `Player ${pi + 1}`}
                            onClick={() =>
                              dispatch({
                                type: 'TOGGLE_PLAYER_ELIMINATED',
                                groupIndex: gi,
                                playerIndex: pi,
                              })
                            }
                            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all
                                        focus:outline-none focus:ring-2 focus:ring-blue-400
                                        ${player.eliminated
                                          ? 'opacity-40 grayscale'
                                          : 'hover:scale-105'
                                        }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full overflow-hidden border-2
                                          ${player.eliminated ? 'border-red-400' : 'border-blue-300'}`}
                            >
                              {hero ? (
                                <img
                                  src={hero.url}
                                  alt={hero.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg">
                                  🦸
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 max-w-[56px] truncate text-center">
                              {player.eliminated ? '💀' : (player.playerName || hero?.name || `P${pi + 1}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Minion + Scheme side by side */}
                <div className="flex flex-row items-start justify-center gap-4 w-full">

                  {/* Minion */}
                  <div className="flex flex-col items-center gap-2">
                    {group.minion === null ? (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'REVEAL_MINION', groupIndex: gi })}
                        className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-semibold
                                   hover:bg-indigo-200 transition-colors whitespace-nowrap"
                      >
                        Reveal Group Minion
                      </button>
                    ) : minionActive ? (
                        <div className="bg-indigo-50 rounded-xl p-3 flex flex-col items-center gap-2">
                          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                            {group.name} Minion
                          </span>
                          <PortraitCard src={minionImg} alt="Minion" />
                          <CounterControl
                            label="Minion HP"
                            value={group.minion.hp}
                            onIncrement={() =>
                              dispatch({ type: 'CHANGE_MINION_HP', groupIndex: gi, delta: 1 })
                            }
                            onDecrement={() =>
                              dispatch({ type: 'CHANGE_MINION_HP', groupIndex: gi, delta: -1 })
                            }
                          />
                        </div>
                    ) : null /* defeated — shown in Victory Display */}
                  </div>

                  {/* Side Scheme */}
                  <div className="flex flex-col items-center gap-2">
                    {group.scheme === null ? (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'REVEAL_SCHEME', groupIndex: gi })}
                        className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold
                                   hover:bg-purple-200 transition-colors whitespace-nowrap"
                      >
                        Reveal Group Scheme
                      </button>
                    ) : schemeActive ? (
                        <div className="bg-purple-50 rounded-xl p-3 flex flex-col items-center gap-2">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                            {group.name} Side Scheme
                          </span>
                          <LandscapeCard src={sideSchemeImg} alt="Side Scheme" />
                          <CounterControl
                            label="Threat"
                            value={group.scheme.hp}
                            onIncrement={() =>
                              dispatch({ type: 'CHANGE_SCHEME_HP', groupIndex: gi, delta: 1 })
                            }
                            onDecrement={() =>
                              dispatch({ type: 'CHANGE_SCHEME_HP', groupIndex: gi, delta: -1 })
                            }
                          />
                        </div>
                    ) : null}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Reset Game ── */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'RESET_GAME' })}
        className="mt-4 px-6 py-2 rounded-lg bg-red-500 text-white font-semibold
                   hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2
                   focus:ring-red-400 transition-colors"
      >
        Reset Game
      </button>

      {/* ── Victory Display dock ── */}
      {defeatedItems.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 group">
          <div
            className="bg-yellow-400 text-yellow-900 text-xs font-bold px-6 py-1 rounded-t-xl
                       cursor-default text-center shadow-lg
                       group-hover:opacity-0 group-hover:pointer-events-none transition-opacity duration-200"
          >
            ⚔ Victory Display ({defeatedItems.length})
          </div>
          <div
            className="bg-yellow-50 border-t-4 border-yellow-400 shadow-2xl rounded-t-2xl px-8 py-5
                       max-w-2xl w-screen
                       translate-y-full group-hover:translate-y-0
                       transition-transform duration-300 ease-out"
          >
            <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-3 text-center">
              ⚔ Victory Display
            </h3>
            <div className="flex flex-row flex-wrap justify-center gap-3">
              {defeatedItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-yellow-300 px-4 py-2 text-center shadow-sm"
                >
                  <p className="text-xs text-gray-500">{item.groupName}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-yellow-600 font-medium">{item.type} — Defeated</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunningPhase;
