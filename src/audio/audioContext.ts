// ===== 共享 AudioContext =====
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function resumeAudioContext(): Promise<void> {
  const audio = getAudioContext();
  if (audio.state === 'suspended') await audio.resume();
}
