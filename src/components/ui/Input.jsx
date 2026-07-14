export function Input({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Select({ label, error, className = "", id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-2 focus:outline-primary ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
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
