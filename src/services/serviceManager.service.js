// src/services/serviceManager.service.js
// ✅ RUNTIME SERVICE ADDITION - Add services without restarting
import { config } from '../config/index.js';
import fs from 'fs-extra';
import path from 'path';

export class ServiceManagerService {
  constructor() {
    this.runtimeServices = new Map();
  }

  // ✅ ADD NEW SERVICE AT RUNTIME
  async addService(serviceName, serviceConfig) {
    try {
      // Validate service config
      if (!serviceName || !serviceConfig.logPath) {
        throw new Error('Service name and logPath are required');
      }

      // Check if service already exists
      if (this.getService(serviceName)) {
        throw new Error(`Service '${serviceName}' already exists`);
      }

      // Validate log path exists
      if (!await fs.pathExists(serviceConfig.logPath)) {
        throw new Error(`Log path does not exist: ${serviceConfig.logPath}`);
      }

      // Add to runtime services
      const fullServiceConfig = {
        name: serviceName,
        displayName: serviceConfig.displayName || serviceName,
        logPath: serviceConfig.logPath,
        port: serviceConfig.port || null,
        description: serviceConfig.description || `${serviceName} service`,
        addedAt: new Date().toISOString(),
        isRuntime: true
      };

      this.runtimeServices.set(serviceName.toLowerCase(), fullServiceConfig);
      
      console.log(`✅ Service '${serviceName}' added successfully`);
      
      // Notify via WebSocket
      this.broadcastServiceUpdate('SERVICE_ADDED', serviceName, fullServiceConfig);
      
      return {
        success: true,
        service: serviceName,
        config: fullServiceConfig,
        message: 'Service added successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to add service '${serviceName}':`, error.message);
      throw error;
    }
  }

  // ✅ REMOVE SERVICE AT RUNTIME
  removeService(serviceName) {
    try {
      const service = this.runtimeServices.get(serviceName.toLowerCase());
      if (!service) {
        throw new Error(`Runtime service '${serviceName}' not found`);
      }

      this.runtimeServices.delete(serviceName.toLowerCase());
      
      console.log(`✅ Runtime service '${serviceName}' removed`);
      
      // Notify via WebSocket
      this.broadcastServiceUpdate('SERVICE_REMOVED', serviceName, service);
      
      return {
        success: true,
        service: serviceName,
        message: 'Service removed successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to remove service '${serviceName}':`, error.message);
      throw error;
    }
  }

  // ✅ GET SERVICE (CHECKS BOTH CONFIG AND RUNTIME)
  getService(serviceName) {
    const lowerName = serviceName.toLowerCase();
    
    // Check runtime services first
    if (this.runtimeServices.has(lowerName)) {
      return this.runtimeServices.get(lowerName);
    }
    
    // Check config services
    return config.friskit.services[lowerName] || null;
  }

  // ✅ GET ALL SERVICES (CONFIG + RUNTIME)
  getAllServices() {
    const configServices = Object.keys(config.friskit.services).map(name => ({
      name,
      ...config.friskit.services[name],
      isRuntime: false
    }));

    const runtimeServices = Array.from(this.runtimeServices.values());
    
    return [...configServices, ...runtimeServices];
  }

  // ✅ GET VALID SERVICE NAMES
  getValidServiceNames() {
    const configNames = Object.keys(config.friskit.services);
    const runtimeNames = Array.from(this.runtimeServices.keys());
    return [...configNames, ...runtimeNames];
  }

  // ✅ UPDATE SERVICE CONFIG
  updateService(serviceName, updates) {
    try {
      const service = this.getService(serviceName);
      if (!service) {
        throw new Error(`Service '${serviceName}' not found`);
      }

      if (service.isRuntime) {
        // Update runtime service
        const updated = { ...service, ...updates, updatedAt: new Date().toISOString() };
        this.runtimeServices.set(serviceName.toLowerCase(), updated);
        
        this.broadcastServiceUpdate('SERVICE_UPDATED', serviceName, updated);
        
        return {
          success: true,
          service: serviceName,
          config: updated,
          message: 'Service updated successfully'
        };
      } else {
        throw new Error('Cannot update config-based services at runtime');
      }

    } catch (error) {
      console.error(`❌ Failed to update service '${serviceName}':`, error.message);
      throw error;
    }
  }

  // ✅ VALIDATE SERVICE PATH
  async validateServicePath(servicePath) {
    try {
      const exists = await fs.pathExists(servicePath);
      if (!exists) {
        return { valid: false, message: 'Path does not exist' };
      }

      const stats = await fs.stat(servicePath);
      if (!stats.isDirectory()) {
        return { valid: false, message: 'Path is not a directory' };
      }

      // Check if we can read the directory
      await fs.access(servicePath, fs.constants.R_OK);
      
      return { valid: true, message: 'Path is valid and accessible' };
      
    } catch (error) {
      return { valid: false, message: `Access denied: ${error.message}` };
    }
  }

  // ✅ DISCOVER SERVICES FROM DIRECTORY
  async discoverServices(basePath) {
    try {
      if (!await fs.pathExists(basePath)) {
        return { services: [], message: 'Base path does not exist' };
      }

      const items = await fs.readdir(basePath, { withFileTypes: true });
      const potentialServices = [];

      for (const item of items) {
        if (item.isDirectory()) {
          const servicePath = path.join(basePath, item.name);
          
          // Check if directory contains log files
          try {
            const files = await fs.readdir(servicePath);
            const logFiles = files.filter(f => f.endsWith('.log'));
            
            if (logFiles.length > 0) {
              potentialServices.push({
                name: item.name.toLowerCase(),
                displayName: item.name,
                logPath: servicePath,
                logFileCount: logFiles.length,
                description: `Auto-discovered service: ${item.name}`
              });
            }
          } catch (error) {
            // Skip directories we can't read
            continue;
          }
        }
      }

      return {
        services: potentialServices,
        count: potentialServices.length,
        message: `Discovered ${potentialServices.length} potential services`
      };

    } catch (error) {
      console.error('Error discovering services:', error);
      throw error;
    }
  }

  broadcastServiceUpdate(type, serviceName, config) {
    if (global.wss && global.wss.clients) {
      const message = {
        type,
        service: serviceName,
        config,
        timestamp: new Date().toISOString()
      };

      global.wss.clients.forEach(client => {
        try {
          if (client.readyState === 1) {
            client.send(JSON.stringify(message));
          }
        } catch (error) {
          // Silent fail for WebSocket errors
        }
      });
    }
  }
}

// ✅ SINGLETON INSTANCE
export const serviceManager = new ServiceManagerService();