// ===== Web Audio 音效引擎（无需外部音频文件） =====
import type { AudioSettings, SoundId } from './types';
import { getAudioContext, resumeAudioContext } from './audioContext';

export { resumeAudioContext };

function masterGain(settings: AudioSettings): number {
  return settings.masterVolume * settings.sfxVolume;
}

function playTone(
  settings: AudioSettings,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
  startOffset = 0,
) {
  const audio = getAudioContext();
  const t = audio.currentTime + startOffset;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume * masterGain(settings), t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function playNoise(
  settings: AudioSettings,
  duration: number,
  volume = 0.08,
  startOffset = 0,
) {
  const audio = getAudioContext();
  const t = audio.currentTime + startOffset;
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  gain.gain.setValueAtTime(volume * masterGain(settings), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start(t);
}

const SOUND_PLAYERS: Record<
  SoundId,
  (settings: AudioSettings) => void
> = {
  see(settings) {
    playTone(settings, 880, 0.06, 'sine', 0.2);
    playTone(settings, 1320, 0.08, 'sine', 0.15, 0.04);
    playNoise(settings, 0.05, 0.06, 0.02);
  },

  fold(settings) {
    playTone(settings, 440, 0.12, 'triangle', 0.18);
    playTone(settings, 330, 0.18, 'triangle', 0.14, 0.06);
  },

  call(settings) {
    playTone(settings, 1800, 0.04, 'square', 0.08);
    playTone(settings, 2400, 0.05, 'sine', 0.12, 0.02);
    playNoise(settings, 0.03, 0.05, 0.01);
  },

  raise(settings) {
    [0, 0.05, 0.1].forEach((offset, i) => {
      playTone(settings, 1600 + i * 200, 0.05, 'square', 0.1, offset);
      playNoise(settings, 0.025, 0.04, offset);
    });
  },

  pk(settings) {
    playNoise(settings, 0.15, 0.15);
    playTone(settings, 220, 0.2, 'sawtooth', 0.12);
    playTone(settings, 110, 0.25, 'square', 0.1, 0.05);
  },

  deal(settings) {
    [0, 0.08, 0.16].forEach((offset) => {
      playNoise(settings, 0.06, 0.06, offset);
      playTone(settings, 600 + offset * 200, 0.05, 'triangle', 0.1, offset);
    });
  },

  win(settings) {
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone(settings, freq, 0.25, 'sine', 0.2, i * 0.12);
    });
  },

  lose(settings) {
    playTone(settings, 392, 0.2, 'triangle', 0.15);
    playTone(settings, 330, 0.3, 'triangle', 0.12, 0.15);
    playTone(settings, 262, 0.4, 'triangle', 0.1, 0.3);
  },

  turn(settings) {
    playTone(settings, 880, 0.1, 'sine', 0.12);
    playTone(settings, 1108, 0.15, 'sine', 0.1, 0.08);
  },

  roundStart(settings) {
    playTone(settings, 440, 0.15, 'sine', 0.12);
    playTone(settings, 554, 0.2, 'sine', 0.1, 0.1);
  },

  click(settings) {
    playTone(settings, 1200, 0.03, 'sine', 0.08);
  },
};

export function playSound(id: SoundId, settings: AudioSettings): void {
  if (settings.masterVolume <= 0 || settings.sfxVolume <= 0) return;
  try {
    SOUND_PLAYERS[id](settings);
  } catch {
    // 浏览器可能尚未解锁 AudioContext
  }
}

/** 从游戏日志文本推断音效 */
export function soundFromLogText(text: string): SoundId | null {
  if (text.includes('看牌')) return 'see';
  if (text.includes('弃牌')) return 'fold';
  if (text.includes('跟注') || text.includes('ALL-IN')) return 'call';
  if (text.includes('加注')) return 'raise';
  if (text.includes('比牌') || text.includes('⚔️')) return 'pk';
  if (text.includes('—— 第') && text.includes('轮 ——')) return 'roundStart';
  return null;
}
