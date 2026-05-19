# Requirements Document

## Introduction

A browser-based dashboard webapp built with React, TypeScript (Vite), and Tailwind CSS that tracks the state of a cooperative board game session. The dashboard manages player count, group count, villain HP, and main scheme progress. Game state persists across page refreshes via browser localStorage. The app detects win and loss conditions and displays an appropriate end screen.

## Glossary

- **Dashboard**: The main single-page web application that displays and manages all game state.
- **Setup Phase**: The initial game state before the game is started, during which player count and group count are configurable.
- **Running Phase**: The active game state after the game is started, during which villain HP and scheme progress are tracked and player/group counts are locked.
- **Player Count**: The number of players participating in the game session, between 1 and 16 inclusive.
- **Group Count**: The number of groups players are divided into, between 1 and 4 inclusive.
- **Villain HP**: The villain's hit points, calculated as 20 × Player Count. Represents the win condition target.
- **Main Scheme Threshold**: The loss condition threshold, calculated as Group Count × 2.
- **Scheme Progress**: A numeric counter tracking how far the main scheme has advanced during the Running Phase.
- **Win Condition**: The state where Villain HP reaches 0 or below.
- **Loss Condition**: The state where Scheme Progress exceeds the Main Scheme Threshold.
- **End Screen**: A full-screen overlay displayed when either the Win Condition or Loss Condition is met.
- **localStorage**: The browser's built-in key-value storage used to persist game state across page refreshes.

## Requirements

### Requirement 1: Setup Phase Configuration

**User Story:** As a player, I want to configure the number of players and groups before starting the game, so that the game is correctly initialised for my session.

#### Acceptance Criteria

1. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL display a numeric input for Player Count accepting integer values between 1 and 16 inclusive.
2. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL display a numeric input for Group Count accepting integer values between 1 and 4 inclusive.
3. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL display the calculated Villain HP as 20 × Player Count.
4. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL display the calculated Main Scheme Threshold as Group Count × 2.
5. WHEN the Player Count input changes, THE Dashboard SHALL recalculate and display the updated Villain HP immediately.
6. WHEN the Group Count input changes, THE Dashboard SHALL recalculate and display the updated Main Scheme Threshold immediately.
7. IF the user enters a Player Count outside the range 1–16, THEN THE Dashboard SHALL reset the Player Count to the nearest valid boundary value (1 or 16).
8. IF the user enters a Group Count outside the range 1–4, THEN THE Dashboard SHALL reset the Group Count to the nearest valid boundary value (1 or 4).
9. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL display a "Start Game" button that transitions the game to the Running Phase.

### Requirement 2: Player Distribution Across Groups

**User Story:** As a player, I want to see how players are distributed across groups, so that I know how many players belong to each group.

#### Acceptance Criteria

1. WHILE the Dashboard is in the Setup Phase, THE Dashboard SHALL calculate player distribution by dividing Player Count as evenly as possible across Group Count groups, with any remainder distributed one extra player per group starting from the first group.
2. THE Dashboard SHALL display the player count assigned to each group.
3. WHEN Player Count or Group Count changes, THE Dashboard SHALL recalculate and display the updated group distribution immediately.

### Requirement 3: Game Start and Phase Transition

**User Story:** As a player, I want to start the game so that the dashboard transitions to active gameplay tracking.

#### Acceptance Criteria

1. WHEN the user activates the "Start Game" button, THE Dashboard SHALL transition from the Setup Phase to the Running Phase.
2. WHEN the Dashboard transitions to the Running Phase, THE Dashboard SHALL lock the Player Count to its current value.
3. WHEN the Dashboard transitions to the Running Phase, THE Dashboard SHALL lock the Group Count to its current value.
4. WHEN the Dashboard transitions to the Running Phase, THE Dashboard SHALL set the initial Villain HP to 20 × the locked Player Count.
5. WHEN the Dashboard transitions to the Running Phase, THE Dashboard SHALL set the initial Scheme Progress to 0.

### Requirement 4: Villain HP Tracking

**User Story:** As a player, I want to increment and decrement the villain's HP during gameplay, so that I can track damage dealt to the villain.

#### Acceptance Criteria

1. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display the current Villain HP value.
2. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display an increment control that increases Villain HP by 1.
3. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display a decrement control that decreases Villain HP by 1.
4. WHEN the user activates the increment control, THE Dashboard SHALL increase Villain HP by 1 and display the updated value.
5. WHEN the user activates the decrement control, THE Dashboard SHALL decrease Villain HP by 1 and display the updated value.
6. WHEN Villain HP reaches 0 or below, THE Dashboard SHALL trigger the Win Condition.

### Requirement 5: Main Scheme Progress Tracking

**User Story:** As a player, I want to track the main scheme's progress during gameplay, so that I can monitor how close the game is to a loss condition.

#### Acceptance Criteria

1. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display the current Scheme Progress value alongside the Main Scheme Threshold.
2. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display an increment control that increases Scheme Progress by 1.
3. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display a decrement control that decreases Scheme Progress by 1.
4. WHEN the user activates the Scheme Progress increment control, THE Dashboard SHALL increase Scheme Progress by 1 and display the updated value.
5. WHEN the user activates the Scheme Progress decrement control, THE Dashboard SHALL decrease Scheme Progress by 1 and display the updated value.
6. IF Scheme Progress is 0, THEN THE Dashboard SHALL disable the Scheme Progress decrement control.
7. WHEN Scheme Progress exceeds the Main Scheme Threshold, THE Dashboard SHALL trigger the Loss Condition.

### Requirement 6: Win and Loss Detection

**User Story:** As a player, I want the game to automatically detect win and loss conditions, so that the outcome is clearly communicated when the game ends.

#### Acceptance Criteria

1. WHEN the Win Condition is triggered, THE Dashboard SHALL display the End Screen with a win message.
2. WHEN the Loss Condition is triggered, THE Dashboard SHALL display the End Screen with a loss message.
3. WHEN the End Screen is displayed, THE Dashboard SHALL overlay the End Screen above all other dashboard content.
4. WHEN the End Screen is displayed, THE Dashboard SHALL display a "Play Again" button that resets the Dashboard to the Setup Phase with default values.

### Requirement 7: State Persistence

**User Story:** As a player, I want the game state to survive a page refresh, so that I do not lose progress if the browser is accidentally refreshed.

#### Acceptance Criteria

1. WHEN any game state value changes, THE Dashboard SHALL write the complete current game state to localStorage under a defined key.
2. WHEN the Dashboard initialises, THE Dashboard SHALL read game state from localStorage and restore the Dashboard to the previously saved state if a valid saved state exists.
3. IF no valid saved state exists in localStorage, THEN THE Dashboard SHALL initialise to the Setup Phase with a default Player Count of 1 and a default Group Count of 1.
4. WHEN the user activates the "Play Again" button on the End Screen, THE Dashboard SHALL clear the saved state from localStorage and reset to the Setup Phase with default values.

### Requirement 8: Reset Capability

**User Story:** As a player, I want to reset the game at any time, so that I can start a new session without refreshing the browser.

#### Acceptance Criteria

1. WHILE the Dashboard is in the Running Phase, THE Dashboard SHALL display a "Reset Game" button.
2. WHEN the user activates the "Reset Game" button, THE Dashboard SHALL clear the saved state from localStorage and reset the Dashboard to the Setup Phase with default values.
