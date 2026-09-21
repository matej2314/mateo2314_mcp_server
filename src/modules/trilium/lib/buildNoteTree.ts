import {
  HIDDEN_NOTE_ID,
  type NoteId,
  type NoteMetadata,
  type NoteTreeNode,
} from "../types.js";

function isHidden(id: NoteId): boolean {
  return id === HIDDEN_NOTE_ID;
}

function walk(
  id: NoteId,
  remaining: number,
  byId: ReadonlyMap<string, NoteMetadata>,
  excludeHidden: boolean,
): NoteTreeNode | undefined {
  if (excludeHidden && isHidden(id)) return undefined;

  const meta = byId.get(id);
  if (meta === undefined) {
    return undefined;
  }

  const children: NoteTreeNode[] = [];
  if (remaining > 0) {
    for (const childId of meta.childNoteIds) {
      const child = walk(childId, remaining - 1, byId, excludeHidden);
      if (child !== undefined) {
        children.push(child);
      }
    }
  }

  return {
    noteId: meta.noteId,
    title: meta.title,
    type: meta.type,
    mime: meta.mime,
    children,
  };
}

export function buildNoteTree(
  flat: readonly NoteMetadata[],
  ancestor: NoteId,
  depth: number,
  excludeHidden: boolean,
): NoteTreeNode {
  const byId = new Map<string, NoteMetadata>();
  for (const note of flat) {
    byId.set(note.noteId, note);
  }

  const rooted = walk(ancestor, depth, byId, excludeHidden);
  if (rooted !== undefined) {
    return rooted;
  }

  const children: NoteTreeNode[] = [];
  if (depth >= 1) {
    for (const note of flat) {
      if (excludeHidden && isHidden(note.noteId)) {
        continue;
      }
      if (!note.parentNoteIds.includes(ancestor)) {
        continue;
      }
      const child = walk(note.noteId, depth - 1, byId, excludeHidden);
      if (child !== undefined) {
        children.push(child);
      }
    }
  }

  return {
    noteId: ancestor,
    title: ancestor,
    type: "text",
    mime: "text/html",
    children,
  };
}
