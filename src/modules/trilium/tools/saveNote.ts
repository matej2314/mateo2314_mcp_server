import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { NOTE_TYPE_VALUES, noteId } from "../types.js";
import { toolError, toolOk } from "../lib/toolResponse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CreateNoteDef,
  NoteType,
  TriliumToolOptions,
} from "../types.js";

const MIME_REQUIRED_TYPES = new Set<NoteType>(["code", "file", "image"]);

const noteTypeSchema = z.enum(NOTE_TYPE_VALUES);

function mimeForCreate(
  type: NoteType,
  mime: string | undefined,
): string | undefined {
  if (mime !== undefined && mime.length > 0) {
    return mime;
  }
  if (MIME_REQUIRED_TYPES.has(type)) {
    throw new Error(
      `mime is required when type is ${type} (code / file / image)`,
    );
  }
  return undefined;
}

export function registerSaveNoteTools(
  server: McpServer,
  options: TriliumToolOptions,
): void {
  const toolName = `${options.namespace}_save_note`;
  const { client } = options;

  registerInstrumentedTool(
    server,
    options.moduleId,
    toolName,
    {
      description: `[${options.namespace}] Zapis notatki: bez noteId — create (parentNoteId+title+content); z noteId — update tytułu i/lub treści.`,
      inputSchema: {
        noteId: z
          .string()
          .min(1)
          .optional()
          .describe("Istniejące ID — tryb aktualizacji"),
        parentNoteId: z
          .string()
          .min(1)
          .optional()
          .describe("Rodzic przy tworzeniu (wymagany bez noteId)"),
        title: z.string().min(1).optional().describe("Tytuł notatki"),
        type: noteTypeSchema
          .optional()
          .describe("Typ przy tworzeniu (domyślnie text)"),
        mime: z
          .string()
          .optional()
          .describe("Wymagane przy type code / file / image"),
        content: z.string().optional().describe("Treść (HTML lub plain)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args: {
      noteId?: string;
      parentNoteId?: string;
      title?: string;
      type?: NoteType;
      mime?: string;
      content?: string;
    }) => {
      try {
        if (args.noteId !== undefined) {
          const id = noteId(args.noteId);
          if (args.title !== undefined) {
            await client.patchNote(id, { title: args.title });
          }
          if (args.content !== undefined) {
            await client.updateNoteContent(id, args.content);
          }
          if (args.title === undefined && args.content === undefined) {
            return toolError(
              `[${toolName}] Invalid update`,
              "Provide title and/or content when noteId is set",
            );
          }
          const metadata = await client.getNoteMetadata(id);
          return toolOk({ action: "updated", noteId: id, metadata });
        }

        if (
          args.parentNoteId === undefined ||
          args.title === undefined ||
          args.content === undefined
        ) {
          return toolError(
            `[${toolName}] Invalid create`,
            "parentNoteId, title and content are required when noteId is omitted",
          );
        }

        const type: NoteType = args.type ?? "text";
        const def: CreateNoteDef = {
          parentNoteId: noteId(args.parentNoteId),
          title: args.title,
          type,
          content: args.content,
        };
        const mime = mimeForCreate(type, args.mime);
        if (mime !== undefined) {
          def.mime = mime;
        }
        const created = await client.createNote(def);
        return toolOk({
          action: "created",
          noteId: created.note.noteId,
          note: created.note,
          branch: created.branch,
        });
      } catch (error) {
        return toolError(`[${toolName}] Error`, error);
      }
    },
  );
}
