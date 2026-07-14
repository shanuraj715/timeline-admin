export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(paise, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(paise / 100);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
