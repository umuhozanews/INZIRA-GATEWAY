import Logomark from "./Logomark";

export default function Loading({ label = "Loading INZIRA..." }) {
  return (
    <div className="flex h-full min-h-[75vh] w-full flex-col items-center justify-center gap-6 p-6 text-center select-none font-body">
      {/* Animated Glowing Round Logo & Spinning Orbit Ring */}
      <div className="relative flex items-center justify-center p-4">
        {/* Soft Background Pulse Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />

        {/* Orbit Spinning Ring */}
        <div className="absolute h-28 w-28 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin duration-1000" />

        {/* Centered Round Logo Badge */}
        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-card border-2 border-line shadow-2xl p-1 overflow-hidden transition-transform duration-300 hover:scale-105">
          <Logomark size={88} className="rounded-full shadow-none border-none" />
        </div>
      </div>

      {/* Brand & App Title */}
      <div className="flex flex-col items-center gap-1 font-heading">
        <h2 className="text-2xl font-black tracking-tight text-ink">
          INZIRA SYSTEM
        </h2>
        <p className="text-[11px] font-black tracking-widest text-primary uppercase">
          DataBridge Mobile Suite
        </p>
      </div>

      {/* Shimmer Loading Progress Bar */}
      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-card border border-line relative">
        <div className="h-full w-full rounded-full bg-primary animate-shimmer" />
      </div>

      {label && (
        <span className="text-xs font-semibold text-muted animate-pulse font-body">
          {label}
        </span>
      )}
    </div>
  );
}
