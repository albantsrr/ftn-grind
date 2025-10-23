import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import type { Routine, RoutineCreate, RoutineStep, SoundType } from '../types';
import { api } from '../services/api';
import { exportRoutine } from '../utils/routineExport';
import ImageSelector from '../components/ImageSelector';
import SoundSelector from '../components/SoundSelector';
import StepCard from '../components/StepCard';

type StepInput = Omit<RoutineStep, 'id' | 'routine_id' | 'order'>;

export default function EditRoutine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [routineName, setRoutineName] = useState('');
  const [soundType, setSoundType] = useState<SoundType>('beep');
  const [volume, setVolume] = useState(30);
  const [imageUrl, setImageUrl] = useState('/default_image.jpg');
  const [steps, setSteps] = useState<StepInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const routine = await api.getRoutine(Number(id));
      setCurrentRoutine(routine);
      setRoutineName(routine.nom);
      setImageUrl(routine.image_url || '/default_image.jpg');
      setSoundType(routine.sound_type || 'beep');
      setVolume(routine.volume || 30);
      setSteps(routine.steps.map(step => ({
        nom: step.nom,
        code_map: step.code_map,
        duree: step.duree,
        tips: step.tips || ''
      })));
      setError(null);
    } catch (err) {
      setError('Failed to load routine');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (currentRoutine) {
      exportRoutine(currentRoutine);
    }
  };

  const addStep = () => {
    setSteps([...steps, { nom: '', code_map: '', duree: 60, tips: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof RoutineStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    setSteps(newSteps);
  };

  const moveStepUp = (index: number) => {
    if (index > 0) moveStep(index, index - 1);
  };

  const moveStepDown = (index: number) => {
    if (index < steps.length - 1) moveStep(index, index + 1);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveStep(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!routineName.trim()) {
      setError('Routine name is required');
      return;
    }

    if (steps.length === 0) {
      setError('At least one step is required');
      return;
    }

    for (const step of steps) {
      if (!step.nom.trim() || !step.code_map.trim()) {
        setError('All steps must have a name and map code');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const routineData: RoutineCreate = {
        nom: routineName,
        sound_type: soundType,
        volume: volume,
        image_url: imageUrl,
        steps: steps.map(step => ({
          nom: step.nom,
          code_map: step.code_map,
          duree: step.duree,
          tips: step.tips || undefined
        }))
      };
      await api.updateRoutine(Number(id), routineData);
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update routine';
      setError(`Failed to update routine: ${errorMessage}`);
      console.error('Error updating routine:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const totalDuration = steps.reduce((sum, step) => sum + step.duree, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading routine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 mb-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to routines
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Edit Routine</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Modify your training flow
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              title="Export this routine"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-8 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Routine Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Routine Info</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Routine Name *
            </label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., Daily Warmup"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              required
            />
          </div>

          <ImageSelector
            currentImage={imageUrl}
            onImageChange={setImageUrl}
          />
        </div>

        {/* Section 2: Sound Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sound Settings</h2>
          </div>

          <SoundSelector
            soundType={soundType}
            volume={volume}
            onSoundTypeChange={setSoundType}
            onVolumeChange={setVolume}
          />
        </div>

        {/* Section 3: Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Training Steps</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {steps.length} {steps.length === 1 ? 'step' : 'steps'} • Total duration: {formatDuration(totalDuration)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                index={index}
                totalSteps={steps.length}
                onUpdate={(field, value) => updateStep(index, field, value)}
                onRemove={() => removeStep(index)}
                onMoveUp={() => moveStepUp(index)}
                onMoveDown={() => moveStepDown(index)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === index}
                isDragOver={dragOverIndex === index}
              />
            ))}

            <button
              type="button"
              onClick={addStep}
              className="w-full py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-xl text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-medium flex items-center justify-center gap-2 group"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Step
            </button>
          </div>
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-8 py-4 shadow-2xl z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'} • {formatDuration(totalDuration)} total
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Save changes to your routine"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
