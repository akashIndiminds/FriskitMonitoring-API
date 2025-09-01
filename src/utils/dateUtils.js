// src/utils/dateUtils.js
// ==========================================
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

export const parseLogTimestamp = (timestampStr) => {
  const patterns = [
    /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
    /^\[(\d{2}:\d{2}:\d{2})\]/,
    /^(\d{2}:\d{2}:\d{2})/,
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
    /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/
  ];

  for (const pattern of patterns) {
    const match = timestampStr.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return new Date().toISOString();
};

export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};