import { AIAnalysisService } from '../services/aiAnalysis.service.js';
import { ErrorDetectorService } from '../services/errorDetector.service.js';
import moment from 'moment';

const aiAnalysis = new AIAnalysisService();
const errorDetector = new ErrorDetectorService();

export const analyzeWithAI = async (req, res) => {
  try {
    const { service } = req.params;
    const { date, category } = req.query;
    
    const targetDate = date || moment().format('YYYY-MM-DD');
    const errorAnalysis = await errorDetector.analyzeLogsForErrors(service, targetDate);
    
    let errorsToAnalyze = [];
    
    if (category && errorAnalysis.errors[category]) {
      errorsToAnalyze = errorAnalysis.errors[category];
    } else {
      // Get all errors
      errorsToAnalyze = Object.values(errorAnalysis.errors).flat();
    }

    if (errorsToAnalyze.length === 0) {
      return res.json({
        service,
        date: targetDate,
        message: 'No errors found for AI analysis',
        analysis: null
      });
    }

    const aiResult = await aiAnalysis.analyzeErrorsWithAI(service, errorsToAnalyze, {
      timeRange: targetDate,
      category
    });
    
    res.json({
      service,
      date: targetDate,
      category,
      errorCount: errorsToAnalyze.length,
      aiAnalysis: aiResult
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to perform AI analysis', 
      message: error.message 
    });
  }
};

export const getLogSummary = async (req, res) => {
  try {
    const { service } = req.params;
    const { date } = req.query;
    
    const targetDate = date || moment().format('YYYY-MM-DD');
    const summary = await aiAnalysis.generateLogSummary(service, targetDate);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate log summary', 
      message: error.message 
    });
  }
};

export const predictIssues = async (req, res) => {
  try {
    const { service } = req.params;
    const { days } = req.query;
    
    // Get historical data for prediction
    const trends = await errorDetector.getErrorTrends(service, parseInt(days) || 7);
    const predictions = await aiAnalysis.predictPotentialIssues(service, trends);
    
    res.json({
      service,
      historicalPeriod: `${days || 7} days`,
      predictions
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to predict issues', 
      message: error.message 
    });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const services = ['api', 'ui', 'notification'];
    const healthReport = {};
    
    for (const service of services) {
      try {
        const today = moment().format('YYYY-MM-DD');
        const analysis = await errorDetector.analyzeLogsForErrors(service, today);
        
        healthReport[service] = {
          status: analysis.summary.criticalCount > 0 ? 'CRITICAL' : 
                  analysis.summary.totalErrors > 10 ? 'WARNING' : 'HEALTHY',
          errorCount: analysis.summary.totalErrors,
          criticalCount: analysis.summary.criticalCount,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        healthReport[service] = {
          status: 'UNKNOWN',
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    const overallStatus = Object.values(healthReport).some(s => s.status === 'CRITICAL') ? 'CRITICAL' :
                         Object.values(healthReport).some(s => s.status === 'WARNING') ? 'WARNING' : 'HEALTHY';

    res.json({
      overallStatus,
      services: healthReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate health report', 
      message: error.message 
    });
  }
};