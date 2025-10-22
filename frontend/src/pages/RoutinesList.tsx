import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Routine } from '../types';
import { api } from '../services/api';
import { exportRoutine, exportRoutines, importRoutinesFromFile } from '../utils/routineExport';
import ThemeToggle from '../components/ThemeToggle';

export default function RoutinesList() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

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
    if (!confirm('Are you sure you want to delete this routine?')) return;

    try {
      await api.deleteRoutine(id);
      await loadRoutines();
    } catch (err) {
      alert('Failed to delete routine');
      console.error(err);
    }
  };

  const handleExportRoutine = (routine: Routine) => {
    exportRoutine(routine);
  };

  const handleExportAll = () => {
    if (routines.length === 0) {
      alert('No routines to export');
      return;
    }
    exportRoutines(routines);
  };

  const handleImport = async () => {
    try {
      const importedRoutines = await importRoutinesFromFile();

      // Import each routine via API
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

      // Reload routines
      await loadRoutines();

      // Show result
      if (failCount === 0) {
        alert(`Successfully imported ${successCount} routine(s)`);
      } else {
        alert(`Imported ${successCount} routine(s), failed to import ${failCount} routine(s)`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import routines';
      alert(errorMessage);
      console.error(err);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🌀 FortiFlow
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Master your flow. Map by map.</p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              title="Import routines from JSON file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            {routines.length > 0 && (
              <button
                onClick={handleExportAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Export all routines to JSON file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export All
              </button>
            )}
            <Link
              to="/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + New Routine
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Routines list */}
        {routines.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No routines yet</p>
            <Link
              to="/create"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
            >
              Create your first routine →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routines.map((routine) => {
              const totalDuration = routine.steps.reduce((sum, step) => sum + step.duree, 0);

              return (
                <div
                  key={routine.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Routine Image */}
                  <div className="h-40 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={routine.image_url || '/default_image.jpg'}
                      alt={routine.nom}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default_image.jpg';
                      }}
                    />
                  </div>

                  <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {routine.nom}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportRoutine(routine)}
                        className="text-green-500 hover:text-green-700 transition-colors"
                        title="Export routine"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </button>
                      <Link
                        to={`/edit/${routine.id}`}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Edit routine"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(routine.id!)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete routine"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(totalDuration)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {routine.steps.length} steps
                    </div>
                  </div>

                    <Link
                      to={`/play/${routine.id}`}
                      className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 rounded-lg font-semibold transition-colors"
                    >
                      Start Training →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
