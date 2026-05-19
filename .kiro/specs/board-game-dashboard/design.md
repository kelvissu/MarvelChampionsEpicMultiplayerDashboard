# Design Document

## Introduction

This document describes the technical architecture for the Board Game Dashboard — a single-page React + TypeScript application built with Vite and Tailwind CSS. The app tracks cooperative board game state (player count, group count, villain HP, scheme progress), persists state to localStorage, and detects win/loss conditions.

---

## Overview

The application is a pure client-side SPA with no backend. All state lives in a single React context backed by a `useReducer` hook. Persistence is handled by a thin localStorage adapter called on every state change via a `useEffect`. The three phases — Setup, Running, and End Screen — are rendered conditionally based on the `phase` field in the central `GameState`.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    App (root)                        │
│  ┌──────────────────────────────────────────────┐   │
│  │           GameStateContext (Provider)         │   │
│  │  state: GameState                             │   │
│  │  dispatch: Dispatch<GameAction>               │   │
│  │                                               │   │
│  │  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  SetupPhase  │  │    RunningPhase       │  │   │
│  │  │  Component   │  │    Component          │  │   │
│  │  └──────────────┘  └──────────────────────┘  │   │
│  │                                               │   │
│  │  ┌──────────────────────────────────────┐    │   │
│  │  │         EndScreen (overlay)          │    │   │
│  │  └──────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │ read/write
┌────────▼────────┐
│   localStorage  │
└─────────────────┘
```

---

## Data Models

### Phase

```typescript
type Phase = 'setup' | 'running' | 'won' | 'lost';
```

### GameState

```typescript
interface GameState {
  phase: Phase;
  playerCount: number;   // 1–16
  groupCount: number;    // 1–4
  villainHP: number;     // current HP during Running phase
  schemeProgress: number; // current progress during Running phase
}
```

### Default State

```typescript
const DEFAULT_STATE: GameState = {
  phase: 'setup',
  playerCount: 1,
  groupCount: 1,
  villainHP: 20,         // 20 × 1
  schemeProgress: 0,
};
```

### Derived Values (pure functions, not stored)

```typescript
// Villain HP ceiling for the current session
function maxVillainHP(playerCount: number): number {
  return playerCount * 20;
}

// Loss threshold
function schemeThreshold(groupCount: number): number {
  return groupCount * 2;
}

// Player distribution across groups
function distributePlayersAcrossGroups(
  playerCount: number,
  groupCount: number
): number[] {
  const base = Math.floor(playerCount / groupCount);
  const remainder = playerCount % groupCount;
  return Array.from({ length: groupCount }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

// Clamp helpers
function clampPlayerCount(value: number): number {
  return Math.min(16, Math.max(1, value));
}

function clampGroupCount(value: number): number {
  return Math.min(4, Math.max(1, value));
}
```

---

## State Management

### Actions

```typescript
type GameAction =
  | { type: 'SET_PLAYER_COUNT'; payload: number }
  | { type: 'SET_GROUP_COUNT'; payload: number }
  | { type: 'START_GAME' }
  | { type: 'INCREMENT_VILLAIN_HP' }
  | { type: 'DECREMENT_VILLAIN_HP' }
  | { type: 'INCREMENT_SCHEME_PROGRESS' }
  | { type: 'DECREMENT_SCHEME_PROGRESS' }
  | { type: 'RESET_GAME' };
```

### Reducer

```typescript
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_COUNT': {
      const playerCount = clampPlayerCount(action.payload);
      return { ...state, playerCount, villainHP: maxVillainHP(playerCount) };
    }
    case 'SET_GROUP_COUNT': {
      const groupCount = clampGroupCount(action.payload);
      return { ...state, groupCount };
    }
    case 'START_GAME': {
      return {
        ...state,
        phase: 'running',
        villainHP: maxVillainHP(state.playerCount),
        schemeProgress: 0,
      };
    }
    case 'INCREMENT_VILLAIN_HP': {
      const villainHP = state.villainHP + 1;
      return { ...state, villainHP };
    }
    case 'DECREMENT_VILLAIN_HP': {
      const villainHP = state.villainHP - 1;
      const phase = villainHP <= 0 ? 'won' : state.phase;
      return { ...state, villainHP, phase };
    }
    case 'INCREMENT_SCHEME_PROGRESS': {
      const schemeProgress = state.schemeProgress + 1;
      const threshold = schemeThreshold(state.groupCount);
      const phase = schemeProgress > threshold ? 'lost' : state.phase;
      return { ...state, schemeProgress, phase };
    }
    case 'DECREMENT_SCHEME_PROGRESS': {
      if (state.schemeProgress === 0) return state;
      return { ...state, schemeProgress: state.schemeProgress - 1 };
    }
    case 'RESET_GAME': {
      return { ...DEFAULT_STATE };
    }
    default:
      return state;
  }
}
```

---

## Components and Interfaces

### File Structure

```
src/
├── main.tsx
├── App.tsx
├── context/
│   └── GameStateContext.tsx      # Context + Provider + useGameState hook
├── hooks/
│   └── useLocalStorage.ts        # localStorage read/write utilities
├── utils/
│   └── gameLogic.ts              # Pure functions: clamp, distribute, thresholds
├── components/
│   ├── SetupPhase.tsx            # Setup form (player count, group count, distribution)
│   ├── RunningPhase.tsx          # Active game controls (HP, scheme progress)
│   ├── EndScreen.tsx             # Win/loss overlay
│   ├── CounterControl.tsx        # Reusable +/- control with label
│   └── GroupDistribution.tsx     # Displays per-group player counts
└── types/
    └── game.ts                   # GameState, Phase, GameAction types
```

### Component Responsibilities

**`App.tsx`**
- Wraps the app in `GameStateProvider`
- Renders the correct phase component based on `state.phase`
- Renders `EndScreen` overlay when `phase === 'won' || phase === 'lost'`

**`GameStateContext.tsx`**
- Initialises state from localStorage (or defaults)
- Wraps `useReducer` with the `gameReducer`
- Writes state to localStorage on every state change via `useEffect`
- Exposes `state` and `dispatch` via context

**`SetupPhase.tsx`**
- Renders Player Count and Group Count inputs
- Displays derived Villain HP and Main Scheme Threshold
- Renders `GroupDistribution` component
- "Start Game" button dispatches `START_GAME`

**`RunningPhase.tsx`**
- Renders `CounterControl` for Villain HP
- Renders `CounterControl` for Scheme Progress (decrement disabled at 0)
- Displays Scheme Progress alongside threshold
- "Reset Game" button dispatches `RESET_GAME`

**`EndScreen.tsx`**
- Full-screen overlay (fixed position, high z-index)
- Displays win or loss message based on `state.phase`
- "Play Again" button dispatches `RESET_GAME`

**`CounterControl.tsx`**
- Props: `label`, `value`, `onIncrement`, `onDecrement`, `decrementDisabled?`
- Renders label, current value, and +/- buttons

**`GroupDistribution.tsx`**
- Props: `playerCount`, `groupCount`
- Calls `distributePlayersAcrossGroups` and renders each group's count

---

## localStorage Persistence

### Key

```typescript
const STORAGE_KEY = 'board-game-dashboard-state';
```

### Adapter

```typescript
// utils/localStorage.ts

function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore write failures (e.g. private browsing quota)
  }
}

function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

### Validation

`isValidGameState` performs a structural check to guard against stale or corrupted data:

```typescript
function isValidGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    ['setup', 'running', 'won', 'lost'].includes(v.phase as string) &&
    typeof v.playerCount === 'number' &&
    typeof v.groupCount === 'number' &&
    typeof v.villainHP === 'number' &&
    typeof v.schemeProgress === 'number'
  );
}
```

### Integration in Context

```typescript
// GameStateContext.tsx (simplified)
const [state, dispatch] = useReducer(
  gameReducer,
  undefined,
  () => loadState() ?? DEFAULT_STATE
);

useEffect(() => {
  saveState(state);
}, [state]);
```

`RESET_GAME` dispatches `clearState()` before returning `DEFAULT_STATE` — this is handled by a middleware wrapper around dispatch rather than inside the reducer, keeping the reducer pure.

---

## Win / Loss Detection

Win and loss conditions are evaluated inside the reducer on every relevant action:

- **Win**: `DECREMENT_VILLAIN_HP` sets `phase = 'won'` when `villainHP - 1 <= 0`
- **Loss**: `INCREMENT_SCHEME_PROGRESS` sets `phase = 'lost'` when `schemeProgress + 1 > schemeThreshold(groupCount)`

`App.tsx` renders `<EndScreen />` whenever `phase === 'won' || phase === 'lost'`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Player Count out of range | Clamped to [1, 16] in reducer |
| Group Count out of range | Clamped to [1, 4] in reducer |
| Scheme Progress decrement at 0 | Reducer returns unchanged state; button is disabled in UI |
| localStorage read failure | Falls back to `DEFAULT_STATE` |
| localStorage write failure | Silently ignored (try/catch) |
| Corrupted localStorage data | `isValidGameState` returns false; falls back to `DEFAULT_STATE` |

---

## Testing Strategy

**Unit tests** cover specific examples and edge cases:
- Setup Phase renders correct inputs with correct min/max attributes
- Start Game transitions phase to `running` with correct initial values
- Win/loss end screen renders the correct message
- Play Again and Reset Game clear localStorage and return to default state
- Scheme Progress decrement is disabled at 0
- Missing or corrupted localStorage falls back to default state

**Property-based tests** (using a library such as fast-check) cover universal invariants:
- Each property listed in the Correctness Properties section below maps to one property test
- Minimum 100 iterations per property test
- Pure functions (`clampPlayerCount`, `clampGroupCount`, `distributePlayersAcrossGroups`, `gameReducer`, `isValidGameState`, `saveState`/`loadState`) are the primary targets
- Tag format: `Feature: board-game-dashboard, Property {N}: {property_title}`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Villain HP formula

*For any* Player Count value in [1, 16], the displayed Villain HP in the Setup Phase SHALL equal 20 × Player Count.

**Validates: Requirements 1.3, 1.5**

---

### Property 2: Main Scheme Threshold formula

*For any* Group Count value in [1, 4], the displayed Main Scheme Threshold SHALL equal Group Count × 2.

**Validates: Requirements 1.4, 1.6**

---

### Property 3: Player Count clamping

*For any* integer input to the Player Count field, the stored Player Count SHALL be clamped to the range [1, 16] — values below 1 become 1, values above 16 become 16, and values already in range are unchanged.

**Validates: Requirements 1.7**

---

### Property 4: Group Count clamping

*For any* integer input to the Group Count field, the stored Group Count SHALL be clamped to the range [1, 4] — values below 1 become 1, values above 4 become 4, and values already in range are unchanged.

**Validates: Requirements 1.8**

---

### Property 5: Player distribution invariants

*For any* Player Count in [1, 16] and Group Count in [1, 4], the player distribution array SHALL satisfy all of the following: (a) its length equals Group Count, (b) the sum of all elements equals Player Count, and (c) the maximum element minus the minimum element is at most 1 (players are distributed as evenly as possible).

**Validates: Requirements 2.1, 2.3**

---

### Property 6: Villain HP counter monotonicity

*For any* current Villain HP value, dispatching `INCREMENT_VILLAIN_HP` SHALL produce a state where Villain HP equals the previous value plus 1, and dispatching `DECREMENT_VILLAIN_HP` SHALL produce a state where Villain HP equals the previous value minus 1.

**Validates: Requirements 4.4, 4.5**

---

### Property 7: Win condition threshold

*For any* Villain HP value that is 0 or below, the game phase SHALL be `'won'`.

**Validates: Requirements 4.6**

---

### Property 8: Scheme Progress counter monotonicity

*For any* Scheme Progress value greater than 0, dispatching `INCREMENT_SCHEME_PROGRESS` SHALL produce a state where Scheme Progress equals the previous value plus 1, and dispatching `DECREMENT_SCHEME_PROGRESS` SHALL produce a state where Scheme Progress equals the previous value minus 1.

**Validates: Requirements 5.4, 5.5**

---

### Property 9: Loss condition threshold

*For any* Scheme Progress value that exceeds Group Count × 2, the game phase SHALL be `'lost'`.

**Validates: Requirements 5.7**

---

### Property 10: Game state persistence round-trip

*For any* valid `GameState` object, serialising it to localStorage and then deserialising it SHALL produce a state that is structurally equal to the original.

**Validates: Requirements 7.1, 7.2**
