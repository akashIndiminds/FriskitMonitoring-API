// 📁 SIMPLE FIXED: src/services/simpleLogService.js
// Just show files by date modified - no extra complexity
// ==========================================
import fs from "fs-extra";
import path from "path";

export class SimpleLogService {
  constructor() {
    this.supportedExtensions = [".log", ".txt", ".out", ".err"];
  }

  // 🎯 SIMPLE: Find files by date modified (no extra logic)
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

  // 🎯 SIMPLE: Just scan and show files by date modified
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

            console.log(`  📄 ${item.name} - Modified: ${fileModifiedDate}`);

            // 🎯 SIMPLE: Just compare dates - jo match kare wo show kar
            if (fileModifiedDate === targetDateStr) {
              console.log(`    ✅ MATCH! Adding to results`);

              matchingFiles.push({
                fileName: item.name,
                filePath: filePath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime.toISOString(),
                modifiedDate: fileModifiedDate,
                modifiedTime: stats.mtime.toTimeString().split(" ")[0], // HH:MM:SS
                extension: ext,
                // 🎯 SIMPLE: Just add file type detection (tera request)
                fileType: this.detectFileType(item.name),
                // Basic info
                ageInHours: Math.floor(
                  (new Date() - stats.mtime) / (1000 * 60 * 60)
                ),
              });
            } else {
              console.log(`    ❌ Skip - Different date`);
            }
          } catch (statError) {
            console.warn(
              `⚠️ Cannot access file: ${item.name} - ${statError.message}`
            );
          }
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
          `   ${index + 1}. ${file.fileName} (${file.fileType}) - ${
            file.modifiedTime
          }`
        );
      });
    }

    return sortedFiles;
  }

  // 🎯 SIMPLE: File type detection (tera exact code)
  detectFileType(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes("dms")) return "DMS Service";
    if (name.includes("fms")) return "FMS Service";
    if (name.includes("ums")) return "UMS Service";
    if (name.includes("api")) return "API Service";
    if (name.includes("ui")) return "UI Service";
    if (name.includes("adapter")) return "Adapter Service";
    if (name.includes("error")) return "Error Log";
    if (name.includes("debug")) return "Debug Log";
    if (name.includes("access")) return "Access Log";
    return "General Log";
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
        content: lines, // 🎯 SIMPLE: Raw lines array (no analysis)
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
