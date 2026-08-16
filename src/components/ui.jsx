// Shared UI components styled for Kinetic Precision
// Vibrant Orange (#FF6B00) primary, Charcoal surfaces, Hanken Grotesk typography, micro-interactions

export function Button({ children, variant = "primary", full, className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-heading font-extrabold text-xs sm:text-sm py-3 px-5 transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 cursor-pointer select-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-orange-sm hover:shadow-orange-glow",
    orange: "bg-primary text-white hover:bg-primary-hover shadow-orange-sm",
    dark: "bg-charcoal-800 text-white hover:bg-charcoal-700 border border-charcoal-700",
    secondary: "bg-card border border-line text-ink hover:bg-card-hover hover:border-primary/40",
    ghost: "bg-card-hover text-ink border border-line hover:border-primary/40",
    danger: "bg-card border border-line text-ink hover:bg-card-hover hover:border-line hover:text-white",
    paper: "bg-card-hover text-ink border border-line hover:border-primary/40",
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${full ? "w-full" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="mt-3 block font-body">
      {label && <span className="font-heading font-bold text-[11px] text-muted uppercase tracking-wider">{label}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-card px-3.5 py-2.5 font-body text-xs font-semibold text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 ${className}`}
      {...props}
    />
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-xl bg-card-hover p-1 border border-line font-heading">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all duration-150 cursor-pointer ${
            value === o.value
              ? "bg-primary text-white shadow-sm font-extrabold"
              : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
