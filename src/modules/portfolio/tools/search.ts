import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { validSections } from '../lib/validSections.js';
import { searchCorpus } from '../lib/search.js';
import { toolError, toolJson } from '../lib/toolResponse.js';
import { registerInstrumentedTool } from '../../../observability/instrumentTool.js';

interface ToolOptions {
	namespace: string;
	moduleId: string;
}

export function registerSearchTools(server: McpServer, options: ToolOptions) {
	const toolName = `${options.namespace}_search`;

	registerInstrumentedTool(
		server,
		options.moduleId,
		toolName,
		{
			description: `[${options.namespace}] Wyszukiwanie pełnotekstowe po treści i frontmatterze (.md)`,
			inputSchema: {
				query: z.string().min(1).describe('Fraza do wyszukania (bez rozróżniania wielkości liter)'),
				section: z
					.string()
					.optional()
					.describe(`Opcjonalnie jedna sekcja z manifestu: ${[...validSections].join(', ')}`),
			},
		},
		async (args) => {
			try {
				const sec = args?.section;
				if (sec && !validSections.has(sec)) {
					return toolError(
						`[${toolName}] Invalid section`,
						new Error(`Nieznana sekcja: ${sec}`)
					);
				}
				const results = await searchCorpus(args?.query ?? '', sec);
				return toolJson({ query: args?.query, section: sec, results });
			} catch (error) {
				return toolError(`[${toolName}] Error`, error);
			}
		},
	);
}
