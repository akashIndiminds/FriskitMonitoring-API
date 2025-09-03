// 📁 src/controllers/users.controller.js
// FIXED - Added updateAlias function
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

// 🔧 UPDATE/EDIT ALIAS FUNCTION - ADDED!
// 🔧 FIXED updateAlias function - Proper storage update
export const updateAlias = async (req, res) => {
  try {
    const { userId, aliasName } = req.params;
    const { newAliasName, newBasePath } = req.body;

    console.log(`✏️ Updating alias: ${userId}/${aliasName}`);
    console.log(`📝 New data:`, { newAliasName, newBasePath });

    // Check if alias exists
    const currentAlias = aliasLogService.userAliasService.getUserAlias(userId, aliasName);
    if (!currentAlias) {
      return res.status(404).json(errorResponse(
        `Alias "${aliasName}" not found for user ${userId}`,
        {
          availableAliases: aliasLogService.userAliasService.getUserAliases(userId)
            .map(a => a.aliasName)
        }
      ));
    }

    // Validate new data
    if (!newAliasName || !newBasePath) {
      return res.status(400).json(errorResponse(
        'Missing required fields: newAliasName and newBasePath',
        {
          received: {
            newAliasName: newAliasName || 'MISSING',
            newBasePath: newBasePath || 'MISSING'
          },
          current: {
            aliasName: currentAlias.aliasName,
            basePath: currentAlias.basePath
          },
          example: {
            newAliasName: 'Updated-API-Logs',
            newBasePath: '\\\\new-server\\path\\logs'
          }
        }
      ));
    }

    // Check if new alias name already exists (if name is being changed)
    if (newAliasName !== aliasName) {
      const existingAlias = aliasLogService.userAliasService.getUserAlias(userId, newAliasName);
      if (existingAlias) {
        return res.status(400).json(errorResponse(
          `Alias "${newAliasName}" already exists for user ${userId}`
        ));
      }
    }

    // 🔥 FIXED: Proper update logic
    const updatedAlias = {
      aliasName: newAliasName,
      basePath: newBasePath,
      originalPath: newBasePath,
      // Preserve existing data
      createdAt: currentAlias.createdAt,
      lastAccessed: new Date(), // Update last accessed
      accessCount: currentAlias.accessCount,
      pathStatus: currentAlias.pathStatus || 'not_validated',
      // Add modification timestamp
      lastModified: new Date()
    };

    // 🔥 CRITICAL FIX: Get the userAliases Map directly
    const userAliasesMap = aliasLogService.userAliasService.userAliases;
    const userAliases = userAliasesMap.get(userId) || [];
    
    // Find and replace the alias
    const aliasIndex = userAliases.findIndex(alias => alias.aliasName === aliasName);
    
    if (aliasIndex === -1) {
      return res.status(404).json(errorResponse(
        `Alias "${aliasName}" not found in storage`
      ));
    }

    // Replace the alias at the same index
    userAliases[aliasIndex] = updatedAlias;
    
    // Update the Map
    userAliasesMap.set(userId, userAliases);
    
    // 🔥 CRITICAL: Save to file immediately
    await aliasLogService.userAliasService.saveToFile();
    
    console.log(`✅ Alias updated and saved to storage`);
    console.log(`📁 Storage file: ${aliasLogService.userAliasService.storageFile}`);

    // Verify the update
    const verifyAlias = aliasLogService.userAliasService.getUserAlias(userId, newAliasName);
    console.log(`🔍 Verification - Updated alias found: ${!!verifyAlias}`);

    res.json(successResponse(
      `Alias updated successfully from "${aliasName}" to "${newAliasName}"`,
      { 
        updatedAlias,
        changes: {
          aliasName: {
            old: aliasName,
            new: newAliasName
          },
          basePath: {
            old: currentAlias.basePath,
            new: newBasePath
          }
        },
        verification: {
          storageUpdated: true,
          newAliasExists: !!verifyAlias,
          totalAliases: userAliases.length
        }
      }
    ));

  } catch (error) {
    console.error('❌ Error updating alias:', error);
    res.status(500).json(errorResponse('Failed to update alias', { 
      message: error.message,
      stack: error.stack
    }));
  }
};