// 📁 NEW FILE 4: src/controllers/aliasLogs.controller.js
// ==========================================
import { AliasLogService } from '../services/aliasLogService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const aliasLogService = new AliasLogService();

// Create new alias
export const createAlias = async (req, res) => {
  try {
    const { userId, aliasName, basePath } = req.body;

    if (!userId || !aliasName || !basePath) {
      return res.status(400).json(errorResponse(
        'Missing required fields: userId, aliasName, and basePath',
        {
          example: {
            userId: 'john_doe',
            aliasName: 'MyLogs',
            basePath: '\\\\\\\\server\\\\logs\\\\folder'
          }
        }
      ));
    }

    const alias = await aliasLogService.userAliasService.addUserAlias(
      userId, 
      aliasName, 
      basePath
    );

    res.status(201).json(successResponse(
      'Alias created successfully', 
      { alias }
    ));

  } catch (error) {
    console.error('Error creating alias:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

// Get logs by alias
export const getLogsByAlias = async (req, res) => {
  try {
    const { userId, aliasName } = req.params;
    const { date } = req.query;

    console.log(`📥 Request: ${userId}/${aliasName} - Date: ${date || 'today'}`);

    const result = await aliasLogService.getLogsByAlias(userId, aliasName, { date });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Logs retrieved successfully', result));

  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json(errorResponse('Failed to retrieve logs', { 
      message: error.message 
    }));
  }
};

// Get all user logs (polling)
export const getAllUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    console.log(`📥 All logs request for user: ${userId}`);

    const result = await aliasLogService.getAllUserLogs(userId, { date });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('All user logs retrieved successfully', result));

  } catch (error) {
    console.error('Error getting all user logs:', error);
    res.status(500).json(errorResponse('Failed to retrieve user logs', { 
      message: error.message 
    }));
  }
};

// Get user aliases
export const getUserAliases = async (req, res) => {
  try {
    const { userId } = req.params;
    const aliases = aliasLogService.userAliasService.getUserAliases(userId);

    res.json(successResponse('User aliases retrieved successfully', { 
      userId, 
      aliases,
      total: aliases.length
    }));

  } catch (error) {
    res.status(500).json(errorResponse('Failed to retrieve aliases', { 
      message: error.message 
    }));
  }
};

// Delete alias
export const deleteAlias = async (req, res) => {
  try {
    const { userId, aliasName } = req.params;

    const deleted = await aliasLogService.userAliasService.deleteAlias(userId, aliasName);

    if (!deleted) {
      return res.status(404).json(errorResponse(`Alias "${aliasName}" not found`));
    }

    res.json(successResponse(`Alias "${aliasName}" deleted successfully`));

  } catch (error) {
    res.status(500).json(errorResponse('Failed to delete alias', { 
      message: error.message 
    }));
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = aliasLogService.userAliasService.getAllUsers();

    res.json(successResponse('All users retrieved successfully', {
      users,
      total: users.length
    }));

  } catch (error) {
    res.status(500).json(errorResponse('Failed to retrieve users', { 
      message: error.message 
    }));
  }
};
