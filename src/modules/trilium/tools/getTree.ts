import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { noteId, ROOT_NOTE_ID } from "../types.js";
import { buildNoteTree } from "../lib/buildNoteTree.js";
import { toolError, toolOk } from "../lib/toolResponse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TriliumToolOptions } from "../types.js";

export function registerGetTreeTools(
  server: McpServer,
  options: TriliumToolOptions,
): void {
  const toolName = `${options.namespace}_get_tree`;
  const { client } = options;

  registerInstrumentedTool(
    server,
    options.moduleId,
    toolName,
    {
      description: `[${options.namespace}] Zagnieżdżone drzewo notatek: GET /etapi/notes?search=note.noteId != ''&ancestorNoteId={parent}, składane z parentNoteIds/childNoteIds.`,
      inputSchema: {
        parentNoteId: z
          .string()
          .min(1)
          .optional()
          .describe("Korzeń poddrzewa (domyślnie root)"),
        depth: z
          .number()
          .int()
          .min(1)
          .max(3)
          .optional()
          .describe("Głębokość dzieci od korzenia (domyślnie 1, max 3)"),
        excludeHidden: z
          .boolean()
          .optional()
          .describe("Pomiń notatkę _hidden (domyślnie true)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async (args: {
      parentNoteId?: string;
      depth?: number;
      excludeHidden?: boolean;
    }) => {
      try {
        const ancestor =
          args.parentNoteId !== undefined
            ? noteId(args.parentNoteId)
            : ROOT_NOTE_ID;
        const depth = args.depth ?? 1;
        const excludeHidden = args.excludeHidden !== false;
        const flat = await client.searchSubtree(ancestor);
        const tree = buildNoteTree(flat, ancestor, depth, excludeHidden);
        return toolOk({
          parentNoteId: ancestor,
          depth,
          excludeHidden,
          tree,
        });
      } catch (error) {
        return toolError(`[${toolName}] Error`, error);
      }
    },
  );
}
