import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { toolError, toolOk } from "../lib/toolResponse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TriliumToolOptions } from "../types.js";

function buildLabelQuery(label: string, value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    return `#${label}`;
  }
  return `#${label}=${value}`;
}

export function registerListByLabelTools(
  server: McpServer,
  options: TriliumToolOptions,
): void {
  const toolName = `${options.namespace}_list_by_label`;
  const { client } = options;

  registerInstrumentedTool(
    server,
    options.moduleId,
    toolName,
    {
      description: `[${options.namespace}] Lista notatek z daną labelką ETAPI (#label lub #label=value).`,
      inputSchema: {
        label: z.string().min(1).describe("Nazwa labelki bez prefiksu #"),
        value: z.string().optional().describe("Opcjonalna wartość labelki"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maks. liczba wyników (domyślnie 20, max 50)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async (args: { label: string; value?: string; limit?: number }) => {
      try {
        const query = buildLabelQuery(args.label, args.value);
        const notes = await client.searchNotes(query, args.limit ?? 20);
        return toolOk({
          query,
          count: notes.length,
          notes: notes.map((note) => ({
            noteId: note.noteId,
            title: note.title,
            type: note.type,
          })),
        });
      } catch (error) {
        return toolError(`[${toolName}] Error`, error);
      }
    },
  );
}
