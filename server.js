// server.js - Network Enabled
// ==========================================
import app from "./src/app.js";
import { config } from "./src/config/index.js";
import os from "os";

const PORT = config.server.port;
// 🔥 CHANGED: Use 0.0.0.0 to accept connections from any IP
const HOST = "0.0.0.0"; // Instead of 'localhost'

const server = app.listen(PORT, HOST, () => {
  // Get network interfaces to show available IPs
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  console.log(`🚀 Dynamic Log Analyzer running on:`);
  console.log(`   📍 Local: http://localhost:${PORT}`);
  console.log(`   📍 Local: http://127.0.0.1:${PORT}`);

  if (addresses.length > 0) {
    addresses.forEach((addr) => {
      console.log(`   🌐 Network: http://${addr}:${PORT}`);
    });
  }

  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API Info: http://localhost:${PORT}/api/info`);
  console.log(`📁 Ready to analyze logs from any file path!`);
  console.log(`⚠️  Server accepting connections from ALL network interfaces`);
});

// Enhanced timeout handling for network requests
server.timeout = 120000; // 2 minutes timeout
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Handle server errors
server.on("error", (error) => {
  console.error("🚨 Server Error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log("💡 Solutions:");
    console.log(`   1. Kill existing process: taskkill /f /im node.exe`);
    console.log(`   2. Use different port: PORT=5001 node server.js`);
    console.log(`   3. Find process: netstat -ano | findstr :${PORT}`);
  }
  process.exit(1);
});

const gracefulShutdown = (signal) => {
  console.log(`📊 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
