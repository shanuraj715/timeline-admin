// Payment-gateway / email-provider / OAuth secret fields are pre-filled
// with a masked placeholder (e.g. "****7890") when a real value is already
// stored. Clearing that field and hitting Save doesn't leave it
// "unchanged" — the backend's mask-then-merge convention deletes the
// stored value outright (an empty string is treated as "no value", not
// "leave alone"). Warns before that happens instead of silently wiping a
// working credential.
//
// `fields` is a list of { label, hadValue, isEmpty }. Returns true if it's
// safe to proceed (nothing being cleared, or the admin confirmed).
export function confirmSecretClear(fields) {
  const clearing = fields.filter((f) => f.hadValue && f.isEmpty).map((f) => f.label);
  if (clearing.length === 0) return true;
  const list = clearing.join(", ");
  return window.confirm(`This will permanently remove the saved ${list}. Continue?`);
}
