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

**Struktura plików do utworzenia:**

```
src/modules/trilium/
├── index.ts              # register() + checkHealth()
├── types.ts              # branded types + interfejsy ETAPI
└── lib/
│   ├── triliumClient.ts  # klasa TriliumClient
│   └── toolResponse.ts   # helpery toolOk / toolError (wzorzec z portfolio)
└── tools/
    ├── getNote.ts        # trilium_get_note
    ├── listByLabel.ts    # trilium_list_by_label
    ├── getTree.ts        # trilium_get_tree
    └── saveNote.ts       # trilium_save_note
```

---

### Krok 3.1 — `types.ts` — branded types i interfejsy ETAPI

Zdefiniuj:

```ts
// Branded type na NoteId — zapobiega myleniu zwykłego stringa z ID notatki
type Brand<T, B extends string> = T & { readonly _brand: B };
export type NoteId = Brand<string, 'NoteId'>;

export function noteId(raw: string): NoteId {
  return raw as NoteId;
}

// M1: pełna lista typów notatek (OpenAPI create jest niepełny — obowiązuje ta lista)
export type NoteType =
  | 'text' | 'code' | 'file' | 'image' | 'search' | 'book' | 'relationMap' | 'render'
  | 'noteMap' | 'mermaid' | 'canvas' | 'webView' | 'launcher' | 'doc'
  | 'contentWidget' | 'mindMap' | 'spreadsheet' | 'llmChat';

// M2: atrybut notatki (label lub relation) — potrzebny w NoteMetadata.attributes
export interface Attribute {
  attributeId: string;
  noteId: NoteId;
  type: 'label' | 'relation';
  name: string;
  value: string;
  position: number;
  isInheritable: boolean;
  utcDateModified: string; // readOnly
}

// M2: pełny kształt Note z ETAPI (odpowiedź GET /etapi/notes/{noteId} i SearchResponse.results)
export interface NoteMetadata {
  noteId: NoteId;
  title: string;            // chronione: "[protected]"
  type: NoteType;
  mime: string;
  isProtected: boolean;     // M3: gdy true — title="[protected]", treść zwraca 400 NOTE_IS_PROTECTED
  blobId: string;
  attributes: Attribute[];
  parentNoteIds: NoteId[];
  childNoteIds: NoteId[];
  parentBranchIds: string[];
  childBranchIds: string[];
  dateCreated: string;
  dateModified: string;     // readOnly
  utcDateCreated: string;
  utcDateModified: string;  // readOnly
}

// M2: SearchResponse.results to pełne obiekty Note, nie okrojony podzbiór
export interface SearchResponse {
  results: NoteMetadata[];
  debugInfo?: unknown;      // tylko gdy debug=true w query
}

// Wynik trilium_get_tree — zagnieżdżenie złożone po stronie modułu (ETAPI zwraca płaską listę)
export interface NoteTreeNode {
  noteId: NoteId;
  title: string;
  type: NoteType;
  mime: string;
  children: NoteTreeNode[];
}

// Konfiguracja przekazywana z modules.config.ts
export interface TriliumClientConfig {
  baseUrl: string;
  apiToken: string;
}

export interface CreateNoteInput {
  parentNoteId: NoteId;
  title: string;
  type: NoteType;
  content: string;
  mime?: string;
}

export interface CreateNoteResult {
  note: NoteMetadata;
  branch: { branchId: string; noteId: NoteId; parentNoteId: NoteId };
}
```

**DoD:** Brak `any` w typach; `NoteId` niemożliwy do zbudowania poza fabryką `noteId()`.

---

### Krok 3.2 — `lib/triliumClient.ts` — klasa TriliumClient

> 📖 Endpointy opisane w [ETAPI Reference](https://docs.triliumnotes.org/user-guide/advanced-usage/etapi) i [API Reference](https://docs.triliumnotes.org/user-guide/advanced-usage/etapi/api-reference). (Link „Backend API" w poprzedniej wersji wskazywał na wewnętrzny scripting API — usunięty.)

```ts
import type { CreateNoteInput, CreateNoteResult, NoteId, NoteMetadata, SearchResponse, TriliumClientConfig } from '../types.js';

export class TriliumClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: TriliumClientConfig) {
    if (!config.baseUrl) throw new Error('[TriliumClient] baseUrl is required');
    if (!config.apiToken) throw new Error('[TriliumClient] apiToken is required');
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      Authorization: config.apiToken,   // ETAPI: bez prefiksu "Bearer"
      'Content-Type': 'application/json',
    };
  }

  // Metody publiczne do implementacji:
  async getAppInfo(): Promise<{ appVersion: string; dbVersion: number }>;
  async getNoteMetadata(id: NoteId): Promise<NoteMetadata>;
  async getNoteContent(id: NoteId): Promise<string>;
  async searchNotes(query: string, limit?: number): Promise<NoteMetadata[]>;
  /** Poddrzewo: GET /etapi/notes?search=note.noteId != ''&ancestorNoteId= */
  async searchSubtree(ancestorNoteId: NoteId): Promise<NoteMetadata[]>;
  async createNote(input: CreateNoteInput): Promise<CreateNoteResult>;
  async updateNoteContent(id: NoteId, content: string): Promise<void>;
  async patchNote(id: NoteId, patch: { title?: string }): Promise<NoteMetadata>;

  // Metoda prywatna — wspólna obsługa fetch + błędów HTTP (JSON)
  private async request<T>(path: string, init?: RequestInit): Promise<T>;
}
```

**Szczegóły implementacji:**

- `request<T>()` wykonuje `fetch(this.baseUrl + path, { headers: this.headers })`:
  - Jeśli `response.ok === false` — rzuca `Error` z kodem HTTP i tekstem błędu z body.
  - Zwraca `response.json() as Promise<T>`.
- `getNoteContent()` używa `response.text()` zamiast `json()` (treść to HTML/plain).
- `searchNotes(query, limit)` → `GET /etapi/notes?search=…` (opcjonalnie `&limit=`); body `SearchResponse`, zwraca `results` (`NoteMetadata[]`). Używane przez `trilium_list_by_label`.
- `searchSubtree(ancestorNoteId)` → `GET /etapi/notes?search=${encodeURIComponent("note.noteId != ''")}&ancestorNoteId=${ancestorNoteId}`. Body: `SearchResponse`; metoda zwraca `results`. Ten sam endpoint co request Postman **1.6 Tree / children → hierarchia**.
- `createNote()` → `POST /etapi/create-note`, body JSON, oczekiwany status `201`.
- `updateNoteContent()` → `PUT /etapi/notes/{id}/content`, body surowy string, nagłówek `Content-Type: text/plain` (nie JSON); oczekiwany status `204`.
- `patchNote()` → `PATCH /etapi/notes/{id}`, body JSON `{ title }` gdy agent zmienia tylko tytuł.
- Brak retry / cache na tym etapie — to v1 modułu.

**DoD:** `TriliumClient` importowany w toolsach bez błędów typowania; `tsc --noEmit` zielony.

---

### Krok 3.3 — `lib/toolResponse.ts` — helpery odpowiedzi

Powiel i dostosuj wzorzec z `src/modules/portfolio/lib/toolResponse.ts`:

```ts
// Zwraca sukces w formacie MCP (text/plain lub JSON stringified)
export function toolOk(data: unknown): ToolResult;

// Zwraca błąd z isError: true i czytelnym komunikatem
export function toolError(label: string, err: unknown): ToolResult;
```

**Uwaga:** Możesz wydzielić `toolResponse.ts` jako współdzielony helper w `src/core/` jeśli chcesz unikać duplikacji. Na potrzeby tej integracji kopiowanie wzorca jest w pełni akceptowalne — moduły są izolowane.

---

### Krok 3.4 — `tools/getNote.ts` — tool `trilium_get_note`

**Inputy:**
- `noteId: z.string().min(1)` — ID notatki w Trilium
- `includeContent: z.boolean().optional()` — czy pobrać treść (domyślnie `false`)

**Logika:**
1. `client.getNoteMetadata(noteId)` — zawsze.
2. Jeśli `metadata.isProtected === true` → natychmiast zwróć `toolError('[trilium_get_note] Note is protected', 'NOTE_IS_PROTECTED')` (M3: nie próbuj pobierać treści chronionej notatki).
3. Jeśli `includeContent === true` → `client.getNoteContent(noteId)`.
4. Zwróć `toolOk({ metadata, content? })`.
5. `catch` → jeśli błąd zawiera kod `NOTE_IS_PROTECTED` → `toolError('[trilium_get_note] Note is protected', err)`, w przeciwnym razie `toolError('[trilium_get_note] Error', err)`.

**Annotations MCP:**
```ts
annotations: { readOnlyHint: true, destructiveHint: false }
```

---

### Krok 3.5 — `tools/listByLabel.ts` — tool `trilium_list_by_label`

**Inputy:**
- `label: z.string().min(1)` — nazwa labeli (np. `type`, `category`)
- `value: z.string().optional()` — oczekiwana wartość labeli
- `limit: z.number().int().min(1).max(100).optional()` — domyślnie `20`

**Logika:**
1. Zbuduj query Trilium: `value` zdefiniowany → `#${label}=${value}`, bez value → `#${label}`.
2. `client.searchNotes(query, limit)`.
3. Zwróć `toolOk({ query, count: results.length, results })`.
4. `catch` → `toolError('[trilium_list_by_label] Error', err)`.

**Annotations MCP:**
```ts
annotations: { readOnlyHint: true, destructiveHint: false }
```

---

### Krok 3.6 — `tools/getTree.ts` — tool `trilium_get_tree`

Refaktor względem: Faza 1 / Krok 1.6 (WYKONANY w ramach fazy). Pierwotny wariant (iteracja `GET /etapi/notes/{id}` po `childNoteIds`, ewentualnie `/children`) **nie obowiązuje**. Na żywej instancji `GET /etapi/notes/root/children` zwraca `Router not found`. Kontrakt toola: **jedno** wyszukiwanie poddrzewa i złożenie hierarchii z pól topologii.

**Endpoint:** `GET /etapi/notes?search=note.noteId != ''&ancestorNoteId={parentNoteId}`  
(`search` jest obowiązkowe w ETAPI — warunek „dowolne noteId”; hierarchii nie koduje query, tylko `ancestorNoteId` + `parentNoteIds` / `childNoteIds` w `results`). Kolekcja Postman: folder **1.6 Tree / children** → request hierarchii.

**Inputy:**
- `parentNoteId: z.string().optional()` — domyślnie `'root'`
- `depth: z.number().int().min(1).max(3).optional()` — domyślnie `1` (ile poziomów **w dół od rodzica** w złożonym drzewie; search i tak zwraca całe poddrzewo, przycinanie jest po stronie toola)
- `excludeHidden: z.boolean().optional()` — domyślnie `true` — nie wchodź do notatki `_hidden` (systemowy folder Hidden Notes)

**Logika:**
1. `ancestor = noteId(parentNoteId ?? 'root')`.
2. `flat = await client.searchSubtree(ancestor)` — płaska `NoteMetadata[]` (bez treści notatek).
3. Mapa `noteId → NoteMetadata`. Złóż `NoteTreeNode` startując od `ancestor`: dzieci = `childNoteIds` obecne w mapie; rekurencja aż `depth`; ID spoza `results` pomiń (na żywej odpowiedzi `_hidden` wymienia dzieci, których nie ma w `results`).
4. Gdy `excludeHidden === true`, nie dodawaj węzła `_hidden` ani jego potomków.
5. Zwróć `toolOk({ parentNoteId: ancestor, depth, tree: NoteTreeNode })` — **zagnieżdżone** `children`, nie płaska lista.
6. `catch` → `toolError('[trilium_get_tree] Error', err)`.

**DoD odpowiedzi:** dla `parentNoteId=root` i wystarczającego `depth` widać wnuki (np. `MCP save test` → `child test note`), czego sam `GET /etapi/notes/root` nie pokazuje.

**Ograniczenia w `description` toola:** ETAPI nie zwraca zagnieżdżonego JSON-a; tree jest złożone w module. Search nie gwarantuje kompletności względem `childNoteIds`. Duże poddrzewa — trzymaj `depth` nisko.

**Annotations MCP:**
```ts
annotations: { readOnlyHint: true, destructiveHint: false }
```

---

### Krok 3.7 — `tools/saveNote.ts` — tool `trilium_save_note`

Narzędzie zapisu (create lub update). Semantyka upsert:

| `noteId` | Zachowanie |
|----------|------------|
| podany | aktualizacja istniejącej notatki (`PUT /content`; opcjonalnie `PATCH` tytułu) |
| brak | utworzenie nowej (`POST /etapi/create-note`) |

**Inputy:**
- `noteId: z.string().min(1).optional()` — ID notatki do nadpisania; brak = create
- `parentNoteId: z.string().min(1).optional()` — rodzic w drzewie; **wymagany przy create**, ignorowany przy update treści
- `title: z.string().min(1).optional()` — wymagany przy create; przy update opcjonalna zmiana tytułu
- `content: z.string().optional()` — treść notatki; wymagany przy create; przy update — jeśli podany, nadpisuje treść
- `type: z.enum(['text', 'code', 'file', 'image', 'search', 'book', 'relationMap', 'render', 'noteMap', 'mermaid', 'canvas', 'webView', 'launcher', 'doc', 'contentWidget', 'mindMap', 'spreadsheet', 'llmChat']).optional()` — domyślnie `'text'` (tylko create)
- `mime: z.string().optional()` — tylko gdy `type` to `code` / `file` / `image`

**Walidacja w handlerze (zanim fetch):**
1. Create (`noteId` brak): `parentNoteId`, `title` i `content` muszą być niepuste → inaczej `toolError` z czytelnym komunikatem (bez wywołania ETAPI).
2. Update (`noteId` podany): co najmniej jedno z `content` / `title` musi być podane.

**Logika create:**
1. `client.createNote({ parentNoteId, title, type: type ?? 'text', content, mime })`.
2. Zwróć `toolOk({ action: 'created', note, branch })`.

**Logika update:**
1. Jeśli `content` podane → `client.updateNoteContent(noteId, content)`.
2. Jeśli `title` podane → `client.patchNote(noteId, { title })`.
3. Zwróć `toolOk({ action: 'updated', noteId, updated: { content: boolean, title: boolean } })`.
4. `catch` → jeśli błąd zawiera kod `NOTE_IS_PROTECTED` → `toolError('[trilium_save_note] Note is protected — cannot modify', err)`, w przeciwnym razie `toolError('[trilium_save_note] Error', err)`. (M3)

**Annotations MCP** (mutujące, niekasujące):
```ts
annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
```

`idempotentHint: false` — create zawsze tworzy nową notatkę; powtórne wywołanie bez `noteId` nie jest idempotentne.

---

### Krok 3.8 — `index.ts` — entry point modułu

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ModuleOptions } from '../../core/types.js';
import type { TriliumModuleConfig } from '../../../config/modules.config.js';
import type { HealthCheck, ModuleHealthChecker } from '../../core/types.js';
import { TriliumClient } from './lib/triliumClient.js';
import { registerGetNoteTools } from './tools/getNote.js';
import { registerListByLabelTools } from './tools/listByLabel.js';
import { registerGetTreeTools } from './tools/getTree.js';
import { registerSaveNoteTools } from './tools/saveNote.js';

export async function register(server: McpServer, options: ModuleOptions = {}) {
  const namespace = options.namespace ?? 'trilium';
  const moduleId = options.moduleId ?? 'trilium';
  const cfg = options.config as TriliumModuleConfig | undefined;

  if (!cfg?.baseUrl || !cfg?.apiToken) {
    throw new Error('[trilium] Missing config: TRILIUM_BASE_URL and TRILIUM_API_TOKEN must be set.');
  }

  const client = new TriliumClient({ baseUrl: cfg.baseUrl, apiToken: cfg.apiToken });
  const toolOptions = { namespace, moduleId, client };

  registerGetNoteTools(server, toolOptions);
  registerListByLabelTools(server, toolOptions);
  registerGetTreeTools(server, toolOptions);
  registerSaveNoteTools(server, toolOptions);

  console.error(`[trilium] Registered tools with namespace: ${namespace}`);
}

export const checkHealth: ModuleHealthChecker = async (config: unknown) => {
  const cfg = config as TriliumModuleConfig | undefined;

  if (!cfg?.baseUrl || !cfg?.apiToken) {
    return [{ id: 'trilium_etapi_health', ok: false, detail: 'missing baseUrl or apiToken in config' }];
  }

  try {
    const client = new TriliumClient({ baseUrl: cfg.baseUrl, apiToken: cfg.apiToken });
    await client.getAppInfo();
    return [{ id: 'trilium_etapi_health', ok: true }];
  } catch (err) {
    return [{
      id: 'trilium_etapi_health',
      ok: false,
      detail: err instanceof Error ? err.message : 'ETAPI unreachable',
    }];
  }
};
```

**DoD:**
- `tsc --noEmit` — brak błędów.
- `npm run dev` — serwer startuje, log zawiera `[trilium] Registered tools with namespace: trilium`.
- `GET /healthz` zwraca `{ status: "ok", checks: [{ id: "trilium_etapi_health", ok: true }] }`.

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
| `src/modules/trilium/lib/triliumClient.ts` | Utwórz | 3 |
| `src/modules/trilium/lib/toolResponse.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/getNote.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/listByLabel.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/getTree.ts` | Utwórz | 3 |
| `src/modules/trilium/tools/saveNote.ts` | Utwórz | 3 |
| `src/modules/trilium/index.ts` | Utwórz | 3 |

**Pliki niezmienione:** `src/core/*`, `src/transports/*`, `src/modules/portfolio/*`, `src/modules/test-tools/*`.
