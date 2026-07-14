// Shared formatting helpers.

// Format a date-like value as a localized date string, or a fallback when
// the value is missing or invalid.
export const formatDate = (value, fallback = 'N/A') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
};
