export type SoundId =
  | 'see'
  | 'fold'
  | 'call'
  | 'raise'
  | 'pk'
  | 'deal'
  | 'win'
  | 'lose'
  | 'turn'
  | 'roundStart'
  | 'click';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  bgmEnabled: boolean;
  bgmVolume: number;
  voiceEnabled: boolean;
  voiceVolume: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.7,
  bgmEnabled: true,
  bgmVolume: 0.35,
  voiceEnabled: true,
  voiceVolume: 0.75,
};

export const AUDIO_SETTINGS_KEY = 'zhajinhua-audio-settings';
