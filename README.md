# Friskit Error Monitoring System

A comprehensive real-time error monitoring and log analysis system for Friskit services with AI-powered insights.

## 🚀 Features

- **Real-time Log Monitoring**: Automatically watches log files and detects changes
- **Error Detection**: Advanced pattern matching for different types of errors
- **AI Analysis**: OpenAI-powered error analysis and recommendations
- **Multi-Service Support**: Monitors API, UI, and Notification services
- **WebSocket Notifications**: Real-time error alerts
- **Trend Analysis**: Historical error tracking and prediction
- **Search & Filter**: Powerful log search capabilities

## 📁 Project Structure

```
friskit-monitoring/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # API endpoint controllers
│   ├── services/         # Business logic services
│   ├── routes/          # Express.js routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Helper functions and patterns
├── postman/             # Postman collection
├── server.js            # Main server file
└── package.json         # Dependencies and scripts
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- OpenAI API Key (optional, for AI analysis)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   Update `.env` file with your paths:
   ```env
   # Update these paths to match your system
   FRISKIT_LOGS_BASE_PATH=C:/Friskit/BAT-Files/latest/logs
   FRISK_API_LOG_PATH=C:/Friskit/BAT-Files/latest/logs/Frisk-API
   FRISK_UI_LOG_PATH=C:/Friskit/BAT-Files/latest/logs/Frisk-UI
   FRISK_NOTIFICATION_LOG_PATH=C:/Friskit/BAT-Files/latest/logs/Frisk-Notification-Service
   
   # Add your OpenAI API key for AI analysis
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

3. **Start the Server**
   ```bash
   npm run dev
   ```

## 🤖 OpenAI Integration Setup

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 2. Configure the System
1. Add your API key to `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   OPENAI_MODEL=gpt-4
   ```

2. **Restart the server** after adding the key

### 3. AI Features Available

- **Error Analysis**: Get detailed analysis of error patterns
- **Log Summaries**: AI-generated summaries of log activities  
- **Predictions**: Predictive analysis for potential issues
- **Recommendations**: Actionable solutions for detected problems

### 4. Usage Examples

**Analyze errors with AI:**
```bash
GET /api/analysis/api/ai?date=2025-08-29
```

**Get AI log summary:**
```bash
GET /api/analysis/ui/summary?date=2025-08-29
```

**Predict potential issues:**
```bash
GET /api/analysis/notification/predictions?days=7
```

## 📊 API Endpoints

### Logs
- `GET /api/logs/:service/dates` - Available log dates
- `GET /api/logs/:service/latest` - Latest logs
- `GET /api/logs/:service/date/:date` - Logs by date
- `GET /api/logs/:service/search` - Search logs

### Error Detection
- `GET /api/errors/:service/analysis` - Error analysis
- `GET /api/errors/:service/trends` - Error trends
- `GET /api/errors/:service/critical` - Critical errors only
- `GET /api/errors/:service/categories` - Categorized errors

### AI Analysis  
- `GET /api/analysis/:service/ai` - AI error analysis
- `GET /api/analysis/:service/summary` - AI log summary
- `GET /api/analysis/:service/predictions` - Issue predictions
- `GET /api/analysis/health` - System health overview

### Services
- `GET /api/services/status` - All services status
- `GET /api/services/:service/details` - Service details

## 🔍 Supported Services

- **api** - Frisk-API (Python/FastAPI on ports 10001-10003)
- **ui** - Frisk-UI (Next.js on port 10000)  
- **notification** - Frisk-Notification-Service (Node.js)

## 📱 WebSocket Events

Connect to `ws://localhost:5000` for real-time updates:

- `FILE_ADDED` - New log file created
- `LOG_UPDATED` - Log file modified
- `CRITICAL_ERROR_ALERT` - Critical error detected
- `FILE_DELETED` - Log file removed

## ⚡ Error Patterns Detected

- **Network**: Connection failures, DNS issues, timeouts
- **Build**: Compilation errors, syntax issues, module problems
- **Package Manager**: Missing npm/pnpm/yarn, install failures
- **Service**: Port conflicts, permission issues, crashes
- **Git**: Repository access, merge conflicts

## 🎯 Why No Database?

This system uses **in-memory storage** and **file-based operations** because:

1. **Simplicity**: No database setup or maintenance required
2. **Performance**: Direct file system access for log reading
3. **Stateless**: Each request processes logs independently  
4. **Scalability**: Easy to run multiple instances
5. **Security**: No database credentials or user management needed

## 🚨 Error Levels

- **CRITICAL**: System crashes, fatal errors, emergency situations
- **ERROR**: Failed operations, exceptions, connection refusals  
- **WARNING**: Potential issues, deprecations, retries
- **INFO**: Normal operations, startup messages, success
- **DEBUG**: Detailed diagnostic information

## 🏥 Health Check

Visit `http://localhost:5000/health` to verify the system is running correctly.

## 📋 Next Steps

1. **Install dependencies**: `npm install`
2. **Configure paths**: Update `.env` with your actual log paths
3. **Add OpenAI key**: For AI-powered analysis features
4. **Start monitoring**: `npm run dev`
5. **Import Postman collection**: Use provided collection for testing