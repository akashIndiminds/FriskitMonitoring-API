# 🔥 README.md (Clean Documentation)

# 🚀 Dynamic Log Analyzer

Universal log analysis system that can analyze logs from any file path dynamically.

## ✨ Features

- 📁 **Any File Path**: Works with any directory and file path
- 🔍 **Smart Parsing**: Supports .log, .txt, .out, .err files
- 🎯 **Advanced Search**: Text search with highlighting
- 📊 **Error Analysis**: Automatic error categorization and insights
- 📈 **Statistics**: Detailed log statistics and trends
- 🕒 **Date Range**: Process multiple files by date range
- 🔄 **Real-time**: Tail functionality for live log monitoring

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd dynamic-log-analyzer
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start server
npm run dev    # Development
npm start      # Production
```

## 📡 API Endpoints

### Get Logs from File

```bash
POST /api/logs/files
{
  "filePath": "C:\\logs\\myapp",
  "fileName": "app.log",
  "limit": 100,
  "level": "ERROR"
}
```

### Browse Directory

```bash
POST /api/logs/directory
{
  "directoryPath": "C:\\logs\\myapp"
}
```

### Date Range Analysis

```bash
POST /api/logs/date-range
{
  "directoryPath": "C:\\logs\\myapp",
  "startDate": "2024-08-25",
  "endDate": "2024-08-30"
}
```

### Search Logs

```bash
POST /api/logs/search
{
  "filePath": "C:\\logs\\myapp",
  "fileName": "app.log",
  "searchQuery": "connection failed"
}
```

### Analyze Errors

```bash
POST /api/logs/analyze
{
  "filePath": "C:\\logs\\myapp",
  "fileName": "app.log"
}
```

## 🔧 Configuration

Environment variables:

```env
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=104857600
MAX_FILES=1000
```

## 📊 Response Format

All APIs return consistent JSON responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-08-30T12:00:00Z"
}
```

## 🛡️ Security

- Rate limiting (200 requests per 15 minutes)
- Input validation and sanitization
- Path traversal protection
- File size limits

## 📈 Monitoring

- Health check: `GET /api/health`
- API info: `GET /api/info`
- Request logging with Morgan
- Error tracking and reporting
