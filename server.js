// server.js - Network Enabled with CORS
// ==========================================
import app from "./src/app.js";
import { config } from "./src/config/index.js";
import cors from "cors";
import os from "os";

const PORT = config.server.port;
// 🔥 CHANGED: Use 0.0.0.0 to accept connections from any IP
const HOST = "0.0.0.0"; // Instead of 'localhost'

// 🌐 CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development/network access
    // You can restrict this to specific domains in production
    callback(null, true);
  },
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // Preflight cache for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional security headers for network access
app.use((req, res, next) => {
  // Allow any origin to access (remove in production if needed)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Access-Token');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
  console.log(`🌐 CORS enabled for cross-origin requests`);
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