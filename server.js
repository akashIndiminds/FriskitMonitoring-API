// server.js
// ==========================================
import app from './src/app.js';
import { config } from './src/config/index.js';

const PORT = config.server.port;
const HOST = config.server.host;

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Dynamic Log Analyzer running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔍 Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`📋 API Info: http://${HOST}:${PORT}/api/info`);
  console.log(`📁 Ready to analyze logs from any file path!`);
});

const gracefulShutdown = (signal) => {
  console.log(`📊 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
