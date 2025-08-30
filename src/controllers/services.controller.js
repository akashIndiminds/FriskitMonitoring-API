// src/controllers/services.controller.js - Fixed
import { config, getValidServices, getServiceConfig } from '../config/index.js';
import fs from 'fs-extra';
import path from 'path';

export const getServicesStatus = async (req, res) => {
  try {
    const services = [];
    const validServices = getValidServices();
    
    for (const serviceName of validServices) {
      const serviceConfig = getServiceConfig(serviceName);
      const status = await checkServiceStatus(serviceName, serviceConfig);
      services.push(status);
    }

    res.json({
      services,
      timestamp: new Date().toISOString(),
      totalServices: services.length,
      activeServices: services.filter(s => s.status === 'ACTIVE').length,
      inactiveServices: services.filter(s => s.status === 'INACTIVE').length
    });

  } catch (error) {
    console.error('Error in getServicesStatus:', error);
    res.status(500).json({ 
      error: 'Failed to get services status', 
      message: error.message 
    });
  }
};

export const getServiceDetails = async (req, res) => {
  try {
    const { service } = req.params;
    
    // Validate service
    const validServices = getValidServices();
    if (!validServices.includes(service.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        message: `Service must be one of: ${validServices.join(', ')}` 
      });
    }

    const serviceConfig = getServiceConfig(service.toLowerCase());
    if (!serviceConfig) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const details = await getDetailedServiceInfo(service, serviceConfig);
    
    res.json(details);
  } catch (error) {
    console.error('Error in getServiceDetails:', error);
    res.status(500).json({ 
      error: 'Failed to get service details', 
      message: error.message,
      service: req.params.service
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
    let logSize = 0;
    if (todayLogExists) {
      const stats = await fs.stat(todayLogPath);
      lastActivity = stats.mtime.toISOString();
      logSize = stats.size;
    }

    // Check if log directory is accessible
    let directoryStatus = 'ACCESSIBLE';
    if (!logDirExists) {
      directoryStatus = 'NOT_FOUND';
    } else {
      try {
        await fs.access(serviceConfig.logPath, fs.constants.R_OK);
      } catch (accessError) {
        directoryStatus = 'ACCESS_DENIED';
      }
    }

    return {
      name: serviceName,
      displayName: serviceConfig.displayName || serviceConfig.name,
      description: serviceConfig.description || `${serviceName} service`,
      status: todayLogExists ? 'ACTIVE' : 'INACTIVE',
      logDirectory: {
        path: serviceConfig.logPath,
        exists: logDirExists,
        accessible: directoryStatus === 'ACCESSIBLE',
        status: directoryStatus
      },
      todayLog: {
        exists: todayLogExists,
        path: todayLogExists ? todayLogPath : null,
        lastActivity,
        size: logSize,
        sizeFormatted: formatBytes(logSize)
      },
      ports: serviceConfig.ports || [serviceConfig.port],
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      name: serviceName,
      displayName: serviceConfig.displayName || serviceConfig.name,
      status: 'ERROR',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

async function getDetailedServiceInfo(serviceName, serviceConfig) {
  try {
    // Check if directory exists and is accessible
    const logDirExists = await fs.pathExists(serviceConfig.logPath);
    if (!logDirExists) {
      return {
        service: serviceName,
        config: serviceConfig,
        error: 'Log directory does not exist',
        logFiles: [],
        summary: {
          totalLogFiles: 0,
          totalSize: 0,
          oldestLog: null,
          newestLog: null
        }
      };
    }

    const logFiles = [];
    let totalSize = 0;

    try {
      const files = await fs.readdir(serviceConfig.logPath);
      const logFileNames = files.filter(f => f.endsWith('.log'));

      for (const file of logFileNames) {
        try {
          const filePath = path.join(serviceConfig.logPath, file);
          const stats = await fs.stat(filePath);
          
          logFiles.push({
            filename: file,
            date: file.replace('.log', ''),
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            sizeFormatted: formatBytes(stats.size),
            isToday: file.replace('.log', '') === new Date().toISOString().split('T')[0],
            isYesterday: file.replace('.log', '') === new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0]
          });

          totalSize += stats.size;
        } catch (fileError) {
          console.warn(`Error reading file ${file}:`, fileError.message);
        }
      }
    } catch (readError) {
      console.error(`Error reading directory ${serviceConfig.logPath}:`, readError.message);
      return {
        service: serviceName,
        config: serviceConfig,
        error: `Cannot read log directory: ${readError.message}`,
        logFiles: [],
        summary: {
          totalLogFiles: 0,
          totalSize: 0
        }
      };
    }

    // Sort by date (newest first)
    logFiles.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      service: serviceName,
      config: {
        ...serviceConfig,
        displayName: serviceConfig.displayName || serviceConfig.name
      },
      logFiles,
      summary: {
        totalLogFiles: logFiles.length,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        oldestLog: logFiles[logFiles.length - 1]?.date || null,
        newestLog: logFiles[0]?.date || null,
        todayLogExists: logFiles.some(f => f.isToday),
        yesterdayLogExists: logFiles.some(f => f.isYesterday),
        averageFileSize: logFiles.length > 0 ? Math.round(totalSize / logFiles.length) : 0
      },
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error getting detailed info for ${serviceName}:`, error);
    throw error;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}