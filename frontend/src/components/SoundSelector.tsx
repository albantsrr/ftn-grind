import type { SoundType } from '../types';
import { SOUND_TYPES, playSound } from '../utils/sounds';

interface SoundSelectorProps {
  soundType: SoundType;
  volume: number;
  onSoundTypeChange: (type: SoundType) => void;
  onVolumeChange: (volume: number) => void;
}

const soundIcons: Record<SoundType, string> = {
  beep: '📢',
  bell: '🔔',
  chime: '🎵',
  notification: '🔊',
};

export default function SoundSelector({
  soundType,
  volume,
  onSoundTypeChange,
  onVolumeChange,
}: SoundSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Sound Type Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Alert Sound
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SOUND_TYPES.map((sound) => (
            <button
              key={sound.value}
              type="button"
              onClick={() => {
                onSoundTypeChange(sound.value);
                playSound(sound.value, volume);
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                soundType === sound.value
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {/* Selected Indicator */}
              {soundType === sound.value && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon & Label */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{soundIcons[sound.value]}</span>
                <div className="font-semibold text-gray-900 dark:text-white text-base">
                  {sound.label}
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {sound.description}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click a sound to preview it
        </p>
      </div>

      {/* Volume Slider */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Volume: {volume}%
        </label>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 dark:text-gray-400 text-xl">🔈</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`,
              }}
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xl">🔊</span>
          <button
            type="button"
            onClick={() => playSound(soundType, volume)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            title="Test current sound and volume"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test
          </button>
        </div>
      </div>
    </div>
  );
}
