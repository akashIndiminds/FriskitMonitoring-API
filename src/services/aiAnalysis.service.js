import { getOpenAIClient, isOpenAIConfigured } from '../config/openai.js';
import { LogParserService } from './logParser.service.js';

export class AIAnalysisService {
  constructor() {
    this.logParser = new LogParserService();
    this.openai = getOpenAIClient();
  }

  async analyzeErrorsWithAI(serviceName, errors, context = {}) {
    if (!isOpenAIConfigured()) {
      return {
        available: false,
        message: 'OpenAI is not configured. Please add your API key to enable AI analysis.'
      };
    }

    try {
      const prompt = this.buildAnalysisPrompt(serviceName, errors, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert system administrator and developer specializing in error analysis for enterprise applications. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const analysis = response.choices[0].message.content;
      
      return {
        available: true,
        serviceName,
        analysis,
        recommendations: this.extractRecommendations(analysis),
        timestamp: new Date().toISOString(),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Error in AI analysis:', error);
      return {
        available: false,
        error: 'Failed to analyze with AI: ' + error.message
      };
    }
  }

  buildAnalysisPrompt(serviceName, errors, context) {
    const errorSummary = errors.map(error => 
      `[${error.timestamp}] ${error.level}: ${error.message}`
    ).join('\n');

    return `
    Analyze the following errors from ${serviceName} service:
    
    SERVICE CONTEXT:
    - Service: ${serviceName}
    - Error Count: ${errors.length}
    - Time Range: ${context.timeRange || 'Recent logs'}
    
    ERRORS:
    ${errorSummary}
    
    Please provide:
    1. Root cause analysis
    2. Severity assessment
    3. Immediate action items
    4. Prevention strategies
    5. Related system impacts
    
    Keep responses concise and focused on actionable solutions.
    `;
  }

  extractRecommendations(analysis) {
    // Simple regex to extract numbered recommendations
    const lines = analysis.split('\n');
    const recommendations = [];
    
    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        recommendations.push(line.trim());
      }
    }

    return recommendations.length > 0 ? recommendations : ['Review the full analysis for detailed recommendations'];
  }

  async generateLogSummary(serviceName, date) {
    if (!isOpenAIConfigured()) {
      return {
        available: false,
        message: 'OpenAI is not configured'
      };
    }

    try {
      const logData = await this.logParser.getLogsByDate(serviceName, date);
      
      if (!logData.exists || logData.logs.length === 0) {
        return {
          available: false,
          message: 'No logs available for analysis'
        };
      }

      const recentLogs = logData.logs.slice(-50); // Last 50 log entries
      const logText = recentLogs.map(log => log.raw).join('\n');

      const prompt = `
      Summarize the following system logs for ${serviceName} on ${date}:
      
      ${logText}
      
      Provide a brief summary including:
      1. Overall system health
      2. Key activities performed
      3. Any issues or concerns
      4. Performance indicators (if visible)
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a system monitoring expert. Provide clear, concise log summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      return {
        available: true,
        summary: response.choices[0].message.content,
        service: serviceName,
        date,
        logCount: logData.logs.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating AI summary:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  async predictPotentialIssues(serviceName, historicalData) {
    if (!isOpenAIConfigured()) {
      return { available: false };
    }

    try {
      const prompt = `
      Based on historical error patterns for ${serviceName}, predict potential future issues:
      
      HISTORICAL DATA:
      ${JSON.stringify(historicalData, null, 2)}
      
      Provide predictions for:
      1. Likely recurring errors
      2. System bottlenecks
      3. Maintenance recommendations
      4. Monitoring improvements
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a predictive analytics expert for system monitoring.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.2
      });

      return {
        available: true,
        predictions: response.choices[0].message.content,
        service: serviceName,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}