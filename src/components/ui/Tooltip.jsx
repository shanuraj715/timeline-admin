import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 6;
const VIEWPORT_MARGIN = 8;

function computePosition(triggerRect, side, tooltipRect) {
  switch (side) {
    case "bottom":
      return {
        top: triggerRect.bottom + GAP,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      };
    case "left":
      return {
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.left - tooltipRect.width - GAP,
      };
    case "right":
      return {
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.right + GAP,
      };
    case "top":
    default:
      return {
        top: triggerRect.top - tooltipRect.height - GAP,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      };
  }
}

// Portal-rendered and positioned from the trigger's real bounding rect,
// not a CSS-only absolutely-positioned child — a plain absolute tooltip
// got clipped whenever its trigger sat inside a scrollable container (e.g.
// ThemeModal's body, which sets only overflow-y, but per the CSS spec that
// silently forces overflow-x to clip too), cutting off wrapped help text
// near the panel's edges. Rendering into document.body escapes that
// clipping entirely; the position is then clamped back inside the
// viewport so it never runs off-screen either. Shows on hover and on
// keyboard focus so icon-only buttons stay identifiable without a mouse.
export function Tooltip({ label, side = "top", wrap = false, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
    let { top, left } = computePosition(triggerRect, side, tooltipRect);
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN);
    top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - tooltipRect.height - VIEWPORT_MARGIN);
    setPos({ top, left });
  }, [open, side, wrap, label]);

  function show() {
    setOpen(true);
  }
  function hide() {
    setOpen(false);
    setPos(null);
  }

  return (
    <span ref={triggerRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {open &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            className={`pointer-events-none fixed z-[70] rounded-md bg-text px-2 py-1 text-xs font-medium text-bg shadow-md transition-opacity duration-100 ${
              pos ? "opacity-100" : "opacity-0"
            } ${wrap ? "w-56 whitespace-normal text-left font-normal leading-snug" : "whitespace-nowrap"}`}
            style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}
