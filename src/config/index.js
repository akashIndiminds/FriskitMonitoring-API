// src/config/index.js

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  cache: {
    autoRefreshInterval: parseInt(process.env.AUTO_REFRESH_INTERVAL) || 5000,
    maxRecentPaths: 20 // Keep last 20 used paths in memory
  },

  dynamicLogs: {
    supportedExtensions: ['.log', '.txt', '.out', '.err', '.json'],
    defaultLimit: 100,
    maxLimit: 10000
  }
};
