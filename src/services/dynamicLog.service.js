// ==========================================
// Enhanced src/services/dynamicLog.service.js
// ==========================================
import fs from "fs-extra";
import path from "path";
import { parseLogTimestamp, formatDate } from "../utils/dateUtils.js";
import { recentPathsService } from "./recentPathsService.js";

export class DynamicLogService {
  constructor() {
    this.supportedExtensions = [".log", ".txt", ".out", ".err", ".json"];
    this.cache = new Map(); // Simple file cache
  }

  async getLogsByPath(filePath, fileName, options = {}) {
    try {
      const {
        limit = 100,
        offset = 0,
        level,
        userInfo = "developer",
      } = options;

      console.log("🚀 Starting getLogsByPath with:", filePath);

      // 🔧 Use the smart path handler instead of normalizeNetworkPath
      const normalizedPath = this.smartPathHandler(filePath);

      console.log("🔍 Checking path existence:", normalizedPath);

      if (!(await fs.pathExists(normalizedPath))) {
        // Try alternative path formats if first fails
        const alternatives = [
          filePath, // Original path
          filePath.replace(/\\{4}/g, "\\\\"), // Reduce quad backslashes
          filePath.replace(/\\{2}/g, "\\"), // Single backslashes
          filePath.replace(/\\\\/g, "\\"), // Remove double backslashes
        ];

        console.log("🔍 Trying alternative paths:");
        for (let altPath of alternatives) {
          console.log("   Testing:", altPath);
          if (await fs.pathExists(altPath)) {
            console.log("✅ Found working path:", altPath);
            normalizedPath = altPath;
            break;
          }
        }

        // If still not found, return detailed error
        if (!(await fs.pathExists(normalizedPath))) {
          return {
            success: false,
            error: "Directory not found after trying multiple path formats",
            path: normalizedPath,
            originalPath: filePath,
            alternatives: alternatives,
            troubleshooting: [
              "Check if network share is accessible",
              "Verify path format (UNC: \\\\server\\share)",
              "Test path manually in Windows Explorer",
              "Check network connectivity to server",
            ],
          };
        }
      }

      // Rest of the method remains same...
      let targetFile;
      let fullPath;

      if (fileName) {
        fullPath = path.join(normalizedPath, fileName);
        if (!(await fs.pathExists(fullPath))) {
          return {
            success: false,
            error: "File not found",
            path: fullPath,
            suggestion:
              "Check if file name is correct or try browsing directory first",
          };
        }
        targetFile = fileName;
      } else {
        const files = await this.getLogFiles(normalizedPath);
        if (files.length === 0) {
          return {
            success: false,
            error: "No log files found in directory",
            path: normalizedPath,
          };
        }
        targetFile = files[0].name;
        fullPath = path.join(normalizedPath, targetFile);
      }

      // Store in recent paths
      recentPathsService.storeRecentPath(filePath, targetFile, userInfo);

      const content = await fs.readFile(fullPath, "utf-8");
      const allLogs = this.parseLogContent(content, targetFile);

      let filteredLogs = level
        ? allLogs.filter((log) => log.level === level)
        : allLogs;

      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        file: targetFile,
        originalPath: filePath,
        normalizedPath,
        fullPath,
        logs: paginatedLogs,
        summary: {
          totalLines: allLogs.length,
          filteredLines: filteredLogs.length,
          displayedLines: paginatedLogs.length,
          fileSize: stats.size,
          fileSizeFormatted: this.formatBytes(stats.size),
          lastModified: formatDate(stats.mtime),
          created: formatDate(stats.birthtime),
        },
        pagination: {
          offset,
          limit,
          total: filteredLogs.length,
          hasMore: offset + limit < filteredLogs.length,
        },
        statistics: this.calculateLogStatistics(allLogs),
        pathInfo: {
          originalPath: filePath,
          processedPath: normalizedPath,
          pathWorked: true,
          isNetworkPath: normalizedPath.startsWith("\\\\"),
          pathType: recentPathsService.detectPathType(filePath),
        },
      };
    } catch (error) {
      console.error("❌ Error reading log file:", error);
      return {
        success: false,
        error: error.message,
        path: filePath,
        details: {
          errorType: error.code,
          errorMessage: error.message,
        },
        troubleshooting: [
          "Check if network path is accessible",
          "Verify file permissions",
          "Ensure file is not locked by another process",
          "Test path manually in Windows Explorer",
        ],
      };
    }
  }
  // Normalize network paths for Windows
  normalizeNetworkPath(filePath) {
    if (!filePath) return filePath;

    console.log("🔍 Original path:", filePath);
    console.log("🔍 Path length:", filePath.length);
    console.log("🔍 First 8 chars:", filePath.substring(0, 8));

    // Remove any extra escaping that might come from UI
    let normalizedPath = filePath;

    // If path has multiple consecutive backslashes, normalize them
    if (filePath.includes("\\\\\\\\")) {
      // Replace quad backslashes with double backslashes
      normalizedPath = filePath.replace(/\\{4,}/g, "\\\\");
      console.log("🔧 Removed extra backslashes:", normalizedPath);
    }

    // Ensure proper UNC path format (exactly 2 leading backslashes)
    if (
      normalizedPath.startsWith("\\\\") &&
      !normalizedPath.startsWith("\\\\\\")
    ) {
      // Path is already correct
      console.log("✅ Path is already in correct UNC format");
      return normalizedPath;
    }

    // If path starts with single backslash, make it UNC
    if (normalizedPath.startsWith("\\") && !normalizedPath.startsWith("\\\\")) {
      normalizedPath = "\\" + normalizedPath;
      console.log("🔧 Converted to UNC path:", normalizedPath);
    }

    // If it's a local path (like C:\), don't modify
    if (normalizedPath.match(/^[A-Z]:\\/)) {
      console.log("✅ Local path detected, no changes needed");
      return normalizedPath;
    }

    console.log("🎯 Final normalized path:", normalizedPath);
    return normalizedPath;
  }

  // 🔧 ALTERNATIVE: Simple path cleaner
  cleanNetworkPath(filePath) {
    if (!filePath) return filePath;

    // Remove excessive backslashes and normalize
    const cleaned = filePath
      .replace(/\\{3,}/g, "\\\\") // Replace 3+ backslashes with 2
      .replace(/\\\\/g, "\\\\"); // Ensure consistent double backslashes

    console.log("🧹 Cleaned path:", cleaned);
    return cleaned;
  }

  // 🔧 BEST APPROACH: Smart path handler
  smartPathHandler(filePath) {
    if (!filePath) return filePath;

    console.log("📥 Input path:", filePath);
    console.log("📥 Input type:", typeof filePath);
    console.log("📥 Starts with \\\\:", filePath.startsWith("\\\\"));

    // Handle different path formats
    let processedPath = filePath;

    // 1. If it's already a proper UNC path, use as-is
    if (filePath.match(/^\\\\[^\\]+\\/)) {
      console.log("✅ Valid UNC path detected");
      return filePath;
    }

    // 2. If it has excessive backslashes from JSON escaping
    if (filePath.includes("\\\\\\\\")) {
      processedPath = filePath.replace(/\\{4}/g, "\\\\");
      console.log("🔧 Fixed JSON escaping:", processedPath);
    }

    // 3. If it's a local Windows path
    if (filePath.match(/^[A-Z]:\\\\/)) {
      processedPath = filePath.replace(/\\\\/g, "\\");
      console.log("🔧 Fixed local path:", processedPath);
    }

    console.log("🎯 Final processed path:", processedPath);
    return processedPath;
  }

  async getFilesInDirectory(directoryPath, userInfo = "developer") {
    try {
      const normalizedPath = this.normalizeNetworkPath(directoryPath);

      if (!(await fs.pathExists(normalizedPath))) {
        return {
          success: false,
          error: "Directory not found",
          path: normalizedPath,
          originalPath: directoryPath,
        };
      }

      const items = await fs.readdir(normalizedPath, { withFileTypes: true });
      const files = [];
      let totalSize = 0;

      for (const item of items) {
        if (item.isFile()) {
          const filePath = path.join(normalizedPath, item.name);
          try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(item.name).toLowerCase();

            files.push({
              name: item.name,
              extension: ext,
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size),
              created: formatDate(stats.birthtime),
              modified: formatDate(stats.mtime),
              isLogFile: this.supportedExtensions.includes(ext),
              canAccess: true,
            });

            totalSize += stats.size;
          } catch (statError) {
            // File might be locked or permissions issue
            files.push({
              name: item.name,
              extension: path.extname(item.name).toLowerCase(),
              size: 0,
              sizeFormatted: "Unknown",
              created: null,
              modified: null,
              isLogFile: this.supportedExtensions.includes(
                path.extname(item.name).toLowerCase()
              ),
              canAccess: false,
              error: "Access denied or file locked",
            });
          }
        }
      }

      files.sort(
        (a, b) => new Date(b.modified || 0) - new Date(a.modified || 0)
      );
      const logFiles = files.filter((f) => f.isLogFile);

      // Store directory access
      recentPathsService.storeRecentPath(
        directoryPath,
        "[Directory Browse]",
        userInfo
      );

      return {
        success: true,
        originalPath: directoryPath,
        normalizedPath,
        files,
        logFiles,
        summary: {
          totalFiles: files.length,
          totalLogFiles: logFiles.length,
          accessibleFiles: files.filter((f) => f.canAccess).length,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
          oldestFile: files[files.length - 1]?.name,
          newestFile: files[0]?.name,
        },
      };
    } catch (error) {
      console.error("Error reading directory:", error);
      return {
        success: false,
        error: error.message,
        originalPath: directoryPath,
        troubleshooting: [
          "Check if network path is accessible",
          "Verify directory permissions",
          "Try accessing the directory manually first",
        ],
      };
    }
  }

  // Get real-time logs (for auto-refresh)
  async getLatestLogs(filePath, fileName, lastTimestamp = null, limit = 50) {
    try {
      const result = await this.getLogsByPath(filePath, fileName, {
        limit: 1000,
      });

      if (!result.success) {
        return result;
      }

      let latestLogs = result.logs;

      // Filter by timestamp if provided
      if (lastTimestamp) {
        latestLogs = latestLogs.filter(
          (log) => new Date(log.timestamp) > new Date(lastTimestamp)
        );
      }

      return {
        success: true,
        file: result.file,
        newLogs: latestLogs.slice(0, limit),
        hasNewLogs: latestLogs.length > 0,
        totalNewLogs: latestLogs.length,
        lastTimestamp: latestLogs[0]?.timestamp || lastTimestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Rest of the methods remain the same...
  parseLogContent(content, fileName) {
    const lines = content.split("\n").filter((line) => line.trim());
    const logs = [];

    for (let i = 0; i < lines.length; i++) {
      const parsedLog = this.parseLogLine(lines[i], i + 1, fileName);
      if (parsedLog) {
        logs.push(parsedLog);
      }
    }

    return logs.reverse(); // Show newest first
  }

  parseLogLine(line, lineNumber, fileName) {
    const timestamp = parseLogTimestamp(line);
    let message = line.trim();

    const timestampPatterns = [
      /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /^\[(\d{2}:\d{2}:\d{2})\]/,
      /^(\d{2}:\d{2}:\d{2})/,
    ];

    for (const pattern of timestampPatterns) {
      const match = line.match(pattern);
      if (match) {
        message = line.substring(match[0].length).trim();
        break;
      }
    }

    const level = this.detectLogLevel(message);

    return {
      id: `${fileName}-${lineNumber}`,
      lineNumber,
      timestamp,
      message,
      level,
      raw: line,
      fileName,
      isError: ["ERROR", "CRITICAL"].includes(level),
      isWarning: level === "WARNING",
      color: this.getLogColor(level),
      severity: this.getLogSeverity(level),
    };
  }

  detectLogLevel(message) {
    const lowerMessage = message.toLowerCase();

    const patterns = {
      CRITICAL: ["fatal", "critical", "crash", "abort", "emergency", "panic"],
      ERROR: ["error", "failed", "failure", "exception", "traceback", "stderr"],
      WARNING: ["warning", "warn", "deprecated", "timeout", "retry"],
      INFO: ["info", "starting", "started", "success", "completed", "finished"],
    };

    for (const [level, keywords] of Object.entries(patterns)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return level;
      }
    }

    return "DEBUG";
  }

  calculateLogStatistics(logs) {
    const stats = {
      total: logs.length,
      byLevel: {},
      timeRange: {},
      topErrors: [],
      recentActivity: [],
    };

    logs.forEach((log) => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    // Get recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    stats.recentActivity = logs.filter(
      (log) => new Date(log.timestamp) > oneHourAgo
    ).length;

    const timestamps = logs
      .map((log) => log.timestamp)
      .filter((ts) => !isNaN(Date.parse(ts)))
      .sort();

    if (timestamps.length > 0) {
      stats.timeRange = {
        earliest: timestamps[0],
        latest: timestamps[timestamps.length - 1],
      };
    }

    const errorMessages = {};
    logs
      .filter((log) => log.isError || log.isWarning)
      .forEach((log) => {
        const shortMsg = log.message.substring(0, 100);
        errorMessages[shortMsg] = (errorMessages[shortMsg] || 0) + 1;
      });

    stats.topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([msg, count]) => ({ message: msg, count }));

    return stats;
  }

  async getLogFiles(directoryPath) {
    const items = await fs.readdir(directoryPath, { withFileTypes: true });
    const files = [];

    for (const item of items) {
      if (
        item.isFile() &&
        this.supportedExtensions.includes(path.extname(item.name).toLowerCase())
      ) {
        const filePath = path.join(directoryPath, item.name);
        try {
          const stats = await fs.stat(filePath);
          files.push({
            name: item.name,
            modified: stats.mtime,
            size: stats.size,
          });
        } catch (error) {
          // Skip files we can't access
          continue;
        }
      }
    }

    return files.sort((a, b) => b.modified - a.modified);
  }

  getLogColor(level) {
    const colors = {
      CRITICAL: "#ff0000",
      ERROR: "#ff6b6b",
      WARNING: "#ffa500",
      INFO: "#4dabf7",
      DEBUG: "#868e96",
    };
    return colors[level] || "#212529";
  }

  getLogSeverity(level) {
    const severities = {
      CRITICAL: 5,
      ERROR: 4,
      WARNING: 3,
      INFO: 2,
      DEBUG: 1,
    };
    return severities[level] || 0;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
    );
  }
}
