interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}

export default function ProgressBar({ label, value, max, colorClass }: ProgressBarProps) {
  const safeMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[12px] font-black text-white/90">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 backdrop-blur-sm">
        <div className={`h-full rounded-full shadow-glow transition-all duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
