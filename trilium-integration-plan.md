# Plan integracji: moduł Trilium dla MCP Server

> Data: 2026-09-20  
> Podstawa: `trilium-enhance-report.md` + analiza kodu projektu  
> Decyzje projektowe: TriliumClient (klasa), tools odczytu (get_note / list_by_label / get_tree) + zapis (`trilium_save_note`), Postman kolekcja od zera, bez kroków deploymentu  
> Dokumentacja API: [Trilium ETAPI — Backend API](https://docs.triliumnotes.org/user-guide/scripts/script-api/backend-api) · [ETAPI Reference](https://docs.triliumnotes.org/user-guide/advanced-usage/etapi)

---

## Przegląd

Projekt dodaje nowy moduł `trilium` do istniejącego modułowego MCP servera. Moduł będzie dostępny pod `/mcp/trilium`, komunikuje się z Trilium Next przez ETAPI, dostarcza trzy narzędzia tylko do odczytu oraz jedno narzędzie zapisu (`trilium_save_note`) i rejestruje metryki / health check spójnie z resztą projektu.

### Decyzje podjęte przed implementacją

| Decyzja | Wybór |
|---------|-------|
| Trilium w Docker | Nowy `docker-compose.trilium.yml` w `main_network` |
| Narzędzia (tools) | `trilium_get_note`, `trilium_list_by_label`, `trilium_get_tree`, `trilium_save_note` |
| Warstwa HTTP | Klasa `TriliumClient` w `src/modules/trilium/lib/` |
| Postman | Nowa kolekcja ETAPI budowana w ramach planu |
| `trilium_get_tree` | Jeden `GET /etapi/notes?search=note.noteId != ''&ancestorNoteId={parent}` — zagnieżdżone drzewo składa klient z `parentNoteIds` / `childNoteIds` (brak `GET …/children`) |
| Deployment | Poza zakresem tego planu |

---

## FAZA 0 — Infrastruktura: uruchomienie Trilium w Docker — **WYKONANA**

**Status:** WYKONANA

**Cel:** Trilium Next dostępny wewnętrznie w `main_network` pod nazwą hosta `trilium`, port `8080`. Zewnętrzny dostęp przez reverse proxy tylko opcjonalnie.

### Krok 0.1 — Utwórz `docker-compose.trilium.yml`

Plik tworzysz **w tym samym katalogu projektu** (lub wybranym miejscu homelaba, ale w tym samym `main_network`).

```yaml
# docker-compose.trilium.yml
version: "3.8"
services:
  trilium:
    image: triliumnext/notes:latest
    container_name: trilium
    networks:
      - main_network
    volumes:
      - trilium_data:/home/node/trilium-data
    restart: unless-stopped
    # Nie wystawiamy portu na hosta — MCP server dociera przez sieć wewnętrzną.
    # Jeśli chcesz dostępu przez przeglądarkę, dodaj: ports: ["127.0.0.1:8080:8080"]

volumes:
  trilium_data:

networks:
  main_network:
    external: true
    name: main_network
```

**DoD:** `docker compose -f docker-compose.trilium.yml up -d` uruchamia kontener bez błędów; `docker network inspect main_network` pokazuje kontener `trilium`.

---

### Krok 0.2 — Pierwsze uruchomienie i konfiguracja ETAPI

Kolejność kroków (wykonujesz ręcznie w przeglądarce / terminalu):

1. Tymczasowo dodaj port `127.0.0.1:8080:8080` do compose (lub użyj `docker exec`) i odwiedź `http://localhost:8080`.
2. Przejdź przez wizard pierwszego uruchomienia Trilium (ustaw hasło).
3. Otwórz **Menu → Options → ETAPI** i wygeneruj token API.
4. Skopiuj token — będzie potrzebny jako `TRILIUM_API_TOKEN` w `.env`.
5. Usuń tymczasowy port z compose lub zostaw go, jeśli chcesz dostępu przez przeglądarkę.

**DoD:** Możesz wywołać z hosta (lub z drugiego kontenera w `main_network`):  
`curl -H "Authorization: <token>" http://trilium:8080/etapi/app-info`  
i otrzymać JSON z polem `appVersion`.

---

## FAZA 1 — Postman: weryfikacja ETAPI przed implementacją — **WYKONANA**

**Status:** WYKONANA

**Cel:** Potwierdź, że każdy endpoint ETAPI, którego użyje moduł, zwraca oczekiwany kształt danych. Kolekcja posłuży też jako kontrakt podczas implementacji.

> 📖 **Dokumentacja ETAPI:** [docs.triliumnotes.org — ETAPI (REST API)](https://docs.triliumnotes.org/user-guide/advanced-usage/etapi) · [Backend API](https://docs.triliumnotes.org/user-guide/scripts/script-api/backend-api)

> **Ważne:** Trilium ETAPI przyjmuje token jako nagłówek `Authorization: <token>` (bez prefiksu `Bearer`).  
> Przykład: `Authorization: ETA...xyz`

---

### Krok 1.1 — Utwórz kolekcję i środowisko w Postmanie

1. W Postmanie utwórz nową kolekcję: **"Trilium ETAPI"**.
2. Utwórz środowisko **"Trilium Local"** z dwiema zmiennymi:
   - `trilium_base_url` = `http://localhost:8080` (lub URL przez reverse proxy)
   - `trilium_api_token` = `<token z Kroku 0.2>`
3. Ustaw to środowisko jako aktywne dla kolekcji.
4. Dla całej kolekcji — w zakładce **Authorization** ustaw:
   - Type: `API Key`
   - Key: `Authorization`
   - Value: `{{trilium_api_token}}`
   - Add to: `Header`

---

### Krok 1.2 — Request: Health check (`GET /etapi/app-info`)

- **Method:** GET
- **URL:** `{{trilium_base_url}}/etapi/app-info`
- **Oczekiwany wynik:** status `200`, body JSON z polami `appVersion`, `dbVersion`.
- **Test snippet:**
  ```js
  pm.test("app-info OK", () => {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json()).to.have.property("appVersion");
  });
  ```

**DoD:** Test zielony — potwierdza łączność i poprawność tokenu.

---

### Krok 1.3 — Request: Pobranie metadanych notatki (`GET /etapi/notes/{noteId}`)

- **Method:** GET  
- **URL:** `{{trilium_base_url}}/etapi/notes/{{note_id}}`  
- Dodaj zmienną środowiskową `note_id` = ID istniejącej notatki (możesz znaleźć w URL przeglądarki Trilium).
- **Oczekiwany wynik:** JSON z polami `noteId`, `title`, `type`, `mime`, `parentNoteIds`, `childNoteIds`.

**DoD:** Rozumiesz kształt `NoteMetadata` — jest podstawą do definicji typów TypeScript.

---

### Krok 1.4 — Request: Pobranie treści notatki (`GET /etapi/notes/{noteId}/content`)

- **Method:** GET  
- **URL:** `{{trilium_base_url}}/etapi/notes/{{note_id}}/content`  
- **Oczekiwany wynik:** dla notatek tekstowych — `text/html` lub `text/plain`; dla kodu — `text/plain`.  
- Zweryfikuj nagłówek `Content-Type` w odpowiedzi — wpłynie na sposób deserializacji treści w kliencie.

**DoD:** Wiesz, jakiego content-type spodziewać się w zależności od `type` notatki.

---

### Krok 1.5 — Request: Wyszukiwanie po labelce (`GET /etapi/notes?search=...`)

- **Method:** GET  
- **URL:** `{{trilium_base_url}}/etapi/notes?search=%23category%3Dtest&limit=20`  
  (odkodowane: `#category=test`)  
- Przetestuj kilka wariantów składni Trilium:
  - `#labelName` — notatki posiadające daną labelkę  
  - `#labelName=value` — filtr po wartości  
  - `#labelName note.type=code` — kombinacja filtrów  
- **Oczekiwany wynik:** JSON array `results` z obiektami `noteId`, `title`, `type`.

**DoD:** Znasz działającą składnię search query; jeśli `results` jest puste przy poprawnej kwerendzie — sprawdź czy notatki testowe mają przypisane labele.

---

### Krok 1.6 — Request: Dzieci notatki (`GET /etapi/notes/{noteId}/children`)

> Uwaga: ETAPI Trilium zwraca `childNoteIds` w metadanych notatki (Krok 1.3). Sprawdź, czy istnieje bezpośredni endpoint `/children` lub czy iterujesz po `childNoteIds` i fetuchujesz każdy osobno.  
> Weryfikacja: spróbuj `GET /etapi/notes/root/children` lub użyj `childNoteIds` z metadanych root node.

- **Method:** GET  
- **URL:** `{{trilium_base_url}}/etapi/notes/root` (lub inna notatka rodzic)  
- Przejrzyj `childNoteIds` w odpowiedzi.

**DoD:** Wiesz, jak zaimplementować `trilium_get_tree` — czy przez iterację po `childNoteIds`, czy przez inny endpoint. Zanotuj decyzję (wpłynie na implementację w Fazie 3).

---

### Krok 1.7 — Request: Tworzenie notatki (`POST /etapi/create-note`)

> Kontrakt: [ETAPI OpenAPI](https://github.com/TriliumNext/Trilium/blob/main/apps/server/src/assets/etapi.openapi.yaml) — `CreateNoteDef`: wymagane `parentNoteId`, `title`, `type`, `content`; `mime` tylko dla `code` / `file` / `image`.

- **Method:** POST
- **URL:** `{{trilium_base_url}}/etapi/create-note`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "parentNoteId": "root",
    "title": "MCP save test",
    "type": "text",
    "content": "<p>Utworzone z Postmana</p>"
  }
  ```
- **Oczekiwany wynik:** status `201`, body `{ note, branch }` — `note.noteId` to ID nowej notatki.
- Zapisz `note.noteId` do zmiennej środowiskowej `created_note_id` (test snippet `pm.environment.set(...)`).

**DoD:** Rozumiesz kształt odpowiedzi tworzenia — to kontrakt `createNote()` w `TriliumClient`.

---

### Krok 1.8 — Request: Aktualizacja treści (`PUT /etapi/notes/{noteId}/content`)

> ETAPI wymaga body `text/plain` **nawet gdy treść to HTML** (nie `application/json` i nie `text/html`). Sukces: `204 No Content`.

- **Method:** PUT
- **URL:** `{{trilium_base_url}}/etapi/notes/{{created_note_id}}/content`
- **Headers:** `Content-Type: text/plain`
- **Body (raw text):** `<p>Zaktualizowana treść</p>`
- **Oczekiwany wynik:** status `204`, puste body.

Opcjonalnie (zmiana tytułu, nie treści): `PATCH {{trilium_base_url}}/etapi/notes/{{created_note_id}}` z JSON `{ "title": "Nowy tytuł" }`.

**DoD:** Wiesz, że `TriliumClient.updateNoteContent()` musi wysłać `Content-Type: text/plain` (osobny fetch, nie ten sam `request<T>()` co JSON).

---

## FAZA 2 — Konfiguracja projektu

**Cel:** Dodaj Trilium do systemu konfiguracji bez zmiany żadnego istniejącego modułu.

---

### Krok 2.1 — Rozszerz `ModuleConfig` w `config/modules.config.ts`

Dodaj nowy typ do unii `ModuleConfig`:

```ts
export interface TriliumModuleConfig {
  baseUrl: string;
  apiToken: string;
}

export type ModuleConfig =
  | { name: 'portfolio'; enabled: boolean; namespace?: string; config: PortfolioModuleConfig }
  | { name: 'test-tools'; enabled: boolean; namespace?: string; config?: undefined }
  | { name: 'trilium'; enabled: boolean; namespace?: string; config: TriliumModuleConfig };
                                        // ^^^--- nowa pozycja w unii
```

---

### Krok 2.2 — Dodaj wpis `trilium` do `modulesConfig[]`

W tej samej sekcji `modulesConfig`:

```ts
{
  name: 'trilium',
  enabled: process.env.ENABLE_MODULE_TRILIUM !== 'false',
  namespace: process.env.TRILIUM_NAMESPACE || 'trilium',
  config: {
    baseUrl: process.env.TRILIUM_BASE_URL ?? '',
    apiToken: process.env.TRILIUM_API_TOKEN ?? '',
  },
},
```

**Uwaga:** `ToolRegistry.loadSingleModule` dynamicznie importuje `src/modules/trilium/index.js` — gdy plik nie istnieje, załadowanie modułu rzuci błąd. Moduł tworzysz w Fazie 3. Jeśli chcesz, możesz na razie dodać wpis z `enabled: false` i przestawić po implementacji.

Pełna treść `config/modules.config.ts` po obu krokach:

```ts
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export interface PortfolioModuleConfig {
  contentRoot: string;
  corpusVersion: string;
}

export interface TriliumModuleConfig {
  baseUrl: string;
  apiToken: string;
}

export type ModuleConfig =
  | {
      name: "portfolio";
      enabled: boolean;
      namespace?: string;
      config: PortfolioModuleConfig;
    }
  | {
      name: "test-tools";
      enabled: boolean;
      namespace?: string;
      config?: undefined;
    }
  | {
      name: "trilium";
      enabled: boolean;
      namespace?: string;
      config: TriliumModuleConfig;
    };

const defaultPortfolioContentRoot = path.join(
  repoRoot,
  "src",
  "modules",
  "portfolio",
  "content",
);

export const modulesConfig: ModuleConfig[] = [
  {
    name: "portfolio",
    enabled: process.env.ENABLE_MODULE_PORTFOLIO !== "false",
    namespace: process.env.PORTFOLIO_NAMESPACE || "portfolio",
    config: {
      contentRoot: process.env.PORTFOLIO_CONTENT_ROOT
        ? path.resolve(process.env.PORTFOLIO_CONTENT_ROOT)
        : defaultPortfolioContentRoot,
      corpusVersion: process.env.PORTFOLIO_CORPUS_VERSION || "1.0.0",
    },
  },
  {
    name: "test-tools",
    enabled: process.env.ENABLE_MODULE_TEST_TOOLS !== "false",
    namespace: process.env.TEST_TOOLS_NAMESPACE || "test",
  },
  {
    name: "trilium",
    enabled: process.env.ENABLE_MODULE_TRILIUM !== "false",
    namespace: process.env.TRILIUM_NAMESPACE || "trilium",
    config: {
      baseUrl: process.env.TRILIUM_BASE_URL ?? "",
      apiToken: process.env.TRILIUM_API_TOKEN ?? "",
    },
  },
];

export type ModuleId = ModuleConfig["name"];

export function getEnabledModuleByName(name: string): ModuleConfig | undefined {
  const found = modulesConfig.find((m) => m.name === name);
  if (!found || !found.enabled) {
    return undefined;
  }
  return found;
}
```

---

### Krok 2.3 — Dodaj zmienne do `.env.example`

```dotenv
# --- Trilium ---
ENABLE_MODULE_TRILIUM=false
TRILIUM_NAMESPACE=trilium
TRILIUM_BASE_URL=http://trilium:8080
TRILIUM_API_TOKEN=your_trilium_etapi_token_here
```

Wersja do `.env` (lokalnie, **nigdy nie commituj**):
```dotenv
ENABLE_MODULE_TRILIUM=true
TRILIUM_BASE_URL=http://localhost:8080   # lub http://trilium:8080 jeśli przez Docker
TRILIUM_API_TOKEN=<token z Kroku 0.2>
```

**DoD:** `tsc --noEmit` przechodzi bez błędów po zmianach w `modules.config.ts`.

---

## FAZA 3 — Implementacja modułu `src/modules/trilium/`

**Cel:** Moduł MCP pod `/mcp/trilium` — cztery toole, klient ETAPI, health check. Importy lokalne ze specyfikatorem `.js` (NodeNext). JSON z ETAPI wchodzi jako `unknown` i przechodzi przez parsery; na granicy publicznej nie ma `any`. Rejestracja tooli przez `registerInstrumentedTool` (jak portfolio), nie przez `server.tool`.

**Struktura plików do utworzenia:**

```
src/modules/trilium/
├── index.ts                 # register() + checkHealth()
├── types.ts                 # branded NoteId, NoteType, kontrakty ETAPI
├── lib/
│   ├── validateClientConfig.ts
│   ├── parseEtapi.ts        # unknown → typy; błędy ETAPI
│   ├── buildNoteTree.ts     # płaskie results → NoteTreeNode
│   ├── triliumClient.ts
│   └── toolResponse.ts      # toolOk / toolError (wzorzec z portfolio)
└── tools/
    ├── getNote.ts
    ├── listByLabel.ts
    ├── getTree.ts
    └── saveNote.ts
```

> `config/modules.config.ts` (Faza 2) już dostarcza `TriliumModuleConfig`. W Fazie 3 **nie** edytuj Faz 0/1. Istniejące szkice `types.ts` / `triliumClient.ts` / `validateClientConfig.ts` zastąp treścią z kroków poniżej (w tym pole `noteId` — ETAPI; nie `nodeId`).

---

### Krok 3.1 — `src/modules/trilium/types.ts` — **WYKONANY**

Kontrakt typów. `NoteId` jest branded — nie mylić z gołym `string`. Fabryka `noteId()` to jedyne miejsce z asercją brandu.

```ts
export type NoteId = string & { readonly __brand: "NoteId" };

/** Jedyna asercja brandu: wejście już sprawdzone jako niepusty string. */
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

/** Query searchSubtree — ten sam kontrakt co Postman Faza 1 (folder Tree). */
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

/**
 * Port klienta ETAPI — kształt dla tooli.
 * Klasa `TriliumClient` w `lib/triliumClient.ts` musi ten kontrakt spełniać (bez `implements`, żeby nie zamykać cyklu importów).
 */
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
	return typeof value === "string" && NOTE_TYPE_VALUES.some((item) => item === value);
}
```

**DoD:** Plik kompiluje się w `strict`; `NoteId` nie jest przypisywalny z gołego `string` bez `noteId()`.

---

### Krok 3.2 — Parsery ETAPI, walidacja configu, `TriliumClient`

Trzy pliki. `fetch` / `JSON.parse` to granica FFI: wynik od razu do `unknown`, potem parser.

#### `src/modules/trilium/lib/validateClientConfig.ts`

```ts
import type { TriliumClientConfig } from "../types.js";

export function validateClientConfig(config: TriliumClientConfig): void {
	if (config.baseUrl.length === 0) {
		throw new Error("[trilium] Missing baseUrl in module config");
	}
	if (config.apiToken.length === 0) {
		throw new Error("[trilium] Missing apiToken in module config");
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readTriliumConfig(config: unknown): TriliumClientConfig | undefined {
	if (!isRecord(config)) {
		return undefined;
	}
	const { baseUrl, apiToken } = config;
	if (typeof baseUrl !== "string" || typeof apiToken !== "string") {
		return undefined;
	}
	return { baseUrl, apiToken };
}
```

#### `src/modules/trilium/lib/parseEtapi.ts`

```ts
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
		isDeleted: requireBoolean(raw, "isDeleted"),
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
```

#### `src/modules/trilium/lib/buildNoteTree.ts`

Składanie drzewa z płaskiego `SearchResponse.results`. Brakujące ID z `childNoteIds` (np. dzieci `_hidden` poza wynikiem search) są pomijane. `depth` liczy poziomy dzieci od `ancestor` (1 = tylko bezpośrednie dzieci).

```ts
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
	if (excludeHidden && isHidden(id)) {
		return undefined;
	}
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
```

#### `src/modules/trilium/lib/triliumClient.ts`

`requestJson` — JSON in/out. `getNoteContent` / `updateNoteContent` — osobny fetch (`text/plain` przy PUT, Faza 1.8). `searchSubtree` = ten sam URL co request Postman w folderze Tree/children.

```ts
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
		params.set("search", query);
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
```

**DoD:** `searchSubtree` koduje `search=note.noteId != ''` i `ancestorNoteId`; PUT content używa `text/plain`; żaden parser nie rzutuje JSON na typ bez sprawdzenia pól.

---

### Krok 3.3 — `src/modules/trilium/lib/toolResponse.ts`

Ten sam kształt odpowiedzi co `src/modules/portfolio/lib/toolResponse.ts`. `toolOk` to alias `toolJson` używany w toolach Trilium.

```ts
export function toolJson(data: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
	};
}

export function toolOk(data: unknown) {
	return toolJson(data);
}

export function toolError(context: string, error: unknown) {
	const detail = error instanceof Error ? error.message : String(error);
	return {
		content: [{ type: "text" as const, text: `${context}: ${detail}` }],
		isError: true as const,
	};
}
```

**DoD:** Błąd toola ma `isError: true` (metryki `registerInstrumentedTool` liczą to jako `error`).

---

### Krok 3.4 — `src/modules/trilium/tools/getNote.ts`

Tool: `{namespace}_get_note`. Chroniona notatka (`isProtected` albo `NOTE_IS_PROTECTED` z ETAPI) → `toolError`, bez treści.

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { noteId, type TriliumToolOptions } from "../types.js";
import { isProtectedEtapiError } from "../lib/parseEtapi.js";
import { toolError, toolOk } from "../lib/toolResponse.js";

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
```

**DoD:** `includeContent !== true` nie woła `getNoteContent`. `isProtected` nie wycieka treści.

---

### Krok 3.5 — `src/modules/trilium/tools/listByLabel.ts`

Search ETAPI: `#label` albo `#label=value`. Limit 1–50, domyślnie 20.

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import type { TriliumToolOptions } from "../types.js";
import { toolError, toolOk } from "../lib/toolResponse.js";

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
```

**DoD:** Query wychodzi jako `#category` albo `#category=test`; odpowiedź to skrócone `{ noteId, title, type }[]`.

---

### Krok 3.6 — `src/modules/trilium/tools/getTree.ts`

Decyzja (Faza 1.6 żywa: **brak** `GET /etapi/notes/{id}/children` — 4xx `Router not found`). Hierarchia: `searchSubtree` + `buildNoteTree`. Domyślnie `parentNoteId=root`, `depth=1`, `excludeHidden=true`.

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import { noteId, ROOT_NOTE_ID, type TriliumToolOptions } from "../types.js";
import { buildNoteTree } from "../lib/buildNoteTree.js";
import { toolError, toolOk } from "../lib/toolResponse.js";

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
```

**DoD:** Jedno wywołanie `searchSubtree` na request; brak N+1 po `childNoteIds`; `_hidden` wycinane gdy `excludeHidden`.

---

### Krok 3.7 — `src/modules/trilium/tools/saveNote.ts`

Upsert: `noteId` → PATCH tytułu (jeśli podany) + PUT treści (jeśli podana). Bez `noteId` → `POST /etapi/create-note` (`parentNoteId` + `title` + `content` wymagane). `mime` tylko gdy `type` to `code` / `file` / `image`.

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInstrumentedTool } from "../../../observability/instrumentTool.js";
import {
	NOTE_TYPE_VALUES,
	noteId,
	type CreateNoteDef,
	type NoteType,
	type TriliumToolOptions,
} from "../types.js";
import { toolError, toolOk } from "../lib/toolResponse.js";

const MIME_REQUIRED_TYPES = new Set<NoteType>(["code", "file", "image"]);

const noteTypeSchema = z.enum(NOTE_TYPE_VALUES);

function mimeForCreate(type: NoteType, mime: string | undefined): string | undefined {
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
```

**DoD:** Create zwraca `action: "created"` i `noteId`; update nie woła `create-note`; PUT treści idzie przez `updateNoteContent` (`text/plain`).

---

### Krok 3.8 — `src/modules/trilium/index.ts`

Rejestracja jak portfolio: `namespace` + `moduleId` + `options.config`. Health: `GET /etapi/app-info`.

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HealthCheck, ModuleHealthChecker, ModuleOptions } from "../../core/types.js";
import { TriliumClient } from "./lib/triliumClient.js";
import { readTriliumConfig } from "./lib/validateClientConfig.js";
import { registerGetNoteTools } from "./tools/getNote.js";
import { registerGetTreeTools } from "./tools/getTree.js";
import { registerListByLabelTools } from "./tools/listByLabel.js";
import { registerSaveNoteTools } from "./tools/saveNote.js";
import type { TriliumToolOptions } from "./types.js";

export async function register(server: McpServer, options: ModuleOptions = {}) {
	const namespace = options.namespace || "trilium";
	const moduleId = options.moduleId ?? "trilium";
	const cfg = readTriliumConfig(options.config);
	if (cfg === undefined) {
		throw new Error(
			"[trilium] No config.baseUrl/apiToken. Check trilium entry in modules.config.ts.",
		);
	}

	const client = new TriliumClient(cfg);
	const toolOptions: TriliumToolOptions = { namespace, moduleId, client };

	registerGetNoteTools(server, toolOptions);
	registerListByLabelTools(server, toolOptions);
	registerGetTreeTools(server, toolOptions);
	registerSaveNoteTools(server, toolOptions);

	console.error(`[trilium] Registered tools with namespace: ${namespace}`);
}

export const checkHealth: ModuleHealthChecker = async (config: unknown) => {
	const cfg = readTriliumConfig(config);
	if (cfg === undefined) {
		const missing: HealthCheck = {
			id: "trilium_etapi",
			ok: false,
			detail: "missing baseUrl or apiToken in module config",
		};
		return [missing];
	}

	try {
		const client = new TriliumClient(cfg);
		const info = await client.getAppInfo();
		const ok: HealthCheck = {
			id: "trilium_etapi",
			ok: true,
			detail: `appVersion=${info.appVersion}`,
		};
		return [ok];
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		const failed: HealthCheck = {
			id: "trilium_etapi",
			ok: false,
			detail,
		};
		return [failed];
	}
};
```

**DoD Fazy 3:** `npx tsc --noEmit` przechodzi; `ENABLE_MODULE_TRILIUM=true` → log `[trilium] Registered tools with namespace: trilium`; `/healthz` zawiera `trilium_etapi`.

---

## FAZA 4 — Weryfikacja integracji (lokalna)

**Cel:** Potwierdzenie end-to-end: Cursor / klient MCP → MCP Server → Trilium ETAPI.

---

### Krok 4.1 — Weryfikacja health check

```bash
curl http://localhost:8090/healthz
```

**Oczekiwany wynik:**
```json
{
  "status": "ok",
  "checks": [
    { "id": "portfolio_content_root", "ok": true },
    { "id": "trilium_etapi_health", "ok": true }
  ]
}
```

Jeśli `trilium_etapi_health` jest `false`:
- Sprawdź `TRILIUM_BASE_URL` (czy serwer MCP dociera do Trilium — w Docker przez `http://trilium:8080`, lokalnie przez `http://localhost:8080`).
- Sprawdź czy token jest poprawny (Krok 1.2 w Postmanie powinien być zielony).

---

### Krok 4.2 — Weryfikacja toolsów przez Postman (MCP initialize)

Dodaj do kolekcji Postman "Trilium ETAPI" nowy folder **"MCP Server — Trilium module"** z requestami:

**Request A — Initialize session:**
- POST `http://localhost:8090/mcp/trilium`
- Headers: `Authorization: Bearer <MCP_INTERNAL_TOKEN>`, `Content-Type: application/json`
- Body (JSON-RPC initialize):
  ```json
  {
    "jsonrpc": "2.0", "id": 1, "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "postman-test", "version": "1.0" }
    }
  }
  ```
- Zapisz `mcp-session-id` z nagłówka odpowiedzi.

**Request B — Lista toolsów:**
- POST `http://localhost:8090/mcp/trilium`
- Header: `mcp-session-id: {{session_id}}`
- Body: `{ "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {} }`
- **Oczekiwany wynik:** lista zawiera `trilium_get_note`, `trilium_list_by_label`, `trilium_get_tree`, `trilium_save_note`.

**Request C — Wywołanie trilium_get_note:**
- POST `http://localhost:8090/mcp/trilium`
- Body:
  ```json
  {
    "jsonrpc": "2.0", "id": 3, "method": "tools/call",
    "params": {
      "name": "trilium_get_note",
      "arguments": { "noteId": "{{note_id}}", "includeContent": true }
    }
  }
  ```
- **Oczekiwany wynik:** `result.content` zawiera metadane i treść notatki.

**Request D — Wywołanie trilium_save_note (create):**
- POST `http://localhost:8090/mcp/trilium`
- Body:
  ```json
  {
    "jsonrpc": "2.0", "id": 4, "method": "tools/call",
    "params": {
      "name": "trilium_save_note",
      "arguments": {
        "parentNoteId": "root",
        "title": "MCP save smoke test",
        "type": "text",
        "content": "<p>Zapisane przez MCP</p>"
      }
    }
  }
  ```
- **Oczekiwany wynik:** `action: "created"` oraz `note.noteId`.
- Potwierdź w UI Trilium (lub Request C z nowym `noteId`), że notatka istnieje.

**DoD Fazy 4 (tools):** testy A–D zielone (initialize, list, get, save).

---

### Krok 4.3 — Sprawdź metryki Prometheus

```bash
curl http://localhost:8090/metrics | grep trilium
```

**Oczekiwane metryki** (po kilku wywołaniach toolsów):
```
mcp_tool_calls_total{module="trilium", tool="trilium_get_note", result="ok"} N
mcp_tool_duration_seconds_bucket{module="trilium", ...}
```

**DoD Fazy 4:** Testy A/B/C/D są zielone; metryki zawierają wpisy dla modułu `trilium` (w tym `trilium_save_note`); health check zwraca `ok`.

---

## Podsumowanie zależności między fazami

```
Faza 0 (Docker Trilium) — WYKONANA
  └─► Faza 1 (Postman — weryfikacja ETAPI) — WYKONANA
        └─► Faza 2 (Config projektu)
              └─► Faza 3 (Implementacja modułu)
                    └─► Faza 4 (Weryfikacja integracji)
```

Fazy 1 i 2 są **niezależne** (możesz równolegle dodać config i testować ETAPI w Postmanie). Faza 3 zaczyna się po Fazie 1 (znasz kształt danych) i Fazie 2 (config gotowy).

---

## Pliki zmieniane / tworzone — pełna lista

| Plik | Operacja | Faza |
|------|----------|------|
| `docker-compose.trilium.yml` | Utwórz (poza projektem TS) | 0 |
| `.env.example` | Dodaj zmienne Trilium | 2 |
| `.env` | Dodaj wartości lokalne (nie commituj) | 2 |
| `config/modules.config.ts` | Dodaj `TriliumModuleConfig` i wpis w `modulesConfig[]` | 2 |
| `src/modules/trilium/types.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/validateClientConfig.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/parseEtapi.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/buildNoteTree.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/triliumClient.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/toolResponse.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/getNote.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/listByLabel.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/getTree.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/saveNote.ts` | Utwórz | 3 |
| `src/modules/trilium/index.ts` | Utwórz | 3 |

**Pliki niezmienione:** `src/core/*`, `src/transports/*`, `src/modules/portfolio/*`, `src/modules/test-tools/*`.
