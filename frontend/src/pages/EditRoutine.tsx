import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import type { RoutineCreate, RoutineStep, SoundType } from '../types';
import { api } from '../services/api';
import { SOUND_TYPES, playSound } from '../utils/sounds';

// Using RoutineStep type for type safety
type StepInput = Omit<RoutineStep, 'id' | 'routine_id' | 'order'>;

export default function EditRoutine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [routineName, setRoutineName] = useState('');
  const [soundType, setSoundType] = useState<SoundType>('beep');
  const [volume, setVolume] = useState(30);
  const [steps, setSteps] = useState<StepInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const routine = await api.getRoutine(Number(id));
      setRoutineName(routine.nom);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-indigo-600 hover:text-indigo-700 mb-2 inline-block">
              ← Back to routines
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Edit Routine</h1>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Routine name */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Routine Name
            </label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., Daily Warmup"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Sound settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sound Settings</h2>

            <div className="space-y-4">
              {/* Sound type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{sound.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{sound.description}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click a sound to preview it
                </p>
              </div>

              {/* Volume slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume: {volume}%
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm">🔈</span>
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
                  <span className="text-gray-500 text-sm">🔊</span>
                  <button
                    type="button"
                    onClick={() => playSound(soundType, volume)}
                    className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-sm font-medium transition-colors"
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
              <h2 className="text-2xl font-bold text-gray-900">Steps</h2>
              <span className="text-sm text-gray-600">
                Total: {formatDuration(totalDuration)}
              </span>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Step {index + 1}
                  </h3>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exercise Name
                    </label>
                    <input
                      type="text"
                      value={step.nom}
                      onChange={(e) => updateStep(index, 'nom', e.target.value)}
                      placeholder="e.g., Raider's Aim Map"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Map Code
                    </label>
                    <input
                      type="text"
                      value={step.code_map}
                      onChange={(e) => updateStep(index, 'code_map', e.target.value)}
                      placeholder="1234-5678-9999"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={step.duree}
                      onChange={(e) => updateStep(index, 'duree', parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDuration(step.duree)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tips (optional)
                    </label>
                    <textarea
                      value={step.tips}
                      onChange={(e) => updateStep(index, 'tips', e.target.value)}
                      placeholder="Focus on headshot tracking..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStep}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
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
