import {
  isNoteType,
  noteId,
  type AppInfo,
  type Attribute,
  type BranchInfo,
  type CreateNoteResult,
  type NoteId,
  type NoteMetadata,
  type SearchResponse,
} from "../types.js";
import { isRecord } from "./validateClientConfig.js";

export class TriliumEtapiError extends Error {
  readonly httpStatus: number;
  readonly code: string | undefined;

  constructor(httpStatus: number, message: string, code?: string) {
    super(message);
    this.name = "TriliumEtapiError";
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export function isProtectedEtapiError(error: unknown): boolean {
  if (error instanceof TriliumEtapiError) {
    if (error.code === "NOTE_IS_PROTECTED") {
      return true;
    }
    return error.message.includes("NOTE_IS_PROTECTED");
  }
  if (error instanceof Error) {
    return error.message.includes("NOTE_IS_PROTECTED");
  }
  return false;
}

export function toEtapiError(httpStatus: number, raw: unknown): TriliumEtapiError {
  if (typeof raw === "string" && raw.length > 0) {
    return new TriliumEtapiError(httpStatus, raw);
  }
  if (isRecord(raw)) {
    const message =
      typeof raw.message === "string" && raw.message.length > 0
        ? raw.message
        : `ETAPI HTTP ${httpStatus}`;
    const code = typeof raw.code === "string" ? raw.code : undefined;
    return new TriliumEtapiError(httpStatus, message, code);
  }
  return new TriliumEtapiError(httpStatus, `ETAPI HTTP ${httpStatus}`);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`[trilium] Expected string field "${key}"`);
  }
  return value;
}

function requireBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`[trilium] Expected boolean field "${key}"`);
  }
  return value;
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  if (!(key in record) || record[key] === undefined) {
    return fallback;
  }
  return requireBoolean(record, key);
}

function parseNoteIdField(record: Record<string, unknown>, key: string): NoteId {
  return noteId(requireString(record, key));
}

function parseNoteIdArray(value: unknown, field: string): NoteId[] {
  if (!Array.isArray(value)) {
    throw new Error(`[trilium] Expected string[] field "${field}"`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0) {
      throw new Error(`[trilium] Invalid note id at ${field}[${index}]`);
    }
    return noteId(item);
  });
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`[trilium] Expected string[] field "${field}"`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new Error(`[trilium] Invalid string at ${field}[${index}]`);
    }
    return item;
  });
}

function parseAttribute(value: unknown): Attribute {
  if (!isRecord(value)) {
    throw new Error("[trilium] Invalid attribute object");
  }
  const typeRaw = value.type;
  if (typeRaw !== "label" && typeRaw !== "relation") {
    throw new Error("[trilium] Invalid attribute.type");
  }
  const position = value.position;
  if (typeof position !== "number") {
    throw new Error("[trilium] Invalid attribute.position");
  }
  return {
    attributeId: requireString(value, "attributeId"),
    noteId: parseNoteIdField(value, "noteId"),
    type: typeRaw,
    name: requireString(value, "name"),
    value: typeof value.value === "string" ? value.value : "",
    position,
    isInheritable: requireBoolean(value, "isInheritable"),
  };
}

function parseAttributes(value: unknown): Attribute[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error("[trilium] Expected attributes array");
  }
  return value.map(parseAttribute);
}

export function parseNoteMetadata(raw: unknown): NoteMetadata {
  if (!isRecord(raw)) {
    throw new Error("[trilium] Note metadata is not an object");
  }
  const typeRaw = raw.type;
  if (!isNoteType(typeRaw)) {
    throw new Error("[trilium] Unknown or missing note.type");
  }
  return {
    noteId: parseNoteIdField(raw, "noteId"),
    title: requireString(raw, "title"),
    type: typeRaw,
    mime: requireString(raw, "mime"),
    isProtected: requireBoolean(raw, "isProtected"),
    blobId: requireString(raw, "blobId"),
    isDeleted: optionalBoolean(raw, "isDeleted", false),
    dateCreated: requireString(raw, "dateCreated"),
    dateModified: requireString(raw, "dateModified"),
    utcDateCreated: requireString(raw, "utcDateCreated"),
    utcDateModified: requireString(raw, "utcDateModified"),
    parentNoteIds: parseNoteIdArray(raw.parentNoteIds, "parentNoteIds"),
    childNoteIds: parseNoteIdArray(raw.childNoteIds, "childNoteIds"),
    parentBranchIds: parseStringArray(raw.parentBranchIds, "parentBranchIds"),
    childBranchIds: parseStringArray(raw.childBranchIds, "childBranchIds"),
    attributes: parseAttributes(raw.attributes),
  };
}

export function parseSearchResponse(raw: unknown): SearchResponse {
  if (!isRecord(raw)) {
    throw new Error("[trilium] Search response is not an object");
  }
  const resultsRaw = raw.results;
  if (!Array.isArray(resultsRaw)) {
    throw new Error("[trilium] Search response.results is not an array");
  }
  const parsed: SearchResponse = {
    results: resultsRaw.map(parseNoteMetadata),
  };
  if ("debugInfo" in raw) {
    parsed.debugInfo = raw.debugInfo;
  }
  return parsed;
}

export function parseAppInfo(raw: unknown): AppInfo {
  if (!isRecord(raw)) {
    throw new Error("[trilium] App info is not an object");
  }
  const appVersion = raw.appVersion;
  const dbVersion = raw.dbVersion;
  if (typeof appVersion !== "string" || typeof dbVersion !== "number") {
    throw new Error("[trilium] Invalid app-info shape");
  }
  return { appVersion, dbVersion };
}

function parseBranchInfo(raw: unknown): BranchInfo {
  if (!isRecord(raw)) {
    throw new Error("[trilium] Branch is not an object");
  }
  return {
    branchId: requireString(raw, "branchId"),
    noteId: parseNoteIdField(raw, "noteId"),
    parentNoteId: parseNoteIdField(raw, "parentNoteId"),
  };
}

export function parseCreateNoteResult(raw: unknown): CreateNoteResult {
  if (!isRecord(raw)) {
    throw new Error("[trilium] Create-note response is not an object");
  }
  return {
    note: parseNoteMetadata(raw.note),
    branch: parseBranchInfo(raw.branch),
  };
}

export function parseJsonBody(text: string): unknown {
  if (text.length === 0) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}
