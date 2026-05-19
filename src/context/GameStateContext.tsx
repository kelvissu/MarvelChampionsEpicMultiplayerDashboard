import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { DEFAULT_STATE, makeDefaultGroup } from '../types/game';
import type { GameState, GameAction, GroupData, PlayerData } from '../types/game';
import {
  clampPlayerCount,
  clampGroupCount,
  maxVillainHP,
  schemeThreshold,
} from '../utils/gameLogic';
import { clearState, loadState, saveState } from '../utils/localStorage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampGroupPlayerCount(n: number): number {
  return Math.min(4, Math.max(1, n));
}

function makeGroups(count: number, existing: GroupData[] = []): GroupData[] {
  return Array.from({ length: count }, (_, i) => existing[i] ?? makeDefaultGroup(i));
}

function updateGroupAt(
  groups: GroupData[],
  index: number,
  updater: (g: GroupData) => GroupData
): GroupData[] {
  return groups.map((g, i) => (i === index ? updater(g) : g));
}

function resizePlayers(existing: PlayerData[], newCount: number): PlayerData[] {
  if (newCount > existing.length) {
    return [
      ...existing,
      ...Array.from({ length: newCount - existing.length }, () => ({
        heroIndex: null,
        playerName: '',
        eliminated: false,
      })),
    ];
  }
  return existing.slice(0, newCount);
}

/** Distribute totalPlayers as evenly as possible across groups, preserving existing player data */
function balancePlayers(groups: GroupData[], totalPlayers: number): GroupData[] {
  const count = groups.length;
  const base = Math.floor(totalPlayers / count);
  const remainder = totalPlayers % count;
  return groups.map((g, i) => ({
    ...g,
    players: resizePlayers(g.players, i < remainder ? base + 1 : base),
  }));
}

/** Returns true if every player across all groups is eliminated */
function allPlayersEliminated(groups: GroupData[]): boolean {
  const allPlayers = groups.flatMap(g => g.players);
  return allPlayers.length > 0 && allPlayers.every(p => p.eliminated);
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_COUNT': {
      const playerCount = clampPlayerCount(action.payload);
      // groupCount can never exceed playerCount (need at least 1 player per group)
      const groupCount = Math.min(state.groupCount, playerCount);
      const groups = balancePlayers(
        groupCount !== state.groupCount ? makeGroups(groupCount, state.groups) : state.groups,
        playerCount
      );
      return { ...state, playerCount, groupCount, groups, villainHP: maxVillainHP(playerCount) };
    }
    case 'SET_GROUP_COUNT': {
      // Cannot have more groups than players
      const groupCount = Math.min(clampGroupCount(action.payload), state.playerCount);
      const groups = balancePlayers(makeGroups(groupCount, state.groups), state.playerCount);
      return { ...state, groupCount, groups };
    }
    case 'START_GAME': {
      return {
        ...state,
        phase: 'running',
        villainHP: maxVillainHP(state.playerCount),
        schemeProgress: 0,
        groups: makeGroups(state.groupCount, state.groups),
      };
    }
    case 'INCREMENT_VILLAIN_HP':
      return { ...state, villainHP: state.villainHP + 1 };
    case 'DECREMENT_VILLAIN_HP': {
      const villainHP = state.villainHP - 1;
      return { ...state, villainHP, phase: villainHP <= 0 ? 'won' : state.phase };
    }
    case 'ADJUST_VILLAIN_HP': {
      const villainHP = state.villainHP + action.delta;
      return { ...state, villainHP, phase: villainHP <= 0 ? 'won' : state.phase };
    }
    case 'INCREMENT_SCHEME_PROGRESS': {
      const schemeProgress = state.schemeProgress + 1;
      const threshold = schemeThreshold(state.groupCount);
      return {
        ...state,
        schemeProgress,
        phase: schemeProgress >= threshold ? 'lost' : state.phase,
      };
    }
    case 'DECREMENT_SCHEME_PROGRESS':
      if (state.schemeProgress === 0) return state;
      return { ...state, schemeProgress: state.schemeProgress - 1 };
    case 'RESET_GAME':
      return { ...DEFAULT_STATE };

    case 'SET_GROUP_NAME':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g, name: action.name,
        })),
      };

    case 'SET_GROUP_PLAYER_COUNT': {
      const count = clampGroupPlayerCount(action.count);
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g, players: resizePlayers(g.players, count),
        })),
      };
    }

    case 'SET_PLAYER_HERO':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g,
          players: g.players.map((p, pi) =>
            pi === action.playerIndex ? { ...p, heroIndex: action.heroIndex } : p
          ),
        })),
      };

    case 'SET_PLAYER_NAME':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g,
          players: g.players.map((p, pi) =>
            pi === action.playerIndex ? { ...p, playerName: action.playerName } : p
          ),
        })),
      };

    case 'TOGGLE_PLAYER_ELIMINATED': {
      const newGroups = updateGroupAt(state.groups, action.groupIndex, g => ({
        ...g,
        players: g.players.map((p, pi) =>
          pi === action.playerIndex ? { ...p, eliminated: !p.eliminated } : p
        ),
      }));
      const phase = allPlayersEliminated(newGroups) ? 'lost' : state.phase;
      return { ...state, groups: newGroups, phase };
    }

    case 'REVEAL_MINION': {
      const minionHP = state.groupCount * 10;
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g =>
          g.minion ? g : { ...g, minion: { hp: minionHP, defeated: false } }
        ),
      };
    }
    case 'REVEAL_SCHEME': {
      const schemeHP = state.groupCount * 7;
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g =>
          g.scheme ? g : { ...g, scheme: { hp: schemeHP, defeated: false } }
        ),
      };
    }
    case 'CHANGE_MINION_HP':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => {
          if (!g.minion) return g;
          const hp = g.minion.hp + action.delta;
          return { ...g, minion: { hp, defeated: hp <= 0 } };
        }),
      };
    case 'CHANGE_SCHEME_HP':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => {
          if (!g.scheme) return g;
          const hp = g.scheme.hp + action.delta;
          return { ...g, scheme: { hp, defeated: hp <= 0 } };
        }),
      };
    case 'SET_VILLAIN':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g, villainIndex: action.villainIndex,
        })),
      };
    case 'DEFEAT_GROUP_VILLAIN':
      return {
        ...state,
        groups: updateGroupAt(state.groups, action.groupIndex, g => ({
          ...g,
          defeatedVillainIndices: g.villainIndex !== null
            ? [...g.defeatedVillainIndices, g.villainIndex]
            : g.defeatedVillainIndices,
          villainIndex: null,
        })),
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface GameStateContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

export const GameStateContext = createContext<GameStateContextValue | null>(null);

interface GameStateProviderProps {
  children: ReactNode;
  initialState?: GameState;
}

export function GameStateProvider({ children, initialState }: GameStateProviderProps): React.JSX.Element {
  const [state, rawDispatch] = useReducer(
    gameReducer,
    undefined,
    () => initialState ?? loadState() ?? DEFAULT_STATE
  );

  useEffect(() => { saveState(state); }, [state]);

  const dispatch: Dispatch<GameAction> = (action) => {
    if (action.type === 'RESET_GAME') clearState();
    rawDispatch(action);
  };

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
