import { ErrorDetectorService } from '../services/errorDetector.service.js';
import moment from 'moment';

const errorDetector = new ErrorDetectorService();

export const getErrorAnalysis = async (req, res) => {
  try {
    const { service } = req.params;
    const { date } = req.query;
    
    const targetDate = date || moment().format('YYYY-MM-DD');
    const analysis = await errorDetector.analyzeLogsForErrors(service, targetDate);
    
    res.json(analysis);
  } catch (error) {
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
    
    const trends = await errorDetector.getErrorTrends(service, parseInt(days) || 7);
    
    res.json({
      service,
      period: `${trends.length} days`,
      trends,
      summary: {
        averageErrors: trends.reduce((acc, day) => acc + day.errorCount, 0) / trends.length,
        peakErrorDay: trends.reduce((max, day) => day.errorCount > max.errorCount ? day : max, trends[0]),
        totalErrors: trends.reduce((acc, day) => acc + day.errorCount, 0)
      }
    });
  } catch (error) {
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
    
    const targetDate = date || moment().format('YYYY-MM-DD');
    const analysis = await errorDetector.analyzeLogsForErrors(service, targetDate);
    
    const criticalErrors = analysis.errors.critical || [];
    const limitedErrors = limit ? criticalErrors.slice(0, parseInt(limit)) : criticalErrors;
    
    res.json({
      service,
      date: targetDate,
      criticalErrors: limitedErrors,
      count: limitedErrors.length,
      totalCritical: criticalErrors.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve critical errors', 
      message: error.message 
    });
  }
};

export const getErrorsByCategory = async (req, res) => {
  try {
    const { service } = req.params;
    const { date } = req.query;
    
    const targetDate = date || moment().format('YYYY-MM-DD');
    const analysis = await errorDetector.analyzeLogsForErrors(service, targetDate);
    
    res.json({
      service,
      date: targetDate,
      categories: analysis.errors,
      summary: analysis.summary,
      recommendations: analysis.recommendations
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to categorize errors', 
      message: error.message 
    });
  }
};