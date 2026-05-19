import type { GameState } from '../types/game';

export const STORAGE_KEY = 'board-game-dashboard-state';

/**
 * Serialises the given GameState to localStorage.
 * Write failures (e.g. private browsing quota exceeded) are silently ignored.
 */
export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore write failures (e.g. private browsing quota)
  }
}

/**
 * Reads and deserialises a GameState from localStorage.
 * Returns null if no value is stored, the stored value cannot be parsed,
 * or the parsed value fails the structural validation guard.
 */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Removes the persisted game state from localStorage.
 */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Type guard that performs a structural check on an unknown value to determine
 * whether it conforms to the GameState interface.
 * Guards against stale or corrupted localStorage data.
 */
export function isValidGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    !['setup', 'running', 'won', 'lost'].includes(v.phase as string) ||
    typeof v.playerCount !== 'number' ||
    typeof v.groupCount !== 'number' ||
    typeof v.villainHP !== 'number' ||
    typeof v.schemeProgress !== 'number' ||
    !Array.isArray(v.groups)
  ) return false;

  // Validate each group has the current shape
  return (v.groups as unknown[]).every(g => {
    if (typeof g !== 'object' || g === null) return false;
    const grp = g as Record<string, unknown>;
    return (
      typeof grp.name === 'string' &&
      Array.isArray(grp.players) &&
      Array.isArray(grp.defeatedVillainIndices) &&
      (grp.villainIndex === null || typeof grp.villainIndex === 'number')
    );
  });
}
