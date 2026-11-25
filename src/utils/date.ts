const dateTimeFormatter = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "2026-11-25T13:14:00Z" → "25 Nov 2026, 9:14 pm" (in the device's time zone). */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
