import { Card } from "./ui/Card";

// Stat tile contract per the dataviz skill: label (sentence case, no
// trailing colon), value (semibold, auto-compact), optional delta.
export function StatTile({ label, value, sublabel }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-text-muted">{sublabel}</p>}
    </Card>
  );
}
