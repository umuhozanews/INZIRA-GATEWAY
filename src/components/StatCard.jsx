import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, tone, onClick, icon: Icon }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`flex-1 rounded-2xl border border-line bg-card p-3 sm:p-4 shadow-card text-left font-body transition-all duration-150 ${
        onClick
          ? "hover:border-primary/50 hover:bg-card-hover cursor-pointer active:scale-[0.98] group"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-heading text-[10px] sm:text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-primary transition truncate">
          {label}
        </span>
        {Icon && (
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-card-hover border border-line text-muted group-hover:text-primary group-hover:border-primary/30 transition shrink-0">
            <Icon size={13} />
          </div>
        )}
      </div>

      {/* High-contrast, authoritative amount */}
      <div className="mt-1.5 font-heading text-sm sm:text-lg md:text-xl font-black tabnum text-ink tracking-tight truncate">
        {value}
      </div>

      {sub && (
        <div className="mt-1 flex items-center gap-1">
          {tone === "up" ? (
            <TrendingUp size={11} className="text-primary shrink-0" />
          ) : tone === "down" ? (
            <TrendingDown size={11} className="text-muted shrink-0" />
          ) : null}
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted truncate">{sub}</span>
        </div>
      )}
    </Tag>
  );
}
