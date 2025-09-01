// src/controllers/recentPaths.controller.js
// ==========================================
import { recentPathsService } from '../services/recentPathsService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export const getRecentPaths = (req, res) => {
  try {
    const recentPaths = recentPathsService.getRecentPaths();
    res.json(successResponse('Recent paths retrieved', { recentPaths }));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to get recent paths', { message: error.message }));
  }
};

export const getPopularPaths = (req, res) => {
  try {
    const popularPaths = recentPathsService.getPopularPaths();
    res.json(successResponse('Popular paths retrieved', { popularPaths }));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to get popular paths', { message: error.message }));
  }
};

export const searchRecentPaths = (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json(errorResponse('Query must be at least 2 characters'));
    }

    const results = recentPathsService.searchRecentPaths(query);
    res.json(successResponse('Search completed', { results, query }));
  } catch (error) {
    res.status(500).json(errorResponse('Search failed', { message: error.message }));
  }
};

export const clearRecentPaths = (req, res) => {
  try {
    recentPathsService.clearAllPaths();
    res.json(successResponse('Recent paths cleared'));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to clear paths', { message: error.message }));
  }
};
