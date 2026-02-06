/**
 * Simple logging utility for the CDD Onboarding Demo
 *
 * In development: logs to console
 * In production: suppresses logs (could be extended to send to error tracking service)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enableInProduction?: boolean;
}

const isDevelopment = process.env.NODE_ENV === 'development';

function shouldLog(level: LogLevel, enableInProduction: boolean): boolean {
  if (isDevelopment) return true;
  if (enableInProduction) return level === 'error' || level === 'warn';
  return false;
}

function formatMessage(prefix: string | undefined, message: string): string {
  return prefix ? `[${prefix}] ${message}` : message;
}

export function createLogger(options: LoggerOptions = {}) {
  const { prefix, enableInProduction = false } = options;

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug', enableInProduction)) {
        console.debug(formatMessage(prefix, message), ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info', enableInProduction)) {
        console.info(formatMessage(prefix, message), ...args);
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn', enableInProduction)) {
        console.warn(formatMessage(prefix, message), ...args);
      }
    },

    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error', enableInProduction)) {
        console.error(formatMessage(prefix, message), ...args);
      }
    },
  };
}

// Pre-configured loggers for common use cases
export const stageDataLogger = createLogger({ prefix: 'StageData' });
export const authLogger = createLogger({ prefix: 'Auth' });
export const apiLogger = createLogger({ prefix: 'API', enableInProduction: true });

// Default logger
export const logger = createLogger();
