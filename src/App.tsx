import { Component, type ReactNode } from 'react';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import { SetupPhase } from './components/SetupPhase';
import { RunningPhase } from './components/RunningPhase';
import { EndScreen } from './components/EndScreen';
import { clearState } from './utils/localStorage';

// ---------------------------------------------------------------------------
// Error boundary — catches render crashes, clears stale localStorage, reloads
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  crashed: boolean;
  error: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { crashed: false, error: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      crashed: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  handleReset = () => {
    clearState();
    window.location.reload();
  };

  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gray-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <span className="text-5xl">⚠️</span>
            <h1 className="text-xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-sm text-gray-500">
              The saved game state may be incompatible with the current version.
              Resetting will clear it and start fresh.
            </p>
            <details className="text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-red-500 bg-red-50 rounded p-2 overflow-auto whitespace-pre-wrap">
                {this.state.error}
              </pre>
            </details>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-semibold
                         hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400
                         focus:ring-offset-2 transition-colors"
            >
              Reset &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// App content
// ---------------------------------------------------------------------------

export function AppContent() {
  const { state } = useGameState();

  return (
    <>
      {state.phase === 'setup' && <SetupPhase />}
      {(state.phase === 'running' ||
        state.phase === 'won' ||
        state.phase === 'lost') && <RunningPhase />}
      {(state.phase === 'won' || state.phase === 'lost') && <EndScreen />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function App() {
  return (
    <AppErrorBoundary>
      <GameStateProvider>
        <AppContent />
      </GameStateProvider>
    </AppErrorBoundary>
  );
}

export default App;
