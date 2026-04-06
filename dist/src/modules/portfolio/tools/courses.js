import { z } from 'zod';
import { toolManifestData } from '../lib/toolManifestData.js';
import { readAllFiles, readFile } from '../lib/corpus.js';
import { matchesCourse, toStrList, uniqueSorted } from '../lib/filterHelpers.js';
import { toolError, toolJson } from '../lib/toolResponse.js';
export function registerCoursesTools(server, options) {
    const ns = options.namespace;
    const m = toolManifestData('courses');
    server.registerTool(`${ns}_courses_query`, {
        description: `[${ns}] Kursy z filtrami: category, platform, year, status, tags`,
        inputSchema: {
            category: z.string().optional(),
            platform: z.string().optional(),
            year: z.number().int().optional(),
            status: z.string().optional(),
            tags: z.array(z.string()).optional(),
            matchAll: z.boolean().optional().describe('Dla tags: wszystkie vs dowolny'),
        },
    }, async (args) => {
        const toolName = `${ns}_courses_query`;
        try {
            const all = await readAllFiles('courses');
            const filters = {
                category: args?.category,
                platform: args?.platform,
                year: args?.year,
                status: args?.status,
                tags: args?.tags,
                matchAll: args?.matchAll,
            };
            const items = all
                .filter((x) => matchesCourse(x.data, filters))
                .map(({ id, data }) => ({ id, data }));
            return toolJson({ filters, count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_courses_list`, {
        description: `[${ns}] Lista wszystkich kursów (id + metadane)`,
    }, async () => {
        const toolName = `${ns}_courses_list`;
        try {
            const all = await readAllFiles('courses');
            const items = all.map(({ id, data }) => ({ id, data }));
            return toolJson({ count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_courses_get`, {
        description: `[${ns}] Szczegóły kursu po id (nazwa pliku bez .md)`,
        inputSchema: {
            id: z.string().min(1),
        },
    }, async (args) => {
        const toolName = `${ns}_courses_get`;
        try {
            const id = args?.id;
            if (!id)
                return toolError(`[${toolName}] Missing id`, new Error('id jest wymagane'));
            const { data, body } = await readFile('courses', `${id}.md`);
            return toolJson({ id, data, body });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_courses_tags`, {
        description: `[${ns}] Tagi / tematy kursów (manifest + frontmatter)`,
    }, async () => {
        const toolName = `${ns}_courses_tags`;
        try {
            const all = await readAllFiles('courses');
            const fromFiles = [];
            for (const { data } of all) {
                fromFiles.push(...toStrList(data.tags));
            }
            const tags = uniqueSorted([...m.tags, ...fromFiles]);
            return toolJson({ tags });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_courses_categories`, {
        description: `[${ns}] Kategorie kursów (manifest + pliki)`,
    }, async () => {
        const toolName = `${ns}_courses_categories`;
        try {
            const all = await readAllFiles('courses');
            const fromFiles = all.map((x) => String(x.data.category ?? '')).filter(Boolean);
            const categories = uniqueSorted([...m.categories, ...fromFiles]);
            return toolJson({ categories });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_courses_platforms`, {
        description: `[${ns}] Platformy kursów (manifest + pole platform w plikach)`,
    }, async () => {
        const toolName = `${ns}_courses_platforms`;
        try {
            const all = await readAllFiles('courses');
            const fromFiles = all.map((x) => String(x.data.platform ?? '')).filter(Boolean);
            const platforms = uniqueSorted([...m.platforms, ...fromFiles]);
            return toolJson({ platforms });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
}
