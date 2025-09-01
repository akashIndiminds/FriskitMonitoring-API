// src/middleware/validation.js - Fully Dynamic Path Validation
// ==========================================
export const validatePathRequest = (req, res, next) => {
  const { filePath, directoryPath, path } = req.body;
  
  // Accept any path field name
  const targetPath = filePath || directoryPath || path;
  
  if (!targetPath) {
    return res.status(400).json({
      success: false,
      error: 'Path is required (use filePath, directoryPath, or path)',
      example: {
        filePath: 'C:\\logs\\myapp',
        fileName: 'app.log'
      },
      alternativeExample: {
        directoryPath: '\\\\\\\\db-indiminds\\\\C\\\\Friskit\\\\BAT-Files\\\\latest\\\\logs\\\\Frisk-UI',
        date: '2025-09-01'
      }
    });
  }

  if (targetPath.length > 260) {
    return res.status(400).json({
      success: false,
      error: 'Path too long (maximum 260 characters)'
    });
  }

  const dangerousPatterns = ['../', '..\\'];
  if (dangerousPatterns.some(pattern => targetPath.includes(pattern))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid path: path traversal not allowed'
    });
  }

  // Normalize the path field for controllers
  req.body.normalizedPath = targetPath;
  
  next();
};

export const validateSearchRequest = (req, res, next) => {
  const { filePath, directoryPath, path, searchQuery } = req.body;
  
  const targetPath = filePath || directoryPath || path;
  
  if (!targetPath || !searchQuery) {
    return res.status(400).json({
      success: false,
      error: 'Path and searchQuery are required',
      example: {
        filePath: 'C:\\logs\\myapp',
        fileName: 'app.log',
        searchQuery: 'error'
      }
    });
  }

  if (searchQuery.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'searchQuery must be at least 2 characters long'
    });
  }

  req.body.normalizedPath = targetPath;
  next();
};