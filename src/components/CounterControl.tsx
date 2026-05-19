interface CounterControlProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement?: () => void;
  decrementDisabled?: boolean;
  hideDecrement?: boolean;
  /**
   * Extra step sizes to show as additional ±N buttons.
   * e.g. [5, 10] renders −10, −5, −1 … +1, +5, +10
   * Requires onStepChange to be provided.
   */
  steps?: number[];
  /** Called with a signed delta when a step button is clicked */
  onStepChange?: (delta: number) => void;
}

/**
 * Reusable counter control with a label, current value display,
 * and accessible increment/decrement buttons.
 * Pass `steps` + `onStepChange` to add ±N shortcut buttons.
 */
export function CounterControl({
  label,
  value,
  onIncrement,
  onDecrement,
  decrementDisabled = false,
  hideDecrement = false,
  steps,
  onStepChange,
}: CounterControlProps) {
  const extraSteps = steps && onStepChange ? [...steps].sort((a, b) => a - b) : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </span>

      {/* Main ±1 row */}
      <div className="flex items-center gap-4">
        {!hideDecrement && (
          <button
            type="button"
            onClick={onDecrement}
            disabled={decrementDisabled}
            aria-label={`Decrement ${label}`}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-800 text-xl font-bold
                       hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                       focus:ring-gray-400 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            −
          </button>
        )}
        <span
          className="w-16 text-center text-3xl font-bold text-gray-900 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label={`Increment ${label}`}
          className="w-10 h-10 rounded-full bg-gray-200 text-gray-800 text-xl font-bold
                     hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-gray-400 transition-colors"
        >
          +
        </button>
      </div>

      {/* Extra step buttons */}
      {extraSteps.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Decrement steps — largest first */}
          {[...extraSteps].reverse().map(step => (
            <button
              key={`-${step}`}
              type="button"
              onClick={() => onStepChange!(-step)}
              aria-label={`Decrease ${label} by ${step}`}
              className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold
                         hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300
                         transition-colors"
            >
              −{step}
            </button>
          ))}
          {/* Increment steps — smallest first */}
          {extraSteps.map(step => (
            <button
              key={`+${step}`}
              type="button"
              onClick={() => onStepChange!(step)}
              aria-label={`Increase ${label} by ${step}`}
              className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold
                         hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300
                         transition-colors"
            >
              +{step}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CounterControl;
