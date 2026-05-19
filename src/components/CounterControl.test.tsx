/**
 * Unit tests for the CounterControl component.
 *
 * Feature: board-game-dashboard
 * Validates: Requirements 2.2, 5.6
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CounterControl } from './CounterControl';

describe('CounterControl', () => {
  it('renders the label', () => {
    render(
      <CounterControl
        label="Players"
        value={3}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  it('renders the current value', () => {
    render(
      <CounterControl
        label="Players"
        value={7}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls onIncrement when the increment button is clicked', async () => {
    const onIncrement = vi.fn();
    render(
      <CounterControl
        label="Players"
        value={3}
        onIncrement={onIncrement}
        onDecrement={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /increment players/i }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('calls onDecrement when the decrement button is clicked and not disabled', async () => {
    const onDecrement = vi.fn();
    render(
      <CounterControl
        label="Players"
        value={3}
        onIncrement={vi.fn()}
        onDecrement={onDecrement}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /decrement players/i }));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  // Validates: Requirement 5.6 — decrement control is disabled when decrementDisabled is true
  it('disables the decrement button when decrementDisabled is true', () => {
    render(
      <CounterControl
        label="Scheme Progress"
        value={0}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        decrementDisabled={true}
      />
    );
    const decrementBtn = screen.getByRole('button', { name: /decrement scheme progress/i });
    expect(decrementBtn).toBeDisabled();
  });

  it('does not disable the decrement button when decrementDisabled is false', () => {
    render(
      <CounterControl
        label="Scheme Progress"
        value={2}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        decrementDisabled={false}
      />
    );
    const decrementBtn = screen.getByRole('button', { name: /decrement scheme progress/i });
    expect(decrementBtn).not.toBeDisabled();
  });

  it('does not disable the decrement button by default', () => {
    render(
      <CounterControl
        label="Villain HP"
        value={10}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );
    const decrementBtn = screen.getByRole('button', { name: /decrement villain hp/i });
    expect(decrementBtn).not.toBeDisabled();
  });

  it('does not call onDecrement when the decrement button is disabled', async () => {
    const onDecrement = vi.fn();
    render(
      <CounterControl
        label="Scheme Progress"
        value={0}
        onIncrement={vi.fn()}
        onDecrement={onDecrement}
        decrementDisabled={true}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /decrement scheme progress/i }));
    expect(onDecrement).not.toHaveBeenCalled();
  });
});
