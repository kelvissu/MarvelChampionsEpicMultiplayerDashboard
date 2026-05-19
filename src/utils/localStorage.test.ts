/**
 * Property-based tests for the localStorage persistence adapter.
 * Uses fast-check to verify universal invariants across all valid GameState inputs.
 *
 * Feature: board-game-dashboard
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { saveState, loadState, clearState } from './localStorage';
import type { GameState } from '../types/game';
import type { Phase } from '../types/game';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a valid Phase value. */
const arbPhase: fc.Arbitrary<Phase> = fc.constantFrom(
  'setup',
  'running',
  'won',
  'lost'
);

/**
 * Generates a structurally valid GameState.
 * All numeric fields are kept in reasonable ranges to mirror real usage,
 * but the property holds for any numbers that pass isValidGameState.
 */
const arbGameState: fc.Arbitrary<GameState> = fc.record({
  phase: arbPhase,
  playerCount: fc.integer({ min: 1, max: 16 }),
  groupCount: fc.integer({ min: 1, max: 4 }),
  villainHP: fc.integer({ min: -100, max: 1000 }),
  schemeProgress: fc.integer({ min: 0, max: 100 }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearState();
});

/**
 * Property 10: Game state persistence round-trip
 *
 * For any valid GameState object, serialising it to localStorage and then
 * deserialising it SHALL produce a state that is structurally equal to the
 * original.
 *
 * Feature: board-game-dashboard, Property 10: Game state persistence round-trip
 * Validates: Requirements 7.1, 7.2
 */
describe('Property 10: Game state persistence round-trip', () => {
  it('loadState after saveState returns a structurally equal GameState', () => {
    fc.assert(
      fc.property(arbGameState, (state) => {
        saveState(state);
        const loaded = loadState();
        expect(loaded).toEqual(state);
      }),
      { numRuns: 100 }
    );
  });
});
