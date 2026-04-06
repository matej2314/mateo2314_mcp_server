import { z } from 'zod';
import { toolManifestData } from '../lib/toolManifestData.js';
import { readAllFiles, readFile } from '../lib/corpus.js';
import { matchesSkill, toStrList, uniqueSorted } from '../lib/filterHelpers.js';
import { toolError, toolJson } from '../lib/toolResponse.js';
export function registerSkillsTools(server, options) {
    const ns = options.namespace;
    const manifest = toolManifestData('skills');
    server.registerTool(`${ns}_skills_query`, {
        description: `[${ns}] Umiejętności z filtrami: tags, category, level, type`,
        inputSchema: {
            tags: z.array(z.string()).optional(),
            category: z.string().optional(),
            level: z.string().optional(),
            type: z.string().optional(),
            matchAll: z.boolean().optional().describe('Dla tags: wszystkie vs dowolny'),
        },
    }, async (args) => {
        const toolName = `${ns}_skills_query`;
        try {
            const all = await readAllFiles('skills');
            const filters = {
                tags: args?.tags,
                category: args?.category,
                level: args?.level,
                type: args?.type,
                matchAll: args?.matchAll,
            };
            const items = all
                .filter((x) => matchesSkill(x.data, filters))
                .map(({ id, data }) => ({ id, data }));
            return toolJson({ filters, count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_skills_list`, {
        description: `[${ns}] Lista wszystkich umiejętności (id + frontmatter)`,
    }, async () => {
        const toolName = `${ns}_skills_list`;
        try {
            const all = await readAllFiles('skills');
            const items = all.map(({ id, data }) => ({ id, data }));
            return toolJson({ count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_skills_get`, {
        description: `[${ns}] Szczegóły umiejętności po id (plik .md bez rozszerzenia)`,
        inputSchema: {
            id: z.string().min(1),
        },
    }, async (args) => {
        const toolName = `${ns}_skills_get`;
        try {
            const id = args?.id;
            if (!id)
                return toolError(`[${toolName}] Missing id`, new Error('id jest wymagane'));
            const { data, body } = await readFile('skills', `${id}.md`);
            return toolJson({ id, data, body });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_skills_tags`, {
        description: `[${ns}] Dostępne tagi umiejętności (manifest + frontmatter)`,
    }, async () => {
        const toolName = `${ns}_skills_tags`;
        try {
            const all = await readAllFiles('skills');
            const fromFiles = [];
            for (const { data } of all) {
                fromFiles.push(...toStrList(data.tags));
            }
            const tags = uniqueSorted([...manifest.tags, ...fromFiles]);
            return toolJson({ tags });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_skills_categories`, {
        description: `[${ns}] Kategorie umiejętności (manifest + wartości z plików)`,
    }, async () => {
        const toolName = `${ns}_skills_categories`;
        try {
            const all = await readAllFiles('skills');
            const fromFiles = all.map((x) => String(x.data.category ?? '')).filter(Boolean);
            const categories = uniqueSorted([...manifest.categories, ...fromFiles]);
            return toolJson({ categories });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
}
