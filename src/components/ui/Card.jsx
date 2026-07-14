export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-[var(--shadow)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-border px-5 py-4 ${className}`}>
      <div>
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
