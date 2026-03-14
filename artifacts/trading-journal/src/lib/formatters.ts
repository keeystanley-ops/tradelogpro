import { format, parseISO } from "date-fns";

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "$0.00";
  const isNegative = amount < 0;
  const absValue = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "0.00%";
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy h:mm a");
  } catch (e) {
    return dateStr;
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "-";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
