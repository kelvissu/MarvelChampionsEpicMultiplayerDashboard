/**
 * Unit tests for the EndScreen component.
 *
 * Feature: board-game-dashboard
 * Validates: Requirements 6.1–6.4
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EndScreen } from './EndScreen';
import { GameStateProvider, useGameState } from '../context/GameStateContext';
import type { GameState } from '../types/game';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wonState: GameState = {
  phase: 'won',
  playerCount: 2,
  groupCount: 2,
  villainHP: 0,
  schemeProgress: 2,
};

const lostState: GameState = {
  phase: 'lost',
  playerCount: 2,
  groupCount: 2,
  villainHP: 20,
  schemeProgress: 5,
};

function renderWithProvider(initialState: GameState) {
  return render(
    <GameStateProvider initialState={initialState}>
      <EndScreen />
    </GameStateProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EndScreen', () => {
  // Validates: Requirement 6.1 — win message displayed when phase is 'won'
  describe('Win condition display', () => {
    it('renders a win message when phase is "won"', () => {
      renderWithProvider(wonState);
      expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();
    });

    it('does not render a loss message when phase is "won"', () => {
      renderWithProvider(wonState);
      expect(screen.queryByRole('heading', { name: /you lose/i })).not.toBeInTheDocument();
    });
  });

  // Validates: Requirement 6.2 — loss message displayed when phase is 'lost'
  describe('Loss condition display', () => {
    it('renders a loss message when phase is "lost"', () => {
      renderWithProvider(lostState);
      expect(screen.getByRole('heading', { name: /you lose/i })).toBeInTheDocument();
    });

    it('does not render a win message when phase is "lost"', () => {
      renderWithProvider(lostState);
      expect(screen.queryByRole('heading', { name: /you win/i })).not.toBeInTheDocument();
    });
  });

  // Validates: Requirement 6.3 — End Screen overlays all other content
  describe('Overlay behaviour', () => {
    it('renders as a dialog with aria-modal="true"', () => {
      renderWithProvider(wonState);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  // Validates: Requirement 6.4 — "Play Again" button resets to Setup Phase
  describe('"Play Again" button', () => {
    it('is present on the End Screen', () => {
      renderWithProvider(wonState);
      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    });

    it('resets the game to Setup Phase when clicked (won state)', async () => {
      function PhaseDisplay() {
        const { state } = useGameState();
        return <div data-testid="phase">{state.phase}</div>;
      }

      render(
        <GameStateProvider initialState={wonState}>
          <EndScreen />
          <PhaseDisplay />
        </GameStateProvider>
      );

      expect(screen.getByTestId('phase')).toHaveTextContent('won');
      await userEvent.click(screen.getByRole('button', { name: /play again/i }));
      expect(screen.getByTestId('phase')).toHaveTextContent('setup');
    });

    it('resets the game to Setup Phase when clicked (lost state)', async () => {
      function PhaseDisplay() {
        const { state } = useGameState();
        return <div data-testid="phase">{state.phase}</div>;
      }

      render(
        <GameStateProvider initialState={lostState}>
          <EndScreen />
          <PhaseDisplay />
        </GameStateProvider>
      );

      expect(screen.getByTestId('phase')).toHaveTextContent('lost');
      await userEvent.click(screen.getByRole('button', { name: /play again/i }));
      expect(screen.getByTestId('phase')).toHaveTextContent('setup');
    });
  });
});
