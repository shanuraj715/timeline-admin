import { ChevronDown, HelpCircle } from "lucide-react";
import { Tooltip } from "./Tooltip";

// Small "?" affordance for a field's label — hover/focus for an
// explanation, without permanently taking up space the way inline help
// text under every field would.
export function FieldHelp({ text }) {
  if (!text) return null;
  return (
    <Tooltip label={text} wrap>
      <HelpCircle size={13} className="text-text-muted" aria-label="Field help" tabIndex={0} />
    </Tooltip>
  );
}

function FieldLabel({ htmlFor, label, help }) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-text">
      {label}
      <FieldHelp text={help} />
    </label>
  );
}

export function Input({ label, help, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={inputId} label={label} help={help} />
      <input
        id={inputId}
        className={`h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Textarea({ label, help, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={inputId} label={label} help={help} />
      <textarea
        id={inputId}
        className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Select({ label, help, error, className = "", id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={inputId} label={label} help={help} />
      {/* Native <select> arrows render inconsistently (position/size vary
          by browser) and aren't reliably stylable — appearance-none drops
          it entirely in favor of one icon we control and can actually
          center. */}
      <div className="relative">
        <select
          id={inputId}
          className={`h-9 w-full appearance-none rounded-lg border border-border bg-surface py-0 pl-3 pr-9 text-sm text-text focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Checkbox({ label, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className={`flex items-center gap-2 text-sm text-text cursor-pointer ${className}`}>
      <input id={inputId} type="checkbox" className="h-4 w-4 accent-primary" {...props} />
      {label}
    </label>
  );
}
