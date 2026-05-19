import { useGameState } from '../context/GameStateContext';
import loseImg from '../assets/lose.jpg';

/**
 * EndScreen component — a fixed full-screen overlay displayed when the game
 * reaches a terminal phase ('won' or 'lost').
 *
 * Renders:
 * - A win message when `state.phase === 'won'`
 * - A loss message when `state.phase === 'lost'`
 * - A "Play Again" button that dispatches RESET_GAME (the middleware wrapper
 *   in GameStateProvider also calls clearState() automatically)
 */
export function EndScreen() {
  const { state, dispatch } = useGameState();

  const isWin = state.phase === 'won';
  const allEliminated =
    state.phase === 'lost' &&
    state.groups.flatMap(g => g.players).every(p => p.eliminated);
  const lossReason = allEliminated
    ? 'All heroes have been eliminated.'
    : 'The scheme has advanced too far. Better luck next time!';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center
                 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isWin ? 'You Win!' : 'You Lose!'}
    >
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-white p-12 shadow-2xl">
        {isWin ? (
          <>
            <span className="text-6xl" aria-hidden="true">🏆</span>
            <h1 className="text-4xl font-bold text-green-600 tracking-tight">
              You Win!
            </h1>
            <p className="text-gray-500 text-center">
              The villain has been defeated. Congratulations!
            </p>
          </>
        ) : (
          <>
            
            <span className="text-6xl" aria-hidden="true">💀</span>
            <img src={loseImg} alt="Lose" className="w-48 h-48 object-contain" />
            <h1 className="text-4xl font-bold text-black-600 tracking-tight">
              You Lose!
            </h1>
            <p className="text-gray-500 text-center">
              {lossReason}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          className="mt-2 px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-indigo-500 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

export default EndScreen;
