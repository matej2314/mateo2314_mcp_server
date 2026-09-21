export type NoteId = string & { readonly __brand: "NoteId" };

export function noteId(value: string): NoteId {
  if (value.length === 0) {
    throw new Error("[trilium] Empty noteId");
  }
  return value as NoteId;
}

export const NOTE_TYPE_VALUES = [
  "text",
  "code",
  "file",
  "image",
  "search",
  "book",
  "relationMap",
  "canvas",
  "mermaid",
  "webView",
  "render",
  "geoMap",
  "aiChat",
] as const;

export type NoteType = (typeof NOTE_TYPE_VALUES)[number];

export const HIDDEN_NOTE_ID = noteId("_hidden");
export const ROOT_NOTE_ID = noteId("root");

export const SUBTREE_SEARCH_QUERY = "note.noteId != ''";

export interface Attribute {
  attributeId: string;
  noteId: NoteId;
  type: "label" | "relation";
  name: string;
  value: string;
  position: number;
  isInheritable: boolean;
}

export interface NoteMetadata {
  noteId: NoteId;
  title: string;
  type: NoteType;
  mime: string;
  isProtected: boolean;
  blobId: string;
  isDeleted: boolean;
  dateCreated: string;
  dateModified: string;
  utcDateCreated: string;
  utcDateModified: string;
  parentNoteIds: NoteId[];
  childNoteIds: NoteId[];
  parentBranchIds: string[];
  childBranchIds: string[];
  attributes: Attribute[];
}

export interface SearchResponse {
  results: NoteMetadata[];
  debugInfo?: unknown;
}

export interface AppInfo {
  appVersion: string;
  dbVersion: number;
}

export interface BranchInfo {
  branchId: string;
  noteId: NoteId;
  parentNoteId: NoteId;
}

export interface CreateNoteDef {
  parentNoteId: NoteId;
  title: string;
  type: NoteType;
  content: string;
  mime?: string;
}

export interface CreateNoteResult {
  note: NoteMetadata;
  branch: BranchInfo;
}

export interface NoteTreeNode {
  noteId: NoteId;
  title: string;
  type: NoteType;
  mime: string;
  children: NoteTreeNode[];
}

export interface TriliumClientConfig {
  baseUrl: string;
  apiToken: string;
}

export interface TriliumModuleConfig {
  baseUrl: string;
  apiToken: string;
}

export interface PatchNoteFields {
  title?: string;
}

export interface TriliumClientPort {
  getAppInfo(): Promise<AppInfo>;
  getNoteMetadata(id: NoteId): Promise<NoteMetadata>;
  getNoteContent(id: NoteId): Promise<string>;
  searchNotes(query: string, limit?: number): Promise<NoteMetadata[]>;
  searchSubtree(ancestorNoteId: NoteId): Promise<NoteMetadata[]>;
  createNote(def: CreateNoteDef): Promise<CreateNoteResult>;
  updateNoteContent(id: NoteId, content: string): Promise<void>;
  patchNote(id: NoteId, fields: PatchNoteFields): Promise<NoteMetadata>;
}

export interface TriliumToolOptions {
  namespace: string;
  moduleId: string;
  client: TriliumClientPort;
}

export function isNoteType(value: unknown): value is NoteType {
  return (
    typeof value === "string" && NOTE_TYPE_VALUES.some((item) => item === value)
  );
}
