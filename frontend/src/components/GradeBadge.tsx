import { useEffect, useState } from 'react';
import { GRADE_REQUIREMENTS, GRADE_BADGES, GRADE_COLORS, getNextGradeRequirements, type GradeName } from '../config/grades';

interface GradeBadgeProps {
  grade: string;
  currentRoutines: number;
  currentStreak: number;
  currentTimeSeconds: number;
}

export default function GradeBadge({ grade, currentRoutines, currentStreak, currentTimeSeconds }: GradeBadgeProps) {
  const [progress, setProgress] = useState(0);
  const currentTimeHours = currentTimeSeconds / 3600;

  const nextRequirements = getNextGradeRequirements(grade as GradeName);

  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => {
      if (nextRequirements) {
        const routinesProgress = (currentRoutines / nextRequirements.routines) * 100;
        const streakProgress = (currentStreak / nextRequirements.streak) * 100;
        const timeProgress = (currentTimeHours / nextRequirements.timeHours) * 100;
        const avgProgress = Math.min((routinesProgress + streakProgress + timeProgress) / 3, 100);
        setProgress(avgProgress);
      } else {
        setProgress(100); // Legend = max level
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentRoutines, currentStreak, currentTimeHours, nextRequirements]);

  const routinesRemaining = nextRequirements ? Math.max(0, nextRequirements.routines - currentRoutines) : 0;
  const streakRemaining = nextRequirements ? Math.max(0, nextRequirements.streak - currentStreak) : 0;
  const timeRemaining = nextRequirements ? Math.max(0, nextRequirements.timeHours - currentTimeHours) : 0;

  const nextGradeName = nextRequirements ? Object.keys(GRADE_REQUIREMENTS).find(
    g => GRADE_REQUIREMENTS[g as GradeName] === nextRequirements
  ) : null;

  return (
    <div className={`bg-gradient-to-r ${GRADE_COLORS[grade as GradeName]} rounded-xl shadow-2xl p-8 text-white relative overflow-hidden`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-2">Your current grade</p>
            <h3 className="text-5xl font-bold flex items-center gap-4">
              <img
                src={GRADE_BADGES[grade as GradeName]}
                alt={`${grade} badge`}
                className="w-16 h-16 object-contain animate-bounce-slow drop-shadow-2xl"
              />
              <span>{grade}</span>
            </h3>
          </div>

          {/* Progress Ring */}
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                className="text-white transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {nextGradeName ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-white/90 text-sm font-medium mb-2 flex items-center gap-2">
              🎯 Next goal:
              <img
                src={GRADE_BADGES[nextGradeName as GradeName]}
                alt={`${nextGradeName} badge`}
                className="w-5 h-5 object-contain inline-block"
              />
              <span className="font-bold">{nextGradeName}</span>
            </p>
            <div className="flex flex-col gap-1 text-sm">
              {routinesRemaining > 0 && (
                <p className="text-white/80">
                  ✨ <span className="font-bold">{routinesRemaining}</span> more routine{routinesRemaining > 1 ? 's' : ''}
                </p>
              )}
              {streakRemaining > 0 && (
                <p className="text-white/80">
                  🔥 <span className="font-bold">{streakRemaining}</span> more day{streakRemaining > 1 ? 's' : ''} streak
                </p>
              )}
              {timeRemaining > 0 && (
                <p className="text-white/80">
                  ⏱ <span className="font-bold">{Math.ceil(timeRemaining)}</span> more hour{timeRemaining > 1 ? 's' : ''} of training
                </p>
              )}
              {routinesRemaining === 0 && streakRemaining === 0 && timeRemaining <= 0 && (
                <p className="text-white font-bold">🎉 Ready for the next grade!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-white font-bold text-center">
              👑 You've reached the maximum grade! Congratulations!
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
}
