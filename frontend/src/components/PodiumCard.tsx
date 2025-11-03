import type { LeaderboardEntry } from '../types';
import { GRADE_BADGES } from '../config/grades';
import type { GradeName } from '../config/grades';

interface PodiumCardProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

const PODIUM_STYLES = {
  1: {
    borderColor: 'border-yellow-500/50',
    bgGradient: 'from-yellow-500/5 via-yellow-500/10 to-yellow-500/5',
    medal: '🥇',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    size: 'scale-105',
    crown: true
  },
  2: {
    borderColor: 'border-gray-400/50',
    bgGradient: 'from-gray-400/5 via-gray-400/10 to-gray-400/5',
    medal: '🥈',
    textColor: 'text-gray-600 dark:text-gray-400',
    size: 'scale-100',
    crown: false
  },
  3: {
    borderColor: 'border-orange-500/50',
    bgGradient: 'from-orange-500/5 via-orange-500/10 to-orange-500/5',
    medal: '🥉',
    textColor: 'text-orange-600 dark:text-orange-400',
    size: 'scale-100',
    crown: false
  }
};

export default function PodiumCard({ entry, position }: PodiumCardProps) {
  const styles = PODIUM_STYLES[position];

  // Safety check
  if (!entry || !entry.username || !entry.grade) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const safeSeconds = seconds || 0;
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUserInitial = () => {
    return (entry.username || 'U').charAt(0).toUpperCase();
  };

  return (
    <div className={`relative ${styles.size} transition-all duration-300 hover:scale-110`}>
      {/* Crown only for first place - outside card */}
      {styles.crown && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-5xl animate-bounce-slow z-10">
          👑
        </div>
      )}

      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 ${styles.borderColor} bg-gradient-to-br ${styles.bgGradient} shadow-xl overflow-hidden`}
      >

        {/* Top: Avatar + Medal */}
        <div className="text-center mb-4">
          <div className="relative inline-block mb-3">
            {/* Medal Badge on Avatar */}
            <div className="absolute -top-2 -right-2 text-3xl z-10 drop-shadow-lg">{styles.medal}</div>

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">{getUserInitial()}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {entry.username}
            </h3>
          </div>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-2">
            {entry.is_premium && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                PRO
              </span>
            )}
            {entry.is_current_user && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full">
                YOU
              </span>
            )}
          </div>
        </div>

        {/* Middle: Grade */}
        <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {GRADE_BADGES[entry.grade as GradeName] && (
            <img
              src={GRADE_BADGES[entry.grade as GradeName]}
              alt={`${entry.grade} badge`}
              className="w-10 h-10 object-contain"
            />
          )}
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {entry.grade || 'Bronze'}
          </span>
        </div>

        {/* Bottom: Stats */}
        <div className="space-y-3">
          {/* Score - Large */}
          <div className="text-center">
            <div className={`text-4xl font-extrabold ${styles.textColor}`}>
              {(entry.total_score || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Total Score
            </div>
          </div>

          {/* Other stats - Small row */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {entry.total_routines_completed || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Routines
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                🔥 {entry.current_streak || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Streak
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {formatTime(entry.total_time_seconds || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Time
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
}
