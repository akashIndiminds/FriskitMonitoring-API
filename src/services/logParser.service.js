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
          message: `No logs found for ${date}`
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
        warnings: logs.filter(log => log.level === 'WARNING').length
      };
    } catch (error) {
      console.error('Error reading log file:', error);
      throw error;
    }
  }

  async getLatestLogs(serviceName, limit = 100) {
    try {
      const service = this.getServiceConfig(serviceName);
      const todayDate = moment().format('YYYY-MM-DD');
      
      return await this.getLogsByDate(serviceName, todayDate);
    } catch (error) {
      console.error('Error getting latest logs:', error);
      throw error;
    }
  }

  parseLogContent(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const logs = [];

    for (const line of lines) {
      const parsedLog = this.parseLogLine(line);
      if (parsedLog) {
        logs.push(parsedLog);
      }
    }

    return logs;
  }

  parseLogLine(line) {
    // Pattern for [YYYY-MM-DD HH:mm:ss] format
    const timestampPattern = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/;
    const match = line.match(timestampPattern);

    if (match) {
      const timestamp = match[1];
      const message = line.substring(match[0].length).trim();
      
      return {
        timestamp,
        message,
        level: this.detectLogLevel(message),
        service: this.detectService(message),
        raw: line
      };
    }

    // Handle lines without timestamps (continuation lines, etc.)
    return {
      timestamp: null,
      message: line.trim(),
      level: this.detectLogLevel(line),
      service: 'UNKNOWN',
      raw: line
    };
  }

  detectLogLevel(message) {
    const lowerMessage = message.toLowerCase();
    
    if (config.errorDetection.criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'CRITICAL';
    }
    
    if (config.errorDetection.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'ERROR';
    }

    if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
      return 'WARNING';
    }

    if (lowerMessage.includes('info') || lowerMessage.includes('starting') || lowerMessage.includes('success')) {
      return 'INFO';
    }

    return 'DEBUG';
  }

  detectService(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('frisk-api') || lowerMessage.includes('uvicorn') || lowerMessage.includes('ums') || lowerMessage.includes('fms') || lowerMessage.includes('dms')) {
      return 'API';
    }
    
    if (lowerMessage.includes('frisk-ui') || lowerMessage.includes('next.js') || lowerMessage.includes('next')) {
      return 'UI';
    }
    
    if (lowerMessage.includes('notification') || lowerMessage.includes('pnpm')) {
      return 'NOTIFICATION';
    }

    return 'SYSTEM';
  }

  getServiceConfig(serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'api':
        return config.friskit.services.api;
      case 'ui':
        return config.friskit.services.ui;
      case 'notification':
        return config.friskit.services.notification;
      default:
        return null;
    }
  }

  async getAvailableLogDates(serviceName) {
    try {
      const service = this.getServiceConfig(serviceName);
      if (!service) {
        return [];
      }

      const files = await fs.readdir(service.logPath);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => file.replace('.log', ''))
        .sort((a, b) => new Date(b) - new Date(a));

      return logFiles;
    } catch (error) {
      console.error('Error getting available log dates:', error);
      return [];
    }
  }
}