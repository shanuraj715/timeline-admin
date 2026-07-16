export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// `undefined` locale lets Intl use the runtime's own locale while still
// rendering the correct symbol/decimal-places for whatever `currency` code
// is given — that's the actual fix needed, not per-currency locale data.
export function formatCurrency(paise, currency = "INR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(paise / 100);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}
