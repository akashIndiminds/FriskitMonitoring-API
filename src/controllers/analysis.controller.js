// src/controllers/analysis.controller.js
import { ErrorAnalyzerService } from '../services/errorAnalyzer.service.js';
import moment from 'moment';

const errorAnalyzer = new ErrorAnalyzerService();

export const analyzeErrors = async (req, res) => {
  try {
    const { service } = req.params;
    const { date } = req.query;
    
    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const targetDate = date || moment().format('YYYY-MM-DD');
    
    // Validate date
    if (!moment(targetDate, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        message: 'Date must be in YYYY-MM-DD format' 
      });
    }

    const analysis = await errorAnalyzer.analyzeLogsForErrors(service, targetDate);
    
    if (!analysis.analysis) {
      return res.status(404).json({
        error: 'No data available',
        message: analysis.message,
        service,
        date: targetDate
      });
    }

    res.json({
      service,
      date: targetDate,
      analysis: analysis.analysis,
      categorizedErrors: analysis.categorizedErrors,
      summary: {
        totalLogs: analysis.totalLogs,
        totalErrors: analysis.totalErrors,
        analysisTimestamp: analysis.timestamp
      }
    });

  } catch (error) {
    console.error('Error in analyzeErrors:', error);
    res.status(500).json({ 
      error: 'Failed to analyze errors', 
      message: error.message 
    });
  }
};

export const getErrorTrends = async (req, res) => {
  try {
    const { service } = req.params;
    const { days } = req.query;
    
    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const daysToAnalyze = parseInt(days) || 7;
    
    if (daysToAnalyze < 1 || daysToAnalyze > 30) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 30'
      });
    }

    const trends = await errorAnalyzer.getErrorTrends(service, daysToAnalyze);
    
    // Calculate summary statistics
    const validTrends = trends.filter(t => t.overallStatus !== 'NO_DATA');
    const summary = {
      totalDaysAnalyzed: trends.length,
      daysWithData: validTrends.length,
      averageErrorsPerDay: validTrends.length > 0 ? 
        Math.round(validTrends.reduce((acc, day) => acc + day.totalErrors, 0) / validTrends.length) : 0,
      peakErrorDay: validTrends.reduce((max, day) => 
        day.totalErrors > max.totalErrors ? day : max, 
        { totalErrors: 0, date: null }
      ),
      healthyDays: validTrends.filter(t => t.overallStatus === 'HEALTHY').length,
      criticalDays: validTrends.filter(t => t.overallStatus === 'CRITICAL').length
    };

    res.json({
      service,
      period: `${daysToAnalyze} days`,
      trends,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getErrorTrends:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve error trends', 
      message: error.message 
    });
  }
};

export const getCriticalErrors = async (req, res) => {
  try {
    const { service } = req.params;
    const { date, limit } = req.query;
    
    // Validate service
    const validServices = ['api', 'ui', 'notification'];
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const targetDate = date || moment().format('YYYY-MM-DD');
    
    // Validate date
    if (!moment(targetDate, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        message: 'Date must be in YYYY-MM-DD format' 
      });
    }

    const analysis = await errorAnalyzer.analyzeLogsForErrors(service, targetDate);
    
    if (!analysis.analysis) {
      return res.status(404).json({
        error: 'No data available',
        message: analysis.message,
        service,
        date: targetDate
      });
    }

    // Extract critical errors from all categories
    const allErrors = Object.values(analysis.categorizedErrors).flat();
    const criticalErrors = allErrors.filter(error => error.level === 'CRITICAL');
    
    // Apply limit
    const limitedErrors = limit ? criticalErrors.slice(0, parseInt(limit)) : criticalErrors;

    res.json({
      service,
      date: targetDate,
      criticalErrors: limitedErrors,
      count: limitedErrors.length,
      totalCritical: criticalErrors.length,
      recommendations: analysis.analysis.recommendations.filter(rec => rec.priority === 'CRITICAL')
    });

  } catch (error) {
    console.error('Error in getCriticalErrors:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve critical errors', 
      message: error.message 
    });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const services = ['api', 'ui', 'notification'];
    const healthReport = {};
    const today = moment().format('YYYY-MM-DD');
    
    for (const service of services) {
      try {
        const analysis = await errorAnalyzer.analyzeLogsForErrors(service, today);
        
        if (analysis.analysis) {
          healthReport[service] = {
            status: analysis.analysis.summary.overallStatus,
            totalErrors: analysis.totalErrors,
            totalLogs: analysis.totalLogs,
            criticalIssues: analysis.analysis.summary.criticalIssuesFound,
            mostCommonIssue: analysis.analysis.summary.mostCommonIssue,
            recommendationCount: analysis.analysis.recommendations.length,
            lastChecked: new Date().toISOString()
          };
        } else {
          healthReport[service] = {
            status: 'NO_DATA',
            message: analysis.message,
            lastChecked: new Date().toISOString()
          };
        }
      } catch (error) {
        healthReport[service] = {
          status: 'ERROR',
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    // Determine overall system status
    const statuses = Object.values(healthReport).map(s => s.status);
    let overallStatus = 'HEALTHY';
    
    if (statuses.includes('CRITICAL')) {
      overallStatus = 'CRITICAL';
    } else if (statuses.includes('NEEDS_ATTENTION')) {
      overallStatus = 'NEEDS_ATTENTION';
    } else if (statuses.includes('ERROR') || statuses.includes('NO_DATA')) {
      overallStatus = 'UNKNOWN';
    }

    // Generate system-wide recommendations
    const systemRecommendations = [];
    Object.entries(healthReport).forEach(([service, health]) => {
      if (health.status === 'CRITICAL') {
        systemRecommendations.push({
          service,
          priority: 'CRITICAL',
          message: `${service} service has critical issues requiring immediate attention`
        });
      } else if (health.status === 'NEEDS_ATTENTION') {
        systemRecommendations.push({
          service,
          priority: 'HIGH',
          message: `${service} service has errors that should be reviewed`
        });
      }
    });

    res.json({
      overallStatus,
      services: healthReport,
      systemRecommendations,
      summary: {
        totalServices: services.length,
        healthyServices: statuses.filter(s => s === 'HEALTHY').length,
        servicesNeedingAttention: statuses.filter(s => s === 'NEEDS_ATTENTION').length,
        criticalServices: statuses.filter(s => s === 'CRITICAL').length,
        unknownServices: statuses.filter(s => s === 'NO_DATA' || s === 'ERROR').length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getSystemHealth:', error);
    res.status(500).json({ 
      error: 'Failed to generate health report', 
      message: error.message 
    });
  }
};

