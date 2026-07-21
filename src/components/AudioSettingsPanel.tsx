import type { AudioSettings } from '../audio/types';

interface AudioSettingsPanelProps {
  open: boolean;
  settings: AudioSettings;
  onClose: () => void;
  updateSettings: (patch: Partial<AudioSettings>) => void;
}

export function AudioSettingsPanel({
  open,
  settings,
  onClose,
  updateSettings,
}: AudioSettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-amber-300/35 bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-2xl font-bold text-amber-300 font-display">音频设置</h3>
            <p className="text-slate-300 text-sm mt-1">调整背景音乐与音效音量。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-200 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2 text-sm text-slate-200">
              <span>主音量</span>
              <span className="font-semibold text-amber-300">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.masterVolume}
              onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) })}
              className="gold-slider w-full"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2 text-sm text-slate-200">
              <span>音效音量</span>
              <span className="font-semibold text-emerald-300">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.sfxVolume}
              onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
              className="gold-slider w-full"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2 text-sm text-slate-200">
              <span>语音播报</span>
              <button
                type="button"
                onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  settings.voiceEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {settings.voiceEnabled ? '已开启' : '已关闭'}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.voiceVolume}
              onChange={(e) => updateSettings({ voiceVolume: Number(e.target.value) })}
              className="gold-slider w-full"
              disabled={!settings.voiceEnabled}
            />
            <div className="mt-2 text-xs text-slate-400">
              语音音量：{Math.round(settings.voiceVolume * 100)}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2 text-sm text-slate-200">
              <span>背景音乐</span>
              <button
                type="button"
                onClick={() => updateSettings({ bgmEnabled: !settings.bgmEnabled })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  settings.bgmEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {settings.bgmEnabled ? '已开启' : '已关闭'}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.bgmVolume}
              onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) })}
              className="gold-slider w-full"
              disabled={!settings.bgmEnabled}
            />
            <div className="mt-2 text-xs text-slate-400">
              背景音乐音量：{Math.round(settings.bgmVolume * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="btn-3d rounded-xl bg-amber-400/15 text-amber-100 border border-amber-300/40 px-4 py-2 hover:bg-amber-400/20"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
