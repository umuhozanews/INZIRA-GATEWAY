import { useEffect } from "react";
import { X } from "lucide-react";

export default function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative mx-auto w-full max-w-[500px] rounded-t-[28px] bg-card border-t border-x border-line shadow-2xl kinetic-fade-in font-body">
        {/* Top Handle bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-line">
          <span className="font-heading text-base font-extrabold text-ink tracking-tight">{title}</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover border border-line text-muted hover:text-ink hover:border-primary/40 transition active:scale-90 cursor-pointer"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div
            className="border-t border-line bg-card-hover/40 px-5 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
