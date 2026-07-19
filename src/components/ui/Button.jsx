const VARIANTS = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-surface border border-border text-text hover:bg-surface-hover",
  ghost: "text-text hover:bg-surface-hover",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  icon: "h-9 w-9",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Same look as Button but renders an <a> — for plain-anchor CSV/file
// downloads (e.g. ?format=csv links) that must be real navigations rather
// than fetch+blob, so the browser's own download handling kicks in.
export function LinkButton({ variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
