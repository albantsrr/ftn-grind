import { useState } from 'react';

interface DataPoint {
  date: string;
  count: number;
  duration: number;
}

interface HeatmapCalendarProps {
  data: DataPoint[];
  formatDuration: (seconds: number) => string;
  onDayClick?: (day: DataPoint) => void;
}

export default function HeatmapCalendar({ data, formatDuration, onDayClick }: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<DataPoint | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Take last 30 days and ensure we have all days
  const today = new Date();
  const last30Days: DataPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existingData = data.find(d => d.date === dateStr);
    last30Days.push(existingData || { date: dateStr, count: 0, duration: 0 });
  }

  // Get intensity levels for color coding with gradient
  const maxCount = Math.max(...last30Days.map(d => d.count), 1);

  const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    const intensity = (count / maxCount);

    // Beautiful gradient: gray → green → blue → purple for high intensity
    if (intensity >= 0.8) return 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-700 shadow-lg shadow-purple-500/50';
    if (intensity >= 0.6) return 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-700 shadow-md shadow-blue-500/40';
    if (intensity >= 0.4) return 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-700 shadow-md shadow-emerald-500/30';
    if (intensity >= 0.2) return 'bg-gradient-to-br from-green-400 to-green-500 border-green-600';
    return 'bg-gradient-to-br from-green-300 to-green-400 border-green-500';
  };

  const handleMouseEnter = (day: DataPoint, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredDay(day);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredPosition({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleDayClick = (day: DataPoint) => {
    if (day.count > 0 && onDayClick) {
      onDayClick(day);
    }
  };

  // Calculate current streak
  const calculateCurrentStreak = (): number => {
    let streak = 0;
    for (let i = last30Days.length - 1; i >= 0; i--) {
      if (last30Days[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  // Calculate weeks (5 rows of 6 days each to show 30 days)
  const weeks: DataPoint[][] = [];
  for (let i = 0; i < 5; i++) {
    weeks.push(last30Days.slice(i * 6, (i + 1) * 6));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📅 Calendrier d'activité
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Cliquez sur un jour pour voir les détails
          </p>
        </div>

        {/* Improved Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Intensité:</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200"></div>
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-300 to-green-400 border border-green-500"></div>
              <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-700"></div>
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-700"></div>
              <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-700"></div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
            <span className="text-gray-400">Aucune</span> → <span className="text-green-500">Faible</span> → <span className="text-emerald-500">Moyenne</span> → <span className="text-blue-500">Élevée</span> → <span className="text-purple-500">Max</span>
          </div>
        </div>
      </div>

      {/* Current Streak Banner */}
      {currentStreak > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-pulse-fire">🔥</div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Série actuelle</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {currentStreak} jour{currentStreak > 1 ? 's' : ''} consécutif{currentStreak > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500">Continue comme ça!</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Keep the streak alive 💪</p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-2 justify-center">
            {week.map((day, dayIndex) => {
              const isHovered = hoveredDay?.date === day.date;
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const isActive = day.count > 0;

              return (
                <div
                  key={dayIndex}
                  className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-300
                    ${getIntensityClass(day.count)}
                    ${isHovered ? 'scale-125 z-10 shadow-2xl rotate-3' : 'scale-100 rotate-0'}
                    ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
                    ${isActive ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
                    group`}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => handleDayClick(day)}
                  style={{
                    animationDelay: `${(weekIndex * 6 + dayIndex) * 20}ms`
                  }}
                >
                  {/* Fire icon for active streak days */}
                  {isActive && day.count >= 2 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs animate-bounce-subtle">
                      🔥
                    </div>
                  )}

                  {/* Check icon for single routine days */}
                  {isActive && day.count === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Today indicator */}
                  {isToday && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Day labels */}
      <div className="mt-4 flex justify-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-500">
        <div className="w-12 text-center">Lun</div>
        <div className="w-12 text-center">Mar</div>
        <div className="w-12 text-center">Mer</div>
        <div className="w-12 text-center">Jeu</div>
        <div className="w-12 text-center">Ven</div>
        <div className="w-12 text-center">Sam</div>
      </div>

      {/* Enhanced Hover Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600
            text-white px-5 py-4 rounded-xl shadow-2xl border border-gray-700 dark:border-gray-500
            animate-fade-in pointer-events-none min-w-[200px]"
          style={{
            left: `${hoveredPosition.x}px`,
            top: `${hoveredPosition.y - 100}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-sm font-bold mb-2 flex items-center gap-2">
            📅 {new Date(hoveredDay.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </div>

          {hoveredDay.count > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">✓</span>
                <span className="font-semibold">{hoveredDay.count}</span>
                <span className="text-gray-300">routine{hoveredDay.count !== 1 ? 's' : ''} complétée{hoveredDay.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-400">⏱</span>
                <span className="font-semibold">{formatDuration(hoveredDay.duration)}</span>
                <span className="text-gray-300">d'entraînement</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                👆 Cliquez pour voir les détails
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>—</span>
              <span>Aucune activité ce jour</span>
            </div>
          )}

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45
            w-3 h-3 bg-gray-900 dark:bg-gray-700 border-r border-b border-gray-700 dark:border-gray-500"></div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {last30Days.filter(d => d.count > 0).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Jours actifs</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((last30Days.filter(d => d.count > 0).length / 30) * 100)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taux d'activité</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {last30Days.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total routines</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse-fire {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-pulse-fire {
          animation: pulse-fire 1.5s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
