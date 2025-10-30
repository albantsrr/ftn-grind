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
  const [copiedCode, setCopiedCode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadRoutine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && isRunning && !isPaused) {
      handleStepComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startRoutine = async () => {
    if (routine && routine.steps.length > 0) {
      // Start session tracking
      try {
        const session = await api.startSession(routine.id!);
        setSessionId(session.id);
        setSessionStartTime(Date.now());
      } catch (err) {
        console.error('Failed to start session:', err);
        // Continue even if session tracking fails
      }

      setIsRunning(true);
      setCurrentStepIndex(0);
      setTimeRemaining(routine.steps[0].duree);
    }
  };

  const handleStepComplete = async () => {
    if (!routine) return;

    if (currentStepIndex < routine.steps.length - 1) {
      // If autoPlay is enabled, don't pause between steps
      setIsPaused(!autoPlay);
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeRemaining(routine.steps[nextIndex].duree);
    } else {
      // Routine completed - track session
      if (sessionId && sessionStartTime) {
        try {
          const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
          await api.completeSession(sessionId, totalDuration);
        } catch (err) {
          console.error('Failed to complete session:', err);
          // Continue even if session completion fails
        }
      }

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
    setIsPaused(true);
  };

  const handlePreviousStep = () => {
    if (!routine || currentStepIndex <= 0) return;
    playBeep();
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    setTimeRemaining(routine.steps[prevIndex].duree);
    setIsPaused(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyMapCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTotalDuration = () => {
    if (!routine) return 0;
    return routine.steps.reduce((sum, step) => sum + step.duree, 0);
  };

  const getTotalRemainingTime = () => {
    if (!routine) return 0;
    let remaining = timeRemaining;
    for (let i = currentStepIndex + 1; i < routine.steps.length; i++) {
      remaining += routine.steps[i].duree;
    }
    return remaining;
  };

  const getStepProgress = () => {
    if (!routine || !isRunning) return 0;
    const currentStep = routine.steps[currentStepIndex];
    return ((currentStep.duree - timeRemaining) / currentStep.duree) * 100;
  };

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

  if (error || !routine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error || 'Routine not found'}
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to routines
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = routine.steps[currentStepIndex];
  const overallProgress = ((currentStepIndex + 1) / routine.steps.length) * 100;
  const totalDuration = getTotalDuration();

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Routine Completed!
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Great job finishing <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{routine.nom}"</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStepIndex(0);
                setIsRunning(false);
                setIsPaused(false);
                setSessionId(null);
                setSessionStartTime(null);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Again
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-8 py-4 rounded-lg font-bold transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Routines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Preview Screen
  if (!isRunning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-6 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to routines
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  {routine.nom}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{formatTime(totalDuration)} total</span>
                  </div>
                  <div className="w-1 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="font-semibold">{routine.steps.length} steps</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/edit/${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                title="Edit this routine"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Routine
              </Link>
            </div>

            {/* Steps Preview */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Steps Preview</h2>
              </div>

              <div className="space-y-3">
                {routine.steps.map((step, index) => (
                  <div key={index} className="group border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-5 transition-all hover:shadow-md bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {step.nom}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 ml-11">
                          <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span className="font-mono font-semibold">{step.code_map}</span>
                        </div>

                        {step.tips && (
                          <div className="mt-3 ml-11 text-sm text-gray-600 dark:text-gray-400 italic flex items-start gap-2">
                            <span>💡</span>
                            <span>{step.tips}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(step.duree)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-Play Option */}
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Auto-Play Mode
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {autoPlay
                        ? "Steps will automatically continue without pausing. You can still manually pause or skip steps during training."
                        : "You'll need to press Resume after each step completes to continue to the next one."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex-shrink-0 ${
                    autoPlay ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={autoPlay}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      autoPlay ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startRoutine}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-5 rounded-xl text-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Timer Screen
  const stepProgress = getStepProgress();
  const totalRemaining = getTotalRemainingTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full">
        {/* Overall Progress Bar */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full h-4 mb-4 overflow-hidden shadow-lg">
          <div
            className="bg-white dark:bg-yellow-400 rounded-full h-4 transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${overallProgress}%` }}
          >
            {overallProgress > 10 && (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-900">
                {currentStepIndex + 1}/{routine.steps.length}
              </span>
            )}
          </div>
        </div>

        {/* Step Info */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-white font-semibold">
            <span>STEP {currentStepIndex + 1} OF {routine.steps.length}</span>
            <div className="w-1 h-4 bg-white/50 rounded-full"></div>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(totalRemaining)} total remaining
            </span>
            {autoPlay && (
              <>
                <div className="w-1 h-4 bg-white/50 rounded-full"></div>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Auto-Play ON
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10 border-4 border-white/20">
          {/* Step Name */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {currentStep.nom}
            </h1>

            {/* Map Code */}
            <button
              onClick={() => copyMapCode(currentStep.code_map)}
              className="relative inline-flex items-center gap-3 text-3xl font-mono bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 hover:from-indigo-200 hover:to-purple-200 dark:hover:from-indigo-800/70 dark:hover:to-purple-800/70 px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-indigo-300 dark:border-indigo-600 group"
              title="Click to copy map code"
            >
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-gray-900 dark:text-white font-bold">{currentStep.code_map}</span>
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>

              {/* Copy Feedback */}
              {copiedCode && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-bounce">
                  ✓ Copied!
                </div>
              )}
            </button>
          </div>

          {/* Tips */}
          {currentStep.tips && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-6 mb-8 rounded-r-xl shadow-md">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">💡</span>
                <div>
                  <div className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Pro Tip</div>
                  <p className="text-lg text-yellow-800 dark:text-yellow-100 leading-relaxed">{currentStep.tips}</p>
                </div>
              </div>
            </div>
          )}

          {/* Circular Timer */}
          <div className="flex items-center justify-center mb-8 relative">
            {/* Circular Progress */}
            <svg className="transform -rotate-90 w-80 h-80" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - stepProgress / 100)}`}
                className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xl text-gray-500 dark:text-gray-400 font-medium mt-2">remaining</div>

              {/* Sound Indicator */}
              <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg className={`w-5 h-5 ${!isPaused ? 'animate-pulse text-green-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-sm font-medium">Sound alert enabled</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Previous Step Button */}
            {currentStepIndex > 0 && (
              <button
                onClick={handlePreviousStep}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span>Previous Step</span>
              </button>
            )}

            {/* Pause/Resume Button */}
            <button
              onClick={handlePause}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-lg ${
                isPaused
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isPaused ? (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause
                </>
              )}
            </button>

            {/* Next Step Button */}
            {currentStepIndex < routine.steps.length - 1 && (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-lg"
              >
                <span>Next Step</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Exit Button */}
            <Link
              to="/"
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
