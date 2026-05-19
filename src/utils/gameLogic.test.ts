/**
 * Property-based tests for pure game logic utilities.
 * Uses fast-check to verify universal invariants across all valid inputs.
 *
 * Feature: board-game-dashboard
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  maxVillainHP,
  schemeThreshold,
  clampPlayerCount,
  clampGroupCount,
  distributePlayersAcrossGroups,
} from './gameLogic';

/**
 * Property 1: Villain HP formula
 * For any playerCount in [1, 16], maxVillainHP(playerCount) === playerCount * 20
 *
 * Feature: board-game-dashboard, Property 1: Villain HP formula
 * Validates: Requirements 1.3, 1.5
 */
describe('Property 1: Villain HP formula', () => {
  it('maxVillainHP equals playerCount * 20 for all valid player counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        (playerCount) => {
          expect(maxVillainHP(playerCount)).toBe(playerCount * 20);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Main Scheme Threshold formula
 * For any groupCount in [1, 4], schemeThreshold(groupCount) === groupCount * 2
 *
 * Feature: board-game-dashboard, Property 2: Main Scheme Threshold formula
 * Validates: Requirements 1.4, 1.6
 */
describe('Property 2: Main Scheme Threshold formula', () => {
  it('schemeThreshold equals groupCount * 2 for all valid group counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        (groupCount) => {
          expect(schemeThreshold(groupCount)).toBe(groupCount * 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Player Count clamping
 * For any integer, clampPlayerCount returns a value in [1, 16]
 *
 * Feature: board-game-dashboard, Property 3: Player Count clamping
 * Validates: Requirements 1.7
 */
describe('Property 3: Player Count clamping', () => {
  it('clampPlayerCount always returns a value in [1, 16]', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        (value) => {
          const result = clampPlayerCount(value);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(16);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clampPlayerCount preserves values already in range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        (value) => {
          expect(clampPlayerCount(value)).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Group Count clamping
 * For any integer, clampGroupCount returns a value in [1, 4]
 *
 * Feature: board-game-dashboard, Property 4: Group Count clamping
 * Validates: Requirements 1.8
 */
describe('Property 4: Group Count clamping', () => {
  it('clampGroupCount always returns a value in [1, 4]', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        (value) => {
          const result = clampGroupCount(value);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clampGroupCount preserves values already in range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        (value) => {
          expect(clampGroupCount(value)).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Player distribution invariants
 * For any playerCount in [1, 16] and groupCount in [1, 4]:
 *   (a) length equals groupCount
 *   (b) sum equals playerCount
 *   (c) max - min <= 1
 *
 * Feature: board-game-dashboard, Property 5: Player distribution invariants
 * Validates: Requirements 2.1, 2.3
 */
describe('Property 5: Player distribution invariants', () => {
  it('distribution length equals groupCount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        fc.integer({ min: 1, max: 4 }),
        (playerCount, groupCount) => {
          const dist = distributePlayersAcrossGroups(playerCount, groupCount);
          expect(dist).toHaveLength(groupCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('distribution sum equals playerCount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        fc.integer({ min: 1, max: 4 }),
        (playerCount, groupCount) => {
          const dist = distributePlayersAcrossGroups(playerCount, groupCount);
          const sum = dist.reduce((acc, n) => acc + n, 0);
          expect(sum).toBe(playerCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('distribution max - min is at most 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        fc.integer({ min: 1, max: 4 }),
        (playerCount, groupCount) => {
          const dist = distributePlayersAcrossGroups(playerCount, groupCount);
          const max = Math.max(...dist);
          const min = Math.min(...dist);
          expect(max - min).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
