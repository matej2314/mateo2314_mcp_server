import fs from "fs/promises";
import { safeJoin } from "../lib/paths.js";
export function registerProfileTools(server, options) {
    const toolName = `${options.namespace}_get_profile`;
    server.registerTool(toolName, {
        description: `[${options.namespace}] Zwraca publiczny profil (kontakt, linki, krótki opis)`,
    }, async () => {
        try {
            const filePath = safeJoin("profile.md");
            const content = await fs.readFile(filePath, "utf-8");
            return {
                content: [
                    {
                        type: "text",
                        text: content,
                    },
                ],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[${toolName}] Error:`, error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error reading profile: ${message}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
