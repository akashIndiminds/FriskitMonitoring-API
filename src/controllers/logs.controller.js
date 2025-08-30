import { LogParserService } from '../services/logParser.service.js';
import moment from 'moment';

const logParser = new LogParserService();

export const getLogsByDate = async (req, res) => {
  try {
    const { service, date } = req.params;
    const { limit, offset, level } = req.query;

    let targetDate = date;
    if (date === 'today') {
      targetDate = moment().format('YYYY-MM-DD');
    } else if (date === 'yesterday') {
      targetDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    }

    const logData = await logParser.getLogsByDate(service, targetDate);

    // Apply filters
    let filteredLogs = logData.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
    }

    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 100;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limitCount);

    res.json({
      ...logData,
      logs: paginatedLogs,
      pagination: {
        offset: startIndex,
        limit: limitCount,
        total: filteredLogs.length,
        hasMore: startIndex + limitCount < filteredLogs.length
      },
      filters: {
        level,
        applied: !!level
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve logs', 
      message: error.message 
    });
  }
};

export const getLatestLogs = async (req, res) => {
  try {
    const { service } = req.params;
    const { limit } = req.query;

    const logs = await logParser.getLatestLogs(service, parseInt(limit) || 100);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve latest logs', 
      message: error.message 
    });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { service } = req.params;
    
    const dates = await logParser.getAvailableLogDates(service);
    
    res.json({
      service,
      availableDates: dates,
      count: dates.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve available dates', 
      message: error.message 
    });
  }
};

export const searchLogs = async (req, res) => {
  try {
    const { service } = req.params;
    const { query, date, level, limit } = req.query;

    const targetDate = date || moment().format('YYYY-MM-DD');
    const logData = await logParser.getLogsByDate(service, targetDate);

    if (!logData.exists) {
      return res.json({
        service,
        date: targetDate,
        results: [],
        message: 'No logs found for the specified date'
      });
    }

    let results = logData.logs;

    // Apply search query
    if (query) {
      results = results.filter(log => 
        log.message.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply level filter
    if (level) {
      results = results.filter(log => log.level === level.toUpperCase());
    }

    // Apply limit
    if (limit) {
      results = results.slice(0, parseInt(limit));
    }

    res.json({
      service,
      date: targetDate,
      query: {
        text: query,
        level,
        limit
      },
      results,
      resultCount: results.length,
      totalLogs: logData.logs.length
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search logs', 
      message: error.message 
    });
  }
};