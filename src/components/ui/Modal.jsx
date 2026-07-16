import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({ open, onClose, title, headerExtra, children, footer, width = "480px" }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-xl border border-border bg-surface/95 shadow-[var(--shadow)] backdrop-blur-xl"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="shrink-0 text-sm font-semibold text-text">{title}</h2>
          <div className="flex items-center gap-3">
            {headerExtra}
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
