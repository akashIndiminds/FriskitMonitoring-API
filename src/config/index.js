// src/config/index.js - Enhanced for multiple services
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  friskit: {
    logsBasePath: process.env.FRISKIT_LOGS_BASE_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs',
    services: {
      api: {
        name: 'Frisk-API',
        displayName: 'Frisk API Service',
        logPath: process.env.FRISK_API_LOG_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs\Frisk-API',
        ports: [10001, 10002, 10003],
        description: 'Main API service handling backend operations'
      },
      ui: {
        name: 'Frisk-UI',
        displayName: 'Frisk UI Service',
        logPath: process.env.FRISK_UI_LOG_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs\Frisk-UI',
        port: 10000,
        description: 'Frontend UI service built with Next.js'
      },
      notification: {
        name: 'Frisk-Notification-Service',
        displayName: 'Frisk Notification Service',
        logPath: process.env.FRISK_NOTIFICATION_LOG_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs\Frisk-Notification-Service',
        port: 8080,
        description: 'Notification service for system alerts'
      },
      FtpAutomation: {
        name: 'Frisk-FTP-Automation',
        displayName: 'Frisk FTP-Automation Service',
        logPath: process.env.DATABASE_LOG_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs\Frisk-FTP-Automation',
        port: 5432,
        description: 'FTP Automation Service'
      },
      FriskTradeAdapter: {
        name: 'Frisk-TradeAdapter',
        displayName: 'Frisk-TradeAdapterService',
        logPath: process.env.DATABASE_LOG_PATH || '\\db-indiminds\C\Friskit\BAT-Files\latest\logs\Frisk-TradeAdapter',
        port: 5432,
        description: 'Frisk TradeAdapter Service'
      },

    }
  },

 errorDetection: {
    // Common error keywords for detection
    keywords: [
      'error', 'failed', 'failure', 'exception', 'traceback', 
      'warning', 'timeout', 'connection', 'refused', 'denied'
    ],
    
    // Critical error keywords
    criticalKeywords: [
      'fatal', 'critical', 'crash', 'abort', 'emergency', 'panic'
    ],

    // Log levels priority
    logLevels: {
      CRITICAL: 5,
      ERROR: 4,
      WARNING: 3,
      INFO: 2,
      DEBUG: 1
    }
  },

  // File watcher configuration
  fileWatcher: {
    enabled: process.env.FILE_WATCHER_ENABLED !== 'false',
    watchExtensions: ['.log', '.txt'], // Support multiple file extensions
    ignoreInitial: true,
    persistent: true
  },

  // API response configuration
  api: {
    defaultLimit: 100,
    maxLimit: 1000,
    defaultOffset: 0,
    enableCors: true,
    enableCompression: true
  }
};

// ✅ DYNAMIC SERVICE VALIDATION
export const getValidServices = () => {
  return Object.keys(config.friskit.services);
};

// ✅ GET SERVICE CONFIG BY NAME
export const getServiceConfig = (serviceName) => {
  return config.friskit.services[serviceName.toLowerCase()];
};