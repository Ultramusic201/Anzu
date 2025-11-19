// Charts-related fixed data and labels
// Applies SRP: this module only contains constants for chart labeling and bucketing

/** Short month labels in Spanish used in line charts */
export const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/** Weekday labels (starting on Sunday) */
export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Buckets to group amounts in the histogram/heatmap */
export const AMOUNT_BUCKETS = [
  { min: 0, max: 20, label: "0 - 20" },
  { min: 20, max: 50, label: "20 - 50" },
  { min: 50, max: 100, label: "50 - 100" },
  { min: 100, max: 200, label: "100 - 200" },
  { min: 200, max: 500, label: "200 - 500" },
  { min: 500, max: Infinity, label: "500+" },
];

/** Palette for pie/donut segments */
export const PIE_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#22d3ee",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];
