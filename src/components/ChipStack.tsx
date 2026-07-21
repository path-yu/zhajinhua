// ===== 筹码堆叠组件 =====
import { cn } from '../utils/cn';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

// 筹码面额与颜色
const CHIP_DENOMS = [
  { value: 1000, color: '#7c3aed', label: '1K' },
  { value: 500, color: '#1f2937', label: '500' },
  { value: 100, color: '#1e3a8a', label: '100' },
  { value: 50, color: '#166534', label: '50' },
  { value: 25, color: '#b91c1c', label: '25' },
  { value: 10, color: '#ca8a04', label: '10' },
  { value: 5, color: '#dc2626', label: '5' },
  { value: 1, color: '#f3f4f6', label: '1' },
];

function computeChips(amount: number) {
  const chips: { color: string; label: string }[] = [];
  let remaining = amount;
  for (const denom of CHIP_DENOMS) {
    while (remaining >= denom.value) {
      chips.push({ color: denom.color, label: denom.label });
      remaining -= denom.value;
      if (chips.length >= 8) break; // 最多显示 8 个
    }
    if (chips.length >= 8) break;
  }
  return chips;
}

export function ChipStack({ amount, size = 'md', animated = false }: ChipStackProps) {
  const chips = computeChips(amount);
  const chipSize =
    size === 'sm'
      ? 'w-5 h-5 text-[7px]'
      : size === 'xl'
        ? 'w-12 h-12 text-xs'
        : size === 'lg'
          ? 'w-9 h-9 text-[10px]'
          : 'w-7 h-7 text-[8px]';
  const stackHeight = size === 'sm' ? 22 : size === 'xl' ? 72 : size === 'lg' ? 48 : 34;
  const layerGap = size === 'sm' ? 4 : size === 'xl' ? 9 : size === 'lg' ? 7 : 6;
  const visibleCount = size === 'xl' ? 7 : 5;

  if (amount <= 0) return null;

  return (
    <div className="relative flex items-end justify-center" style={{ minHeight: stackHeight }}>
      {chips.slice(0, visibleCount).map((chip, i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-full border-2 flex items-center justify-center font-bold text-white shadow-md',
            chipSize,
            animated && 'chip-drop',
          )}
          style={{
            bottom: `${i * layerGap}px`,
            backgroundColor: chip.color,
            borderColor: 'rgba(255,255,255,0.4)',
            boxShadow: `0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)`,
            animationDelay: `${i * 0.05}s`,
            zIndex: i,
          }}
        >
          <span className="drop-shadow">{chip.label}</span>
        </div>
      ))}
    </div>
  );
}
