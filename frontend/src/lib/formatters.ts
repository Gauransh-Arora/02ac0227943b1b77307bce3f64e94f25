export function formatMW(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatErrorMW(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMW(value, decimals)} MW`;
}

export function formatDateTimeUTC(isoString: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    const day = d.getUTCDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getUTCMonth()];
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month} ${hours}:${mins} UTC`;
  } catch {
    return isoString;
  }
}

export function formatTimeUTC(isoString: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const day = d.getUTCDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${day}`;
  } catch {
    return dateStr;
  }
}
