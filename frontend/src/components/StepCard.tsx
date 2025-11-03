import { useState } from 'react';
import type { RoutineStep } from '../types';

interface StepCardProps {
  step: Omit<RoutineStep, 'id' | 'routine_id' | 'order'>;
  index: number;
  totalSteps: number;
  onUpdate: (field: keyof RoutineStep, value: string | number) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export default function StepCard({
  step,
  index,
  totalSteps,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md transition-all duration-200 ${
        isDragging
          ? 'opacity-50 scale-95'
          : isDragOver
          ? 'ring-2 ring-indigo-400 scale-[1.02]'
          : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none p-1"
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
              title="Move up"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalSteps - 1}
              className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
              title="Move down"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Step Number & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-bold text-sm">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step.nom || 'Unnamed step'}
            </h3>
          </div>
          {!isExpanded && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="truncate">{step.code_map || 'No map code'}</span>
              <span>•</span>
              <span>{formatDuration(step.duree)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {totalSteps > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Remove step"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Game Type *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onUpdate('game_type', 'fortnite')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  (step.game_type || 'fortnite') === 'fortnite'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🎮 Fortnite
              </button>
              <button
                type="button"
                onClick={() => onUpdate('game_type', 'kovaaks')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  step.game_type === 'kovaaks'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🎯 Kovaak's
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              value={step.nom}
              onChange={(e) => onUpdate('nom', e.target.value)}
              placeholder="e.g., Raider's Aim Map"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              required
            />
          </div>

          {(step.game_type || 'fortnite') === 'fortnite' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Map Code *
              </label>
              <input
                type="text"
                value={step.code_map}
                onChange={(e) => onUpdate('code_map', e.target.value)}
                placeholder="1234-5678-9999"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-shadow"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Duration *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={Math.floor(step.duree / 60)}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value) || 0;
                      const seconds = step.duree % 60;
                      onUpdate('duree', minutes * 60 + seconds);
                    }}
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    Minutes
                  </label>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={step.duree % 60}
                    onChange={(e) => {
                      const seconds = parseInt(e.target.value) || 0;
                      const minutes = Math.floor(step.duree / 60);
                      onUpdate('duree', minutes * 60 + seconds);
                    }}
                    min="0"
                    max="59"
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    Seconds
                  </label>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium min-w-[4rem]">
                = {formatDuration(step.duree)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Tips (optional)
            </label>
            <textarea
              value={step.tips}
              onChange={(e) => onUpdate('tips', e.target.value)}
              placeholder="Focus on headshot tracking..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}
