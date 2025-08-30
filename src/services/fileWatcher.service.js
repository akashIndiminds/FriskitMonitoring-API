import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs-extra';
import { config } from '../config/index.js';
import { LogParserService } from './logParser.service.js';
import { ErrorAnalyzerService } from './errorAnalyzer.service.js';

export class FileWatcherService {
  constructor() {
    this.watchers = new Map();
    this.logParser = new LogParserService();
    this.errorAnalyzer = new ErrorAnalyzerService();
    this.isWatching = false;
    this.retryAttempts = new Map(); // Track retry attempts per service
    this.maxRetries = 3; // Maximum retry attempts
    this.retryDelay = 10000; // 10 seconds delay between retries
  }

  startWatching() {
    if (this.isWatching) {
      console.log('🔍 File watcher is already running');
      return;
    }

    console.log('🔍 Starting file watchers for Friskit services...');
    this.isWatching = true;

    // First, test network connectivity
    this.testNetworkConnectivity().then(accessible => {
      if (!accessible) {
        console.warn('⚠️ Network paths not accessible. File watcher will be disabled.');
        this.broadcastToClients({
          type: 'WATCHER_WARNING',
          message: 'Network paths not accessible. File watching disabled.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Start watching each service
      Object.entries(config.friskit.services).forEach(([serviceName, serviceConfig]) => {
        this.watchService(serviceName, serviceConfig);
      });
    });

    // Set global reference for cleanup
    global.fileWatcher = this;
  }

  async testNetworkConnectivity() {
    try {
      const basePath = config.friskit.logsBasePath;
      console.log(`🔍 Testing network connectivity to: ${basePath}`);
      
      const exists = await fs.pathExists(basePath);
      if (exists) {
        console.log('✅ Network path accessible');
        return true;
      } else {
        console.warn('❌ Network path not found');
        return false;
      }
    } catch (error) {
      console.warn(`❌ Network connectivity test failed:`, error.message);
      return false;
    }
  }

  async watchService(serviceName, serviceConfig) {
    try {
      const watchPath = serviceConfig.logPath;
      
      // Test if this specific service path exists
      const pathExists = await fs.pathExists(watchPath);
      if (!pathExists) {
        console.warn(`⚠️ Path not found for ${serviceName}: ${watchPath}`);
        this.broadcastToClients({
          type: 'SERVICE_PATH_NOT_FOUND',
          service: serviceName,
          path: watchPath,
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`📁 Watching ${serviceName} logs at: ${watchPath}`);

      const watcher = chokidar.watch(`${watchPath}/*.log`, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 500
        },
        // Specific settings for network paths
        usePolling: true,  // Use polling for network drives
        interval: 5000,    // Poll every 5 seconds
        binaryInterval: 10000 // Binary file polling interval
      });

      watcher
        .on('add', (filePath) => this.onFileAdded(serviceName, filePath))
        .on('change', (filePath) => this.onFileChanged(serviceName, filePath))
        .on('unlink', (filePath) => this.onFileDeleted(serviceName, filePath))
        .on('error', (error) => {
          this.handleWatcherError(serviceName, error);
        })
        .on('ready', () => {
          console.log(`✅ File watcher ready for ${serviceName}`);
          // Reset retry count on successful connection
          this.retryAttempts.delete(serviceName);
        });

      this.watchers.set(serviceName, watcher);

    } catch (error) {
      console.error(`❌ Failed to setup watcher for ${serviceName}:`, error.message);
      this.handleWatcherError(serviceName, error);
    }
  }

  async onFileAdded(serviceName, filePath) {
    try {
      console.log(`📄 New log file added: ${path.basename(filePath)} for ${serviceName}`);
      
      this.broadcastToClients({
        type: 'FILE_ADDED',
        service: serviceName,
        filePath: path.basename(filePath),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling file addition:', error.message);
    }
  }

  async onFileChanged(serviceName, filePath) {
    try {
      const fileName = path.basename(filePath, '.log');
      console.log(`📝 Log file updated: ${fileName} (${serviceName})`);
      
      // Debounce rapid changes
      const debounceKey = `${serviceName}-${fileName}`;
      clearTimeout(this.changeTimeouts?.[debounceKey]);
      
      this.changeTimeouts = this.changeTimeouts || {};
      this.changeTimeouts[debounceKey] = setTimeout(async () => {
        await this.processFileChange(serviceName, fileName);
      }, 3000); // Wait 3 seconds before processing

    } catch (error) {
      console.error('Error handling file change:', error.message);
    }
  }

  async processFileChange(serviceName, fileName) {
    try {
      const date = this.extractDateFromFilename(fileName);
      
      if (!date) {
        console.warn(`Could not extract date from filename: ${fileName}`);
        return;
      }

      // Broadcast simple update first
      this.broadcastToClients({
        type: 'LOG_UPDATED',
        service: serviceName,
        fileName: fileName,
        date: date,
        timestamp: new Date().toISOString()
      });

      // Perform analysis in background (don't wait)
      this.performBackgroundAnalysis(serviceName, date).catch(error => {
        console.warn(`Background analysis failed for ${serviceName}:`, error.message);
      });

    } catch (error) {
      console.error('Error processing file change:', error.message);
    }
  }

  async performBackgroundAnalysis(serviceName, date) {
    try {
      const analysis = await this.errorAnalyzer.analyzeLogsForErrors(serviceName, date);
      
      if (analysis.totalErrors > 0) {
        this.broadcastToClients({
          type: 'ANALYSIS_UPDATE',
          service: serviceName,
          date: date,
          errorCount: analysis.totalErrors,
          status: analysis.analysis?.summary?.overallStatus || 'UNKNOWN',
          timestamp: new Date().toISOString()
        });

        // Only send critical alerts if there are actual critical errors
        if (analysis.analysis?.summary?.criticalIssuesFound) {
          this.sendCriticalAlert(serviceName, analysis, date);
        }
      }
    } catch (error) {
      // Silent fail for background analysis
      console.warn(`Background analysis failed:`, error.message);
    }
  }

  onFileDeleted(serviceName, filePath) {
    const fileName = path.basename(filePath);
    console.log(`🗑️ Log file deleted: ${fileName} for ${serviceName}`);
    
    this.broadcastToClients({
      type: 'FILE_DELETED',
      service: serviceName,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  sendCriticalAlert(serviceName, analysis, date) {
    try {
      // Extract critical errors from all categories
      const criticalErrors = [];
      
      if (analysis.categorizedErrors) {
        Object.values(analysis.categorizedErrors).forEach(categoryErrors => {
          const criticals = categoryErrors.filter(error => error.level === 'CRITICAL');
          criticalErrors.push(...criticals.slice(0, 2)); // Max 2 per category
        });
      }

      if (criticalErrors.length > 0) {
        this.broadcastToClients({
          type: 'CRITICAL_ERROR_ALERT',
          service: serviceName,
          date: date,
          criticalCount: criticalErrors.length,
          sample: criticalErrors[0]?.message?.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending critical alert:', error.message);
    }
  }

  extractDateFromFilename(fileName) {
    // Try different date formats
    const datePatterns = [
      /^(\d{4}-\d{2}-\d{2})$/,           // 2025-08-30
      /^(\d{4}_\d{2}_\d{2})$/,           // 2025_08_30
      /^(\d{8})$/,                       // 20250830
      /.*(\d{4}-\d{2}-\d{2}).*/          // Any string containing YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
      const match = fileName.match(pattern);
      if (match) {
        let dateStr = match[1];
        dateStr = dateStr.replace(/_/g, '-');
        
        if (dateStr.length === 8 && !dateStr.includes('-')) {
          dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  handleWatcherError(serviceName, error) {
    const currentRetries = this.retryAttempts.get(serviceName) || 0;
    
    if (currentRetries >= this.maxRetries) {
      console.error(`❌ Max retries reached for ${serviceName}. Stopping attempts.`);
      this.retryAttempts.delete(serviceName);
      
      this.broadcastToClients({
        type: 'WATCHER_FAILED',
        service: serviceName,
        error: 'Max retry attempts reached',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    console.warn(`⚠️ Watcher error for ${serviceName} (attempt ${currentRetries + 1}/${this.maxRetries}):`, error.message);
    this.retryAttempts.set(serviceName, currentRetries + 1);

    // Only retry after a delay and if not at max retries
    setTimeout(() => {
      if (this.retryAttempts.get(serviceName) <= this.maxRetries) {
        console.log(`🔄 Retrying watcher for ${serviceName}...`);
        const serviceConfig = config.friskit.services[serviceName];
        if (serviceConfig) {
          this.watchService(serviceName, serviceConfig);
        }
      }
    }, this.retryDelay);
  }

  broadcastToClients(message) {
    if (global.wss && global.wss.clients) {
      const clientCount = global.wss.clients.size;
      
      if (clientCount > 0) {
        global.wss.clients.forEach(client => {
          try {
            if (client.readyState === 1) {
              client.send(JSON.stringify(message));
            }
          } catch (error) {
            // Silent fail for WebSocket errors
          }
        });
        
        // Only log important events
        if (['CRITICAL_ERROR_ALERT', 'WATCHER_FAILED', 'WATCHER_WARNING'].includes(message.type)) {
          console.log(`📡 Sent ${message.type} to ${clientCount} clients`);
        }
      }
    }
  }

  stopWatching() {
    if (!this.isWatching) {
      return;
    }

    console.log('🛑 Stopping file watchers...');
    
    // Clear all timeouts
    if (this.changeTimeouts) {
      Object.values(this.changeTimeouts).forEach(timeout => clearTimeout(timeout));
      this.changeTimeouts = {};
    }
    
    this.watchers.forEach((watcher, serviceName) => {
      try {
        watcher.close();
        console.log(`✅ Stopped watching ${serviceName}`);
      } catch (error) {
        console.warn(`⚠️ Error stopping watcher for ${serviceName}:`, error.message);
      }
    });
    
    this.watchers.clear();
    this.retryAttempts.clear();
    this.isWatching = false;
    
    console.log('🛑 All file watchers stopped');
  }

  getStatus() {
    return {
      isWatching: this.isWatching,
      activeWatchers: Array.from(this.watchers.keys()),
      watcherCount: this.watchers.size,
      retryAttempts: Object.fromEntries(this.retryAttempts)
    };
  }
}