const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

export function formatRelativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();

  for (const [unit, ms] of UNITS) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }

  return rtf.format(0, "minute");
}
