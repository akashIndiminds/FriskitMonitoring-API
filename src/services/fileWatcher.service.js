import chokidar from 'chokidar';
import { config } from '../config/index.js';
import { LogParserService } from './logParser.service.js';
import { ErrorDetectorService } from './errorDetector.service.js';

export class FileWatcherService {
  constructor() {
    this.watchers = new Map();
    this.logParser = new LogParserService();
    this.errorDetector = new ErrorDetectorService();
  }

  startWatching() {
    console.log('🔍 Starting file watchers for Friskit services...');

    Object.entries(config.friskit.services).forEach(([serviceName, serviceConfig]) => {
      this.watchService(serviceName, serviceConfig);
    });
  }

  watchService(serviceName, serviceConfig) {
    const watchPath = serviceConfig.logPath;
    console.log(`📁 Watching ${serviceName} logs at: ${watchPath}`);

    const watcher = chokidar.watch(`${watchPath}/*.log`, {
      ignored: /[\/\\]\./,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', (filePath) => this.onFileAdded(serviceName, filePath))
      .on('change', (filePath) => this.onFileChanged(serviceName, filePath))
      .on('unlink', (filePath) => this.onFileDeleted(serviceName, filePath))
      .on('error', (error) => console.error(`Watcher error for ${serviceName}:`, error));

    this.watchers.set(serviceName, watcher);
  }

  async onFileAdded(serviceName, filePath) {
    console.log(`📄 New log file added: ${filePath}`);
    this.broadcastToClients({
      type: 'FILE_ADDED',
      service: serviceName,
      filePath,
      timestamp: new Date().toISOString()
    });
  }

  async onFileChanged(serviceName, filePath) {
    console.log(`📝 Log file changed: ${filePath}`);
    
    try {
      // Get the date from filename
      const fileName = path.basename(filePath, '.log');
      const date = fileName;

      // Analyze for new errors
      const analysis = await this.errorDetector.analyzeLogsForErrors(serviceName, date);
      
      // Broadcast real-time updates
      this.broadcastToClients({
        type: 'LOG_UPDATED',
        service: serviceName,
        filePath,
        analysis: analysis.summary,
        timestamp: new Date().toISOString()
      });

      // If critical errors found, send alert
      if (analysis.summary.criticalCount > 0) {
        this.broadcastToClients({
          type: 'CRITICAL_ERROR_ALERT',
          service: serviceName,
          criticalErrors: analysis.errors.critical,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error processing file change:', error);
    }
  }

  onFileDeleted(serviceName, filePath) {
    console.log(`🗑️ Log file deleted: ${filePath}`);
    this.broadcastToClients({
      type: 'FILE_DELETED',
      service: serviceName,
      filePath,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToClients(message) {
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  stopWatching() {
    console.log('🛑 Stopping file watchers...');
    this.watchers.forEach((watcher, serviceName) => {
      watcher.close();
      console.log(`✅ Stopped watching ${serviceName}`);
    });
    this.watchers.clear();
  }
}