import type { LeaderboardEntry } from '../types';
import { GRADE_BADGES } from '../config/grades';
import type { GradeName } from '../config/grades';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

export default function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-yellow-600 dark:text-yellow-400 font-extrabold text-xl';
    if (position <= 10) return 'text-indigo-600 dark:text-indigo-400 font-bold';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <tr
      className={`
        ${entry.is_current_user
          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-500 dark:border-indigo-400'
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Position */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-center font-bold ${getPositionColor(entry.position)}`}>
          #{entry.position}
        </div>
      </td>

      {/* Player */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden ring-2 ring-white dark:ring-gray-700">
            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.username}
                className="w-full h-full object-cover"
              />
            ) : (
              entry.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {entry.username}
              </span>
              {entry.is_premium && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">
                  PRO
                </span>
              )}
              {entry.is_current_user && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full shadow-sm">
                  YOU
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Grade */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={GRADE_BADGES[entry.grade as GradeName]}
            alt={`${entry.grade} badge`}
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {entry.grade}
          </span>
        </div>
      </td>

      {/* Score */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {entry.total_score.toLocaleString()}
        </div>
      </td>

      {/* Routines */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
          {entry.total_routines_completed}
        </div>
      </td>

      {/* Streak */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
          🔥 {entry.current_streak}
        </div>
      </td>

      {/* Time */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {formatTime(entry.total_time_seconds)}
        </div>
      </td>
    </tr>
  );
}
