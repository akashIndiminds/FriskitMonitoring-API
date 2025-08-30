// ============================================

// src/controllers/logs.controller.js
import { LogParserService } from '../services/logParser.service.js';
import moment from 'moment';

const logParser = new LogParserService();

export const getLogsByDate = async (req, res) => {
  try {
    const { service, date } = req.params;
    const { limit, offset, level } = req.query;

    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    let targetDate = date;
    if (date === 'today') {
      targetDate = moment().format('YYYY-MM-DD');
    } else if (date === 'yesterday') {
      targetDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    } else if (!moment(date, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        message: 'Date must be in YYYY-MM-DD format or "today"/"yesterday"' 
      });
    }

    const logData = await logParser.getLogsByDate(service, targetDate);

    if (!logData.exists) {
      return res.status(404).json({
        error: 'No logs found',
        message: `No log file exists for ${service} service on ${targetDate}`,
        service,
        date: targetDate
      });
    }

    // Apply filters
    let filteredLogs = [...logData.logs];
    
    if (level && level.toUpperCase() !== 'ALL') {
      filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
    }

    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 100;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limitCount);

    // Add color coding for different log levels
    const logsWithColors = paginatedLogs.map(log => ({
      ...log,
      color: getLogColor(log.level),
      severity: getLogSeverity(log.level)
    }));

    res.json({
      service,
      date: targetDate,
      logs: logsWithColors,
      summary: {
        total: logData.logs.length,
        filtered: filteredLogs.length,
        displayed: logsWithColors.length,
        errors: logData.errors,
        warnings: logData.warnings,
        criticals: logData.criticals
      },
      pagination: {
        offset: startIndex,
        limit: limitCount,
        total: filteredLogs.length,
        hasMore: startIndex + limitCount < filteredLogs.length,
        nextOffset: startIndex + limitCount < filteredLogs.length ? startIndex + limitCount : null
      },
      filters: {
        level: level || 'ALL',
        applied: !!level
      },
      filePath: logData.filePath
    });

  } catch (error) {
    console.error('Error in getLogsByDate:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve logs', 
      message: error.message,
      service: req.params.service,
      date: req.params.date
    });
  }
};

export const getLatestLogs = async (req, res) => {
  try {
    const { service } = req.params;
    const { limit } = req.query;

    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const logs = await logParser.getLatestLogs(service, parseInt(limit) || 100);
    
    if (!logs.exists) {
      return res.status(404).json({
        error: 'No logs found',
        message: `No log file exists for ${service} service today`,
        service
      });
    }

    // Add color coding
    const logsWithColors = logs.logs.map(log => ({
      ...log,
      color: getLogColor(log.level),
      severity: getLogSeverity(log.level)
    }));

    res.json({
      ...logs,
      logs: logsWithColors
    });
  } catch (error) {
    console.error('Error in getLatestLogs:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve latest logs', 
      message: error.message,
      service: req.params.service
    });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { service } = req.params;
    
    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const dates = await logParser.getAvailableLogDates(service);
    
    // Add additional info for each date
    const datesWithInfo = await Promise.all(
      dates.map(async (date) => {
        try {
          const logData = await logParser.getLogsByDate(service, date);
          return {
            date,
            hasLogs: logData.exists,
            totalLines: logData.totalLines || 0,
            errors: logData.errors || 0,
            warnings: logData.warnings || 0,
            criticals: logData.criticals || 0,
            dayName: moment(date).format('dddd'),
            isToday: date === moment().format('YYYY-MM-DD'),
            isYesterday: date === moment().subtract(1, 'day').format('YYYY-MM-DD')
          };
        } catch (error) {
          return {
            date,
            hasLogs: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      service,
      availableDates: datesWithInfo,
      count: dates.length,
      summary: {
        totalDays: dates.length,
        daysWithErrors: datesWithInfo.filter(d => d.errors > 0).length,
        daysWithWarnings: datesWithInfo.filter(d => d.warnings > 0).length
      }
    });
  } catch (error) {
    console.error('Error in getAvailableDates:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve available dates', 
      message: error.message,
      service: req.params.service
    });
  }
};

export const searchLogs = async (req, res) => {
  try {
    const { service } = req.params;
    const { query, date, level, limit } = req.query;

    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const targetDate = date || moment().format('YYYY-MM-DD');
    
    // Validate date
    if (!moment(targetDate, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        message: 'Date must be in YYYY-MM-DD format' 
      });
    }

    const searchParams = { query, date: targetDate, level, limit };
    const results = await logParser.searchLogs(service, searchParams);

    // Add color coding to results
    const resultsWithColors = results.results.map(log => ({
      ...log,
      color: getLogColor(log.level),
      severity: getLogSeverity(log.level)
    }));

    res.json({
      ...results,
      results: resultsWithColors
    });

  } catch (error) {
    console.error('Error in searchLogs:', error);
    res.status(500).json({ 
      error: 'Failed to search logs', 
      message: error.message,
      service: req.params.service
    });
  }
};

// Helper functions for log styling
function getLogColor(level) {
  switch (level) {
    case 'CRITICAL': return '#ff0000'; // Red
    case 'ERROR': return '#ff6b6b';    // Light Red
    case 'WARNING': return '#ffa500';  // Orange
    case 'INFO': return '#4dabf7';     // Blue
    case 'DEBUG': return '#868e96';    // Gray
    default: return '#212529';         // Dark Gray
  }
}

function getLogSeverity(level) {
  switch (level) {
    case 'CRITICAL': return 5;
    case 'ERROR': return 4;
    case 'WARNING': return 3;
    case 'INFO': return 2;
    case 'DEBUG': return 1;
    default: return 0;
  }
}