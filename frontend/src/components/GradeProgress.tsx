import { useEffect, useState } from 'react';
import type { UserStats } from '../types';
import { GRADE_REQUIREMENTS, GRADE_BADGES, GRADE_COLORS, GRADE_ORDER } from '../config/grades';

interface GradeProgressProps {
  stats: UserStats;
}

const GRADES = GRADE_ORDER.map(name => ({
  name,
  badge: GRADE_BADGES[name],
  routines: GRADE_REQUIREMENTS[name].routines,
  streak: GRADE_REQUIREMENTS[name].streak,
  timeHours: GRADE_REQUIREMENTS[name].timeHours,
  color: GRADE_COLORS[name]
}));

export default function GradeProgress({ stats }: GradeProgressProps) {
  const [progressValues, setProgressValues] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  // Find the next grade to achieve (first non-achieved grade)
  const currentTimeHours = stats.total_time_seconds / 3600;
  const nextGradeIndex = GRADES.findIndex(grade => {
    return stats.total_routines_completed < grade.routines ||
           stats.longest_streak < grade.streak ||
           currentTimeHours < grade.timeHours;
  });

  useEffect(() => {
    // Animate progress bars
    const timer = setTimeout(() => {
      const currentTimeHours = stats.total_time_seconds / 3600;
      const newProgress = GRADES.map(grade => {
        const routinesProgress = Math.min((stats.total_routines_completed / grade.routines) * 100, 100);
        const streakProgress = Math.min((stats.longest_streak / grade.streak) * 100, 100);
        const timeProgress = Math.min((currentTimeHours / grade.timeHours) * 100, 100);
        return Math.min((routinesProgress + streakProgress + timeProgress) / 3, 100);
      });
      setProgressValues(newProgress);
    }, 100);

    return () => clearTimeout(timer);
  }, [stats]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Grade System</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Progress based on routines + streak + time
        </div>
      </div>

      <div className="space-y-4">
        {GRADES.map((grade, index) => {
          const isCurrentGrade = stats.grade === grade.name;
          const currentTimeHours = stats.total_time_seconds / 3600;
          const hasAchieved = stats.total_routines_completed >= grade.routines &&
                             stats.longest_streak >= grade.streak &&
                             currentTimeHours >= grade.timeHours;
          const progress = progressValues[index];

          const routinesDiff = grade.routines - stats.total_routines_completed;
          const streakDiff = grade.streak - stats.longest_streak;
          const timeDiff = grade.timeHours - currentTimeHours;

          return (
            <div
              key={grade.name}
              className={`p-4 rounded-xl border-2 transition-all duration-300
                ${isCurrentGrade
                  ? 'border-indigo-500 dark:border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg scale-105'
                  : hasAchieved
                  ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                }
                hover:shadow-xl hover:scale-102 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={grade.badge}
                    alt={`${grade.name} badge`}
                    className={`w-12 h-12 object-contain transition-transform duration-300 ${isCurrentGrade ? 'animate-bounce-slow scale-110' : ''}`}
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{grade.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {grade.routines} routines · {grade.streak} days · {grade.timeHours}h
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrentGrade && (
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-md">
                      🎯 Current
                    </span>
                  )}
                  {hasAchieved && !isCurrentGrade && (
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${grade.color} rounded-full transition-all duration-1000 ease-out relative`}
                    style={{
                      width: `${progress}%`,
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Shimmer effect for current grade */}
                    {isCurrentGrade && progress < 100 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {Math.round(progress)}%
                  </span>
                  {!hasAchieved && (
                    <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {routinesDiff > 0 && (
                        <span>+{routinesDiff} routines</span>
                      )}
                      {streakDiff > 0 && (
                        <span>+{streakDiff} days</span>
                      )}
                      {timeDiff > 0 && (
                        <span>+{Math.ceil(timeDiff)}h</span>
                      )}
                    </div>
                  )}
                  {hasAchieved && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              </div>

              {/* Call to action for next grade to achieve */}
              {index === nextGradeIndex && !hasAchieved && (
                <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-center text-indigo-600 dark:text-indigo-400 font-medium">
                    🎯 Next goal: {grade.name} -{' '}
                    {routinesDiff > 0 && `${routinesDiff} more routine${routinesDiff > 1 ? 's' : ''}`}
                    {routinesDiff > 0 && (streakDiff > 0 || timeDiff > 0) && ', '}
                    {streakDiff > 0 && `${streakDiff} more day${streakDiff > 1 ? 's' : ''} streak`}
                    {streakDiff > 0 && timeDiff > 0 && ', '}
                    {timeDiff > 0 && `${Math.ceil(timeDiff)} more hours`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
