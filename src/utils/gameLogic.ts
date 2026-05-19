/**
 * Pure game logic utility functions for the Board Game Dashboard.
 *
 * These functions are stateless and derive values from game configuration.
 * They are used by the reducer, components, and tests.
 */

/**
 * Calculates the maximum villain HP for a given player count.
 * Formula: playerCount × 20
 *
 * @param playerCount - Number of players (1–16)
 * @returns The villain HP ceiling for the session
 */
export function maxVillainHP(playerCount: number): number {
  return playerCount * 20;
}

/**
 * Calculates the main scheme loss threshold for a given group count.
 * Formula: groupCount × 2
 *
 * @param groupCount - Number of groups (1–4)
 * @returns The scheme progress value at which the game is lost
 */
export function schemeThreshold(groupCount: number): number {
  return groupCount * 2;
}

/**
 * Distributes players as evenly as possible across groups.
 * Groups with a lower index receive the extra player when the count
 * does not divide evenly.
 *
 * @param playerCount - Total number of players (1–16)
 * @param groupCount  - Number of groups to distribute into (1–4)
 * @returns An array of length `groupCount` where each element is the
 *          number of players assigned to that group
 */
export function distributePlayersAcrossGroups(
  playerCount: number,
  groupCount: number
): number[] {
  const base = Math.floor(playerCount / groupCount);
  const remainder = playerCount % groupCount;
  return Array.from({ length: groupCount }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

/**
 * Clamps a player count value to the valid range [1, 16].
 *
 * @param value - Raw player count input
 * @returns The clamped value in [1, 16]
 */
export function clampPlayerCount(value: number): number {
  return Math.min(16, Math.max(1, value));
}

/**
 * Clamps a group count value to the valid range [1, 4].
 *
 * @param value - Raw group count input
 * @returns The clamped value in [1, 4]
 */
export function clampGroupCount(value: number): number {
  return Math.min(4, Math.max(1, value));
}
