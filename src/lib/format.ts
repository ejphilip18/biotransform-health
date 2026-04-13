export function formatDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, options).format(date);
}
