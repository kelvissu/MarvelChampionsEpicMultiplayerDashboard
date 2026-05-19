/**
 * Represents the current phase of the board game session.
 */
export type Phase = 'setup' | 'running' | 'won' | 'lost';

/**
 * Per-group item state (minion or side scheme).
 * null = not yet revealed.
 */
export interface GroupItemState {
  hp: number;
  defeated: boolean;
}

/**
 * A single player within a group.
 */
export interface PlayerData {
  /** Index into the hero icon pool. null = no icon chosen. */
  heroIndex: number | null;
  /** Friendly name for the person controlling this hero */
  playerName: string;
  eliminated: boolean;
}

/**
 * Per-group persistent state.
 */
export interface GroupData {
  name: string;
  /** 1–4 players in this group */
  players: PlayerData[];
  minion: GroupItemState | null;
  scheme: GroupItemState | null;
  /** Index into the villain pool. null = not yet spun. */
  villainIndex: number | null;
  /** Indices of villains already defeated for this group (excluded from next spin) */
  defeatedVillainIndices: number[];
}

/**
 * The complete state of a board game session.
 */
export interface GameState {
  phase: Phase;
  playerCount: number;   // 1–16 (total across all groups)
  groupCount: number;    // 1–4
  villainHP: number;
  schemeProgress: number;
  /** Per-group state — length always equals groupCount */
  groups: GroupData[];
}

/**
 * Union of all dispatchable actions for the game reducer.
 */
export type GameAction =
  | { type: 'SET_PLAYER_COUNT'; payload: number }
  | { type: 'SET_GROUP_COUNT'; payload: number }
  | { type: 'START_GAME' }
  | { type: 'INCREMENT_VILLAIN_HP' }
  | { type: 'DECREMENT_VILLAIN_HP' }
  | { type: 'ADJUST_VILLAIN_HP'; delta: number }
  | { type: 'INCREMENT_SCHEME_PROGRESS' }
  | { type: 'DECREMENT_SCHEME_PROGRESS' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_GROUP_NAME'; groupIndex: number; name: string }
  | { type: 'SET_GROUP_PLAYER_COUNT'; groupIndex: number; count: number }
  | { type: 'SET_PLAYER_HERO'; groupIndex: number; playerIndex: number; heroIndex: number | null }
  | { type: 'SET_PLAYER_NAME'; groupIndex: number; playerIndex: number; playerName: string }
  | { type: 'TOGGLE_PLAYER_ELIMINATED'; groupIndex: number; playerIndex: number }
  | { type: 'REVEAL_MINION'; groupIndex: number }
  | { type: 'REVEAL_SCHEME'; groupIndex: number }
  | { type: 'CHANGE_MINION_HP'; groupIndex: number; delta: number }
  | { type: 'CHANGE_SCHEME_HP'; groupIndex: number; delta: number }
  | { type: 'SET_VILLAIN'; groupIndex: number; villainIndex: number }
  | { type: 'DEFEAT_GROUP_VILLAIN'; groupIndex: number };

function defaultPlayers(count: number): PlayerData[] {
  return Array.from({ length: count }, () => ({ heroIndex: null, playerName: '', eliminated: false }));
}

export function makeDefaultGroup(index: number): GroupData {
  return {
    name: `Group ${index + 1}`,
    players: defaultPlayers(1),
    minion: null,
    scheme: null,
    villainIndex: null,
    defeatedVillainIndices: [],
  };
}

/**
 * Default state — Setup Phase, 1 player, 1 group.
 */
export const DEFAULT_STATE: GameState = {
  phase: 'setup',
  playerCount: 1,
  groupCount: 1,
  villainHP: 20,
  schemeProgress: 0,
  groups: [makeDefaultGroup(0)],
};
