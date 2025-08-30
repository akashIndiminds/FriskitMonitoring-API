import { LogParserService } from './logParser.service.js';
import { config } from '../config/index.js';

export class ErrorDetectorService {
  constructor() {
    this.logParser = new LogParserService();
    this.errorPatterns = this.initializeErrorPatterns();
  }

  initializeErrorPatterns() {
    return {
      networkErrors: [
        /failed to establish.*connection/i,
        /connection.*refused/i,
        /timeout/i,
        /getaddrinfo failed/i,
        /could not resolve host/i
      ],
      
      packageManagerErrors: [
        /'.*' is not recognized as an internal or external command/i,
        /npm.*not found/i,
        /pnpm.*not found/i,
        /yarn.*not found/i
      ],

      buildErrors: [
        /build.*failed/i,
        /compilation.*error/i,
        /syntax.*error/i,
        /module.*not found/i
      ],

      serviceErrors: [
        /service.*stopped/i,
        /service.*failed/i,
        /port.*already in use/i,
        /permission denied/i
      ],

      gitErrors: [
        /fatal:.*git/i,
        /git.*error/i,
        /merge.*conflict/i
      ]
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
          errors: [],
          summary: 'No logs available for analysis'
        };
      }

      const errors = this.detectErrors(logData.logs);
      const categorizedErrors = this.categorizeErrors(errors);
      const summary = this.generateErrorSummary(categorizedErrors);

      return {
        service: serviceName,
        date: targetDate,
        totalLogs: logData.logs.length,
        errors: categorizedErrors,
        summary,
        recommendations: this.generateRecommendations(categorizedErrors)
      };

    } catch (error) {
      console.error('Error analyzing logs:', error);
      throw error;
    }
  }

  detectErrors(logs) {
    return logs.filter(log => 
      log.level === 'ERROR' || 
      log.level === 'CRITICAL' || 
      log.level === 'WARNING'
    );
  }

  categorizeErrors(errors) {
    const categorized = {
      critical: [],
      network: [],
      packageManager: [],
      build: [],
      service: [],
      git: [],
      other: []
    };

    for (const error of errors) {
      const message = error.message.toLowerCase();
      let categorized_flag = false;

      // Check for critical errors first
      if (error.level === 'CRITICAL') {
        categorized.critical.push(error);
        categorized_flag = true;
      }

      // Check other patterns
      for (const [category, patterns] of Object.entries(this.errorPatterns)) {
        if (patterns.some(pattern => pattern.test(message))) {
          const categoryKey = category.replace('Errors', '').toLowerCase();
          if (categorized[categoryKey]) {
            categorized[categoryKey].push(error);
            categorized_flag = true;
          }
          break;
        }
      }

      // If no category matched, put in 'other'
      if (!categorized_flag && error.level !== 'CRITICAL') {
        categorized.other.push(error);
      }
    }

    return categorized;
  }

  generateErrorSummary(categorizedErrors) {
    const summary = {
      totalErrors: 0,
      criticalCount: categorizedErrors.critical.length,
      categories: {}
    };

    for (const [category, errors] of Object.entries(categorizedErrors)) {
      summary.categories[category] = errors.length;
      summary.totalErrors += errors.length;
    }

    return summary;
  }

  generateRecommendations(categorizedErrors) {
    const recommendations = [];

    if (categorizedErrors.packageManager.length > 0) {
      recommendations.push({
        category: 'Package Manager',
        issue: 'Package manager not found or not configured properly',
        solution: 'Install the required package manager (pnpm, npm, yarn) or update PATH environment variable',
        priority: 'HIGH'
      });
    }

    if (categorizedErrors.network.length > 0) {
      recommendations.push({
        category: 'Network',
        issue: 'Network connectivity issues detected',
        solution: 'Check internet connection, firewall settings, or DNS configuration',
        priority: 'MEDIUM'
      });
    }

    if (categorizedErrors.build.length > 0) {
      recommendations.push({
        category: 'Build',
        issue: 'Build process failures detected',
        solution: 'Review build configuration, check for missing dependencies or syntax errors',
        priority: 'HIGH'
      });
    }

    if (categorizedErrors.service.length > 0) {
      recommendations.push({
        category: 'Service',
        issue: 'Service startup or runtime issues',
        solution: 'Check port availability, service configuration, and system resources',
        priority: 'CRITICAL'
      });
    }

    return recommendations;
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
          errorCount: analysis.summary.totalErrors,
          criticalCount: analysis.summary.criticalCount
        });
      } catch (error) {
        trends.push({
          date,
          errorCount: 0,
          criticalCount: 0,
          message: 'No data available'
        });
      }
    }

    return trends.reverse(); // Most recent first
  }
}