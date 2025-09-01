// src/services/recentPathsService.js - In-Memory Storage
// ==========================================
class RecentPathsService {
  constructor() {
    this.recentPaths = new Map();
    this.pathHistory = [];
  }

  // Store recent path with user info
  storeRecentPath(filePath, fileName, userInfo = 'developer') {
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
      pathType: this.detectPathType(filePath)
    };

    this.recentPaths.set(pathKey, pathData);
    
    // Add to history (keep last 50)
    this.pathHistory.unshift({
      ...pathData,
      id: Date.now()
    });
    
    if (this.pathHistory.length > 50) {
      this.pathHistory = this.pathHistory.slice(0, 50);
    }

    // Keep only recent 20 in main map
    if (this.recentPaths.size > 20) {
      const oldestKey = Array.from(this.recentPaths.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0];
      this.recentPaths.delete(oldestKey);
    }

    return pathData;
  }

  detectPathType(filePath) {
    if (filePath.includes('Frisk-API')) return 'API Service';
    if (filePath.includes('Frisk-UI')) return 'UI Service';
    if (filePath.includes('Frisk-Adapter')) return 'Adapter Service';
    if (filePath.includes('Frisk-FTP')) return 'FTP Service';
    if (filePath.includes('Frisk-Notification')) return 'Notification Service';
    return 'Other';
  }

  // Get recent paths (most used first)
  getRecentPaths() {
    return Array.from(this.recentPaths.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  // Get popular paths (by access count)
  getPopularPaths() {
    return Array.from(this.recentPaths.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);
  }

  // Get path history
  getPathHistory() {
    return this.pathHistory;
  }

  // Clear all stored paths
  clearAllPaths() {
    this.recentPaths.clear();
    this.pathHistory = [];
    return true;
  }

  // Search in recent paths
  searchRecentPaths(query) {
    const lowQuery = query.toLowerCase();
    return Array.from(this.recentPaths.values()).filter(path => 
      path.filePath.toLowerCase().includes(lowQuery) ||
      path.fileName.toLowerCase().includes(lowQuery) ||
      path.pathType.toLowerCase().includes(lowQuery)
    );
  }
}

// Single instance for the app
export const recentPathsService = new RecentPathsService();
