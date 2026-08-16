// Circular gauge for the Business Health Score with brand orange stroke & high-contrast background
export default function HealthGauge({ score = 0, size = 140, label }) {
  const strokeW = 10;
  const r = (size - strokeW * 2) / 2;
  const c = 2 * Math.PI * r;
  const has = typeof score === "number" && !Number.isNaN(score);
  const pct = has ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const bandColor = "#FF6B00";

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="drop-shadow-sm">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className="text-line"
          strokeWidth={strokeW}
          fill="none"
        />
        {/* Active progress circle with brand orange stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={bandColor}
          strokeWidth={strokeW}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span
          className="font-heading font-black leading-none tabnum text-ink"
          style={{ fontSize: size * 0.28 }}
        >
          {has ? score : "—"}
        </span>
        <span className="text-[11px] font-heading font-bold text-muted mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}
