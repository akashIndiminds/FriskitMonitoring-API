// src/controllers/serviceManagement.controller.js
import { serviceManager } from '../services/serviceManager.service.js';

// ✅ ADD NEW SERVICE
export const addService = async (req, res) => {
  try {
    const { serviceName, logPath, displayName, port, description } = req.body;

    if (!serviceName || !logPath) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'serviceName and logPath are required',
        required: ['serviceName', 'logPath'],
        optional: ['displayName', 'port', 'description']
      });
    }

    const serviceConfig = {
      logPath,
      displayName,
      port,
      description
    };

    const result = await serviceManager.addService(serviceName, serviceConfig);
    res.status(201).json(result);

  } catch (error) {
    res.status(400).json({
      error: 'Failed to add service',
      message: error.message
    });
  }
};

// ✅ REMOVE SERVICE
export const removeService = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const result = serviceManager.removeService(serviceName);
    res.json(result);

  } catch (error) {
    res.status(404).json({
      error: 'Failed to remove service',
      message: error.message
    });
  }
};

// ✅ UPDATE SERVICE
export const updateService = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const updates = req.body;
    
    const result = serviceManager.updateService(serviceName, updates);
    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: 'Failed to update service',
      message: error.message
    });
  }
};

// ✅ GET ALL SERVICES (CONFIG + RUNTIME)
export const getAllServices = async (req, res) => {
  try {
    const services = serviceManager.getAllServices();
    const validNames = serviceManager.getValidServiceNames();

    res.json({
      services,
      validServiceNames: validNames,
      totalServices: services.length,
      configServices: services.filter(s => !s.isRuntime).length,
      runtimeServices: services.filter(s => s.isRuntime).length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get services',
      message: error.message
    });
  }
};

// ✅ VALIDATE SERVICE PATH
export const validatePath = async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({
        error: 'Path is required'
      });
    }

    const validation = await serviceManager.validateServicePath(path);
    res.json(validation);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate path',
      message: error.message
    });
  }
};

// ✅ DISCOVER SERVICES
export const discoverServices = async (req, res) => {
  try {
    const { basePath } = req.body;
    
    if (!basePath) {
      return res.status(400).json({
        error: 'basePath is required'
      });
    }

    const discovered = await serviceManager.discoverServices(basePath);
    res.json(discovered);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to discover services',
      message: error.message
    });
  }
};

