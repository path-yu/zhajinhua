// ===== 加注弹窗（带筹码滑动条）=====
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import type { GameState, Player } from '../game/types';

interface RaiseModalProps {
  open: boolean;
  state: GameState;
  humanPlayer: Player;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function RaiseModal({
  open,
  state,
  humanPlayer,
  onConfirm,
  onClose,
}: RaiseModalProps) {
  const minRaise = state.currentBet + state.ante; // 最小加注额

  // 最大可加注到（看牌者：全部筹码；闷牌者：两倍筹码）
  const maxRaise = humanPlayer.hasSeenCards
    ? humanPlayer.chips + humanPlayer.invested
    : Math.floor((humanPlayer.chips + humanPlayer.invested) * 2);

  const [raiseTo, setRaiseTo] = useState(minRaise);

  useEffect(() => {
    if (open) {
      setRaiseTo(Math.min(minRaise + state.ante * 2, maxRaise));
    }
  }, [open, minRaise, maxRaise, state.ante]);

  if (!open) return null;

  // 预设加注档位
  const presets = [
    { label: '最小', value: minRaise },
    { label: '½池', value: Math.min(Math.floor(state.pot * 0.5), maxRaise) },
    { label: '¾池', value: Math.min(Math.floor(state.pot * 0.75), maxRaise) },
    { label: '满池', value: Math.min(state.pot, maxRaise) },
  ];

  const actualCost = humanPlayer.hasSeenCards
    ? raiseTo - humanPlayer.invested
    : raiseTo / 2 - humanPlayer.invested;

  const clampedRaise = Math.max(minRaise, Math.min(raiseTo, maxRaise));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border-2 border-amber-600/60 bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-amber-400 font-display">加注</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* 当前信息 */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="rounded-lg bg-black/40 p-2">
            <div className="text-gray-400 text-xs">当前单注</div>
            <div className="text-amber-400 font-bold">{state.currentBet}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-2">
            <div className="text-gray-400 text-xs">你的筹码</div>
            <div className="text-green-400 font-bold">{humanPlayer.chips}</div>
          </div>
        </div>

        {/* 滑动条 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>最小 {minRaise}</span>
            <span>最大 {maxRaise}</span>
          </div>
          <input
            type="range"
            className="gold-slider w-full"
            min={minRaise}
            max={maxRaise}
            step={state.ante}
            value={clampedRaise}
            onChange={(e) => setRaiseTo(Number(e.target.value))}
          />
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold text-amber-400 text-glow-gold">
              加注到 {clampedRaise}
            </span>
            <div className="text-xs text-gray-400 mt-1">
              需支付 <span className="text-red-400 font-bold">{Math.max(0, actualCost)}</span> 筹码
            </div>
          </div>
        </div>

        {/* 预设档位 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setRaiseTo(p.value)}
              className={cn(
                'btn-3d rounded-lg py-1.5 text-xs font-semibold border',
                clampedRaise === p.value
                  ? 'bg-amber-500 text-gray-900 border-amber-300'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 确认按钮 */}
        <button
          onClick={() => onConfirm(clampedRaise)}
          className="btn-3d w-full rounded-xl py-3 bg-gradient-to-b from-amber-400 to-amber-600 text-gray-900 font-bold text-lg border-2 border-amber-700 btn-glow-gold"
        >
          确认加注 {clampedRaise}
        </button>
      </div>
    </div>
  );
}
