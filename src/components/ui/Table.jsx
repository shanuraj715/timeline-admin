export function Table({ children, className = "" }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">{children}</thead>;
}

export function Th({ children, className = "" }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, className = "" }) {
  return <tr className={`hover:bg-surface-hover ${className}`}>{children}</tr>;
}

export function Td({ children, className = "" }) {
  return <td className={`px-5 py-3 align-middle text-text ${className}`}>{children}</td>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-muted">{description}</p>}
    </div>
  );
}
