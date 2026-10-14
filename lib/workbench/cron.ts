export const FIELD_NAMES = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

const FIELD_RANGES: Record<FieldName, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 7],
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function expandField(token: string, [min, max]: [number, number]): number[] {
  const out = new Set<number>();
  for (const part of token.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) throw new Error('invalid');
    const step = Number(match[2] ?? 1);
    if (!Number.isSafeInteger(step) || step < 1) throw new Error('step');
    const range = match[1].split('-').map(Number);
    const lo = match[1] === '*' ? min : range[0];
    const hi = match[1] === '*' ? max : range[1] ?? (match[2] ? max : lo);
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < min || hi > max || lo > hi) throw new Error('range');
    for (let i = lo; i <= hi; i += step) out.add(i);
  }
  return [...out].sort((a,b) => a-b);
}

export interface ParsedCron {
  valid: boolean;
  restrictedDays?: boolean;
  error?: string;
  fields?: Record<FieldName, number[]>;
}

export function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, error: 'Expected 5 fields (min hr dom mon dow)' };
  try {
    const fields = {} as Record<FieldName, number[]>;
    FIELD_NAMES.forEach((name, i) => {
      fields[name] = expandField(parts[i], FIELD_RANGES[name]);
    });
    fields.dayOfWeek = [...new Set(fields.dayOfWeek.map(day => day % 7))];
    return { valid: true, fields, restrictedDays: !parts[2].includes('*') && !parts[4].includes('*') };
  } catch {
    return { valid: false, error: 'Invalid expression' };
  }
}

export function nextRuns(parsed: ParsedCron, count = 8, from = new Date()): Date[] {
  if (!parsed.valid || !parsed.fields) return [];
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.fields;
  const results: Date[] = [];
  const now = new Date(from);
  now.setSeconds(0, 0);
  const cap = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000);
  let cur = new Date(now.getTime() + 60_000);

  while (results.length < count && cur < cap) {
    const dom = dayOfMonth.includes(cur.getDate()), dow = dayOfWeek.includes(cur.getDay());
    if (!month.includes(cur.getMonth() + 1) || !(parsed.restrictedDays ? dom || dow : dom && dow)) {
      cur.setDate(cur.getDate() + 1); cur.setHours(0, 0, 0, 0); continue;
    }
    if (hour.includes(cur.getHours()) && minute.includes(cur.getMinutes())) results.push(new Date(cur));
    cur = new Date(cur.getTime() + 60_000);
  }
  return results;
}

export function describeField(field: FieldName, values: number[]): string {
  const [min, max] = FIELD_RANGES[field];
  if (values.length === (field === 'dayOfWeek' ? 7 : max - min + 1)) return 'every';
  if (field === 'month') return values.map((v) => MONTH_NAMES[v - 1]).join(', ');
  if (field === 'dayOfWeek') return values.map((v) => DOW_NAMES[v]).join(', ');
  return values.join(', ');
}
