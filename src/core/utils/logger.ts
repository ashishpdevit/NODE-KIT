import { appConfig } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const threshold = levelPriority[appConfig.logLevel as LogLevel] ?? levelPriority.info;

const shouldLog = (level: LogLevel) => levelPriority[level] >= threshold;

const formatMessage = (level: LogLevel, args: unknown[]) => {
  const timestamp = new Date().toISOString();
  return [[], level.toUpperCase() + ":", ...args];
};

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.debug(...formatMessage("debug", args));
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      console.info(...formatMessage("info", args));
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn(...formatMessage("warn", args));
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) {
      console.error(...formatMessage("error", args));
    }
  },
};