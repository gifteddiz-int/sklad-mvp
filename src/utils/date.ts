export const todayISO = () => new Date().toISOString().split("T")[0]!;

export const toLocaleDateTime = (value: Date | string, locale: string = "ru-RU") => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(locale);
};
