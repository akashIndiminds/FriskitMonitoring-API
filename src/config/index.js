import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  friskit: {
    logsBasePath: process.env.FRISKIT_LOGS_BASE_PATH || 'C:/Friskit/BAT-Files/latest/logs',
    services: {
      api: {
        name: 'Frisk-API',
        logPath: process.env.FRISK_API_LOG_PATH || 'C:/Friskit/BAT-Files/latest/logs/Frisk-API',
        ports: [10001, 10002, 10003]
      },
      ui: {
        name: 'Frisk-UI',
        logPath: process.env.FRISK_UI_LOG_PATH || 'C:/Friskit/BAT-Files/latest/logs/Frisk-UI',
        port: 10000
      },
      notification: {
        name: 'Frisk-Notification-Service',
        logPath: process.env.FRISK_NOTIFICATION_LOG_PATH || 'C:/Friskit/BAT-Files/latest/logs/Frisk-Notification-Service',
        port: 8080
      }
    }
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4'
  },

  errorDetection: {
    keywords: (process.env.ERROR_KEYWORDS || 'error,failed,exception,warning,timeout,connection,refused').split(','),
    criticalKeywords: (process.env.CRITICAL_KEYWORDS || 'fatal,critical,crash,abort,emergency').split(',')
  }
};