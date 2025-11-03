import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import PaywallModal from '../components/PaywallModal';
import GradeBadge from '../components/GradeBadge';
import StatsCard from '../components/StatsCard';
import GradeProgress from '../components/GradeProgress';
import StatsSkeleton from '../components/StatsSkeleton';
import type { UserStats } from '../types';

export default function Statistics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = user?.subscription_tier === 'premium';

  // Check Premium access on mount
  useEffect(() => {
    if (!isPremium) {
      setShowPaywall(true);
    }
  }, [isPremium]);

  // Load statistics data
  useEffect(() => {
    if (isPremium) {
      loadStatistics();
    } else {
      // For Free users, immediately stop loading to show paywall
      setLoading(false);
    }
  }, [isPremium]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const statsData = await api.getUserStats();
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Show skeleton loader while loading
  if (loading && isPremium) {
    return <StatsSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={() => navigate('/')} feature="Statistics" />

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} username={user?.username || 'User'} subscriptionTier={user?.subscription_tier} avatarUrl={user?.avatar_url} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Stats Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your progress and performance
                </p>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {error ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadStatistics}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Grade Badge with Progress Ring */}
                <GradeBadge
                  grade={stats.grade}
                  currentRoutines={stats.total_routines_completed}
                  currentStreak={stats.longest_streak}
                  currentTimeSeconds={stats.total_time_seconds}
                />

                {/* Stats Grid with Animated Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard
                    title="Routines Completed"
                    value={stats.total_routines_completed}
                    color="green"
                    tooltip="Total number of routines you have completed"
                    delay={100}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />

                  <StatsCard
                    title="Total Time"
                    value={formatDuration(stats.total_time_seconds)}
                    color="blue"
                    tooltip="Total time spent training"
                    delay={200}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />

                  <StatsCard
                    title="Best Streak"
                    value={`${stats.longest_streak} days`}
                    color="orange"
                    tooltip="Longest streak of consecutive training days"
                    delay={300}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                    }
                  />
                </div>

                {/* Grade Progress with Progress Bars */}
                <GradeProgress stats={stats} />
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No data available</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start using the app to see your statistics!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Create a routine
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
