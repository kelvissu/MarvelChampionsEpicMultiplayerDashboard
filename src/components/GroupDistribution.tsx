import { distributePlayersAcrossGroups } from '../utils/gameLogic';

interface GroupDistributionProps {
  playerCount: number;
  groupCount: number;
}

/**
 * Displays the player count assigned to each group.
 * Distribution is calculated by dividing players as evenly as possible,
 * with any remainder distributed one extra player per group from the first.
 */
export function GroupDistribution({ playerCount, groupCount }: GroupDistributionProps) {
  const distribution = distributePlayersAcrossGroups(playerCount, groupCount);

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Group Distribution
      </h3>
      <ul className="space-y-1">
        {distribution.map((count, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <span className="font-medium">Group {index + 1}:</span>
            <span>
              {count} {count === 1 ? 'player' : 'players'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupDistribution;
