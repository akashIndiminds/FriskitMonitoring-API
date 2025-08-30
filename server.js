import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

import logsRoutes from './src/routes/logs.routes.js';
import { analysisRouter } from './src/routes/analysis.routes.js'; // Changed to named import
import { servicesRouter } from './src/routes/services.routes.js'; // Changed to named import
// import serviceManagementRoutes from './src/routes/serviceManagement.routes.js'; // Comment this out for now

import { FileWatcherService } from './src/services/fileWatcher.service.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { config } from './src/config/index.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Global WebSocket reference
global.wss = wss;

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: config.server.nodeEnv === 'production' ? 
    ['http://localhost:3000', 'http://localhost:3001'] : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/logs', logsRoutes);
app.use('/api/analysis', analysisRouter); // Changed to use the named import
app.use('/api/services', servicesRouter); // Changed to use the named import
// app.use('/api/service-management', serviceManagementRoutes); // Comment this out for now

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['logs', 'analysis', 'services', 'file-watcher'],
    version: '2.0.0',
    environment: config.server.nodeEnv
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Friskit Monitoring API',
    version: '2.0.0',
    description: 'Complete API for Friskit Error Monitoring System',
    endpoints: {
      logs: {
        'GET /api/logs/:service/dates': 'Get available log dates for service',
        'GET /api/logs/:service/latest': 'Get latest logs (today)',
        'GET /api/logs/:service/date/:date': 'Get logs by specific date',
        'GET /api/logs/:service/search': 'Search logs with filters'
      },
      analysis: {
        'GET /api/analysis/:service/errors': 'Analyze errors for service',
        'GET /api/analysis/:service/trends': 'Get error trends over time',
        'GET /api/analysis/:service/critical': 'Get critical errors only',
        'GET /api/analysis/health': 'Get overall system health'
      },
      services: {
        'GET /api/services/status': 'Get all services status',
        'GET /api/services/:service/details': 'Get detailed service info'
      }
    },
    supportedServices: ['api', 'ui', 'notification'],
    logLevels: ['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG']
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: '/api'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Connected to Friskit Monitoring System',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      // Handle different message types
      if (message.type === 'PING') {
        ws.send(JSON.stringify({
          type: 'PONG',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
});

// Initialize file watcher if enabled
if (config.fileWatcher.enabled) {
  try {
    const fileWatcher = new FileWatcherService();
    fileWatcher.startWatching();
    console.log('File watcher initialized');
  } catch (error) {
    console.warn('File watcher failed to initialize:', error.message);
  }
}

const PORT = config.server.port;

server.listen(PORT, () => {
  console.log('\nFriskit Monitoring API Server Started');
  console.log(`API Server: http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Monitoring logs at: ${config.friskit.logsBasePath}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log('=====================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  
  if (global.fileWatcher) {
    global.fileWatcher.stopWatching();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});