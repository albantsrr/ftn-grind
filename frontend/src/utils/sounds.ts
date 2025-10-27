import type { SoundType } from '../types';

export const SOUND_TYPES: { value: SoundType; label: string; description: string }[] = [
  { value: 'beep', label: 'Beep', description: 'Simple beep tone' },
  { value: 'bell', label: 'Bell', description: 'Bell-like sound' },
  { value: 'chime', label: 'Chime', description: 'Gentle chime' },
  { value: 'notification', label: 'Notification', description: 'Notification alert' },
];

/**
 * Play a sound alert with the specified type and volume
 * @param soundType - Type of sound to play
 * @param volume - Volume level (0-100)
 */
export function playSound(soundType: SoundType = 'beep', volume: number = 30): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const gainNode = audioContext.createGain();

  // Convert volume (0-100) to gain (0-1)
  const gain = Math.max(0, Math.min(100, volume)) / 100;
  gainNode.gain.setValueAtTime(gain * 0.3, audioContext.currentTime);

  switch (soundType) {
    case 'beep':
      playBeep(audioContext, gainNode);
      break;
    case 'bell':
      playBell(audioContext, gainNode);
      break;
    case 'chime':
      playChime(audioContext, gainNode);
      break;
    case 'notification':
      playNotification(audioContext, gainNode);
      break;
    default:
      playBeep(audioContext, gainNode);
  }
}

/**
 * Simple beep sound
 */
function playBeep(audioContext: AudioContext, gainNode: GainNode): void {
  const oscillator = audioContext.createOscillator();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Bell-like sound with harmonics
 */
function playBell(audioContext: AudioContext, gainNode: GainNode): void {
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord

  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const oscGain = audioContext.createGain();

    oscillator.connect(oscGain);
    oscGain.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'sine';

    const delayTime = index * 0.05;
    oscGain.gain.setValueAtTime(0.2 / (index + 1), audioContext.currentTime + delayTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delayTime + 0.5);

    oscillator.start(audioContext.currentTime + delayTime);
    oscillator.stop(audioContext.currentTime + delayTime + 0.5);
  });
}

/**
 * Gentle chime sound
 */
function playChime(audioContext: AudioContext, gainNode: GainNode): void {
  const frequencies = [1046.5, 1318.5]; // C6, E6

  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const oscGain = audioContext.createGain();

    oscillator.connect(oscGain);
    oscGain.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'sine';

    const delayTime = index * 0.1;
    oscGain.gain.setValueAtTime(0.3, audioContext.currentTime + delayTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delayTime + 0.8);

    oscillator.start(audioContext.currentTime + delayTime);
    oscillator.stop(audioContext.currentTime + delayTime + 0.8);
  });
}

/**
 * Notification alert sound
 */
function playNotification(audioContext: AudioContext, gainNode: GainNode): void {
  const notes = [
    { freq: 880, duration: 0.1 },
    { freq: 988, duration: 0.1 },
    { freq: 1046.5, duration: 0.2 }
  ];

  let startTime = audioContext.currentTime;

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const oscGain = audioContext.createGain();

    oscillator.connect(oscGain);
    oscGain.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = note.freq;
    oscillator.type = 'square';

    oscGain.gain.setValueAtTime(0.2, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + note.duration);

    startTime += note.duration;
  });
}
