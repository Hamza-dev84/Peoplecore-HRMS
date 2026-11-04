export const getToday = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.TIMEZONE || "Asia/Karachi",
  }).format(new Date());

export const isValidDateString = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

export const isValidMonth = (value: string): boolean =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export const getMonthRange = (month: string): { start: string; end: string } => {
  const [year, mon] = month.split("-").map(Number);
  const end =
    mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;

  return { start: `${month}-01`, end };
};

export const getLastDays = (count: number): string[] => {
  const today = getToday();
  const days: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }

  return days;
};

export const formatTime = (value?: Date): string =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
      timeZone: process.env.TIMEZONE || "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(value)
    : "";