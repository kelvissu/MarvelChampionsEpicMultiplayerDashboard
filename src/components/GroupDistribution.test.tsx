/**
 * Unit tests for the GroupDistribution component.
 *
 * Feature: board-game-dashboard
 * Validates: Requirements 2.2
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupDistribution } from './GroupDistribution';

describe('GroupDistribution', () => {
  // Validates: Requirement 2.2 — displays the player count assigned to each group
  it('renders the correct number of group entries', () => {
    render(<GroupDistribution playerCount={6} groupCount={3} />);
    // Expect exactly 3 list items (one per group)
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('renders one group entry when groupCount is 1', () => {
    render(<GroupDistribution playerCount={5} groupCount={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
  });

  it('renders four group entries when groupCount is 4', () => {
    render(<GroupDistribution playerCount={8} groupCount={4} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
  });

  it('displays the correct player count for each group (even distribution)', () => {
    render(<GroupDistribution playerCount={6} groupCount={3} />);
    // 6 players / 3 groups = 2 each
    expect(screen.getByText('Group 1:')).toBeInTheDocument();
    expect(screen.getByText('Group 2:')).toBeInTheDocument();
    expect(screen.getByText('Group 3:')).toBeInTheDocument();
    const playerCounts = screen.getAllByText('2 players');
    expect(playerCounts).toHaveLength(3);
  });

  it('distributes remainder players to earlier groups (uneven distribution)', () => {
    // 7 players / 3 groups → [3, 2, 2]
    render(<GroupDistribution playerCount={7} groupCount={3} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('3 players');
    expect(items[1]).toHaveTextContent('2 players');
    expect(items[2]).toHaveTextContent('2 players');
  });

  it('uses singular "player" when a group has exactly 1 player', () => {
    // 1 player / 1 group → [1]
    render(<GroupDistribution playerCount={1} groupCount={1} />);
    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('uses plural "players" when a group has more than 1 player', () => {
    render(<GroupDistribution playerCount={4} groupCount={2} />);
    const playerCounts = screen.getAllByText('2 players');
    expect(playerCounts).toHaveLength(2);
  });
});
