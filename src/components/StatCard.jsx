import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, tone, onClick }) {
  const color = tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-ink";
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`flex-1 rounded-2xl border border-line bg-card p-3.5 shadow-card text-left transition duration-200 ${
        onClick
          ? "hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-95 group"
          : ""
      }`}
    >
      <span className="font-body text-[10.5px] md:text-xs font-semibold text-muted group-hover:text-primary transition">
        {label}
      </span>
      <div className="mt-1 font-heading text-base md:text-lg font-extrabold tabnum text-ink">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 flex items-center gap-0.5">
          {tone === "up" ? (
            <TrendingUp size={11} className="text-success" />
          ) : tone === "down" ? (
            <TrendingDown size={11} className="text-danger" />
          ) : null}
          <span className={`text-[10px] md:text-[11px] font-semibold ${color}`}>{sub}</span>
        </div>
      )}
    </Tag>
  );
}
