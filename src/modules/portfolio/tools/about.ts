import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'fs/promises';
import { safeJoin } from '../lib/paths.js';
import { toolError } from '../lib/toolResponse.js';

interface ToolOptions {
	namespace: string;
}

export function registerAboutTools(server: McpServer, options: ToolOptions) {
	const toolName = `${options.namespace}_get_about`;

	server.registerTool(
		toolName,
		{
			description: `[${options.namespace}] Sekcja „O mnie” (surowy plik about/body.md, jak profile)`,
		},
		async () => {
			try {
				const content = await fs.readFile(safeJoin('about', 'body.md'), 'utf-8');
				return {
					content: [{ type: 'text' as const, text: content }],
				};
			} catch (error) {
				return toolError(`[${toolName}] Error reading about`, error);
			}
		}
	);
}
