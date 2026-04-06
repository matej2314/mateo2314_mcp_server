import fs from 'fs/promises';
import { safeJoin } from '../lib/paths.js';
import { toolError } from '../lib/toolResponse.js';
export function registerAboutTools(server, options) {
    const toolName = `${options.namespace}_get_about`;
    server.registerTool(toolName, {
        description: `[${options.namespace}] Sekcja „O mnie” (surowy plik about/body.md, jak profile)`,
    }, async () => {
        try {
            const content = await fs.readFile(safeJoin('about', 'body.md'), 'utf-8');
            return {
                content: [{ type: 'text', text: content }],
            };
        }
        catch (error) {
            return toolError(`[${toolName}] Error reading about`, error);
        }
    });
}
