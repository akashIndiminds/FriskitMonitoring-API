# Friskit Monitoring API v2.0

A complete log monitoring and error analysis system for Friskit services with real-time capabilities.

## ✨ Features

- **📊 Real-time Log Monitoring** - Live log streaming with WebSocket support
- **🔍 Smart Error Analysis** - Intelligent error categorization and solutions
- **📈 Trend Analysis** - Historical error trends and patterns
- **🎯 Service-specific Monitoring** - Dedicated monitoring for API, UI, and Notification services
- **🔴 Critical Error Detection** - Immediate alerts for critical issues
- **🌈 Color-coded Logs** - Visual log level distinction (like Vercel/Render)
- **📅 Date-based Navigation** - Easy navigation through historical logs
- **🔎 Advanced Search** - Powerful log search with multiple filters

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Access to Friskit log directory (`\\db-indiminds\Friskit\BAT-Files\latest\logs`)

### Installation

1. **Clone and Install**
```bash
npm install
```

2. **Configure Environment**
Create `.env` file:
```env
PORT=5000
NODE_ENV=development

# Log Paths (Your Network Paths)
FRISKIT_LOGS_BASE_PATH=\\\\db-indiminds\\Friskit\\BAT-Files\\latest\\logs
FRISK_API_LOG_PATH=\\\\db-indiminds\\Friskit\\BAT-Files\\latest\\logs\\Frisk-API
FRISK_UI_LOG_PATH=\\\\db-indiminds\\Friskit\\BAT-Files\\latest\\logs\\Frisk-UI
FRISK_NOTIFICATION_LOG_PATH=\\\\db-indiminds\\Friskit\\BAT-Files\\latest\\logs\\Frisk-Notification-Service

# File Watcher
FILE_WATCHER_ENABLED=true
```

3. **Start the Server**
```bash
npm start
# or for development
npm run dev
```

4. **Verify Installation**
Visit: `http://localhost:5000/health`

## 📚 API Endpoints

### 🏥 Health & Status
```
GET /health                    - API health check
GET /api                       - API documentation
GET /api/services/status       - All services status
GET /api/services/:service/details - Detailed service info
```

### 📋 Logs Management
```
GET /api/logs/:service/dates           - Available log dates
GET /api/logs/:service/latest          - Today's logs  
GET /api/logs/:service/date/:date      - Logs by specific date
GET /api/logs/:service/search          - Search logs with filters
```

### 🔬 Error Analysis
```
GET /api/analysis/:service/errors      - Detailed error analysis with solutions
GET /api/analysis/:service/trends      - Error trends over time
GET /api/analysis/:service/critical    - Critical errors only
GET /api/analysis/health               - Overall system health
```

**Supported Services:** `api`, `ui`, `notification`

## 🎯 Usage Examples

### Get Today's API Logs (with color coding)
```bash
curl "http://localhost:5000/api/logs/api/date/today?limit=50"
```

### Analyze Errors with Solutions
```bash
curl "http://localhost:5000/api/analysis/ui/errors"
```

**Response includes:**
- ✅ Categorized errors (Network, Build, Service issues)
- 🔧 **Specific solutions** for each error type
- 🎯 **Priority levels** (CRITICAL, HIGH, MEDIUM)
- 📊 **Error trends** and statistics

### Search for Specific Issues
```bash
curl "http://localhost:5000/api/logs/api/search?query=connection failed&date=2025-08-30&level=ERROR"
```

### Get 7-Day Error Trends
```bash
curl "http://localhost:5000/api/analysis/api/trends?days=7"
```

### System Health Overview
```bash
curl "http://localhost:5000/api/analysis/health"
```

## 🎨 Log Color Coding (Like Vercel/Render)

The API provides color-coded logs for easy visual distinction:

- 🔴 **CRITICAL** - `#ff0000` (Red)
- 🟠 **ERROR** - `#ff6b6b` (Light Red)  
- 🟡 **WARNING** - `#ffa500` (Orange)
- 🔵 **INFO** - `#4dabf7` (Blue)
- ⚫ **DEBUG** - `#868e96` (Gray)

Each log entry includes:
```json
{
  "message": "Error connecting to database",
  "level": "ERROR",
  "color": "#ff6b6b",
  "severity": 4,
  "timestamp": "2025-08-30 14:30:15"
}
```

## 🔧 Error Analysis & Solutions

The API provides **intelligent error analysis** similar to modern deployment platforms:

### Example Analysis Response:
```json
{
  "analysis": {
    "summary": {
      "overallStatus": "NEEDS_ATTENTION",
      "mostCommonIssue": "Network Issues",
      "criticalIssuesFound": false
    },
    "recommendations": [
      {
        "category": "Network Issues",
        "priority": "HIGH",
        "errorCount": 5,
        "topSolution": "Check internet connection"
      }
    ],
    "detailedAnalysis": {
      "Network Issues": {
        "errorCount": 5,
        "priority": "HIGH",
        "commonCauses": [
          "Internet connectivity problems",
          "Firewall blocking connections",
          "DNS resolution issues"
        ],
        "recommendedSolutions": [
          "Check internet connection",
          "Verify firewall settings",
          "Try different DNS servers (8.8.8.8, 1.1.1.1)"
        ]
      }
    }
  }
}
```

## 🔌 WebSocket Real-time Updates

Connect to `ws://localhost:5000` for real-time log updates:

```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'LOG_UPDATED':
      console.log(`New logs in ${data.service}`);
      break;
    case 'CRITICAL_ERROR_ALERT':
      console.log('🚨 CRITICAL ERROR DETECTED!');
      break;
  }
};
```

## 📁 Project Structure

```
friskit-monitoring-api/
├── server.js                 # Main server file
├── src/
│   ├── controllers/           # Route handlers
│   │   ├── logs.controller.js
│   │   ├── analysis.controller.js
│   │   └── services.controller.js
│   ├── services/              # Business logic
│   │   ├── logParser.service.js
│   │   ├── errorAnalyzer.service.js
│   │   └── fileWatcher.service.js
│   ├── routes/                # API routes
│   │   ├── logs.routes.js
│   │   ├── analysis.routes.js
│   │   └── services.routes.js
│   ├── config/                # Configuration
│   │   └── index.js
│   └── middleware/            # Express middleware
│       └── errorHandler.js
├── postman/                   # API collection
└── .env                      # Environment variables
```

## 🎯 Key Improvements Made

1. **📍 Clear API Endpoints** - Easy to understand `/api/logs/api/date/today`
2. **🎨 Color-coded Logs** - Visual distinction like modern platforms
3. **🔧 Smart Error Analysis** - Provides actual solutions, not just detection
4. **📅 Date Navigation** - Easy historical log browsing
5. **🔍 Advanced Search** - Multiple filter options
6. **📊 Trend Analysis** - Track error patterns over time
7. **🏥 Health Monitoring** - Overall system status
8. **⚡ Real-time Updates** - WebSocket notifications
9. **📚 Complete Documentation** - Postman collection included

## 🔗 Integration with Frontend

For your UI, you can easily integrate:

```javascript
// Get today's logs with colors
const response = await fetch('/api/logs/api/date/today');
const data = await response.json();

// Display logs with colors
data.logs.forEach(log => {
  const logElement = document.createElement('div');
  logElement.style.color = log.color;
  logElement.textContent = `[${log.timestamp}] ${log.level}: ${log.message}`;
  container.appendChild(logElement);
});

// Get error analysis
const analysisResponse = await fetch('/api/analysis/api/errors');
const analysis = await analysisResponse.json();

// Show solutions in UI
if (analysis.analysis.recommendations.length > 0) {
  showAnalyzeButton(); // Show "Analyze" button
}
```

## 🎉 Ready to Use!

Your API is now ready with:
- ✅ All endpoints working with your network paths
- ✅ Color-coded logs (like Vercel/Render)
- ✅ Smart error analysis with solutions  
- ✅ Historical log browsing
- ✅ Real-time monitoring
- ✅ Complete Postman collection
- ✅ No AI dependencies (removed OpenAI logic)

**Test it:** Import the Postman collection and start making requests!