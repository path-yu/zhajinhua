// ===== 游戏开始/配置界面 =====
import { useState } from 'react';
import type { GameConfig } from '../game/types';
import { HAND_TYPE_ORDER } from '../game/handEvaluator';

interface StartScreenProps {
  onStart: (config: GameConfig) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);
  const [startingChips, setStartingChips] = useState(1000);
  const [ante, setAnte] = useState(10);
  const [humanName, setHumanName] = useState('你');

  const handleStart = () => {
    onStart({ playerCount, startingChips, ante, maxRounds: 15, humanName });
  };

  return (
    <div className="min-h-screen felt-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg fade-in-up text-slate-50">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🃏</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 font-display text-glow-gold tracking-wider">
            炸金花
          </h1>
          <p className="text-amber-200/70 text-sm mt-2 tracking-[0.3em]">
            ZHA JIN HUA · 拼三张
          </p>
        </div>

        {/* 配置卡片 */}
        <div className="rounded-2xl border-2 border-amber-300/35 bg-slate-950/72 backdrop-blur p-6 shadow-2xl shadow-black/45">
          <h2 className="text-amber-200 font-bold text-xl mb-4 font-display text-glow-gold">游戏设置</h2>

          {/* 玩家数量 */}
          <div className="mb-4">
            <label className="text-slate-100 text-sm font-semibold mb-2 block">玩家数量</label>
            <div className="grid grid-cols-2 gap-2">
              {[4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`btn-3d rounded-lg py-2 font-bold border-2 ${
                    playerCount === n
                      ? 'bg-amber-300 text-amber-950 border-amber-100 shadow-lg shadow-amber-500/20'
                      : 'bg-white/10 text-slate-100 border-white/25'
                  }`}
                >
                  {n} 人 ({n - 1} AI)
                </button>
              ))}
            </div>
          </div>

          {/* 起始筹码 */}
          <div className="mb-4">
            <label className="text-slate-100 text-sm font-semibold mb-2 block">
              起始筹码: <span className="text-amber-400 font-bold">{startingChips}</span>
            </label>
            <input
              type="range"
              className="gold-slider w-full"
              min={500}
              max={5000}
              step={500}
              value={startingChips}
              onChange={(e) => setStartingChips(Number(e.target.value))}
            />
          </div>

          {/* 底注 */}
          <div className="mb-4">
            <label className="text-slate-100 text-sm font-semibold mb-2 block">
              底注: <span className="text-amber-400 font-bold">{ante}</span>
            </label>
            <input
              type="range"
              className="gold-slider w-full"
              min={5}
              max={50}
              step={5}
              value={ante}
              onChange={(e) => setAnte(Number(e.target.value))}
            />
          </div>

          {/* 昵称 */}
          <div className="mb-6">
            <label className="text-slate-100 text-sm font-semibold mb-2 block">你的昵称</label>
            <input
              type="text"
              value={humanName}
              onChange={(e) => setHumanName(e.target.value)}
              maxLength={8}
              className="w-full rounded-lg bg-white/10 border border-white/35 px-3 py-2 text-white placeholder:text-slate-300 focus:border-amber-300 focus:outline-none"
              placeholder="输入昵称"
            />
          </div>

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            className="btn-3d w-full rounded-xl py-4 bg-gradient-to-b from-amber-400 to-amber-600 text-gray-900 font-black text-xl border-2 border-amber-700 btn-glow-gold font-display tracking-wider"
          >
            🎴 开 始 游 戏
          </button>
        </div>

        {/* 牌型说明 */}
        <div className="mt-4 rounded-xl border border-amber-300/25 bg-slate-950/55 p-4 text-slate-100">
          <h3 className="text-amber-200 text-sm font-bold mb-2 font-display">牌型大小（从大到小）</h3>
          <div className="flex flex-wrap gap-1.5">
            {HAND_TYPE_ORDER.map((t, i) => (
              <span
                key={t}
                className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-slate-100 border border-white/20"
              >
                {i + 1}. {t}
              </span>
            ))}
          </div>
          <div className="mt-3 text-slate-200/75 text-[11px] leading-relaxed">
            闷牌下注为看牌者一半 · 比牌同牌型发起方输 · 最高 15 轮强制摊牌
          </div>
        </div>
      </div>
    </div>
  );
}
