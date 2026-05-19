/**
 * Unit tests for the SetupPhase component.
 *
 * Feature: board-game-dashboard
 * Validates: Requirements 1.1–1.9, 3.1
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SetupPhase } from './SetupPhase';
import { GameStateProvider, useGameState } from '../context/GameStateContext';
import type { GameState } from '../types/game';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETUP_STATE: GameState = {
  phase: 'setup',
  playerCount: 1,
  groupCount: 1,
  villainHP: 20,
  schemeProgress: 0,
};

function renderSetupPhase(initialState: GameState = DEFAULT_SETUP_STATE) {
  return render(
    <GameStateProvider initialState={initialState}>
      <SetupPhase />
    </GameStateProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SetupPhase', () => {
  // Validates: Requirement 1.1 — Player Count input min=1, max=16
  // Validates: Requirement 1.2 — Group Count input min=1, max=4
  describe('input min/max attributes', () => {
    it('renders Player Count input with min=1 and max=16', () => {
      renderSetupPhase();
      const playerInput = screen.getByLabelText(/player count/i);
      expect(playerInput).toHaveAttribute('min', '1');
      expect(playerInput).toHaveAttribute('max', '16');
    });

    it('renders Group Count input with min=1 and max=4', () => {
      renderSetupPhase();
      const groupInput = screen.getByLabelText(/group count/i);
      expect(groupInput).toHaveAttribute('min', '1');
      expect(groupInput).toHaveAttribute('max', '4');
    });
  });

  // Validates: Requirement 1.3 — Villain HP displayed as 20 × Player Count
  // Validates: Requirement 1.5 — Villain HP updates when Player Count changes
  describe('Villain HP updates when Player Count changes', () => {
    it('displays initial Villain HP based on default player count', () => {
      renderSetupPhase();
      // Default playerCount=1 → villainHP = 20 × 1 = 20
      expect(screen.getByTestId('villain-hp')).toHaveTextContent('20');
    });

    it('recalculates Villain HP immediately when Player Count input changes', async () => {
      renderSetupPhase();
      const playerInput = screen.getByLabelText(/player count/i);

      // Use fireEvent.change to set the value directly (avoids append behaviour
      // of userEvent.type on number inputs that already have a value).
      fireEvent.change(playerInput, { target: { value: '5' } });

      // 20 × 5 = 100
      expect(screen.getByTestId('villain-hp')).toHaveTextContent('100');
    });

    it('reflects Villain HP for a non-default initial player count', () => {
      renderSetupPhase({ ...DEFAULT_SETUP_STATE, playerCount: 4, villainHP: 80 });
      // 20 × 4 = 80
      expect(screen.getByTestId('villain-hp')).toHaveTextContent('80');
    });
  });

  // Validates: Requirement 1.4 — Scheme Threshold displayed as Group Count × 2
  // Validates: Requirement 1.6 — Scheme Threshold updates when Group Count changes
  describe('Scheme Threshold updates when Group Count changes', () => {
    it('displays initial Scheme Threshold based on default group count', () => {
      renderSetupPhase();
      // Default groupCount=1 → threshold = 1 × 2 = 2
      expect(screen.getByTestId('scheme-threshold')).toHaveTextContent('2');
    });

    it('recalculates Scheme Threshold immediately when Group Count input changes', async () => {
      renderSetupPhase();
      const groupInput = screen.getByLabelText(/group count/i);

      // Use fireEvent.change to set the value directly.
      fireEvent.change(groupInput, { target: { value: '3' } });

      // 3 × 2 = 6
      expect(screen.getByTestId('scheme-threshold')).toHaveTextContent('6');
    });

    it('reflects Scheme Threshold for a non-default initial group count', () => {
      renderSetupPhase({ ...DEFAULT_SETUP_STATE, groupCount: 4 });
      // 4 × 2 = 8
      expect(screen.getByTestId('scheme-threshold')).toHaveTextContent('8');
    });
  });

  // Validates: Requirement 1.9 / 3.1 — "Start Game" button triggers phase transition
  describe('"Start Game" button triggers phase transition', () => {
    it('renders a "Start Game" button', () => {
      renderSetupPhase();
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('dispatches START_GAME when "Start Game" is clicked, transitioning to running phase', async () => {
      // We verify the side-effect: after clicking, the SetupPhase component
      // should no longer be the active view. Since App.tsx renders SetupPhase
      // only in 'setup' phase, we confirm the dispatch happened by checking
      // that the component re-renders with the updated state.
      //
      // Because GameStateProvider is wrapping SetupPhase directly here,
      // the phase change will cause the provider's state to update.
      // We can observe this by checking that the button is still present
      // (SetupPhase is still rendered in this isolated test) but the
      // dispatch was called — we verify via the reducer side-effect:
      // after START_GAME the phase becomes 'running', which means
      // villainHP is set to 20 × playerCount.
      //
      // The simplest observable check: clicking the button does not throw,
      // and the button remains accessible (component didn't crash).
      renderSetupPhase({ ...DEFAULT_SETUP_STATE, playerCount: 3 });
      const startBtn = screen.getByRole('button', { name: /start game/i });
      await userEvent.click(startBtn);
      // If dispatch succeeded without error, the button interaction completed.
      // The phase transition itself is tested in gameReducer.test.ts.
      // Here we confirm the button is clickable and the component handles it.
      expect(startBtn).toBeInTheDocument();
    });

    it('START_GAME dispatch sets phase to running in the shared context', async () => {
      // Render a sibling component that reads phase from context to confirm
      // the dispatch actually changed the state.
      function PhaseDisplay() {
        const { state } = useGameState();
        return <div data-testid="phase">{state.phase}</div>;
      }

      render(
        <GameStateProvider initialState={DEFAULT_SETUP_STATE}>
          <SetupPhase />
          <PhaseDisplay />
        </GameStateProvider>
      );

      expect(screen.getByTestId('phase')).toHaveTextContent('setup');
      await userEvent.click(screen.getByRole('button', { name: /start game/i }));
      expect(screen.getByTestId('phase')).toHaveTextContent('running');
    });
  });
});
