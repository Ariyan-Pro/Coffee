/** Formatting helpers. Prices are display-only here; the backend remains authoritative. */

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "2,450" (PKR amount without symbol) */
export function formatPKR(amount: number): string {
  return pkr.format(Math.round(amount));
}

/** "Rs. 2,450" */
export function formatPrice(amount: number): string {
  const localised = pkr.format(Math.round(amount)).replace(/^(PKR|Rs\.?)\s*/i, "");
  return `Rs. ${localised}`;
}

/** Human date, e.g. "Mon, 24 Aug 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** "Weekly" from WEEKLY */
export function humanizeFrequency(freq: string): string {
  const map: Record<string, string> = {
    WEEKLY: "Weekly",
    BIWEEKLY: "Every 2 weeks",
    MONTHLY: "Monthly",
  };
  return map[freq] ?? freq.toLowerCase();
}

/** Number → "01" two-digit stage label */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
