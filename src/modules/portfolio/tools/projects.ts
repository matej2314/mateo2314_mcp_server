import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toolManifestData } from '../lib/toolManifestData.js';
import { readAllFiles, readFile } from '../lib/corpus.js';
import { matchesProject, toStrList, uniqueSorted } from '../lib/filterHelpers.js';
import { toolError, toolJson } from '../lib/toolResponse.js';

interface ToolOptions {
	namespace: string;
}

export function registerProjectsTools(server: McpServer, options: ToolOptions) {
	const ns = options.namespace;
	const manifest = toolManifestData('projects');

	server.registerTool(
		`${ns}_projects_query`,
		{
			description: `[${ns}] Projekty z filtrami: kategoria, tech, status, rok, rola (matchAll dla tech)`,
			inputSchema: {
				category: z.string().optional(),
				tech: z.array(z.string()).optional(),
				status: z.string().optional(),
				year: z.number().int().optional(),
				role: z.string().optional(),
				matchAll: z.boolean().optional().describe('Dla tech: true = wszystkie muszą pasować, false = dowolny'),
			},
		},
		async args => {
			const toolName = `${ns}_projects_query`;
			try {
				const all = await readAllFiles('projects');
				const filters = {
					category: args?.category,
					tech: args?.tech,
					status: args?.status,
					year: args?.year,
					role: args?.role,
					matchAll: args?.matchAll,
				};
				const items = all.filter(x => matchesProject(x.data as Record<string, unknown>, filters)).map(({ id, data }) => ({ id, data }));
				return toolJson({ filters, count: items.length, items });
			} catch (error) {
				return toolError(`[${toolName}] Error`, error);
			}
		},
	);

	server.registerTool(
		`${ns}_projects_list`,
		{
			description: `[${ns}] Lista wszystkich projektów (id + metadane frontmatter, bez treści body)`,
		},
		async () => {
			const toolName = `${ns}_projects_list`;
			try {
				const all = await readAllFiles('projects');
				const items = all.map(({ id, data }) => ({ id, data }));
				return toolJson({ count: items.length, items });
			} catch (error) {
				return toolError(`[${toolName}] Error`, error);
			}
		},
	);

	server.registerTool(
		`${ns}_projects_get`,
		{
			description: `[${ns}] Szczegóły projektu po id (nazwa pliku bez .md)`,
			inputSchema: {
				id: z.string().min(1).describe('Identyfikator pliku, np. portfolio-nextjs'),
			},
		},
		async args => {
			const toolName = `${ns}_projects_get`;
			try {
				const id = args?.id;
				if (!id) return toolError(`[${toolName}] Missing id`, new Error('id jest wymagane'));
				const { data, body } = await readFile('projects', `${id}.md`);
				return toolJson({ id, data, body });
			} catch (error) {
				return toolError(`[${toolName}] Error`, error);
			}
		},
	);

	server.registerTool(
		`${ns}_projects_tags`,
		{
			description: `[${ns}] Zbiór technologii / tagów projektów (manifest + frontmatter)`,
		},
		async () => {
			const toolName = `${ns}_projects_tags`;
			try {
				const all = await readAllFiles('projects');
				const fromFiles: string[] = [];
				for (const { data } of all) {
					const d = data as Record<string, unknown>;
					fromFiles.push(...toStrList(d.tech_stack ?? d.tech ?? d.tags));
				}
				const merged = uniqueSorted([...manifest.tags, ...fromFiles]);
				return toolJson({ tags: merged });
			} catch (error) {
				return toolError(`[${toolName}] Error`, error);
			}
		},
	);
}
