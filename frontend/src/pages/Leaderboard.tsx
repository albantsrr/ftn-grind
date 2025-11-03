import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import PodiumCard from '../components/PodiumCard';
import LeaderboardRow from '../components/LeaderboardRow';
import type { LeaderboardResponse } from '../types';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load leaderboard
  useEffect(() => {
    loadLeaderboard();
  }, [debouncedSearch]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getLeaderboard({
        limit: 100,
        search: debouncedSearch || undefined
      });
      setData(response);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const topThree = data?.entries.slice(0, 3) || [];
  const remaining = data?.entries.slice(3) || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} username={user?.username || 'User'} subscriptionTier={user?.subscription_tier} avatarUrl={user?.avatar_url} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Leaderboard Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Rankings by performance and engagement
                </p>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {/* Season & Search */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg">
                  <span className="font-semibold">🏆 Season {data?.season || 'Current'}</span>
                </div>
                {data && (
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {data.total_count} players
                    </span>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadLeaderboard}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
              </div>
            ) : data ? (
              <>
                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <span>🏆</span>
                      Top 3 Champions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-12">
                      {/* 2nd Place - Left */}
                      {topThree[1] && (
                        <div className="order-2 md:order-1 md:mb-8">
                          <PodiumCard entry={topThree[1]} position={2} />
                        </div>
                      )}

                      {/* 1st Place - Center */}
                      {topThree[0] && (
                        <div className="order-1 md:order-2">
                          <PodiumCard entry={topThree[0]} position={1} />
                        </div>
                      )}

                      {/* 3rd Place - Right */}
                      {topThree[2] && (
                        <div className="order-3 md:mb-8">
                          <PodiumCard entry={topThree[2]} position={3} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Leaderboard Table */}
                {remaining.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                          <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Player
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Routines
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Streak
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {remaining.map((entry) => (
                            <LeaderboardRow key={entry.user_id} entry={entry} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Current User Position (Sticky Bottom) - Only show when NOT searching */}
                {data.current_user_entry && data.current_user_entry.position > 3 && !searchQuery && (
                  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-2xl p-4 border-2 border-indigo-400">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold">Your Position</span>
                          <span className="text-3xl font-extrabold">#{data.current_user_entry.position}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{data.current_user_entry.total_score.toLocaleString()}</div>
                            <div className="text-xs opacity-80">Score</div>
                          </div>
                          <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            Improve Your Score →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No leaderboard data</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start training to appear on the leaderboard!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Start Training
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
