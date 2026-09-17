export function parseDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid date');
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function resolveRange(input: {
  dateFrom?: string;
  dateTo?: string;
}): { start: Date; end: Date } {
  const from = input.dateFrom ?? todayDateString();
  const to = input.dateTo ?? from;
  const { start } = parseDayBounds(from);
  const { end } = parseDayBounds(to);
  return { start, end: end < start ? parseDayBounds(from).end : end };
}
