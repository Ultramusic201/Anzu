// Date utilities without external dependencies
// Applies SRP: only date helpers live here. Can be reused across features.

/** Left-pad a number with zeros to 2 digits */
export const pad2 = (n) => String(n).padStart(2, "0");

/** Format Date to YYYY-MM-DD */
export const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

/** Format Date to YYYY-MM */
export const formatYM = (date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  return `${y}-${m}`;
};

/** Start of week (Monday) for a given date */
export const startOfWeek = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

/**
 * Parse a date string in DD/MM/YYYY and return YYYY-MM-DD or null if invalid
 */
export const parseSearchDate = (input) => {
  if (!input) return null;
  const parts = input.split("/").map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [dd, mm, yyyy] = parts;
  if (yyyy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  // catch invalid dates like 31/02/2024
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  )
    return null;
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  return `${y}-${m}-${da}`;
};
