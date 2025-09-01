// src/services/persistentRecentPaths.service.js - JSON File Storage Solution
// ==========================================
import fs from 'fs-extra';
import path from 'path';

class PersistentRecentPathsService {
  constructor() {
    this.recentPaths = new Map();
    this.pathHistory = [];
    this.storageFile = path.join(process.cwd(), 'storage', 'recent-paths.json');
    this.maxRecentPaths = 20;
    this.maxHistoryPaths = 50;
    
    // Initialize storage and load existing data
    this.initializeStorage();
  }

  // Initialize storage directory and load existing data
  async initializeStorage() {
    try {
      // Create storage directory if it doesn't exist
      const storageDir = path.dirname(this.storageFile);
      await fs.ensureDir(storageDir);

      // Load existing data if file exists
      if (await fs.pathExists(this.storageFile)) {
        await this.loadFromFile();
        console.log(`📁 Loaded ${this.recentPaths.size} recent paths from storage`);
      } else {
        // Create empty storage file
        await this.saveToFile();
        console.log('📁 Created new recent paths storage file');
      }
    } catch (error) {
      console.error('❌ Error initializing recent paths storage:', error.message);
    }
  }

  // Load data from JSON file
  async loadFromFile() {
    try {
      const data = await fs.readJson(this.storageFile);
      
      // Restore recent paths Map
      if (data.recentPaths && Array.isArray(data.recentPaths)) {
        this.recentPaths.clear();
        data.recentPaths.forEach(([key, value]) => {
          // Add lastAccessed as Date object
          value.lastAccessed = new Date(value.lastAccessed);
          this.recentPaths.set(key, value);
        });
      }

      // Restore path history
      if (data.pathHistory && Array.isArray(data.pathHistory)) {
        this.pathHistory = data.pathHistory.map(path => ({
          ...path,
          lastAccessed: new Date(path.lastAccessed)
        }));
      }

      return true;
    } catch (error) {
      console.error('❌ Error loading recent paths from file:', error.message);
      return false;
    }
  }

  // Save data to JSON file
  async saveToFile() {
    try {
      const data = {
        recentPaths: Array.from(this.recentPaths.entries()),
        pathHistory: this.pathHistory,
        lastSaved: new Date().toISOString(),
        totalPaths: this.recentPaths.size,
        metadata: {
          version: '1.0.0',
          maxRecentPaths: this.maxRecentPaths,
          maxHistoryPaths: this.maxHistoryPaths
        }
      };

      await fs.writeJson(this.storageFile, data, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('❌ Error saving recent paths to file:', error.message);
      return false;
    }
  }

  // Store recent path with user info (with persistence)
  async storeRecentPath(filePath, fileName, userInfo = 'developer') {
    const pathKey = `${filePath}\\${fileName}`;
    const timestamp = new Date();
    
    const pathData = {
      filePath,
      fileName,
      fullPath: pathKey,
      userInfo,
      lastAccessed: timestamp,
      accessCount: (this.recentPaths.get(pathKey)?.accessCount || 0) + 1,
      isNetworkPath: filePath.startsWith('\\\\'),
      pathType: this.detectPathType(filePath),
      id: Date.now(),
      storedAt: timestamp
    };

    // Store in memory
    this.recentPaths.set(pathKey, pathData);
    
    // Add to history (keep last 50)
    this.pathHistory.unshift({
      ...pathData,
      id: Date.now()
    });
    
    if (this.pathHistory.length > this.maxHistoryPaths) {
      this.pathHistory = this.pathHistory.slice(0, this.maxHistoryPaths);
    }

    // Keep only recent paths in main map
    if (this.recentPaths.size > this.maxRecentPaths) {
      const oldestKey = Array.from(this.recentPaths.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0];
      this.recentPaths.delete(oldestKey);
    }

    // Persist to file
    await this.saveToFile();
    
    console.log(`📁 Stored recent path: ${fileName} (Total: ${this.recentPaths.size})`);
    return pathData;
  }

  detectPathType(filePath) {
    if (filePath.includes('Frisk-API')) return 'API Service';
    if (filePath.includes('Frisk-UI')) return 'UI Service';
    if (filePath.includes('Frisk-Adapter')) return 'Adapter Service';
    if (filePath.includes('Frisk-FTP')) return 'FTP Service';
    if (filePath.includes('Frisk-Notification')) return 'Notification Service';
    if (filePath.includes('logs')) return 'Log Files';
    if (filePath.includes('config')) return 'Configuration';
    return 'Other';
  }

  // Get recent paths (most used first)
  getRecentPaths() {
    return Array.from(this.recentPaths.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .map(path => ({
        ...path,
        lastAccessed: path.lastAccessed.toISOString(),
        timeAgo: this.getTimeAgo(path.lastAccessed)
      }));
  }

  // Get popular paths (by access count)
  getPopularPaths() {
    return Array.from(this.recentPaths.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(path => ({
        ...path,
        lastAccessed: path.lastAccessed.toISOString(),
        timeAgo: this.getTimeAgo(path.lastAccessed)
      }));
  }

  // Get path history
  getPathHistory() {
    return this.pathHistory.map(path => ({
      ...path,
      lastAccessed: path.lastAccessed.toISOString(),
      timeAgo: this.getTimeAgo(path.lastAccessed)
    }));
  }

  // Get storage statistics
  getStorageStats() {
    return {
      totalRecentPaths: this.recentPaths.size,
      totalHistoryPaths: this.pathHistory.length,
      storageFile: this.storageFile,
      lastSaved: this.lastSaved,
      pathTypes: this.getPathTypeDistribution(),
      userDistribution: this.getUserDistribution(),
      accessPatterns: this.getAccessPatterns()
    };
  }

  getPathTypeDistribution() {
    const distribution = {};
    Array.from(this.recentPaths.values()).forEach(path => {
      distribution[path.pathType] = (distribution[path.pathType] || 0) + 1;
    });
    return distribution;
  }

  getUserDistribution() {
    const distribution = {};
    Array.from(this.recentPaths.values()).forEach(path => {
      distribution[path.userInfo] = (distribution[path.userInfo] || 0) + 1;
    });
    return distribution;
  }

  getAccessPatterns() {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const patterns = {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      older: 0
    };

    Array.from(this.recentPaths.values()).forEach(path => {
      const timeDiff = now - path.lastAccessed;
      if (timeDiff < oneHour) patterns.lastHour++;
      else if (timeDiff < oneDay) patterns.lastDay++;
      else if (timeDiff < oneWeek) patterns.lastWeek++;
      else patterns.older++;
    });

    return patterns;
  }

  // Clear all stored paths
  async clearAllPaths() {
    try {
      this.recentPaths.clear();
      this.pathHistory = [];
      await this.saveToFile();
      console.log('🗑️ Cleared all recent paths from storage');
      return true;
    } catch (error) {
      console.error('❌ Error clearing recent paths:', error.message);
      return false;
    }
  }

  // Search in recent paths
  searchRecentPaths(query) {
    const lowQuery = query.toLowerCase();
    return Array.from(this.recentPaths.values())
      .filter(path => 
        path.filePath.toLowerCase().includes(lowQuery) ||
        path.fileName.toLowerCase().includes(lowQuery) ||
        path.pathType.toLowerCase().includes(lowQuery) ||
        path.userInfo.toLowerCase().includes(lowQuery)
      )
      .map(path => ({
        ...path,
        lastAccessed: path.lastAccessed.toISOString(),
        timeAgo: this.getTimeAgo(path.lastAccessed)
      }));
  }

  // Remove specific path
  async removeRecentPath(pathKey) {
    try {
      if (this.recentPaths.has(pathKey)) {
        this.recentPaths.delete(pathKey);
        // Also remove from history
        this.pathHistory = this.pathHistory.filter(p => p.fullPath !== pathKey);
        await this.saveToFile();
        console.log(`🗑️ Removed path: ${pathKey}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error removing recent path:', error.message);
      return false;
    }
  }

  // Get file contents for debugging
  async getStorageFileContents() {
    try {
      if (await fs.pathExists(this.storageFile)) {
        return await fs.readJson(this.storageFile);
      }
      return null;
    } catch (error) {
      console.error('❌ Error reading storage file:', error.message);
      return null;
    }
  }

  // Helper function to calculate time ago
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Backup storage file
  async createBackup() {
    try {
      const backupFile = `${this.storageFile}.backup.${Date.now()}.json`;
      await fs.copy(this.storageFile, backupFile);
      console.log(`💾 Created backup: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Error creating backup:', error.message);
      return null;
    }
  }

  // Clean up old entries
  async cleanupOldEntries(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let removedCount = 0;
      
      // Clean recent paths
      for (const [key, path] of this.recentPaths.entries()) {
        if (path.lastAccessed < cutoffDate) {
          this.recentPaths.delete(key);
          removedCount++;
        }
      }

      // Clean history
      const initialHistoryCount = this.pathHistory.length;
      this.pathHistory = this.pathHistory.filter(path => path.lastAccessed >= cutoffDate);
      removedCount += initialHistoryCount - this.pathHistory.length;

      if (removedCount > 0) {
        await this.saveToFile();
        console.log(`🧹 Cleaned up ${removedCount} old entries (older than ${daysOld} days)`);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old entries:', error.message);
      return 0;
    }
  }
}

// Create and export singleton instance
export const persistentRecentPathsService = new PersistentRecentPathsService();