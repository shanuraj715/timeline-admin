import { useState } from "react";
import { Select, Input } from "./ui/Input";
import { Button } from "./ui/Button";

const PRESETS = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  monthly: { label: "Monthly (last 12 months)", monthsBack: 12, groupBy: "month" },
  yearly: { label: "Yearly (last 5 years)", monthsBack: 60, groupBy: "month" },
  custom: { label: "Custom range…" },
};

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function presetToRange(key) {
  const preset = PRESETS[key];
  if (preset.days) return { days: preset.days };
  if (preset.monthsBack) {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - preset.monthsBack);
    return { from: isoDate(from), to: isoDate(to), groupBy: preset.groupBy };
  }
  return null;
}

/** Emits onChange({ days } | { from, to, groupBy }) — see api/analytics.js's rangeQuery(). */
export function DateRangeSelect({ onChange }) {
  const [preset, setPreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  function handlePresetChange(key) {
    setPreset(key);
    if (key === "custom") return; // wait for both dates before firing onChange
    onChange(presetToRange(key));
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    onChange({ from: customFrom, to: customTo, groupBy: "day" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onChange={(e) => handlePresetChange(e.target.value)} className="w-56">
        {Object.entries(PRESETS).map(([key, p]) => (
          <option key={key} value={key}>
            {p.label}
          </option>
        ))}
      </Select>
      {preset === "custom" && (
        <>
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
          <span className="text-text-muted">to</span>
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
          <Button size="sm" onClick={applyCustom} disabled={!customFrom || !customTo}>
            Apply
          </Button>
        </>
      )}
    </div>
  );
}
