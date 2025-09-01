// src/utils/responseHelper.js
// ==========================================
export const successResponse = (message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data) response.data = data;
  if (meta) response.meta = meta;

  return response;
};

export const errorResponse = (message, details = null, code = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) response.details = details;
  if (code) response.code = code;

  return response;
};

export const paginationMeta = (total, limit, offset) => {
  return {
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : null,
      previousOffset: offset > 0 ? Math.max(0, offset - limit) : null
    }
  };
};