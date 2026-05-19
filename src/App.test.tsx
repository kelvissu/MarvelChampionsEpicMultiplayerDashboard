/**
 * Integration tests for the full game flow.
 *
 * Feature: board-game-dashboard
 * Validates: Requirements 3.1–3.5, 4.6, 5.7, 6.1–6.4, 7.1–7.4
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App, { AppContent } from './App';
import { GameStateProvider } from './context/GameStateContext';
import type { GameState } from './types/game';
import { STORAGE_KEY } from './utils/localStorage';

// ---------------------------------------------------------------------------
// In-memory localStorage mock (mirrors the pattern in localStorage.test.ts)
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Global localStorage isolation
// All tests use the in-memory mock to avoid cross-test contamination.
// ---------------------------------------------------------------------------

let mockStorage: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  mockStorage = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the full <App /> component (includes its own GameStateProvider). */
function renderApp() {
  return render(<App />);
}

/**
 * Renders AppContent wrapped in a GameStateProvider with a given initialState.
 * Useful for setting up specific states efficiently without going through the UI.
 */
function renderWithState(initialState: GameState) {
  return render(
    <GameStateProvider initialState={initialState}>
      <AppContent />
    </GameStateProvider>
  );
}

// ---------------------------------------------------------------------------
// Sub-task 1: Setup → Running phase transition preserves correct initial HP
//             and scheme values
// Validates: Requirements 3.1–3.5
// ---------------------------------------------------------------------------

describe('Sub-task 1: Setup → Running phase transition', () => {
  it('transitions to Running Phase when "Start Game" is clicked', async () => {
    renderApp();

    // Setup Phase should be visible
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    // Running Phase heading should now be visible
    expect(screen.getByRole('heading', { name: /running phase/i })).toBeInTheDocument();
  });

  it('sets initial Villain HP to 20 × playerCount on transition (1 player → 20 HP)', async () => {
    // Default state: playerCount=1, so villainHP should be 20
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    const villainHPSection = screen.getByRole('region', { name: /villain hp/i });
    expect(villainHPSection).toHaveTextContent('20');
  });

  it('sets initial Villain HP to 20 × playerCount on transition (3 players → 60 HP)', async () => {
    const setupState: GameState = {
      phase: 'setup',
      playerCount: 3,
      groupCount: 2,
      villainHP: 60,
      schemeProgress: 0,
    };
    renderWithState(setupState);
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    const villainHPSection = screen.getByRole('region', { name: /villain hp/i });
    expect(villainHPSection).toHaveTextContent('60');
  });

  it('sets initial Scheme Progress to 0 on transition', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    const schemeSection = screen.getByRole('region', { name: /scheme progress/i });
    // Scheme Progress starts at 0
    expect(schemeSection).toHaveTextContent('0');
  });

  it('locks Player Count and Group Count on transition (Running Phase has no setup inputs)', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    // Setup inputs should not be present in Running Phase
    expect(screen.queryByLabelText(/player count/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/group count/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sub-task 2: Win flow — decrement HP to 0 → EndScreen with win message
//             → Play Again → Setup
// Validates: Requirements 4.6, 6.1, 6.3, 6.4
// ---------------------------------------------------------------------------

describe('Sub-task 2: Win flow', () => {
  it('shows EndScreen with win message when Villain HP reaches 0', async () => {
    // Start with villainHP=1 so a single decrement triggers the win condition
    const nearWinState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 1,
      schemeProgress: 0,
    };
    renderWithState(nearWinState);

    // Decrement Villain HP by 1 → HP becomes 0 → win condition
    await userEvent.click(
      screen.getByRole('button', { name: /decrement villain hp/i })
    );

    // EndScreen should appear with win message
    expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you lose/i })).not.toBeInTheDocument();
  });

  it('EndScreen is rendered as a modal overlay (aria-modal=true)', async () => {
    const nearWinState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 1,
      schemeProgress: 0,
    };
    renderWithState(nearWinState);

    await userEvent.click(
      screen.getByRole('button', { name: /decrement villain hp/i })
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('"Play Again" on win EndScreen resets to Setup Phase', async () => {
    const nearWinState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 1,
      schemeProgress: 0,
    };
    renderWithState(nearWinState);

    await userEvent.click(
      screen.getByRole('button', { name: /decrement villain hp/i })
    );

    // Confirm win screen is shown
    expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();

    // Click Play Again
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));

    // Should be back at Setup Phase
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you win/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sub-task 3: Loss flow — increment scheme past threshold → EndScreen with
//             loss message → Play Again → Setup
// Validates: Requirements 5.7, 6.2, 6.3, 6.4
// ---------------------------------------------------------------------------

describe('Sub-task 3: Loss flow', () => {
  it('shows EndScreen with loss message when Scheme Progress exceeds threshold', async () => {
    // groupCount=1 → threshold = 1×2 = 2; schemeProgress=2 means one more increment
    // triggers loss (schemeProgress > threshold, i.e. 3 > 2)
    const nearLossState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 20,
      schemeProgress: 2,
    };
    renderWithState(nearLossState);

    // Increment Scheme Progress → 3 > 2 → loss condition
    await userEvent.click(
      screen.getByRole('button', { name: /increment scheme progress/i })
    );

    // EndScreen should appear with loss message
    expect(screen.getByRole('heading', { name: /you lose/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you win/i })).not.toBeInTheDocument();
  });

  it('EndScreen is rendered as a modal overlay on loss (aria-modal=true)', async () => {
    const nearLossState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 20,
      schemeProgress: 2,
    };
    renderWithState(nearLossState);

    await userEvent.click(
      screen.getByRole('button', { name: /increment scheme progress/i })
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('"Play Again" on loss EndScreen resets to Setup Phase', async () => {
    const nearLossState: GameState = {
      phase: 'running',
      playerCount: 1,
      groupCount: 1,
      villainHP: 20,
      schemeProgress: 2,
    };
    renderWithState(nearLossState);

    await userEvent.click(
      screen.getByRole('button', { name: /increment scheme progress/i })
    );

    // Confirm loss screen is shown
    expect(screen.getByRole('heading', { name: /you lose/i })).toBeInTheDocument();

    // Click Play Again
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));

    // Should be back at Setup Phase
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you lose/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sub-task 4: Page reload restores state from localStorage
// Validates: Requirements 7.1–7.4
// ---------------------------------------------------------------------------

describe('Sub-task 4: localStorage state persistence', () => {
  it('saves state to localStorage when game state changes', async () => {
    renderApp();

    // Click Start Game — this changes state and should trigger a save
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));

    const saved = mockStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved!);
    expect(parsed.phase).toBe('running');
  });

  it('restores Running Phase state from localStorage on re-render', () => {
    // Pre-populate localStorage with a running-phase state
    const savedState: GameState = {
      phase: 'running',
      playerCount: 4,
      groupCount: 2,
      villainHP: 80,
      schemeProgress: 3,
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

    // Render App — it should read from localStorage and restore the state
    renderApp();

    // Should be in Running Phase (not Setup)
    expect(screen.getByRole('heading', { name: /running phase/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();

    // Villain HP should be restored to 80
    const villainHPSection = screen.getByRole('region', { name: /villain hp/i });
    expect(villainHPSection).toHaveTextContent('80');
  });

  it('restores Scheme Progress from localStorage on re-render', () => {
    const savedState: GameState = {
      phase: 'running',
      playerCount: 2,
      groupCount: 2,
      villainHP: 40,
      schemeProgress: 3,
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

    renderApp();

    const schemeSection = screen.getByRole('region', { name: /scheme progress/i });
    expect(schemeSection).toHaveTextContent('3');
  });

  it('initialises to Setup Phase with defaults when localStorage is empty', () => {
    // mockStorage is empty by default
    renderApp();

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
  });

  it('"Play Again" clears saved game state and resets to Setup Phase with defaults', async () => {
    // Start in a won state
    const wonState: GameState = {
      phase: 'won',
      playerCount: 1,
      groupCount: 1,
      villainHP: 0,
      schemeProgress: 0,
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(wonState));

    renderApp();

    // Should show win EndScreen
    expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /play again/i }));

    // Should be back at Setup Phase
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();

    // The saved state should now reflect the default setup state (not the won state)
    // After RESET_GAME, clearState() is called then the useEffect re-saves the default state.
    const saved = mockStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.phase).toBe('setup');
    expect(parsed.playerCount).toBe(1);
    expect(parsed.groupCount).toBe(1);
  });
});
