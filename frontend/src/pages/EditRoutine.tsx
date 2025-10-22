import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import type { Routine, RoutineCreate, RoutineStep, SoundType } from '../types';
import { api } from '../services/api';
import { SOUND_TYPES, playSound } from '../utils/sounds';
import { exportRoutine } from '../utils/routineExport';
import ImageSelector from '../components/ImageSelector';

// Using RoutineStep type for type safety
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
    if (index > 0) {
      moveStep(index, index - 1);
    }
  };

  const moveStepDown = (index: number) => {
    if (index < steps.length - 1) {
      moveStep(index, index + 1);
    }
  };

  // Drag and drop handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      const routine: RoutineCreate = {
        nom: routineName,
        sound_type: soundType,
        image_url: imageUrl,
        volume: volume,
        steps: steps.map(step => ({
          nom: step.nom,
          code_map: step.code_map,
          duree: step.duree,
          tips: step.tips || undefined
        }))
      };
      await api.updateRoutine(Number(id), routine);
      navigate('/');
    } catch (err) {
      setError('Failed to update routine');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const totalDuration = steps.reduce((sum, step) => sum + step.duree, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-2 inline-block">
              ← Back to routines
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Edit Routine</h1>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            title="Export this routine"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Export
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Routine name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Routine Name
              </label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g., Daily Warmup"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <ImageSelector
              currentImage={imageUrl}
              onImageChange={setImageUrl}
            />
          </div>

          {/* Sound settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sound Settings</h2>

            <div className="space-y-4">
              {/* Sound type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Alert Sound
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SOUND_TYPES.map((sound) => (
                    <button
                      key={sound.value}
                      type="button"
                      onClick={() => {
                        setSoundType(sound.value);
                        playSound(sound.value, volume);
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        soundType === sound.value
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{sound.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sound.description}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Click a sound to preview it
                </p>
              </div>

              {/* Volume slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Volume: {volume}%
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm dark:text-gray-400">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-gray-500 text-sm dark:text-gray-400">🔊</span>
                  <button
                    type="button"
                    onClick={() => playSound(soundType, volume)}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-sm font-medium transition-colors"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Steps</h2>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Total: {formatDuration(totalDuration)}
              </span>
            </div>

            {steps.map((step, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                    ? 'ring-2 ring-indigo-400 scale-[1.02]'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3 p-6">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none p-1"
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveStepUp(index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStepDown(index)}
                        disabled={index === steps.length - 1}
                        className="text-gray-400 hover:text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-200">
                        Step {index + 1}
                      </h3>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-300 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Exercise Name
                        </label>
                        <input
                          type="text"
                          value={step.nom}
                          onChange={(e) => updateStep(index, 'nom', e.target.value)}
                          placeholder="e.g., Raider's Aim Map"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Map Code
                        </label>
                        <input
                          type="text"
                          value={step.code_map}
                          onChange={(e) => updateStep(index, 'code_map', e.target.value)}
                          placeholder="1234-5678-9999"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={step.duree}
                          onChange={(e) => updateStep(index, 'duree', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDuration(step.duree)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Tips (optional)
                        </label>
                        <textarea
                          value={step.tips}
                          onChange={(e) => updateStep(index, 'tips', e.target.value)}
                          placeholder="Focus on headshot tracking..."
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStep}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
            >
              + Add Step
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              to="/"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold text-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
