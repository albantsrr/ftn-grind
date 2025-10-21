import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Routine } from '../types';
import { api } from '../services/api';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🌀 FortiFlow
            </h1>
            <p className="text-gray-600">Master your flow. Map by map.</p>
          </div>
          <Link
            to="/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + New Routine
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Routines list */}
        {routines.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No routines yet</p>
            <Link
              to="/create"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
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
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {routine.nom}
                    </h3>
                    <div className="flex gap-2">
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
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(totalDuration)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
