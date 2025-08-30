// Common error patterns found in Friskit logs
export const ERROR_PATTERNS = {
  // Network related errors
  CONNECTION_FAILED: /failed to establish.*connection/i,
  DNS_RESOLUTION_FAILED: /getaddrinfo failed/i,
  TIMEOUT: /timeout/i,
  CONNECTION_REFUSED: /connection.*refused/i,
  HOST_UNREACHABLE: /could not resolve host/i,

  // Package Manager errors
  COMMAND_NOT_FOUND: /'.*' is not recognized as an internal or external command/i,
  PACKAGE_MANAGER_MISSING: /(npm|pnpm|yarn).*not found/i,
  INSTALL_FAILED: /install.*failed/i,

  // Build errors
  BUILD_FAILED: /build.*failed/i,
  COMPILATION_ERROR: /compilation.*error/i,
  SYNTAX_ERROR: /syntax.*error/i,
  MODULE_NOT_FOUND: /module.*not found/i,

  // Service errors
  PORT_IN_USE: /port.*already in use/i,
  SERVICE_STOPPED: /service.*stopped/i,
  PERMISSION_DENIED: /permission denied/i,
  
  // Git errors
  GIT_FATAL: /fatal:.*git/i,
  MERGE_CONFLICT: /merge.*conflict/i,

  // Python/API specific
  PIP_WARNING: /warning:.*retrying/i,
  UVICORN_ERROR: /uvicorn.*error/i,

  // Next.js specific
  NEXTJS_WARNING: /warning:.*react hook/i,
  NEXTJS_ERROR: /error.*next/i
};

export const SEVERITY_LEVELS = {
  CRITICAL: ['fatal', 'critical', 'crash', 'abort', 'emergency'],
  HIGH: ['error', 'failed', 'exception', 'refused', 'denied'],
  MEDIUM: ['warning', 'warn', 'timeout', 'not found'],
  LOW: ['info', 'debug', 'starting', 'success']
};

export const SERVICE_INDICATORS = {
  API: ['uvicorn', 'fastapi', 'ums', 'fms', 'dms', 'python'],
  UI: ['next.js', 'react', 'npm run', 'build', 'localhost:10000'],
  NOTIFICATION: ['notification', 'pnpm', 'github.com']
};