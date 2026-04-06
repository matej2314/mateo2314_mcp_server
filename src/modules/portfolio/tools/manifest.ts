import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'fs/promises';
import { safeJoin } from '../lib/paths.js';
import { toolError, toolJson } from '../lib/toolResponse.js';

interface ToolOptions {
	namespace: string;
}

export function registerManifestTools(server: McpServer, options: ToolOptions) {
	const toolName = `${options.namespace}_get_manifest`;

	server.registerTool(
		toolName,
		{
			description: `[${options.namespace}] manifest.json — sekcje, pola filtrowania, tagi (MVP)`,
		},
		async () => {
			try {
				const raw = await fs.readFile(safeJoin('manifest.json'), 'utf-8');
				return toolJson(JSON.parse(raw) as unknown);
			} catch (error) {
				return toolError(`[${toolName}] Error reading manifest`, error);
			}
		}
	);
}
