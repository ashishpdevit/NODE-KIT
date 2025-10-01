import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { initService } from "./init.service";
import { initRequestSchema } from "./init.validation";

interface InitConfig {
  maintenance?: boolean;
  update?: boolean;
  forceUpdate?: boolean;
}

const compareVersions = (clientVersion: string, systemVersion: string): number => {
  const client = parseInt(clientVersion.replace(/\./g, ""), 10);
  const system = parseInt(systemVersion.replace(/\./g, ""), 10);
  return client - system;
};

const getConfigData = (additionalData: InitConfig = {}) => ({
  ...additionalData,
  //any other data that is required for the app
});

export const initializeApp = async (req: Request, res: Response) => {
  const parsed = initRequestSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid parameters", parsed.error.flatten()));
  }

  const { appVersion, type } = parsed.data;

  if (!appVersion || !type) {
    return res.status(400).json(toError("app_version and type are required"));
  }

  const settings = await initService.findSettingByLabel(type);

  if (!settings) {
    return res.status(404).json(toError(`No settings found for app type: ${type}`));
  }

  // Check maintenance mode first
  if (settings.maintenance === 1) {
    return res.json({
      data: getConfigData({ maintenance: true }),
      status: false,
      message: "The application is currently under maintenance. Please try again later.",
    });
  }

  // Compare versions
  const versionDiff = compareVersions(appVersion, settings.version);

  // App version is older than system version
  if (versionDiff < 0) {
    // Force update required
    if (settings.forceUpdates === 1) {
      return res.json({
        data: getConfigData({ forceUpdate: true }),
        status: false,
        message: "A critical update is required. Please update your app to continue.",
      });
    }

    // Soft update (optional)
    return res.json({
      data: getConfigData({ update: true }),
      status: true,
      message: "A new version of the app is available. Please consider updating.",
    });
  }

  // App version is up to date or newer
  return res.json({
    data: getConfigData(),
    status: true,
    message: "",
  });
};

