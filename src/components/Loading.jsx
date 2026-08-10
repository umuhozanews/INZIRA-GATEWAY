import Logomark from "./Logomark";

export default function Loading({ label }) {
  return (
    <div className="flex h-full min-h-[75vh] w-full flex-col items-center justify-center gap-5 p-6 text-center select-none db-rise">
      {/* Animated Glowing User Logo */}
      <div className="relative flex items-center justify-center p-3">
        <div className="absolute inset-0 rounded-3xl bg-primary/25 blur-2xl animate-pulse" />
        <div className="relative z-10 animate-logo-glow flex items-center justify-center p-2 rounded-2xl bg-card/80 backdrop-blur border border-line/60 shadow-xl">
          <Logomark size={72} />
        </div>
      </div>

      {/* Brand Title */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
          INZIRA SYSTEM
        </h2>
        <p className="font-body text-xs font-semibold text-muted tracking-wider uppercase">
          DataBridge Mobile Suite
        </p>
      </div>

      {/* Shimmer Loading Progress Bar */}
      <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-line/80 relative">
        <div className="h-full w-full rounded-full bg-primary animate-shimmer" />
      </div>

      {label && <span className="text-xs font-semibold text-muted">{label}</span>}
    </div>
  );
}
