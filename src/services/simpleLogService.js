// 📁 UPDATED: src/services/simpleLogService.js
// By default current date only, modified date based
// ==========================================
import fs from 'fs-extra';
import path from 'path';

export class SimpleLogService {
  constructor() {
    this.supportedExtensions = ['.log', '.txt', '.out', '.err'];
  }

  // Find files by date modified (default: current date only)
  async findTodaysFiles(basePath, targetDate = null) {
    try {
      // 🎯 DEFAULT: Always current date if no date provided
      const searchDate = targetDate ? new Date(targetDate) : new Date();
      const dateStr = searchDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`🔍 Finding files in: ${basePath}`);
      console.log(`📅 Searching for files modified on: ${dateStr} (Current date: ${new Date().toISOString().split('T')[0]})`);
      
      if (!await fs.pathExists(basePath)) {
        return {
          success: false,
          error: `Path not found: ${basePath}`,
          searchDate: dateStr,
          isCurrentDate: !targetDate
        };
      }

      const files = await this.scanDirectoryForCurrentDate(basePath, searchDate);
      
      console.log(`📁 Found ${files.length} files modified on ${dateStr}`);
      
      return {
        success: true,
        basePath,
        searchDate: dateStr,
        isCurrentDate: !targetDate,
        files,
        message: !targetDate ? 
          `Found ${files.length} files modified today` : 
          `Found ${files.length} files modified on ${dateStr}`
      };

    } catch (error) {
      console.error(`❌ Error scanning directory: ${error.message}`);
      return {
        success: false,
        error: error.message,
        basePath,
        searchDate: targetDate || new Date().toISOString().split('T')[0]
      };
    }
  }

  async scanDirectoryForCurrentDate(dirPath, targetDate) {
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const matchingFiles = [];

    console.log(`🔍 Scanning directory: ${dirPath}`);
    console.log(`📅 Looking for files modified on: ${targetDateStr}`);

    for (const item of items) {
      if (item.isFile()) {
        const filePath = path.join(dirPath, item.name);
        const ext = path.extname(item.name).toLowerCase();
        
        // Only process supported file types
        if (this.supportedExtensions.includes(ext)) {
          try {
            const stats = await fs.stat(filePath);
            const fileModifiedDate = stats.mtime.toISOString().split('T')[0];
            
            console.log(`  📄 ${item.name} - Modified: ${fileModifiedDate}`);
            
            // ✅ STRICT: Only files modified on exact target date
            if (fileModifiedDate === targetDateStr) {
              console.log(`    ✅ MATCH! File modified on target date`);
              
              matchingFiles.push({
                fileName: item.name,
                filePath: filePath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime.toISOString(),
                modifiedDate: fileModifiedDate,
                extension: ext
              });
            } else {
              console.log(`    ❌ Skip - Different date (${fileModifiedDate} ≠ ${targetDateStr})`);
            }
          } catch (statError) {
            console.warn(`⚠️ Cannot access file: ${item.name} - ${statError.message}`);
          }
        } else {
          console.log(`  📄 ${item.name} - Skipped (unsupported extension: ${ext})`);
        }
      }
    }

    // Sort by modified time (newest first)
    const sortedFiles = matchingFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    console.log(`📊 Final result: ${sortedFiles.length} matching files`);
    if (sortedFiles.length > 0) {
      console.log(`📋 Files found:`);
      sortedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.fileName} (${file.sizeFormatted}) - ${file.modified}`);
      });
    }

    return sortedFiles;
  }

  // Read file and return raw content
  async readFileContent(filePath) {
    try {
      console.log(`📖 Reading file: ${filePath}`);
      
      // Check file size first
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > 50) {
        console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)}MB`);
        // Could add size limit here if needed
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n')
        .map(line => line.trimEnd()) // Remove trailing whitespace but keep line structure
        .filter(line => line.length > 0); // Remove completely empty lines
      
      console.log(`📄 File read successfully: ${lines.length} non-empty lines`);
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        fileSizeFormatted: this.formatBytes(stats.size),
        totalLines: lines.length,
        content: lines, // Raw lines as array
        rawContent: content, // Full raw content (if needed)
        readAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error reading file: ${filePath}`, error.message);
      return {
        success: false,
        error: error.message,
        filePath,
        errorCode: error.code
      };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper: Get current date string
  getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
  }

  // Helper: Check if date is today
  isToday(dateString) {
    return dateString === this.getCurrentDateString();
  }
}
