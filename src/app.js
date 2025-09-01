import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from "dotenv";
import apiRoutes from "./routes/index.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();

// Simple rate limiting without external dependency (fallback)
const createRateLimit = () => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - (15 * 60 * 1000); // 15 minutes
    
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }
    
    const clientRequests = requests.get(clientId);
    const recentRequests = clientRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= 200) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: '15 minutes'
      });
    }
    
    recentRequests.push(now);
    requests.set(clientId, recentRequests);
    next();
  };
};

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] 
    : true,
  credentials: true
}));

// Apply rate limiting to API routes
app.use('/api', createRateLimit());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use("/api", apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Dynamic Log Analyzer',
    version: '2.0.0',
    status: 'Running',
    description: 'Universal log analysis system for any file path',
    documentation: {
      health: '/api/health',
      info: '/api/info',
      logs: '/api/logs/*'
    },
    usage: {
      example: 'POST /api/logs/files with { "filePath": "C:\\\\logs\\\\app", "fileName": "app.log" }'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;