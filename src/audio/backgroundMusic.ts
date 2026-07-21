// ===== 背景音乐（Web Audio 循环氛围音） =====
import type { AudioSettings } from './types';
import { getAudioContext, resumeAudioContext } from './audioContext';

export type MusicMode = 'lounge' | 'normal' | 'tension' | 'climax';

let bgmNodes: {
  masterGain: GainNode;
  oscillators: OscillatorNode[];
} | null = null;
let bgmMode: MusicMode | null = null;
let bgmRunning = false;

function createPulsePattern(
  audio: AudioContext,
  masterGain: GainNode,
  freq: number,
  type: OscillatorType,
  volume: number,
  cycleDuration: number,
  hits: number,
): OscillatorNode {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, audio.currentTime);

  for (let i = 0; i < hits; i++) {
    const start = audio.currentTime + i * cycleDuration;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + cycleDuration * 0.55);
  }

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  return osc;
}

function createLoopPattern(
  audio: AudioContext,
  masterGain: GainNode,
  notes: number[],
  type: OscillatorType,
  volume: number,
  cycleDuration: number,
): OscillatorNode[] {
  return notes.map((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const noteDuration = cycleDuration / notes.length;
    gain.gain.setValueAtTime(0, audio.currentTime);
    for (let cycle = 0; cycle < 20; cycle++) {
      const base = audio.currentTime + cycle * cycleDuration + i * noteDuration;
      gain.gain.setValueAtTime(0, base);
      gain.gain.linearRampToValueAtTime(volume, base + 0.08);
      gain.gain.setValueAtTime(volume, base + noteDuration * 0.85);
      gain.gain.linearRampToValueAtTime(0.001, base + noteDuration);
    }
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    return osc;
  });
}

function createImpactEffect(
  audio: AudioContext,
  masterGain: GainNode,
  freq: number,
  type: OscillatorType,
  volume: number,
  duration: number,
  delay = 0,
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audio.currentTime + delay;
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
  return osc;
}

function buildBackgroundMusic(audio: AudioContext, masterGain: GainNode, mode: MusicMode): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  const pad = audio.createOscillator();
  const padGain = audio.createGain();

  if (mode === 'lounge') {
    pad.type = 'sine';
    pad.frequency.value = 100;
    padGain.gain.value = 0.03;
    pad.connect(padGain);
    padGain.connect(masterGain);
    pad.start();
    oscillators.push(pad);

    oscillators.push(...createLoopPattern(audio, masterGain, [196, 220, 247, 220], 'triangle', 0.025, 10));
    oscillators.push(createPulsePattern(audio, masterGain, 1200, 'sine', 0.04, 5.5, 5));
  } else if (mode === 'normal') {
    pad.type = 'triangle';
    pad.frequency.value = 120;
    padGain.gain.value = 0.04;
    pad.connect(padGain);
    padGain.connect(masterGain);
    pad.start();
    oscillators.push(pad);

    oscillators.push(...createLoopPattern(audio, masterGain, [220, 262, 294, 262], 'square', 0.03, 8));
    oscillators.push(createPulsePattern(audio, masterGain, 800, 'triangle', 0.05, 4, 6));
  } else if (mode === 'tension') {
    pad.type = 'sawtooth';
    pad.frequency.value = 90;
    padGain.gain.value = 0.05;
    pad.connect(padGain);
    padGain.connect(masterGain);
    pad.start();
    oscillators.push(pad);

    oscillators.push(...createLoopPattern(audio, masterGain, [110, 123, 147, 165], 'square', 0.035, 6));
    oscillators.push(createPulsePattern(audio, masterGain, 260, 'square', 0.08, 2.5, 8));
  } else {
    pad.type = 'square';
    pad.frequency.value = 70;
    padGain.gain.value = 0.08;
    pad.connect(padGain);
    padGain.connect(masterGain);
    pad.start();
    oscillators.push(pad);

    oscillators.push(...createLoopPattern(audio, masterGain, [98, 110, 123, 147], 'sawtooth', 0.05, 4));
    oscillators.push(createPulsePattern(audio, masterGain, 180, 'square', 0.12, 1.5, 10));
    createImpactEffect(audio, masterGain, 60, 'sawtooth', 0.18, 0.24, 2.4);
  }

  return oscillators;
}

export async function startBackgroundMusic(settings: AudioSettings, mode: MusicMode = 'lounge'): Promise<void> {
  await resumeAudioContext();
  if (!settings.bgmEnabled || settings.bgmVolume <= 0 || settings.masterVolume <= 0) {
    stopBackgroundMusic();
    return;
  }

  const audio = getAudioContext();
  if (audio.state === 'suspended') await audio.resume();

  if (bgmRunning && bgmMode === mode) {
    updateBackgroundMusicVolume(settings);
    return;
  }

  stopBackgroundMusic();

  const masterGain = audio.createGain();
  masterGain.connect(audio.destination);
  const oscillators = buildBackgroundMusic(audio, masterGain, mode);

  bgmNodes = { masterGain, oscillators };
  bgmMode = mode;
  bgmRunning = true;
  updateBackgroundMusicVolume(settings);
}

export function stopBackgroundMusic(): void {
  if (!bgmNodes) {
    bgmRunning = false;
    bgmMode = null;
    return;
  }
  bgmNodes.oscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  });
  bgmNodes = null;
  bgmMode = null;
  bgmRunning = false;
}

export function updateBackgroundMusicVolume(settings: AudioSettings): void {
  if (!bgmNodes) return;
  const vol = settings.bgmEnabled
    ? settings.masterVolume * settings.bgmVolume
    : 0;
  bgmNodes.masterGain.gain.setValueAtTime(
    vol,
    getAudioContext().currentTime,
  );
}

export function isBackgroundMusicRunning(): boolean {
  return bgmRunning;
}
