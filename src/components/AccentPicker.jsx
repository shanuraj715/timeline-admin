import { useTheme, ACCENTS } from "../context/ThemeContext";

// Swatch colors shown to the picker match this app's own light-mode
// --primary value per accent (see index.css) — not a separate color list,
// so the dot always reflects what clicking it will actually look like.
const SWATCH_COLOR = {
  blue: "#0a84ff",
  red: "#dc2626",
  green: "#16a34a",
  purple: "#7c3aed",
  orange: "#ea580c",
  pink: "#db2777",
};

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  lg: "h-8 w-8",
};

export function AccentPicker({ size = "sm" }) {
  const { accent, setAccent } = useTheme();
  const dimension = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Accent color">
      {ACCENTS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setAccent(key)}
          aria-label={`${key} accent`}
          aria-pressed={accent === key}
          title={`${key.charAt(0).toUpperCase()}${key.slice(1)} accent`}
          className={`${dimension} shrink-0 rounded-full transition-transform ${
            accent === key ? "scale-110 ring-2 ring-offset-2 ring-offset-surface" : "hover:scale-110"
          }`}
          style={{
            backgroundColor: SWATCH_COLOR[key],
            ...(accent === key ? { "--tw-ring-color": SWATCH_COLOR[key] } : {}),
          }}
        />
      ))}
    </div>
  );
}
