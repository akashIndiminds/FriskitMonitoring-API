// src/services/dynamicErrorAnalyzer.service.js
// ========================================

import { DynamicLogService } from './dynamicLog.service.js';

export class DynamicErrorAnalyzer {
  constructor() {
    this.logService = new DynamicLogService();
    this.errorPatterns = this.initializeErrorPatterns();
    this.solutions = this.initializeSolutions();
  }

  initializeErrorPatterns() {
    return {
      connectionErrors: {
        patterns: [
          /connection.*refused/i,
          /timeout/i,
          /network.*unreachable/i,
          /failed to connect/i,
          /connection.*lost/i
        ],
        category: 'Network Issues',
        severity: 'HIGH'
      },
      fileSystemErrors: {
        patterns: [
          /no such file or directory/i,
          /permission denied/i,
          /access.*denied/i,
          /file not found/i,
          /directory not found/i
        ],
        category: 'File System Issues',
        severity: 'HIGH'
      },
      memoryErrors: {
        patterns: [
          /out of memory/i,
          /memory.*error/i,
          /stack overflow/i,
          /heap.*error/i
        ],
        category: 'Memory Issues',
        severity: 'CRITICAL'
      },
      applicationErrors: {
        patterns: [
          /null pointer/i,
          /segmentation fault/i,
          /assertion.*failed/i,
          /unhandled exception/i
        ],
        category: 'Application Errors',
        severity: 'HIGH'
      },
      databaseErrors: {
        patterns: [
          /database.*error/i,
          /sql.*error/i,
          /connection.*timeout/i,
          /deadlock/i
        ],
        category: 'Database Issues',
        severity: 'HIGH'
      }
    };
  }

  initializeSolutions() {
    return {
      'Network Issues': {
        commonCauses: [
          'Internet connectivity problems',
          'Firewall blocking connections',
          'Service is down',
          'DNS resolution issues'
        ],
        solutions: [
          'Check internet connection and network status',
          'Verify firewall and security settings',
          'Confirm target service is running and accessible',
          'Test DNS resolution and try alternative DNS servers',
          'Check network configuration and routing'
        ],
        priority: 'HIGH'
      },
      'File System Issues': {
        commonCauses: [
          'File or directory does not exist',
          'Insufficient permissions',
          'Path is incorrect',
          'Disk space issues'
        ],
        solutions: [
          'Verify file and directory paths are correct',
          'Check file and directory permissions',
          'Ensure sufficient disk space is available',
          'Run application with appropriate privileges',
          'Check if files were moved or deleted'
        ],
        priority: 'HIGH'
      },
      'Memory Issues': {
        commonCauses: [
          'Application consuming too much memory',
          'Memory leaks in the application',
          'Insufficient system RAM',
          'Large dataset processing'
        ],
        solutions: [
          'Increase system memory or optimize application',
          'Profile application for memory leaks',
          'Implement memory management best practices',
          'Process data in smaller chunks',
          'Restart application to free memory'
        ],
        priority: 'CRITICAL'
      },
      'Application Errors': {
        commonCauses: [
          'Programming bugs and logic errors',
          'Unhandled edge cases',
          'Resource conflicts',
          'Invalid input data'
        ],
        solutions: [
          'Review and debug application code',
          'Implement proper error handling',
          'Add input validation and sanitization',
          'Test with various input scenarios',
          'Check for recent code changes'
        ],
        priority: 'HIGH'
      },
      'Database Issues': {
        commonCauses: [
          'Database server is down',
          'Connection pool exhaustion',
          'Query performance issues',
          'Database locks and deadlocks'
        ],
        solutions: [
          'Check database server status and connectivity',
          'Review and optimize database queries',
          'Monitor connection pool usage',
          'Implement proper transaction management',
          'Check database locks and running processes'
        ],
        priority: 'HIGH'
      }
    };
  }

  // ✅ Analyze file for errors
  async analyzeFile(directoryPath, fileName, analysisType = 'comprehensive') {
    try {
      // Get log data
      const logData = await this.logService.getLogsByPath(directoryPath, fileName);
      if (!logData.success) {
        return logData;
      }

      const errors = this.extractErrors(logData.logs);
      const categorizedErrors = this.categorizeErrors(errors);
      const analysis = this.generateAnalysis(categorizedErrors, logData.file);

      return {
        success: true,
        file: logData.file,
        fullPath: logData.fullPath,
        analysisType,
        totalLogs: logData.logs.length,
        totalErrors: errors.length,
        categorizedErrors,
        analysis,
        recommendations: this.generateRecommendations(categorizedErrors),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error analyzing file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractErrors(logs) {
    return logs.filter(log => 
      log.level === 'ERROR' || 
      log.level === 'CRITICAL' || 
      log.level === 'WARNING'
    );
  }

  categorizeErrors(errors) {
    const categorized = {};
    
    // Initialize categories
    Object.keys(this.errorPatterns).forEach(key => {
      categorized[this.errorPatterns[key].category] = [];
    });
    categorized['Other Issues'] = [];

    for (const error of errors) {
      let categorizedFlag = false;

      for (const [patternKey, patternData] of Object.entries(this.errorPatterns)) {
        if (patternData.patterns.some(pattern => pattern.test(error.message))) {
          categorized[patternData.category].push({
            ...error,
            patternMatched: patternKey,
            severity: patternData.severity
          });
          categorizedFlag = true;
          break;
        }
      }

      if (!categorizedFlag) {
        categorized['Other Issues'].push(error);
      }
    }

    // Remove empty categories
    Object.keys(categorized).forEach(category => {
      if (categorized[category].length === 0) {
        delete categorized[category];
      }
    });

    return categorized;
  }

  generateAnalysis(categorizedErrors, fileName) {
    const analysis = {
      summary: {
        fileName,
        totalCategories: Object.keys(categorizedErrors).length,
        mostCommonIssue: null,
        criticalIssuesFound: false,
        overallStatus: 'UNKNOWN',
        severityBreakdown: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
      },
      categoryBreakdown: {},
      timeline: this.analyzeErrorTimeline(categorizedErrors),
      patterns: this.identifyPatterns(categorizedErrors)
    };

    let maxCount = 0;
    let mostCommonCategory = null;

    for (const [category, errors] of Object.entries(categorizedErrors)) {
      if (errors.length > maxCount) {
        maxCount = errors.length;
        mostCommonCategory = category;
      }

      // Check for critical issues
      const criticalErrors = errors.filter(e => e.level === 'CRITICAL' || e.severity === 'CRITICAL');
      if (criticalErrors.length > 0) {
        analysis.summary.criticalIssuesFound = true;
      }

      // Count severity levels
      errors.forEach(error => {
        const severity = error.severity || this.mapLevelToSeverity(error.level);
        analysis.summary.severityBreakdown[severity] = 
          (analysis.summary.severityBreakdown[severity] || 0) + 1;
      });

      // Category breakdown
      analysis.categoryBreakdown[category] = {
        errorCount: errors.length,
        percentage: ((errors.length / Object.values(categorizedErrors).flat().length) * 100).toFixed(1),
        samples: errors.slice(0, 3).map(e => ({
          message: e.message.substring(0, 150) + (e.message.length > 150 ? '...' : ''),
          timestamp: e.timestamp,
          level: e.level,
          lineNumber: e.lineNumber
        }))
      };
    }

    analysis.summary.mostCommonIssue = mostCommonCategory;
    
    // Determine overall status
    if (analysis.summary.criticalIssuesFound || analysis.summary.severityBreakdown.CRITICAL > 0) {
      analysis.summary.overallStatus = 'CRITICAL';
    } else if (analysis.summary.severityBreakdown.HIGH > 5) {
      analysis.summary.overallStatus = 'NEEDS_ATTENTION';
    } else if (Object.keys(categorizedErrors).length > 0) {
      analysis.summary.overallStatus = 'MINOR_ISSUES';
    } else {
      analysis.summary.overallStatus = 'HEALTHY';
    }

    return analysis;
  }

  analyzeErrorTimeline(categorizedErrors) {
    const timeline = {};
    const allErrors = Object.values(categorizedErrors).flat();

    allErrors.forEach(error => {
      try {
        const hour = moment(error.timestamp).format('YYYY-MM-DD HH:00');
        if (!timeline[hour]) {
          timeline[hour] = { total: 0, byLevel: {} };
        }
        timeline[hour].total++;
        timeline[hour].byLevel[error.level] = (timeline[hour].byLevel[error.level] || 0) + 1;
      } catch (e) {
        // Skip invalid timestamps
      }
    });

    return Object.entries(timeline)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 24) // Last 24 hours
      .map(([hour, data]) => ({ hour, ...data }));
  }

  identifyPatterns(categorizedErrors) {
    const patterns = {
      repeatingErrors: {},
      burstErrors: [],
      timePatterns: {}
    };

    const allErrors = Object.values(categorizedErrors).flat();

    // Find repeating error messages
    allErrors.forEach(error => {
      const shortMsg = error.message.substring(0, 100);
      if (!patterns.repeatingErrors[shortMsg]) {
        patterns.repeatingErrors[shortMsg] = {
          count: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          level: error.level
        };
      }
      patterns.repeatingErrors[shortMsg].count++;
      patterns.repeatingErrors[shortMsg].lastSeen = error.timestamp;
    });

    // Keep only messages that repeat more than 3 times
    Object.keys(patterns.repeatingErrors).forEach(msg => {
      if (patterns.repeatingErrors[msg].count <= 3) {
        delete patterns.repeatingErrors[msg];
      }
    });

    return patterns;
  }

  generateRecommendations(categorizedErrors) {
    const recommendations = [];

    for (const [category, errors] of Object.entries(categorizedErrors)) {
      const solution = this.solutions[category];
      if (solution) {
        recommendations.push({
          category,
          priority: solution.priority,
          errorCount: errors.length,
          commonCauses: solution.commonCauses,
          recommendedActions: solution.solutions,
          urgency: this.calculateUrgency(errors),
          impact: this.assessImpact(category, errors.length)
        });
      }
    }

    // Sort by priority and urgency
    recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const urgencyOrder = { 'IMMEDIATE': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      const aUrgency = urgencyOrder[a.urgency] || 1;
      const bUrgency = urgencyOrder[b.urgency] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return bUrgency - aUrgency;
    });

    return recommendations;
  }

  calculateUrgency(errors) {
    const criticalCount = errors.filter(e => e.level === 'CRITICAL').length;
    const errorCount = errors.filter(e => e.level === 'ERROR').length;
    
    if (criticalCount > 0) return 'IMMEDIATE';
    if (errorCount > 10) return 'HIGH';
    if (errorCount > 5) return 'MEDIUM';
    return 'LOW';
  }

  assessImpact(category, errorCount) {
    const highImpactCategories = ['Memory Issues', 'Database Issues', 'Application Errors'];
    const mediumImpactCategories = ['Network Issues', 'File System Issues'];
    
    if (highImpactCategories.includes(category) && errorCount > 5) return 'HIGH';
    if (mediumImpactCategories.includes(category) && errorCount > 10) return 'MEDIUM';
    return 'LOW';
  }

  mapLevelToSeverity(level) {
    switch (level) {
      case 'CRITICAL': return 'CRITICAL';
      case 'ERROR': return 'HIGH';
      case 'WARNING': return 'MEDIUM';
      default: return 'LOW';
    }
  }
}