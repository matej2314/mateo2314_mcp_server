import type {
  AppInfo,
  CreateNoteDef,
  CreateNoteResult,
  NoteId,
  NoteMetadata,
  PatchNoteFields,
  TriliumClientConfig,
} from "../types.js";
import { SUBTREE_SEARCH_QUERY } from "../types.js";
import { validateClientConfig } from "./validateClientConfig.js";
import {
  parseAppInfo,
  parseCreateNoteResult,
  parseJsonBody,
  parseNoteMetadata,
  parseSearchResponse,
  toEtapiError,
} from "./parseEtapi.js";
import { URLSearchParams } from "url";

interface AuthHeaders {
  Authorization: string;
  Accept: string;
  "Content-Type": string;
}

export class TriliumClient {
  private readonly baseUrl: string;
  private readonly headers: AuthHeaders;

  constructor(config: TriliumClientConfig) {
    validateClientConfig(config);
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: config.apiToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  private async requestJson<T>(
    path: string,
    parse: (raw: unknown) => T,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.headers,
        ...init?.headers,
      },
    });
    const raw = parseJsonBody(await response.text());
    if (!response.ok) {
      throw toEtapiError(response.status, raw);
    }
    return parse(raw);
  }

  async getAppInfo(): Promise<AppInfo> {
    return this.requestJson("/etapi/app-info", parseAppInfo);
  }

  async getNoteMetadata(id: NoteId): Promise<NoteMetadata> {
    return this.requestJson(`/etapi/notes/${id}`, parseNoteMetadata);
  }

  async getNoteContent(id: NoteId): Promise<string> {
    const response = await fetch(`${this.baseUrl}/etapi/notes/${id}/content`, {
      headers: {
        Authorization: this.headers.Authorization,
        Accept: "*/*",
      },
    });
    const text = await response.text();
    if (!response.ok) {
      throw toEtapiError(response.status, parseJsonBody(text));
    }
    return text;
  }

  async searchNotes(query: string, limit = 20): Promise<NoteMetadata[]> {
    const params = new URLSearchParams();
    params.set("query", query);
    params.set("limit", String(limit));
    const parsed = await this.requestJson(
      `/etapi/notes?${params.toString()}`,
      parseSearchResponse,
    );
    return parsed.results;
  }

  async searchSubtree(ancestorNoteId: NoteId): Promise<NoteMetadata[]> {
    const params = new URLSearchParams();
    params.set("search", SUBTREE_SEARCH_QUERY);
    params.set("ancestorNoteId", ancestorNoteId);
    const parsed = await this.requestJson(
      `/etapi/notes?${params.toString()}`,
      parseSearchResponse,
    );
    return parsed.results;
  }

  async createNote(def: CreateNoteDef): Promise<CreateNoteResult> {
    const body: Record<string, string> = {
      parentNoteId: def.parentNoteId,
      title: def.title,
      type: def.type,
      content: def.content,
    };
    if (def.mime !== undefined) {
      body.mime = def.mime;
    }
    return this.requestJson("/etapi/create-note", parseCreateNoteResult, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updateNoteContent(id: NoteId, content: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/etapi/notes/${id}/content`, {
      method: "PUT",
      headers: {
        Authorization: this.headers.Authorization,
        "Content-Type": "text/plain",
      },
      body: content,
    });
    if (!response.ok) {
      const raw = parseJsonBody(await response.text());
      throw toEtapiError(response.status, raw);
    }
  }

  async patchNote(id: NoteId, fields: PatchNoteFields): Promise<NoteMetadata> {
    return this.requestJson(`/etapi/notes/${id}`, parseNoteMetadata, {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
  }
}
