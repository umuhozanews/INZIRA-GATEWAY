import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, tone, onClick, icon: Icon }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`flex-1 rounded-2xl border border-line bg-card p-4 shadow-card text-left font-body transition-all duration-150 ${
        onClick
          ? "hover:border-primary/50 hover:bg-card-hover cursor-pointer active:scale-[0.98] group"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-primary transition">
          {label}
        </span>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-hover border border-line text-muted group-hover:text-primary group-hover:border-primary/30 transition">
            <Icon size={14} />
          </div>
        )}
      </div>

      {/* High-contrast, authoritative amount without color-coding */}
      <div className="mt-1.5 font-heading text-lg sm:text-xl font-black tabnum text-ink tracking-tight">
        {value}
      </div>

      {sub && (
        <div className="mt-1 flex items-center gap-1.5">
          {tone === "up" ? (
            <TrendingUp size={12} className="text-emerald-500 shrink-0" />
          ) : tone === "down" ? (
            <TrendingDown size={12} className="text-rose-500 shrink-0" />
          ) : null}
          <span className="text-[11px] font-semibold text-muted">{sub}</span>
        </div>
      )}
    </Tag>
  );
}
