# Implementation Plan: Board Game Dashboard

## Overview

Implement a single-page React + TypeScript (Vite) application with Tailwind CSS that tracks cooperative board game state. The implementation follows the layered architecture from the design: types → pure utilities → localStorage adapter → state context → UI components. Each task builds on the previous, ending with full integration and wiring.

## Tasks

- [x] 1. Set up project types and pure utility functions
  - [x] 1.1 Create core type definitions
    - Create `src/types/game.ts` with `Phase`, `GameState`, `GameAction` types and `DEFAULT_STATE` constant
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1_

  - [x] 1.2 Implement pure game logic utilities
    - Create `src/utils/gameLogic.ts` with `maxVillainHP`, `schemeThreshold`, `distributePlayersAcrossGroups`, `clampPlayerCount`, `clampGroupCount`
    - _Requirements: 1.3, 1.4, 1.7, 1.8, 2.1_

  - [x] 1.3 Write property tests for game logic utilities
    - **Property 1: Villain HP formula** — for any playerCount in [1,16], `maxVillainHP(playerCount) === playerCount * 20`
    - **Validates: Requirements 1.3, 1.5**
    - **Property 2: Main Scheme Threshold formula** — for any groupCount in [1,4], `schemeThreshold(groupCount) === groupCount * 2`
    - **Validates: Requirements 1.4, 1.6**
    - **Property 3: Player Count clamping** — for any integer, `clampPlayerCount` returns a value in [1,16]
    - **Validates: Requirements 1.7**
    - **Property 4: Group Count clamping** — for any integer, `clampGroupCount` returns a value in [1,4]
    - **Validates: Requirements 1.8**
    - **Property 5: Player distribution invariants** — length equals groupCount, sum equals playerCount, max−min ≤ 1
    - **Validates: Requirements 2.1, 2.3**

- [x] 2. Implement localStorage adapter
  - [x] 2.1 Create localStorage utility module
    - Create `src/hooks/useLocalStorage.ts` (or `src/utils/localStorage.ts`) with `saveState`, `loadState`, `clearState`, and `isValidGameState` validation guard
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.2 Write property test for state persistence round-trip
    - **Property 10: Game state persistence round-trip** — for any valid `GameState`, `loadState` after `saveState` returns a structurally equal object
    - **Validates: Requirements 7.1, 7.2**

  - [x] 2.3 Write unit tests for localStorage adapter
    - Test missing key falls back to `null`
    - Test corrupted JSON falls back to `null`
    - Test `isValidGameState` rejects objects with missing or wrong-typed fields
    - _Requirements: 7.2, 7.3_

- [x] 3. Implement game state reducer and context
  - [x] 3.1 Implement `gameReducer`
    - Create reducer in `src/context/GameStateContext.tsx` (or a separate file) handling all `GameAction` types per the design spec
    - Include `clearState()` side-effect wrapper around dispatch for `RESET_GAME`
    - _Requirements: 1.7, 1.8, 3.1–3.5, 4.4–4.6, 5.4–5.7, 7.4, 8.2_

  - [x] 3.2 Write property tests for the reducer
    - **Property 6: Villain HP counter monotonicity** — INCREMENT adds 1, DECREMENT subtracts 1
    - **Validates: Requirements 4.4, 4.5**
    - **Property 7: Win condition threshold** — after DECREMENT_VILLAIN_HP when villainHP ≤ 1, phase is `'won'`
    - **Validates: Requirements 4.6**
    - **Property 8: Scheme Progress counter monotonicity** — INCREMENT adds 1 (when not triggering loss), DECREMENT subtracts 1 (when > 0)
    - **Validates: Requirements 5.4, 5.5**
    - **Property 9: Loss condition threshold** — after INCREMENT_SCHEME_PROGRESS when schemeProgress > groupCount × 2, phase is `'lost'`
    - **Validates: Requirements 5.7**

  - [x] 3.3 Implement `GameStateContext` provider and `useGameState` hook
    - Initialise state from `loadState() ?? DEFAULT_STATE`
    - Wire `useEffect` to call `saveState(state)` on every state change
    - Export `GameStateProvider` and `useGameState`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Build reusable UI components
  - [x] 5.1 Implement `CounterControl` component
    - Create `src/components/CounterControl.tsx` with props `label`, `value`, `onIncrement`, `onDecrement`, `decrementDisabled?`
    - Style with Tailwind CSS; ensure +/− buttons are accessible (aria-label)
    - _Requirements: 4.2, 4.3, 5.2, 5.3, 5.6_

  - [x] 5.2 Implement `GroupDistribution` component
    - Create `src/components/GroupDistribution.tsx` accepting `playerCount` and `groupCount` props
    - Call `distributePlayersAcrossGroups` and render each group's player count
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.3 Write unit tests for `CounterControl` and `GroupDistribution`
    - Test decrement button is disabled when `decrementDisabled` is true
    - Test `GroupDistribution` renders correct number of group entries
    - _Requirements: 2.2, 5.6_

- [x] 6. Build phase components
  - [x] 6.1 Implement `SetupPhase` component
    - Create `src/components/SetupPhase.tsx`
    - Render Player Count and Group Count numeric inputs (min/max attributes per spec)
    - Display derived Villain HP and Main Scheme Threshold
    - Render `GroupDistribution`
    - "Start Game" button dispatches `START_GAME`
    - _Requirements: 1.1–1.9, 2.1–2.3, 3.1_

  - [x] 6.2 Write unit tests for `SetupPhase`
    - Test inputs render with correct min/max attributes
    - Test Villain HP and Scheme Threshold update when inputs change
    - Test "Start Game" button triggers phase transition
    - _Requirements: 1.1–1.9, 3.1_

  - [x] 6.3 Implement `RunningPhase` component
    - Create `src/components/RunningPhase.tsx`
    - Render `CounterControl` for Villain HP and Scheme Progress
    - Display Scheme Progress alongside threshold
    - Disable Scheme Progress decrement at 0
    - "Reset Game" button dispatches `RESET_GAME`
    - _Requirements: 4.1–4.6, 5.1–5.7, 8.1, 8.2_

  - [x] 6.4 Write unit tests for `RunningPhase`
    - Test Scheme Progress decrement is disabled at 0
    - Test "Reset Game" button is present and dispatches reset
    - _Requirements: 5.6, 8.1, 8.2_

  - [x] 6.5 Implement `EndScreen` component
    - Create `src/components/EndScreen.tsx` as a fixed full-screen overlay (high z-index)
    - Display win or loss message based on `state.phase`
    - "Play Again" button dispatches `RESET_GAME` and calls `clearState()`
    - _Requirements: 6.1–6.4, 7.4_

  - [x] 6.6 Write unit tests for `EndScreen`
    - Test win message renders when phase is `'won'`
    - Test loss message renders when phase is `'lost'`
    - Test "Play Again" button resets to Setup Phase
    - _Requirements: 6.1–6.4_

- [x] 7. Wire everything together in `App.tsx` and `main.tsx`
  - [x] 7.1 Implement `App.tsx`
    - Wrap app in `GameStateProvider`
    - Conditionally render `SetupPhase` or `RunningPhase` based on `state.phase`
    - Render `EndScreen` overlay when `phase === 'won' || phase === 'lost'`
    - _Requirements: 3.1, 6.1–6.3_

  - [x] 7.2 Configure `main.tsx` entry point
    - Mount `<App />` into the DOM root
    - Ensure Tailwind CSS is imported
    - _Requirements: (all — application entry point)_

  - [x] 7.3 Write integration tests for full game flow
    - Test Setup → Running phase transition preserves correct initial HP and scheme values
    - Test win flow: decrement HP to 0 → EndScreen with win message → Play Again → Setup
    - Test loss flow: increment scheme past threshold → EndScreen with loss message → Play Again → Setup
    - Test page reload restores state from localStorage
    - _Requirements: 3.1–3.5, 4.6, 5.7, 6.1–6.4, 7.1–7.4_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests (Tasks 1.3, 2.2, 3.2) validate universal correctness invariants using fast-check
- Unit tests validate specific examples and edge cases
- The localStorage adapter and reducer are pure/isolated, making them ideal first targets for testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "6.1", "6.3"] },
    { "id": 7, "tasks": ["6.2", "6.4", "6.5"] },
    { "id": 8, "tasks": ["6.6", "7.1"] },
    { "id": 9, "tasks": ["7.2"] },
    { "id": 10, "tasks": ["7.3"] }
  ]
}
```
