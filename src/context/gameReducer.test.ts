/**
 * Property-based tests for the gameReducer.
 * Uses fast-check to verify universal invariants across all valid inputs.
 *
 * Feature: board-game-dashboard
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { gameReducer } from './GameStateContext';
import type { GameState } from '../types/game';
import { schemeThreshold } from '../utils/gameLogic';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid running-phase GameState with arbitrary but in-range values.
 * Used as the base state for reducer property tests.
 */
const runningState = (): fc.Arbitrary<GameState> =>
  fc.record<GameState>({
    phase: fc.constant('running'),
    playerCount: fc.integer({ min: 1, max: 16 }),
    groupCount: fc.integer({ min: 1, max: 4 }),
    villainHP: fc.integer({ min: 1, max: 320 }), // max is 16 * 20
    schemeProgress: fc.integer({ min: 0, max: 100 }),
  });

// ---------------------------------------------------------------------------
// Property 6: Villain HP counter monotonicity
// ---------------------------------------------------------------------------

/**
 * Property 6: Villain HP counter monotonicity
 * INCREMENT_VILLAIN_HP adds 1; DECREMENT_VILLAIN_HP subtracts 1.
 *
 * Feature: board-game-dashboard, Property 6: Villain HP counter monotonicity
 * Validates: Requirements 4.4, 4.5
 */
describe('Property 6: Villain HP counter monotonicity', () => {
  it('INCREMENT_VILLAIN_HP increases villainHP by exactly 1', () => {
    fc.assert(
      fc.property(runningState(), (state) => {
        const next = gameReducer(state, { type: 'INCREMENT_VILLAIN_HP' });
        expect(next.villainHP).toBe(state.villainHP + 1);
      }),
      { numRuns: 100 }
    );
  });

  it('DECREMENT_VILLAIN_HP decreases villainHP by exactly 1', () => {
    // Use villainHP > 1 so the win condition does not change the phase
    // (we only care about the HP delta here, not the phase transition)
    fc.assert(
      fc.property(
        fc.record<GameState>({
          phase: fc.constant('running'),
          playerCount: fc.integer({ min: 1, max: 16 }),
          groupCount: fc.integer({ min: 1, max: 4 }),
          villainHP: fc.integer({ min: 2, max: 320 }),
          schemeProgress: fc.integer({ min: 0, max: 100 }),
        }),
        (state) => {
          const next = gameReducer(state, { type: 'DECREMENT_VILLAIN_HP' });
          expect(next.villainHP).toBe(state.villainHP - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Win condition threshold
// ---------------------------------------------------------------------------

/**
 * Property 7: Win condition threshold
 * After DECREMENT_VILLAIN_HP when villainHP ≤ 1, phase becomes 'won'.
 *
 * Feature: board-game-dashboard, Property 7: Win condition threshold
 * Validates: Requirements 4.6
 */
describe('Property 7: Win condition threshold', () => {
  it('phase becomes "won" when DECREMENT_VILLAIN_HP brings villainHP to 0 or below', () => {
    // villainHP in [1, 1] means after decrement it becomes 0 (≤ 0 → won)
    // We also test negative starting HP to cover the <= 0 boundary fully
    fc.assert(
      fc.property(
        fc.record<GameState>({
          phase: fc.constant('running'),
          playerCount: fc.integer({ min: 1, max: 16 }),
          groupCount: fc.integer({ min: 1, max: 4 }),
          villainHP: fc.integer({ min: -10, max: 1 }),
          schemeProgress: fc.integer({ min: 0, max: 100 }),
        }),
        (state) => {
          const next = gameReducer(state, { type: 'DECREMENT_VILLAIN_HP' });
          expect(next.phase).toBe('won');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Scheme Progress counter monotonicity
// ---------------------------------------------------------------------------

/**
 * Property 8: Scheme Progress counter monotonicity
 * INCREMENT_SCHEME_PROGRESS adds 1 (when not triggering loss);
 * DECREMENT_SCHEME_PROGRESS subtracts 1 (when schemeProgress > 0).
 *
 * Feature: board-game-dashboard, Property 8: Scheme Progress counter monotonicity
 * Validates: Requirements 5.4, 5.5
 */
describe('Property 8: Scheme Progress counter monotonicity', () => {
  it('INCREMENT_SCHEME_PROGRESS increases schemeProgress by exactly 1 (when not triggering loss)', () => {
    // Constrain schemeProgress so that schemeProgress + 1 <= threshold (no loss)
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }).chain((groupCount) => {
          const threshold = schemeThreshold(groupCount);
          return fc.record<GameState>({
            phase: fc.constant('running'),
            playerCount: fc.integer({ min: 1, max: 16 }),
            groupCount: fc.constant(groupCount),
            villainHP: fc.integer({ min: 1, max: 320 }),
            // schemeProgress + 1 must be <= threshold to avoid triggering loss
            schemeProgress: fc.integer({ min: 0, max: threshold - 1 }),
          });
        }),
        (state) => {
          const next = gameReducer(state, { type: 'INCREMENT_SCHEME_PROGRESS' });
          expect(next.schemeProgress).toBe(state.schemeProgress + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('DECREMENT_SCHEME_PROGRESS decreases schemeProgress by exactly 1 when schemeProgress > 0', () => {
    fc.assert(
      fc.property(
        fc.record<GameState>({
          phase: fc.constant('running'),
          playerCount: fc.integer({ min: 1, max: 16 }),
          groupCount: fc.integer({ min: 1, max: 4 }),
          villainHP: fc.integer({ min: 1, max: 320 }),
          schemeProgress: fc.integer({ min: 1, max: 100 }),
        }),
        (state) => {
          const next = gameReducer(state, { type: 'DECREMENT_SCHEME_PROGRESS' });
          expect(next.schemeProgress).toBe(state.schemeProgress - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Loss condition threshold
// ---------------------------------------------------------------------------

/**
 * Property 9: Loss condition threshold
 * After INCREMENT_SCHEME_PROGRESS when schemeProgress > groupCount × 2, phase is 'lost'.
 *
 * Feature: board-game-dashboard, Property 9: Loss condition threshold
 * Validates: Requirements 5.7
 */
describe('Property 9: Loss condition threshold', () => {
  it('phase becomes "lost" when INCREMENT_SCHEME_PROGRESS pushes schemeProgress above threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }).chain((groupCount) => {
          const threshold = schemeThreshold(groupCount);
          return fc.record<GameState>({
            phase: fc.constant('running'),
            playerCount: fc.integer({ min: 1, max: 16 }),
            groupCount: fc.constant(groupCount),
            villainHP: fc.integer({ min: 1, max: 320 }),
            // schemeProgress must equal threshold so that +1 exceeds it
            schemeProgress: fc.constant(threshold),
          });
        }),
        (state) => {
          const next = gameReducer(state, { type: 'INCREMENT_SCHEME_PROGRESS' });
          expect(next.phase).toBe('lost');
        }
      ),
      { numRuns: 100 }
    );
  });
});
