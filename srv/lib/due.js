export const TZ = 'Asia/Kolkata';

export const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TZ });

export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (fromIso, toIso) =>
  Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86400000);

export function bucketFor(days) {
  if (days > 15)  return { dueBucket: 'Not yet due',              criticality: 0 };
  if (days > 7)   return { dueBucket: 'Due within 15 days',       criticality: 3 };
  if (days > 3)   return { dueBucket: 'Due within 7 days',        criticality: 2 };
  if (days >= 0)  return { dueBucket: 'Due within 3 days',        criticality: 2 };
  if (days >= -2) return { dueBucket: 'Overdue 1-2 days',         criticality: 1 };
  if (days >= -5) return { dueBucket: 'Overdue 3-5 days',         criticality: 1 };
  if (days >= -7) return { dueBucket: 'Overdue 6-7 days',         criticality: 1 };
  return             { dueBucket: 'Overdue more than 7 days', criticality: 1 };
}