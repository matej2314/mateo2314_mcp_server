import { TriliumClient } from "./lib/triliumClient.js";
import { readTriliumConfig } from "./lib/validateClientConfig.js";
import { registerGetNoteTools } from "./tools/getNote.js";
import { registerGetTreeTools } from "./tools/getTree.js";
import { registerListByLabelTools } from "./tools/listByLabel.js";
import { registerSaveNoteTools } from "./tools/saveNote.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  HealthCheck,
  ModuleHealthChecker,
  ModuleOptions,
} from "../../core/types.js";
import type { TriliumToolOptions } from "./types.js";

export async function register(
  server: McpServer,
  options: ModuleOptions = {},
): Promise<void> {
  const namespace = options.namespace || "trilium";
  const moduleId = options.moduleId ?? "trilium";
  const cfg = readTriliumConfig(options.config);
  if (cfg === undefined) {
    throw new Error(
      "[trilium] No config.baseUrl/apiToken. Check trilium entry in modules.config.ts.",
    );
  }

  const client = new TriliumClient(cfg);
  const toolOptions: TriliumToolOptions = { namespace, moduleId, client };

  registerGetNoteTools(server, toolOptions);
  registerListByLabelTools(server, toolOptions);
  registerGetTreeTools(server, toolOptions);
  registerSaveNoteTools(server, toolOptions);

  console.error(`[trilium] Registered tools with namespace: ${namespace}`);
}

export const checkHealth: ModuleHealthChecker = async (config: unknown) => {
  const cfg = readTriliumConfig(config);
  if (cfg === undefined) {
    const missing: HealthCheck = {
      id: "trilium_etapi",
      ok: false,
      detail: "missing baseUrl or apiToken in module config",
    };
    return [missing];
  }

  try {
    const client = new TriliumClient(cfg);
    const info = await client.getAppInfo();
    const ok: HealthCheck = {
      id: "trilium_etapi",
      ok: true,
      detail: `appVersion=${info.appVersion}`,
    };
    return [ok];
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const failed: HealthCheck = {
      id: "trilium_etapi",
      ok: false,
      detail,
    };
    return [failed];
  }
};
