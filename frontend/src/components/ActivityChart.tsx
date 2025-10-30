import { useState } from 'react';

interface DataPoint {
  date: string;
  count: number;
  duration: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  formatDuration: (seconds: number) => string;
  onDayClick?: (day: DataPoint) => void;
}

export default function ActivityChart({ data, formatDuration, onDayClick }: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Take last 14 days
  const displayData = data.slice(-14);
  const filteredData = showOnlyActive ? displayData.filter(d => d.count > 0) : displayData;
  const maxCount = Math.max(...displayData.map(d => d.count), 1);
  const maxDuration = Math.max(...displayData.map(d => d.duration), 1);

  const handleDayClick = (day: DataPoint) => {
    if (day.count > 0 && onDayClick) {
      onDayClick(day);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📊 Activité détaillée (14 jours)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Progression par jour avec routines et temps d'entraînement
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            showOnlyActive
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {showOnlyActive ? '✓ Jours actifs' : 'Tous les jours'}
        </button>
      </div>

      {/* Legend with better explanation */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md"></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Routines complétées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md"></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Temps d'entraînement</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Survolez pour voir les détails · Cliquez pour approfondir
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {filteredData.map((dataPoint, index) => {
          const routinePercentage = (dataPoint.count / maxCount) * 100;
          const durationPercentage = (dataPoint.duration / maxDuration) * 100;
          const isHovered = hoveredIndex === index;
          const isActive = dataPoint.count > 0;
          const isToday = dataPoint.date === new Date().toISOString().split('T')[0];

          return (
            <div
              key={index}
              className={`group relative transition-all duration-300 ${
                isHovered ? 'scale-102' : 'scale-100'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-4">
                {/* Date with day of week */}
                <div className="w-24">
                  <div className={`text-sm font-bold ${
                    isToday
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {new Date(dataPoint.date).toLocaleDateString('fr-FR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(dataPoint.date).toLocaleDateString('fr-FR', {
                      weekday: 'short'
                    })}
                  </div>
                </div>

                {/* Bar Chart with improved design */}
                <div className="flex-1 space-y-2">
                  {/* Routines Bar */}
                  <div className="relative group/bar">
                    <div className={`h-8 rounded-xl overflow-hidden transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div
                        className={`h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 rounded-xl
                          transition-all duration-700 ease-out shadow-lg
                          ${isHovered ? 'opacity-100 shadow-indigo-500/50' : 'opacity-90'}`}
                        style={{
                          width: `${routinePercentage}%`,
                          transitionDelay: `${index * 30}ms`
                        }}
                      />
                    </div>
                    {/* Value display */}
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-all ${
                      isHovered && routinePercentage > 15
                        ? 'text-white opacity-100'
                        : routinePercentage > 15
                        ? 'text-white/70 opacity-0 group-hover/bar:opacity-100'
                        : 'text-gray-700 dark:text-gray-300 left-[calc(100%+8px)]'
                    }`}>
                      {dataPoint.count > 0 ? `${dataPoint.count} routine${dataPoint.count !== 1 ? 's' : ''}` : '—'}
                    </div>
                  </div>

                  {/* Duration Bar */}
                  <div className="relative group/bar">
                    <div className={`h-8 rounded-xl overflow-hidden transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div
                        className={`h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-cyan-600 rounded-xl
                          transition-all duration-700 ease-out shadow-lg
                          ${isHovered ? 'opacity-100 shadow-blue-500/50' : 'opacity-90'}`}
                        style={{
                          width: `${durationPercentage}%`,
                          transitionDelay: `${index * 30 + 100}ms`
                        }}
                      />
                    </div>
                    {/* Value display */}
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-all ${
                      isHovered && durationPercentage > 15
                        ? 'text-white opacity-100'
                        : durationPercentage > 15
                        ? 'text-white/70 opacity-0 group-hover/bar:opacity-100'
                        : 'text-gray-700 dark:text-gray-300 left-[calc(100%+8px)]'
                    }`}>
                      {dataPoint.duration > 0 ? formatDuration(dataPoint.duration) : '—'}
                    </div>
                  </div>
                </div>

                {/* Activity Indicator with icon */}
                <button
                  onClick={() => handleDayClick(dataPoint)}
                  disabled={!isActive}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                    transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    } ${isHovered && isActive ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}`}
                >
                  {isActive ? '✓' : '—'}
                </button>
              </div>

              {/* Enhanced Hover Tooltip */}
              {isHovered && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-24 z-20
                  bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600
                  text-white px-5 py-3 rounded-xl shadow-2xl border border-gray-700 dark:border-gray-500
                  animate-fade-in-up min-w-[250px]">
                  <div className="text-sm font-bold mb-2 flex items-center gap-2">
                    📅 {new Date(dataPoint.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </div>

                  {dataPoint.count > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-indigo-400 flex items-center gap-1">
                          <span>●</span> Routines
                        </span>
                        <span className="font-bold">{dataPoint.count}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-400 flex items-center gap-1">
                          <span>●</span> Durée
                        </span>
                        <span className="font-bold">{formatDuration(dataPoint.duration)}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400 text-center">
                        👆 Cliquez pour plus de détails
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Aucune activité ce jour</div>
                  )}

                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45
                    w-3 h-3 bg-gray-900 dark:bg-gray-700 border-r border-b border-gray-700 dark:border-gray-500"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary with enhanced design */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {displayData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">Total routines</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatDuration(displayData.reduce((sum, d) => sum + d.duration, 0))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">Temps total</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {displayData.filter(d => d.count > 0).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">Jours actifs</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
