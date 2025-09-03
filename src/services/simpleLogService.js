// 📁 FIXED: src/services/simpleLogService.js
// Show ALL files created TODAY (regardless of time)
// ==========================================
import fs from "fs-extra";
import path from "path";

export class SimpleLogService {
  constructor() {
    this.supportedExtensions = [".log", ".txt", ".out", ".err"];
  }

  // 🔥 FIXED: Find today's files properly
  async findTodaysFiles(basePath, targetDate = null) {
    try {
      const searchDate = targetDate ? new Date(targetDate) : new Date();
      const dateStr = searchDate.toISOString().split("T")[0]; // YYYY-MM-DD

      console.log(`🔍 Finding files in: ${basePath}`);
      console.log(`📅 Target date: ${dateStr}`);

      if (!(await fs.pathExists(basePath))) {
        return {
          success: false,
          error: `Path not found: ${basePath}`,
          searchDate: dateStr,
          isCurrentDate: !targetDate,
        };
      }

      const files = await this.scanDirectoryForDateFiles(basePath, searchDate);

      console.log(`📁 Found ${files.length} files for date ${dateStr}`);

      return {
        success: true,
        basePath,
        searchDate: dateStr,
        isCurrentDate: !targetDate,
        files,
        message: `Found ${files.length} files for ${dateStr}`,
      };
    } catch (error) {
      console.error(`❌ Error scanning directory: ${error.message}`);
      return {
        success: false,
        error: error.message,
        basePath,
        searchDate: targetDate || new Date().toISOString().split("T")[0],
      };
    }
  }

  // 🔥 FIXED: Proper date comparison
  async scanDirectoryForDateFiles(dirPath, targetDate) {
    const targetDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const matchingFiles = [];

    console.log(`🔍 Scanning directory: ${dirPath}`);
    console.log(`📅 Looking for files from date: ${targetDateStr}`);

    for (const item of items) {
      if (item.isFile()) {
        const filePath = path.join(dirPath, item.name);
        const ext = path.extname(item.name).toLowerCase();

        // Only process supported file types
        if (this.supportedExtensions.includes(ext)) {
          try {
            const stats = await fs.stat(filePath);
            const fileModifiedDate = stats.mtime.toISOString().split("T")[0];
            const fileModifiedTime = stats.mtime.toISOString();

            console.log(`  📄 ${item.name}`);
            console.log(`     Modified: ${fileModifiedTime}`);
            console.log(`     Date: ${fileModifiedDate}`);
            console.log(`     Target: ${targetDateStr}`);

            // 🔥 FIXED: Compare only date part (not time)
            if (fileModifiedDate === targetDateStr) {
              console.log(`    ✅ MATCH! File is from target date`);

              matchingFiles.push({
                fileName: item.name,
                filePath: filePath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime.toISOString(),
                modifiedDate: fileModifiedDate,
                modifiedTime: stats.mtime.toTimeString().split(" ")[0], // HH:MM:SS
                extension: ext,
                // 🔥 Additional info for debugging
                createdToday:
                  fileModifiedDate === new Date().toISOString().split("T")[0],
                ageInHours: Math.floor(
                  (new Date() - stats.mtime) / (1000 * 60 * 60)
                ),
              });
            } else {
              console.log(
                `    ❌ Skip - Different date (${fileModifiedDate} ≠ ${targetDateStr})`
              );
            }
          } catch (statError) {
            console.warn(
              `⚠️ Cannot access file: ${item.name} - ${statError.message}`
            );
          }
        } else {
          console.log(
            `  📄 ${item.name} - Skipped (unsupported extension: ${ext})`
          );
        }
      }
    }

    // Sort by modified time (newest first)
    const sortedFiles = matchingFiles.sort(
      (a, b) => new Date(b.modified) - new Date(a.modified)
    );

    console.log(
      `📊 Final result: ${sortedFiles.length} files found for ${targetDateStr}`
    );
    if (sortedFiles.length > 0) {
      console.log(`📋 Files included:`);
      sortedFiles.forEach((file, index) => {
        console.log(
          `   ${index + 1}. ${file.fileName} (${file.sizeFormatted}) - ${
            file.modifiedTime
          } (${file.ageInHours}h ago)`
        );
      });
    } else {
      console.log(`❌ No files found for date ${targetDateStr}`);

      // 🔥 DEBUG: Show what files DO exist
      console.log(`🔍 Let me check what files exist in this directory:`);
      for (const item of items) {
        if (
          item.isFile() &&
          this.supportedExtensions.includes(
            path.extname(item.name).toLowerCase()
          )
        ) {
          try {
            const stats = await fs.stat(path.join(dirPath, item.name));
            const fileDate = stats.mtime.toISOString().split("T")[0];
            console.log(
              `   📄 ${item.name} - Date: ${fileDate} (${
                fileDate === targetDateStr ? "MATCHES" : "DIFFERENT"
              })`
            );
          } catch (e) {
            console.log(`   📄 ${item.name} - Cannot read stats`);
          }
        }
      }
    }

    return sortedFiles;
  }

  // 🔥 NEW: Show ALL files (ignore date completely)
  async findAllFiles(basePath) {
    try {
      console.log(
        `🌐 Finding ALL files in: ${basePath} (ignoring date completely)`
      );

      if (!(await fs.pathExists(basePath))) {
        return {
          success: false,
          error: `Path not found: ${basePath}`,
        };
      }

      const items = await fs.readdir(basePath, { withFileTypes: true });
      const allFiles = [];

      for (const item of items) {
        if (item.isFile()) {
          const filePath = path.join(basePath, item.name);
          const ext = path.extname(item.name).toLowerCase();

          if (this.supportedExtensions.includes(ext)) {
            try {
              const stats = await fs.stat(filePath);

              allFiles.push({
                fileName: item.name,
                filePath: filePath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime.toISOString(),
                modifiedDate: stats.mtime.toISOString().split("T")[0],
                modifiedTime: stats.mtime.toTimeString().split(" ")[0],
                extension: ext,
              });

              console.log(
                `  ✅ ${
                  item.name
                } - ${stats.mtime.toISOString()} (${this.formatBytes(
                  stats.size
                )})`
              );
            } catch (statError) {
              console.warn(
                `⚠️ Cannot access file: ${item.name} - ${statError.message}`
              );
            }
          }
        }
      }

      const sortedFiles = allFiles.sort(
        (a, b) => new Date(b.modified) - new Date(a.modified)
      );

      console.log(`📁 Total files found: ${sortedFiles.length}`);

      return {
        success: true,
        basePath,
        files: sortedFiles,
        message: `Found ${sortedFiles.length} log files (all dates)`,
        showingAll: true,
      };
    } catch (error) {
      console.error(`❌ Error finding all files: ${error.message}`);
      return {
        success: false,
        error: error.message,
        basePath,
      };
    }
  }

  // Read file content (unchanged)
  async readFileContent(filePath) {
    try {
      console.log(`📖 Reading file: ${filePath}`);

      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 50) {
        console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)}MB`);
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0);

      console.log(`📄 File read successfully: ${lines.length} non-empty lines`);

      return {
        success: true,
        filePath,
        fileSize: stats.size,
        fileSizeFormatted: this.formatBytes(stats.size),
        totalLines: lines.length,
        content: lines,
        rawContent: content,
        readAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error reading file: ${filePath}`, error.message);
      return {
        success: false,
        error: error.message,
        filePath,
        errorCode: error.code,
      };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getCurrentDateString() {
    return new Date().toISOString().split("T")[0];
  }

  isToday(dateString) {
    return dateString === this.getCurrentDateString();
  }
}
