import fs from "fs/promises";
import { safeJoin } from "../lib/paths.js";
import { toolError, toolJson } from "../lib/toolResponse.js";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
export function registerManifestTools(server, options) {
    const toolName = `${options.namespace}_get_manifest`;
    registerInstrumentedTool(server, options.moduleId, toolName, {
        description: `[${options.namespace}] manifest.json — sekcje, pola filtrowania, tagi (MVP)`,
    }, async () => {
        try {
            const raw = await fs.readFile(safeJoin("manifest.json"), "utf-8");
            return toolJson(JSON.parse(raw));
        }
        catch (error) {
            return toolError(`[${toolName}] Error reading manifest`, error);
        }
    });
}
