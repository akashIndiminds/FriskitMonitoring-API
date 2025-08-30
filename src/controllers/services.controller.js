import { config } from '../config/index.js';
import fs from 'fs-extra';
import path from 'path';

export const getServicesStatus = async (req, res) => {
  try {
    const services = [];
    
    for (const [serviceName, serviceConfig] of Object.entries(config.friskit.services)) {
      const status = await checkServiceStatus(serviceName, serviceConfig);
      services.push(status);
    }

    res.json({
      services,
      timestamp: new Date().toISOString(),
      totalServices: services.length
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get services status', 
      message: error.message 
    });
  }
};

export const getServiceDetails = async (req, res) => {
  try {
    const { service } = req.params;
    
    const serviceConfig = config.friskit.services[service.toLowerCase()];
    if (!serviceConfig) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const details = await getDetailedServiceInfo(service, serviceConfig);
    
    res.json(details);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get service details', 
      message: error.message 
    });
  }
};

async function checkServiceStatus(serviceName, serviceConfig) {
  try {
    // Check if log directory exists
    const logDirExists = await fs.pathExists(serviceConfig.logPath);
    
    // Check for today's log file
    const today = new Date().toISOString().split('T')[0];
    const todayLogPath = path.join(serviceConfig.logPath, `${today}.log`);
    const todayLogExists = await fs.pathExists(todayLogPath);
    
    // Get last modified time of today's log (if exists)
    let lastActivity = null;
    if (todayLogExists) {
      const stats = await fs.stat(todayLogPath);
      lastActivity = stats.mtime.toISOString();
    }

    return {
      name: serviceName,
      displayName: serviceConfig.name,
      status: todayLogExists ? 'ACTIVE' : 'INACTIVE',
      logDirectory: {
        path: serviceConfig.logPath,
        exists: logDirExists
      },
      todayLog: {
        exists: todayLogExists,
        path: todayLogExists ? todayLogPath : null,
        lastActivity
      },
      ports: serviceConfig.ports || [serviceConfig.port]
    };
    
  } catch (error) {
    return {
      name: serviceName,
      displayName: serviceConfig.name,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function getDetailedServiceInfo(serviceName, serviceConfig) {
  try {
    const logFiles = await fs.readdir(serviceConfig.logPath);
    const logFileDetails = [];

    for (const file of logFiles.filter(f => f.endsWith('.log'))) {
      const filePath = path.join(serviceConfig.logPath, file);
      const stats = await fs.stat(filePath);
      
      logFileDetails.push({
        filename: file,
        date: file.replace('.log', ''),
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        sizeFormatted: formatBytes(stats.size)
      });
    }

    // Sort by date (newest first)
    logFileDetails.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      service: serviceName,
      config: serviceConfig,
      logFiles: logFileDetails,
      summary: {
        totalLogFiles: logFileDetails.length,
        oldestLog: logFileDetails[logFileDetails.length - 1]?.date,
        newestLog: logFileDetails[0]?.date,
        totalSize: logFileDetails.reduce((acc, file) => acc + file.size, 0)
      }
    };

  } catch (error) {
    throw error;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}