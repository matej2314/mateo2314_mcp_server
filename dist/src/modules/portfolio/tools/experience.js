import { z } from 'zod';
import manifest from '../content/manifest.json';
import { readAllFiles, readFile } from '../lib/corpus.js';
import { matchesExperience, toStrList, uniqueSorted } from '../lib/filterHelpers.js';
import { toolError, toolJson } from '../lib/toolResponse.js';
function experienceManifestTags() {
    const sec = manifest.sections.find((s) => s.name === 'experience');
    const tags = sec && 'tags' in sec && Array.isArray(sec.tags) ? sec.tags : [];
    return tags;
}
export function registerExperienceTools(server, options) {
    const ns = options.namespace;
    server.registerTool(`${ns}_experience_query`, {
        description: `[${ns}] Doświadczenie z filtrami: firma, rola, tech, rok startu/końca`,
        inputSchema: {
            company: z.string().optional(),
            role: z.string().optional(),
            tech: z.array(z.string()).optional(),
            startYear: z.number().int().optional(),
            endYear: z.number().int().optional(),
        },
    }, async (args) => {
        const toolName = `${ns}_experience_query`;
        try {
            const all = await readAllFiles('experience');
            const filters = {
                company: args?.company,
                role: args?.role,
                tech: args?.tech,
                startYear: args?.startYear,
                endYear: args?.endYear,
            };
            const items = all
                .filter((x) => matchesExperience(x.data, filters))
                .map(({ id, data }) => ({ id, data }));
            return toolJson({ filters, count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_experience_list`, {
        description: `[${ns}] Pełna lista wpisów doświadczenia (id + metadane)`,
    }, async () => {
        const toolName = `${ns}_experience_list`;
        try {
            const all = await readAllFiles('experience');
            const items = all.map(({ id, data }) => ({ id, data }));
            return toolJson({ count: items.length, items });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_experience_get`, {
        description: `[${ns}] Szczegóły jednego wpisu doświadczenia po id (nazwa pliku bez .md)`,
        inputSchema: {
            id: z.string().min(1),
        },
    }, async (args) => {
        const toolName = `${ns}_experience_get`;
        try {
            const id = args?.id;
            if (!id)
                return toolError(`[${toolName}] Missing id`, new Error('id jest wymagane'));
            const { data, body } = await readFile('experience', `${id}.md`);
            return toolJson({ id, data, body });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
    server.registerTool(`${ns}_experience_tags`, {
        description: `[${ns}] Technologie w doświadczeniu (manifest + pole tech we frontmatter)`,
    }, async () => {
        const toolName = `${ns}_experience_tags`;
        try {
            const all = await readAllFiles('experience');
            const fromFiles = [];
            for (const { data } of all) {
                fromFiles.push(...toStrList(data.tech));
            }
            const tags = uniqueSorted([...experienceManifestTags(), ...fromFiles]);
            return toolJson({ tags });
        }
        catch (error) {
            return toolError(`[${toolName}] Error`, error);
        }
    });
}
