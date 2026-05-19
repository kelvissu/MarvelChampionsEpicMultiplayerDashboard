import { useGameState } from '../context/GameStateContext';
import { maxVillainHP, schemeThreshold } from '../utils/gameLogic';
import { GroupDistribution } from './GroupDistribution';
import { HERO_POOL } from './HeroPicker';

export function SetupPhase() {
  const { state, dispatch } = useGameState();

  const villainHP = maxVillainHP(state.playerCount);
  const threshold = schemeThreshold(state.groupCount);

  // Collect all hero indices currently selected by any player
  const takenHeroIndices = new Set(
    state.groups
      .flatMap(g => g.players)
      .map(p => p.heroIndex)
      .filter((i): i is number => i !== null)
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Game Setup</h1>

      {/* Global counts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="player-count" className="block text-sm font-medium text-gray-700">
            Total Player Count
          </label>
          <input
            id="player-count"
            type="number"
            min={1}
            max={16}
            value={state.playerCount}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) dispatch({ type: 'SET_PLAYER_COUNT', payload: v });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="group-count" className="block text-sm font-medium text-gray-700">
            Group Count
            {state.playerCount === 1 && (
              <span className="ml-2 text-xs text-amber-600 font-normal"/>
            )}
          </label>
          <input
            id="group-count"
            type="number"
            min={1}
            max={Math.min(4, state.playerCount)}
            value={state.groupCount}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) dispatch({ type: 'SET_GROUP_COUNT', payload: v });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Derived values */}
      <div className="rounded-md bg-gray-50 border border-gray-200 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-700">
          <span className="font-medium">Villain HP</span>
          <span data-testid="villain-hp">{villainHP}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span className="font-medium">Main Scheme Threshold</span>
          <span data-testid="scheme-threshold">{threshold}</span>
        </div>
      </div>

      {/* Group Distribution summary */}
      <GroupDistribution playerCount={state.playerCount} groupCount={state.groupCount} />

      {/* Per-group player configuration */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-700">Configure Groups</h2>
        {state.groups.map((group, gi) => (
          <div key={gi} className="rounded-xl border border-gray-200 bg-white p-4 space-y-4 shadow-sm">

            {/* Group name */}
            <input
              type="text"
              value={group.name}
              onChange={e =>
                dispatch({ type: 'SET_GROUP_NAME', groupIndex: gi, name: e.target.value })
              }
              aria-label={`Group ${gi + 1} name`}
              className="text-sm font-bold text-gray-800 border-b border-transparent
                         hover:border-gray-300 focus:border-blue-500 focus:outline-none
                         bg-transparent w-full transition-colors"
            />

            {/* Players */}
            <div className="space-y-3">
              {group.players.map((player, pi) => {
                const selectedHero = player.heroIndex !== null ? HERO_POOL[player.heroIndex] : null;
                return (
                  <div
                    key={pi}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3
                               rounded-lg bg-gray-50 border border-gray-100"
                  >
                    {/* Hero avatar preview */}
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      {selectedHero ? (
                        <img
                          src={selectedHero.url}
                          alt={selectedHero.name}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg">
                          🦸
                        </div>
                      )}
                    </div>

                    {/* Player name */}
                    <input
                      type="text"
                      placeholder={`Player ${pi + 1} name`}
                      value={player.playerName}
                      onChange={e =>
                        dispatch({
                          type: 'SET_PLAYER_NAME',
                          groupIndex: gi,
                          playerIndex: pi,
                          playerName: e.target.value,
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm
                                 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                                 bg-white min-w-0"
                    />

                    {/* Hero dropdown */}
                    <select
                      value={player.heroIndex ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        dispatch({
                          type: 'SET_PLAYER_HERO',
                          groupIndex: gi,
                          playerIndex: pi,
                          heroIndex: val === '' ? null : parseInt(val, 10),
                        });
                      }}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm
                                 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                                 bg-white"
                    >
                      <option value="">— No hero —</option>
                      {HERO_POOL.map(hero => {
                        const takenByOther =
                          takenHeroIndices.has(hero.index) && hero.index !== player.heroIndex;
                        return (
                          <option
                            key={hero.index}
                            value={hero.index}
                            disabled={takenByOther}
                          >
                            {takenByOther ? `${hero.name} (taken)` : hero.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Start Game */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'START_GAME' })}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:ring-offset-2 transition-colors"
      >
        Start Game
      </button>
    </div>
  );
}

export default SetupPhase;
