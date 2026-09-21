import type { TriliumClientConfig } from "../types.js";

export function validateClientConfig(config: TriliumClientConfig): void {
  if (config.baseUrl.trim().length === 0)
    throw new Error("[trilium] Missing baseUrl in module config");
  if (config.apiToken.trim().length === 0)
    throw new Error("[trilium] Missing apiToken in module config");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readTriliumConfig(
  config: unknown,
): TriliumClientConfig | undefined {
  if (!isRecord(config)) return undefined;

  const baseUrl = readNonEmptyString(config.baseUrl);
  const apiToken = readNonEmptyString(config.apiToken);
  if (baseUrl === undefined || apiToken === undefined) {
    return undefined;
  }

  return { baseUrl, apiToken };
}
