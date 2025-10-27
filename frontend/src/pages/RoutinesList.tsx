import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Routine } from '../types';
import { api } from '../services/api';
import { exportRoutine, exportRoutines, importRoutinesFromFile } from '../utils/routineExport';
import ThemeToggle from '../components/ThemeToggle';
import Sidebar from '../components/Sidebar';
import RoutineCard from '../components/RoutineCard';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

export default function RoutinesList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [filteredRoutines, setFilteredRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, []);

  useEffect(() => {
    // Filter routines based on search query
    if (searchQuery.trim() === '') {
      setFilteredRoutines(routines);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = routines.filter(routine =>
        routine.nom.toLowerCase().includes(query) ||
        routine.steps.some(step =>
          step.nom.toLowerCase().includes(query) ||
          step.code_map.toLowerCase().includes(query)
        )
      );
      setFilteredRoutines(filtered);
    }
  }, [searchQuery, routines]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await api.getRoutines();
      setRoutines(data);
      setError(null);
    } catch (err) {
      setError('Failed to load routines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRoutine(id);
      await loadRoutines();
      success('✅ Routine supprimée avec succès');
    } catch (err) {
      showError('❌ Erreur lors de la suppression de la routine');
      console.error(err);
    }
  };

  const handleExportRoutine = (routine: Routine) => {
    try {
      exportRoutine(routine);
      success(`✅ Routine "${routine.nom}" exportée`);
    } catch {
      showError('❌ Erreur lors de l\'exportation');
    }
  };

  const handleExportAll = () => {
    if (routines.length === 0) {
      showError('❌ Aucune routine à exporter');
      return;
    }
    try {
      exportRoutines(routines);
      success(`✅ ${routines.length} routine(s) exportée(s)`);
      setShowActionsMenu(false);
    } catch {
      showError('❌ Erreur lors de l\'exportation');
    }
  };

  const handleShare = async (id: number) => {
    try {
      await api.shareRoutine(id);
      await loadRoutines(); // Reload to get updated is_public status

      // Check new status
      const updatedRoutine = await api.getRoutine(id);
      if (updatedRoutine.is_public) {
        success('✅ Routine partagée avec la communauté');
      } else {
        success('✅ Routine retirée de la communauté');
      }
    } catch (err) {
      showError('❌ Erreur lors du partage de la routine');
      console.error(err);
    }
  };

  const handleImport = async () => {
    try {
      const importedRoutines = await importRoutinesFromFile();

      let successCount = 0;
      let failCount = 0;

      for (const routine of importedRoutines) {
        try {
          await api.createRoutine(routine);
          successCount++;
        } catch (err) {
          console.error('Failed to import routine:', routine.nom, err);
          failCount++;
        }
      }

      await loadRoutines();

      if (failCount === 0) {
        success(`✅ ${successCount} routine(s) importée(s) avec succès`);
      } else {
        showError(`⚠️ ${successCount} importée(s), ${failCount} échouée(s)`);
      }
      setShowActionsMenu(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import routines';
      alert(errorMessage);
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading your routines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} username={user?.username || 'User'} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Routines</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {routines.length} {routines.length === 1 ? 'routine' : 'routines'} ready
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  title="Actions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  Actions
                </button>

                {showActionsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={handleImport}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Routines
                    </button>
                    {routines.length > 0 && (
                      <button
                        onClick={handleExportAll}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Export All
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search routines, exercises, or map codes..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {filteredRoutines.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                {searchQuery ? (
                  <>
                    <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      No routines found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Try adjusting your search terms
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      No routines yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Create your first training routine to get started
                    </p>
                    <Link
                      to="/create"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Routine
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onDelete={handleDelete}
                  onExport={handleExportRoutine}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <Link
        to="/create"
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 z-50"
        title="Create new routine"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>

      {/* Click outside to close actions menu */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActionsMenu(false)}
        />
      )}

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
