export default function StatsSkeleton() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
            {/* Grade Card Skeleton */}
            <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-32 bg-white/30 rounded mb-3"></div>
                  <div className="h-12 w-48 bg-white/40 rounded"></div>
                </div>
                <div className="w-24 h-24 rounded-full bg-white/20"></div>
              </div>
              <div className="mt-6 h-16 bg-white/10 rounded-lg"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse-gentle"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${Math.random() * 50 + 30}%` }}></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${Math.random() * 50 + 20}%` }}></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((week) => (
                  <div key={week} className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5, 6].map((day) => (
                      <div
                        key={day}
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse-gentle"
                        style={{ animationDelay: `${(week * 6 + day) * 50}ms` }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Progress Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div>
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
