// ===== 音频设置 Hook =====
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startBackgroundMusic,
  stopBackgroundMusic,
  updateBackgroundMusicVolume,
  type MusicMode,
} from '../audio/backgroundMusic';
import { playSound, resumeAudioContext, soundFromLogText } from '../audio/soundEngine';
import { speakText } from '../audio/voice';
import type { AudioSettings, SoundId } from '../audio/types';
import {
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_SETTINGS,
} from '../audio/types';
import type { GameState } from '../game/types';
import { isHumanTurn } from '../game/gameEngine';

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_AUDIO_SETTINGS };
}

function saveSettings(settings: AudioSettings): void {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
}

export function useAudio() {
  const [settings, setSettings] = useState<AudioSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateSettings = useCallback((patch: Partial<AudioSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const play = useCallback(
    (id: SoundId) => {
      playSound(id, settings);
    },
    [settings],
  );

  const speak = useCallback((text: string) => {
    speakText(settings, text);
  }, [settings]);

  const unlockAudio = useCallback(async () => {
    await resumeAudioContext();
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen((v) => !v);
  }, []);

  useEffect(() => {
    updateBackgroundMusicVolume(settings);
  }, [settings]);

  const startBgm = useCallback(async () => {
    await resumeAudioContext();
    if (settings.bgmEnabled) {
      await startBackgroundMusic(settings);
    }
  }, [settings]);

  const stopBgm = useCallback(() => {
    stopBackgroundMusic();
  }, []);

  useEffect(() => {
    if (!settings.bgmEnabled) {
      stopBackgroundMusic();
      return;
    }
    startBackgroundMusic(settings);
  }, [settings.bgmEnabled, settings.bgmVolume, settings.masterVolume]);

  return {
    settings,
    settingsOpen,
    updateSettings,
    play,
    speak,
    unlockAudio,
    toggleSettings,
    startBgm,
    stopBgm,
  };
}

/** 监听游戏状态变化，自动播放对应音效 */
export function useGameSounds(
  state: GameState,
  settings: AudioSettings,
  play: (id: SoundId) => void,
  speak: (text: string) => void,
) {
  const lastLogIdRef = useRef(0);
  const lastPhaseRef = useRef(state.phase);
  const lastPlayerIndexRef = useRef(state.currentPlayerIndex);
  const lastModeRef = useRef<MusicMode>('lounge');

  function getMusicMode(): MusicMode {
    if (state.phase === 'pk' || state.phase === 'showdown') return 'climax';
    if (state.phase === 'betting') {
      const highStakes = state.currentBet >= state.ante * 3 || state.round >= Math.max(2, state.maxRounds - 2);
      return highStakes ? 'tension' : 'normal';
    }
    return 'lounge';
  }

  useEffect(() => {
    if (state.phase === 'dealing' && lastPhaseRef.current !== 'dealing') {
      play('deal');
    }

    if (
      state.phase === 'betting' &&
      isHumanTurn(state) &&
      lastPlayerIndexRef.current !== state.currentPlayerIndex
    ) {
      play('turn');
    }
    lastPlayerIndexRef.current = state.currentPlayerIndex;

    if (
      (state.phase === 'roundOver' || state.phase === 'showdown') &&
      lastPhaseRef.current !== 'roundOver' &&
      lastPhaseRef.current !== 'showdown'
    ) {
      play(state.winnerId === state.humanPlayerId ? 'win' : 'lose');
    }

    const currentMode = getMusicMode();
    if (currentMode !== lastModeRef.current) {
      void startBackgroundMusic(settings, currentMode);
      lastModeRef.current = currentMode;
    }

    lastPhaseRef.current = state.phase;

    const lastLog = state.log[state.log.length - 1];
    if (lastLog && lastLog.id !== lastLogIdRef.current) {
      lastLogIdRef.current = lastLog.id;
      const soundId = soundFromLogText(lastLog.text);
      if (soundId) play(soundId);
      if (lastLog.type === 'action' || lastLog.type === 'pk') {
        speak(lastLog.text);
      }
    }
  }, [state, settings, play, speak]);
}
