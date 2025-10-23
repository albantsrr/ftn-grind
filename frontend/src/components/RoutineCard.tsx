import { Link } from 'react-router-dom';
import type { Routine } from '../types';

interface RoutineCardProps {
  routine: Routine;
  onDelete: (id: number) => void;
  onExport: (routine: Routine) => void;
}

export default function RoutineCard({ routine, onDelete, onExport }: RoutineCardProps) {
  const totalDuration = routine.steps.reduce((sum, step) => sum + step.duree, 0);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${routine.nom}"?`)) {
      onDelete(routine.id!);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image Header */}
      <div className="h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 relative">
        <img
          src={routine.image_url || '/default_image.jpg'}
          alt={routine.nom}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default_image.jpg';
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[3.5rem]">
          {routine.nom}
        </h3>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(totalDuration)}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {routine.steps.length} {routine.steps.length === 1 ? 'step' : 'steps'}
          </div>
        </div>

        {/* Start Button */}
        <Link
          to={`/play/${routine.id}`}
          className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg">Start Training</span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onExport(routine)}
            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Export routine"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>
          <Link
            to={`/edit/${routine.id}`}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit routine"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete routine"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
