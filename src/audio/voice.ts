import type { AudioSettings } from './types';

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function chooseChineseVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const zhVoices = voices.filter(
    (voice) => voice.lang.toLowerCase().startsWith('zh') || /chinese|普通话|汉语/i.test(voice.name),
  );
  if (zhVoices.length > 0) {
    const preferred = zhVoices.find((voice) => /google|microsoft|huawei|xiaoyan|xiaomei|meihong/i.test(voice.name));
    return preferred ?? zhVoices[0];
  }

  return voices[0];
}

function addNaturalPauses(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  let normalized = trimmed.replace(/\s+/g, ' ');
  normalized = normalized.replace(/(加注|弃牌|比牌|跟注|ALL-IN|all-in|看牌)/gi, '$1，');
  normalized = normalized.replace(/，+/g, '，').replace(/，\s*/g, '，');
  normalized = normalized.replace(/([。！？!?,，]+)$/u, '').trim();
  return `${normalized}。`;
}

export function speakText(settings: AudioSettings, text: string): void {
  if (
    !isSpeechSupported() ||
    !settings.voiceEnabled ||
    settings.masterVolume <= 0 ||
    settings.voiceVolume <= 0 ||
    !text.trim()
  ) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(addNaturalPauses(text));
  utterance.lang = 'zh-CN';
  utterance.volume = Math.min(1, settings.masterVolume * settings.voiceVolume * 1.05);

  const length = text.length;
  if (length <= 10) {
    utterance.rate = 1.0 + Math.random() * 0.05;
  } else if (length <= 18) {
    utterance.rate = 0.92 + Math.random() * 0.08;
  } else {
    utterance.rate = 0.88 + Math.random() * 0.08;
  }

  utterance.pitch = 0.98 + Math.random() * 0.14;
  const selectedVoice = chooseChineseVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
