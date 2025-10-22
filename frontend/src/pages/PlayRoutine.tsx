import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Routine } from '../types';
import { api } from '../services/api';
import { playSound } from '../utils/sounds';

export default function PlayRoutine() {
  const { id } = useParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Step completed, play beep
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && isRunning && !isPaused) {
      handleStepComplete();
    }
  }, [timeRemaining, isRunning, isPaused]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const data = await api.getRoutine(Number(id));
      setRoutine(data);
      setError(null);
    } catch (err) {
      setError('Failed to load routine');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playBeep = () => {
    if (routine) {
      playSound(routine.sound_type || 'beep', routine.volume || 30);
    }
  };

  const startRoutine = () => {
    if (routine && routine.steps.length > 0) {
      setIsRunning(true);
      setCurrentStepIndex(0);
      setTimeRemaining(routine.steps[0].duree);
    }
  };

  const handleStepComplete = () => {
    if (!routine) return;

    if (currentStepIndex < routine.steps.length - 1) {
      // Pause automatically before next step
      setIsPaused(true);
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeRemaining(routine.steps[nextIndex].duree);
    } else {
      // Routine completed
      setIsRunning(false);
      setIsCompleted(true);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleNextStep = () => {
    if (!routine || currentStepIndex >= routine.steps.length - 1) return;
    playBeep();
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setTimeRemaining(routine.steps[nextIndex].duree);
    setIsPaused(true); // Auto-pause on manual next
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyMapCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Routine not found'}
          </div>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            ← Back to routines
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = routine.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / routine.steps.length) * 100;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-12 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Routine Completed!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Great job finishing "{routine.nom}"
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStepIndex(0);
                setIsRunning(false);
                setIsPaused(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Run Again
            </button>
            <Link
              to="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Routines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isRunning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 mb-6 inline-block">
            ← Back to routines
          </Link>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {routine.nom}
            </h1>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Steps Preview</h2>
              <div className="space-y-3">
                {routine.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {index + 1}. {step.nom}
                        </div>
                        <div className="text-sm text-gray-600 font-mono mt-1">
                          {step.code_map}
                        </div>
                        {step.tips && (
                          <div className="text-sm text-gray-500 mt-2 italic">
                            💡 {step.tips}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatTime(step.duree)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startRoutine}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg text-xl font-semibold transition-colors"
            >
              Start Training →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2 mb-8">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg shadow-2xl p-12">
          <div className="text-center mb-8">
            <div className="text-sm font-semibold text-indigo-600 mb-2">
              STEP {currentStepIndex + 1} OF {routine.steps.length}
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {currentStep.nom}
            </h1>
            <button
              onClick={() => copyMapCode(currentStep.code_map)}
              className="inline-flex items-center gap-2 text-2xl font-mono bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition-colors"
              title="Click to copy"
            >
              {currentStep.code_map}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {currentStep.tips && (
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 mb-8">
              <div className="flex items-start">
                <span className="text-2xl mr-3">💡</span>
                <p className="text-lg text-gray-700">{currentStep.tips}</p>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-indigo-600 mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-gray-500">remaining</div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handlePause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            {currentStepIndex < routine.steps.length - 1 && (
              <button
                onClick={handleNextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Next Step →
              </button>
            )}
            <Link
              to="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
