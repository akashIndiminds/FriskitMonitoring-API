import { LogParserService } from './logParser.service.js';
import moment from 'moment';

export class ErrorAnalyzerService {
  constructor() {
    this.logParser = new LogParserService();
    this.errorPatterns = this.initializeErrorPatterns();
    this.solutions = this.initializeSolutions();
  }

  initializeErrorPatterns() {
    return {
      connectionErrors: {
        patterns: [
          /failed to establish.*connection/i,
          /connection.*refused/i,
          /timeout/i,
          /getaddrinfo failed/i,
          /could not resolve host/i,
          /network.*unreachable/i
        ],
        category: 'Network Issues'
      },
      
      packageManagerErrors: {
        patterns: [
          /'.*' is not recognized as an internal or external command/i,
          /npm.*not found/i,
          /pnpm.*not found/i,
          /yarn.*not found/i,
          /package.*not found/i
        ],
        category: 'Package Manager Issues'
      },

      buildErrors: {
        patterns: [
          /build.*failed/i,
          /compilation.*error/i,
          /syntax.*error/i,
          /module.*not found/i,
          /import.*failed/i
        ],
        category: 'Build & Compilation Issues'
      },

      serviceErrors: {
        patterns: [
          /service.*stopped/i,
          /service.*failed/i,
          /port.*already in use/i,
          /permission denied/i,
          /access denied/i
        ],
        category: 'Service Runtime Issues'
      },

      databaseErrors: {
        patterns: [
          /database.*connection.*failed/i,
          /sql.*error/i,
          /connection.*timeout/i,
          /authentication.*failed/i
        ],
        category: 'Database Issues'
      },

      pythonErrors: {
        patterns: [
          /modulenotfounderror/i,
          /importerror/i,
          /syntaxerror/i,
          /indentationerror/i,
          /keyerror/i,
          /traceback/i
        ],
        category: 'Python Runtime Issues'
      },

      nextjsErrors: {
        patterns: [
          /next\.js.*error/i,
          /react.*error/i,
          /webpack.*error/i,
          /failed to compile/i
        ],
        category: 'Next.js Frontend Issues'
      }
    };
  }

  initializeSolutions() {
    return {
      'Network Issues': {
        commonCauses: [
          'Internet connectivity problems',
          'Firewall blocking connections', 
          'DNS resolution issues',
          'Target service is down'
        ],
        solutions: [
          'Check internet connection',
          'Verify firewall settings',
          'Try different DNS servers (8.8.8.8, 1.1.1.1)',
          'Check if target service is running',
          'Verify network configuration'
        ],
        priority: 'HIGH'
      },

      'Package Manager Issues': {
        commonCauses: [
          'Package manager not installed',
          'PATH environment variable not set',
          'Wrong package manager being used'
        ],
        solutions: [
          'Install the required package manager (npm, pnpm, yarn)',
          'Update PATH environment variable',
          'Use correct package manager command',
          'Restart terminal/command prompt',
          'Check package manager version'
        ],
        priority: 'HIGH'
      },

      'Build & Compilation Issues': {
        commonCauses: [
          'Missing dependencies',
          'Syntax errors in code',
          'Version compatibility issues',
          'Build configuration problems'
        ],
        solutions: [
          'Install missing dependencies',
          'Fix syntax errors in source code',
          'Check dependency versions for compatibility',
          'Review build configuration files',
          'Clear build cache and rebuild'
        ],
        priority: 'HIGH'
      },

      'Service Runtime Issues': {
        commonCauses: [
          'Port already in use by another process',
          'Insufficient permissions',
          'Service configuration errors',
          'Resource limitations'
        ],
        solutions: [
          'Kill process using the port or use different port',
          'Run with administrator/sudo privileges',
          'Check service configuration files',
          'Monitor system resources (CPU, RAM)',
          'Restart the service'
        ],
        priority: 'CRITICAL'
      },

      'Database Issues': {
        commonCauses: [
          'Database server not running',
          'Wrong connection credentials',
          'Network connectivity issues',
          'Database permissions'
        ],
        solutions: [
          'Start database service',
          'Verify connection credentials',
          'Check database server status',
          'Review database user permissions',
          'Test database connectivity'
        ],
        priority: 'CRITICAL'
      },

      'Python Runtime Issues': {
        commonCauses: [
          'Missing Python modules',
          'Python version incompatibility',
          'Virtual environment issues',
          'Code syntax errors'
        ],
        solutions: [
          'Install missing modules using pip',
          'Check Python version compatibility',
          'Activate correct virtual environment',
          'Fix syntax and indentation errors',
          'Update pip and setuptools'
        ],
        priority: 'HIGH'
      },

      'Next.js Frontend Issues': {
        commonCauses: [
          'Node.js version issues',
          'Missing npm packages',
          'React component errors',
          'Build configuration problems'
        ],
        solutions: [
          'Update Node.js to compatible version',
          'Run npm install to install dependencies',
          'Fix React component syntax errors',
          'Check next.config.js configuration',
          'Clear .next build folder and rebuild'
        ],
        priority: 'MEDIUM'
      }
    };
  }

  async analyzeLogsForErrors(serviceName, date = null) {
    try {
      const targetDate = date || moment().format('YYYY-MM-DD');
      const logData = await this.logParser.getLogsByDate(serviceName, targetDate);
      
      if (!logData.exists) {
        return {
          service: serviceName,
          date: targetDate,
          analysis: null,
          message: 'No logs available for analysis'
        };
      }

      const errors = this.extractErrors(logData.logs);
      const categorizedErrors = this.categorizeErrors(errors);
      const analysis = this.generateAnalysis(categorizedErrors, serviceName);

      return {
        service: serviceName,
        date: targetDate,
        totalLogs: logData.logs.length,
        totalErrors: errors.length,
        categorizedErrors,
        analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error analyzing logs:', error);
      throw error;
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
          categorized[patternData.category].push(error);
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

  generateAnalysis(categorizedErrors, serviceName) {
    const analysis = {
      summary: {
        totalCategories: Object.keys(categorizedErrors).length,
        mostCommonIssue: null,
        criticalIssuesFound: false,
        overallStatus: 'UNKNOWN'
      },
      recommendations: [],
      detailedAnalysis: {}
    };

    // Find most common issue
    let maxCount = 0;
    let mostCommonCategory = null;

    for (const [category, errors] of Object.entries(categorizedErrors)) {
      if (errors.length > maxCount) {
        maxCount = errors.length;
        mostCommonCategory = category;
      }

      // Check for critical issues
      const criticalErrors = errors.filter(e => e.level === 'CRITICAL');
      if (criticalErrors.length > 0) {
        analysis.summary.criticalIssuesFound = true;
      }

      // Generate detailed analysis for each category
      const solution = this.solutions[category];
      if (solution) {
        analysis.detailedAnalysis[category] = {
          errorCount: errors.length,
          priority: solution.priority,
          commonCauses: solution.commonCauses,
          recommendedSolutions: solution.solutions,
          sampleErrors: errors.slice(0, 3).map(e => ({
            message: e.message,
            timestamp: e.timestamp,
            level: e.level
          }))
        };

        // Add to recommendations
        analysis.recommendations.push({
          category,
          priority: solution.priority,
          errorCount: errors.length,
          topSolution: solution.solutions[0]
        });
      }
    }

    analysis.summary.mostCommonIssue = mostCommonCategory;
    
    // Determine overall status
    if (analysis.summary.criticalIssuesFound) {
      analysis.summary.overallStatus = 'CRITICAL';
    } else if (Object.keys(categorizedErrors).length > 0) {
      analysis.summary.overallStatus = 'NEEDS_ATTENTION';
    } else {
      analysis.summary.overallStatus = 'HEALTHY';
    }

    // Sort recommendations by priority and error count
    analysis.recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      return b.errorCount - a.errorCount; // More errors first
    });

    return analysis;
  }

  async getErrorTrends(serviceName, days = 7) {
    const trends = [];
    const today = moment();

    for (let i = 0; i < days; i++) {
      const date = today.clone().subtract(i, 'days').format('YYYY-MM-DD');
      try {
        const analysis = await this.analyzeLogsForErrors(serviceName, date);
        trends.push({
          date,
          totalErrors: analysis.totalErrors || 0,
          categories: analysis.categorizedErrors ? Object.keys(analysis.categorizedErrors).length : 0,
          overallStatus: analysis.analysis?.summary?.overallStatus || 'UNKNOWN'
        });
      } catch (error) {
        trends.push({
          date,
          totalErrors: 0,
          categories: 0,
          overallStatus: 'NO_DATA',
          message: 'No data available'
        });
      }
    }

    return trends.reverse(); // Oldest first
  }
}