import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { noteId } from "../types.js";
import { isProtectedEtapiError } from "../lib/parseEtapi.js";
import { toolError, toolOk } from "../lib/toolResponse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TriliumToolOptions } from "../types.js";

export function registerGetNoteTools(
  server: McpServer,
  options: TriliumToolOptions,
): void {
  const toolName = `${options.namespace}_get_note`;
  const { client } = options;

  registerInstrumentedTool(
    server,
    options.moduleId,
    toolName,
    {
      description: `[${options.namespace}] Pobiera metadane notatki Trilium po noteId; opcjonalnie treść. Chronione notatki zwracają błąd bez odczytu treści.`,
      inputSchema: {
        noteId: z.string().min(1).describe("ID notatki w Trilium"),
        includeContent: z
          .boolean()
          .optional()
          .describe("Czy dołączyć treść (domyślnie false)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async (args: { noteId: string; includeContent?: boolean }) => {
      try {
        const id = noteId(args.noteId);
        const metadata = await client.getNoteMetadata(id);
        if (metadata.isProtected) {
          return toolError(
            `[${toolName}] Note is protected`,
            "NOTE_IS_PROTECTED",
          );
        }
        if (args.includeContent === true) {
          const content = await client.getNoteContent(id);
          return toolOk({ metadata, content });
        }
        return toolOk({ metadata });
      } catch (error) {
        if (isProtectedEtapiError(error)) {
          return toolError(`[${toolName}] Note is protected`, error);
        }
        return toolError(`[${toolName}] Error`, error);
      }
    },
  );
}
