import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from "dotenv";
import logsRoutes from "./routes/logs.routes.js";
import errorsRoutes from "./routes/errors.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

 dotenv.config();
 const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : true,
  credentials: true
}));

// Body parsing middleware
 app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
 app.use("/api/logs", logsRoutes);
 app.use("/api/errors", errorsRoutes);
 app.use("/api/analysis", analysisRoutes);
app.use("/api/services", servicesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['logs', 'errors', 'analysis', 'file-watcher']
  });
});

// Error handling middleware (must be last)
 app.use(errorHandler);

 export default app;