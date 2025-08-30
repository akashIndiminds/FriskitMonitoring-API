import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { config } from '../config/index.js';

export class LogParserService {
  constructor() {
    this.logCache = new Map();
  }

  async getLogsByDate(serviceName, date) {
    try {
      const service = this.getServiceConfig(serviceName);
      if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      const logFilePath = path.join(service.logPath, `${date}.log`);
      
      if (!await fs.pathExists(logFilePath)) {
        return {
          service: serviceName,
          date,
          logs: [],
          exists: false,
          message: `No logs found for ${date}`,
          filePath: logFilePath
        };
      }

      const content = await fs.readFile(logFilePath, 'utf-8');
      const logs = this.parseLogContent(content);

      return {
        service: serviceName,
        date,
        logs,
        exists: true,
        totalLines: logs.length,
        errors: logs.filter(log => log.level === 'ERROR').length,
        warnings: logs.filter(log => log.level === 'WARNING').length,
        criticals: logs.filter(log => log.level === 'CRITICAL').length,
        filePath: logFilePath
      };
    } catch (error) {
      console.error('Error reading log file:', error);
      throw error;
    }
  }

  async getLatestLogs(serviceName, limit = 100) {
    try {
      const todayDate = moment().format('YYYY-MM-DD');
      const result = await this.getLogsByDate(serviceName, todayDate);
      
      if (result.exists && limit) {
        result.logs = result.logs.slice(-limit); // Get latest entries
      }
      
      return result;
    } catch (error) {
      console.error('Error getting latest logs:', error);
      throw error;
    }
  }

  parseLogContent(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const logs = [];

    for (let i = 0; i < lines.length; i++) {
      const parsedLog = this.parseLogLine(lines[i], i + 1);
      if (parsedLog) {
        logs.push(parsedLog);
      }
    }

    return logs;
  }

  parseLogLine(line, lineNumber) {
    // Enhanced pattern for different timestamp formats
    const timestampPatterns = [
      /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,  // [2024-08-30 12:30:45]
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,      // 2024-08-30 12:30:45
      /^\[(\d{2}:\d{2}:\d{2})\]/,                      // [12:30:45]
      /^(\d{2}:\d{2}:\d{2})/                           // 12:30:45
    ];

    let timestamp = null;
    let message = line.trim();

    for (const pattern of timestampPatterns) {
      const match = line.match(pattern);
      if (match) {
        timestamp = match[1];
        message = line.substring(match[0].length).trim();
        break;
      }
    }

    // If no timestamp found, treat as continuation line
    if (!timestamp) {
      timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    const level = this.detectLogLevel(message);
    const service = this.detectService(message);

    return {
      id: `${lineNumber}-${timestamp}`,
      lineNumber,
      timestamp,
      message,
      level,
      service,
      raw: line,
      isError: level === 'ERROR' || level === 'CRITICAL',
      isWarning: level === 'WARNING'
    };
  }

  detectLogLevel(message) {
    const lowerMessage = message.toLowerCase();
    
    // Critical keywords (highest priority)
    const criticalKeywords = ['fatal', 'critical', 'crash', 'abort', 'emergency', 'panic'];
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'CRITICAL';
    }
    
    // Error keywords
    const errorKeywords = ['error', 'failed', 'failure', 'exception', 'traceback', 'stderr'];
    if (errorKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'ERROR';
    }

    // Warning keywords
    const warningKeywords = ['warning', 'warn', 'deprecated', 'timeout', 'retry'];
    if (warningKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'WARNING';
    }

    // Info keywords
    const infoKeywords = ['info', 'starting', 'started', 'success', 'completed', 'finished'];
    if (infoKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'INFO';
    }

    return 'DEBUG';
  }

  detectService(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('frisk-api') || lowerMessage.includes('uvicorn') || 
        lowerMessage.includes('ums') || lowerMessage.includes('fms') || 
        lowerMessage.includes('dms') || lowerMessage.includes('fastapi')) {
      return 'API';
    }
    
    if (lowerMessage.includes('frisk-ui') || lowerMessage.includes('next.js') || 
        lowerMessage.includes('next') || lowerMessage.includes('react')) {
      return 'UI';
    }
    
    if (lowerMessage.includes('notification') || lowerMessage.includes('pnpm') ||
        lowerMessage.includes('frisk-notification')) {
      return 'NOTIFICATION';
    }

    return 'SYSTEM';
  }

  getServiceConfig(serviceName) {
    const services = {
      'api': config.friskit.services.api,
      'ui': config.friskit.services.ui,
      'notification': config.friskit.services.notification
    };
    
    return services[serviceName.toLowerCase()] || null;
  }

  async getAvailableLogDates(serviceName) {
    try {
      const service = this.getServiceConfig(serviceName);
      if (!service) {
        return [];
      }

      // Check if directory exists
      if (!await fs.pathExists(service.logPath)) {
        console.warn(`Log directory not found: ${service.logPath}`);
        return [];
      }

      const files = await fs.readdir(service.logPath);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const dateStr = file.replace('.log', '');
          return {
            date: dateStr,
            filename: file,
            isValid: moment(dateStr, 'YYYY-MM-DD').isValid()
          };
        })
        .filter(item => item.isValid)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return logFiles.map(item => item.date);
    } catch (error) {
      console.error('Error getting available log dates:', error);
      return [];
    }
  }

  async searchLogs(serviceName, searchParams) {
    try {
      const { query, date, level, limit = 50 } = searchParams;
      const logData = await this.getLogsByDate(serviceName, date);

      if (!logData.exists) {
        return {
          service: serviceName,
          date,
          results: [],
          message: 'No logs found for the specified date'
        };
      }

      let results = [...logData.logs];

      // Apply search query
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase();
        results = results.filter(log => 
          log.message.toLowerCase().includes(searchTerm) ||
          log.raw.toLowerCase().includes(searchTerm)
        );
      }

      // Apply level filter
      if (level && level !== 'ALL') {
        results = results.filter(log => log.level === level.toUpperCase());
      }

      // Apply limit
      if (limit > 0) {
        results = results.slice(0, limit);
      }

      return {
        service: serviceName,
        date,
        searchParams,
        results,
        resultCount: results.length,
        totalLogs: logData.logs.length
      };

    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }
}