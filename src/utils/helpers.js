import moment from 'moment';

export const formatTimestamp = (timestamp) => {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

export const getDateRange = (days) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    dates.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
  }
  return dates.reverse();
};

export const sanitizePath = (filePath) => {
  // Remove any potentially dangerous path elements
  return filePath.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
};

export const parseLogLevel = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
    return 'CRITICAL';
  }
  if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
    return 'ERROR';
  }
  if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
    return 'WARNING';
  }
  if (lowerMessage.includes('info') || lowerMessage.includes('starting')) {
    return 'INFO';
  }
  
  return 'DEBUG';
};

export const extractErrorContext = (logLine, surroundingLines = []) => {
  return {
    mainError: logLine,
    context: surroundingLines,
    timestamp: extractTimestamp(logLine)
  };
};

export const extractTimestamp = (logLine) => {
  const match = logLine.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
  return match ? match[1] : null;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};