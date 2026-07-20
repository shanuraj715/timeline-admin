import { useRef, useState } from "react";
import { X } from "lucide-react";
import { uploadCmsMedia } from "../api/cms";
import { FieldHelp } from "./ui/Input";
import { IconButton } from "./ui/IconButton";
import { useToast } from "../context/ToastContext";

// One upload slot (used twice by ThemedImageField below, once per variant).
// Not exported — Light/Dark always come as a pair via ThemedImageField, no
// other call site needs a bare single-image uploader (Homepage.jsx's old
// local ImageField, which this replaces, was already scoped that way).
function ImageSlot({ label, help, value, onChange, onRemove, disabled, disabledHint }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const toast = useToast();

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCmsMedia(file);
      onChange(result.url);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        {label}
        <FieldHelp text={help} />
      </span>
      <div className="flex items-center gap-3">
        {value && (
          <>
            <img src={value} alt="" className="h-14 w-20 rounded-md border border-border object-cover" />
            <IconButton label={`Remove ${label.toLowerCase()}`} icon={X} variant="danger" onClick={onRemove} />
          </>
        )}
        {!disabled && (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm text-text-muted"
          />
        )}
        {disabled && <span className="text-xs text-text-muted">{disabledHint}</span>}
      </div>
    </div>
  );
}

// A Light/Dark image pair — Dark can't be uploaded until Light exists (the
// input is replaced with a hint instead), and clearing Light clears Dark
// too, keeping "Dark only ever exists alongside Light" true on the client
// side the same way the backend enforces it (zod .refine() for
// JSON-embedded fields like Homepage/Branding, a route-level check for
// Theme's own dedicated upload endpoints).
export function ThemedImageField({ label, help, lightValue, onLightChange, darkValue, onDarkChange }) {
  function handleRemoveLight() {
    onLightChange("");
    if (darkValue) onDarkChange("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      {label && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-text">
          {label}
          <FieldHelp text={help} />
        </span>
      )}
      <ImageSlot label="Light theme image" value={lightValue} onChange={onLightChange} onRemove={handleRemoveLight} />
      <ImageSlot
        label="Dark theme image"
        help="Optional — shown instead of the light image when the site is in dark mode. Falls back to the light image if left empty."
        value={darkValue}
        onChange={onDarkChange}
        onRemove={() => onDarkChange("")}
        disabled={!lightValue}
        disabledHint="Upload a light theme image first"
      />
    </div>
  );
}
