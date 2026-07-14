export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      className={disabled ? "opacity-50" : "cursor-pointer"}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          display: "inline-block",
          flexShrink: 0,
          height: 20,
          width: 36,
          borderRadius: 9999,
          border: "none",
          padding: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          background: checked ? "var(--primary)" : "var(--border)",
          transition: "background-color 150ms ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            height: 16,
            width: 16,
            borderRadius: 9999,
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            transform: checked ? "translateX(16px)" : "translateX(0)",
            transition: "transform 150ms ease",
          }}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}
