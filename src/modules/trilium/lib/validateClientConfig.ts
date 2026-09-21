import type { TriliumClientConfig } from "../types.js";

export function validateClientConfig(config: TriliumClientConfig): void {
  if (config.baseUrl.length === 0)
    throw new Error("[trilium] Missing baseUrl in module config");
  if (config.apiToken.length === 0)
    throw new Error("[trilium] Missing apiToken in module config");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readTriliumConfig(
  config: unknown,
): TriliumClientConfig | undefined {
  if (!isRecord(config)) return undefined;

  const { baseUrl, apiToken } = config;

  if (typeof baseUrl !== "string" || typeof apiToken !== "string") {
    return undefined;
  }

  return { baseUrl, apiToken };
}
