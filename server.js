import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

import logsRoutes from './src/routes/logs.routes.js';
import errorsRoutes from './src/routes/errors.routes.js';
import analysisRoutes from './src/routes/analysis.routes.js';
import servicesRoutes from './src/routes/services.routes.js';

import { FileWatcherService } from './src/services/fileWatcher.service.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Global WebSocket reference
global.wss = wss;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/logs', logsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/services', servicesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['logs', 'errors', 'analysis', 'file-watcher']
  });
});

// Error handling
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Initialize file watcher
const fileWatcher = new FileWatcherService();
fileWatcher.startWatching();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Friskit Monitoring API running on port ${PORT}`);
  console.log(`📊 Dashboard will be available at http://localhost:3000`);
  console.log(`🔍 Monitoring logs at: ${process.env.FRISKIT_LOGS_BASE_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  fileWatcher.stopWatching();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});