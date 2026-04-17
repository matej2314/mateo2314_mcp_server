# Unified Agent Context System (MCP)

Globalny serwer [Model Context Protocol](https://modelcontextprotocol.io/) z rozdzieleniem rdzenia, transportu i modułów narzędzi per domena.

## Architektura

- **Core** (`src/core/`) — tworzenie instancji `McpServer`, typy wspólne dla modułów, `ToolRegistry` ładujący moduły z konfiguracji.
- **Transports** (`src/transports/`) — adaptery MCP: **Streamable HTTP** ([`http.ts`](./src/transports/http.ts), sesje, Express przez SDK) oraz **stdio** ([`stdio.ts`](./src/transports/stdio.ts)) — w [`src/index.ts`](./src/index.ts) domyślnie startuje **HTTP**; stdio włączasz ręcznie w entry point (krok po kroku: [Transport stdio (aktywacja)](#transport-stdio-aktywacja-alternatywy-do-http)).
- **Modules** (`src/modules/<nazwa>/`) — każdy moduł eksportuje `register(server, options)` i rejestruje narzędzia pod własnym namespace z env / `config/modules.config.ts`.
- **Config** (`config/modules.config.ts`) — lista modułów, flagi `ENABLE_MODULE_*`, namespace i opcje (np. `contentRoot` dla portfolio).

Przepływ (obecny domyślny): `src/index.ts` → `createMcpServer()` → `ToolRegistry.loadModules()` → `startHttpTransport(buildMcpServer, { port, host })` (Bearer: `process.env.MCP_INTERNAL_TOKEN` w `http.ts`).

## Moduły

### Portfolio

Treść z plików Markdown i `manifest.json` w katalogu content (read-only, ścieżki przez `safeJoin` z ochroną przed path traversal).

**Lib:** `corpus.ts`, `paths.ts`, `frontmatter.ts`, `search.ts`, `filterHelpers.ts`, `toolResponse.ts`, `validSections.ts`, `toolManifestData.ts`.

**Narzędzia** (prefix domyślny `portfolio_`, konfigurowalny przez `PORTFOLIO_NAMESPACE`):

| Narzędzie | Opis |
|-----------|------|
| `{ns}_get_profile` | Profil publiczny |
| `{ns}_get_about` | Sekcja „O mnie” |
| `{ns}_get_manifest` | `manifest.json` (sekcje, metadane MVP) |
| `{ns}_search` | Wyszukiwanie po korpusie |
| `{ns}_projects_query`, `{ns}_projects_list`, `{ns}_projects_get`, `{ns}_projects_tags` | Projekty |
| `{ns}_skills_query`, `{ns}_skills_list`, `{ns}_skills_get`, `{ns}_skills_tags`, `{ns}_skills_categories` | Umiejętności |
| `{ns}_experience_query`, `{ns}_experience_list`, `{ns}_experience_get`, `{ns}_experience_tags` | Doświadczenie |
| `{ns}_courses_query`, `{ns}_courses_list`, `{ns}_courses_get`, `{ns}_courses_tags`, `{ns}_courses_categories`, `{ns}_courses_platforms` | Kursy |

`{ns}` = wartość namespace (np. `portfolio`).

### test-tools

Przykładowy moduł demonstracyjny (`zod` + `server.tool`): `{ns}_get_user_data`, `{ns}_get_products`. Domyślny namespace: `test` (`TEST_TOOLS_NAMESPACE`). W środowisku produkcyjnym zwykle wyłączasz: `ENABLE_MODULE_TEST_TOOLS=false`.

Moduł jest **włączony domyślnie** (jak portfolio), dopóki nie ustawisz `ENABLE_MODULE_*=false`.

## Struktura repozytorium

```
.                                 # korzeń repozytorium (nazwa katalogu zależy od klonu)
├── config/
│   └── modules.config.ts          # Moduły, namespace, contentRoot, corpusVersion
├── scripts/
│   └── copy-portfolio-content.mjs # Po tsc: kopiuje content → dist/.../portfolio/content
├── Dockerfile
├── docker-compose.yml             # Przykładowe wdrożenie HTTP (MCP_HOST, MCP_PORT)
├── src/
│   ├── index.ts                   # Entry: server → registry → HTTP (domyślnie)
│   ├── core/
│   │   ├── server.ts
│   │   ├── toolRegistry.ts
│   │   └── types.ts
│   ├── transports/
│   │   ├── http.ts                # Streamable HTTP, /mcp, Bearer opcjonalny
│   │   └── stdio.ts
│   └── modules/
│       ├── portfolio/
│       │   ├── index.ts           # register*: profile, about, manifest, search, projects, skills, experience, courses
│       │   ├── content/           # .md, manifest.json (+ kopia w dist po buildzie)
│       │   ├── lib/
│       │   └── tools/
│       └── test-tools/
│           ├── index.ts
│           └── tools/
└── dist/                          # `tsc` → m.in. dist/src/index.js
```

## Instalacja

```bash
npm install
```

## Konfiguracja

```bash
cp .env.example .env
```

Ważne zmienne (szczegóły w [`.env.example`](./.env.example)):

- **Portfolio:** `ENABLE_MODULE_PORTFOLIO`, `PORTFOLIO_NAMESPACE`, `PORTFOLIO_CONTENT_ROOT`, `PORTFOLIO_CORPUS_VERSION`
- **test-tools:** `ENABLE_MODULE_TEST_TOOLS`, `TEST_TOOLS_NAMESPACE`
- **Transport HTTP (aktywny w `src/index.ts`):** `MCP_HOST` (domyślnie `127.0.0.1`), `MCP_PORT` (domyślnie `3333`), `MCP_INTERNAL_TOKEN` (opcjonalny Bearer wymuszany na każdym żądaniu)


## Uruchomienie

### Rozwój (watch)

```bash
npm run dev
```

### Produkcja

```bash
npm run build
npm start
```

`build` uruchamia `tsc` oraz `scripts/copy-portfolio-content.mjs`, żeby przy `npm start` (`node dist/src/index.js`) katalog `content` modułu portfolio był dostępny obok skompilowanych plików (domyślny `PORTFOLIO_CONTENT_ROOT` względem `lib` w `dist`).

## Transport stdio (aktywacja alternatywy do HTTP)

Alternatywny transport MCP znajduje się w [`src/transports/stdio.ts`](./src/transports/stdio.ts): funkcja **`startStdioTransport(server)`** podłącza jedną instancję `McpServer` do **`StdioServerTransport`** (komunikacja JSON-RPC MCP wyłącznie przez **stdin / stdout**). Nadaje się do klientów, które **spawnują** proces Node i nie otwierają portu HTTP (typowo **Cursor** z konfiguracją `command` + `args`).

**Jak włączyć stdio** (ręczna zmiana w [`src/index.ts`](./src/index.ts), potem `npm run build`):

1. **Import:** odkomentuj `import { startStdioTransport } from './transports/stdio.js';` i zakomentuj (lub usuń) import `startHttpTransport`, jeśli nie jest już potrzebny.
2. **Funkcja `main()`:** usuń lub zakomentuj cały obecny blok: **sonda startowa** (`probe` z `createServerWithModules` + `probe.close()`), a także **`startHttpTransport(...)`**. Sonda zamyka pierwszą instancję serwera — przed stdio **nie** powinna zostawiać zamkniętego serwera jako jedynej ścieżki.
3. **Zastąp** logiką w stylu poniżej — **jedna** instancja serwera na proces, bez nasłuchu TCP:

```typescript
const { server, loadedModules } = await createServerWithModules();
console.error(`[Server] Loaded ${loadedModules.length} modules: ${loadedModules.join(', ')}`);
await startStdioTransport(server);
```

4. W repozytorium w komentarzu jest skrócona wersja tej samej idei (linia przy `// Stdio (jeden proces, jedna sesja):`); możesz ją wkleić zamiast ręcznego składania bloku — byle **nie** mieszać jednocześnie z `startHttpTransport` w tym samym `main()`.

**Zmienne `MCP_HOST` / `MCP_PORT` / `MCP_INTERNAL_TOKEN`** nie dotyczą trybu stdio (brak serwera HTTP). Po przełączeniu z powrotem na HTTP przywróć import i wywołanie `startHttpTransport` oraz (opcjonalnie) sondę diagnostyczną, jeśli z niej korzystasz.

## Integracja z Cursor IDE

**Uwaga:** domyślny `src/index.ts` uruchamia **serwer HTTP**, a nie MCP po **stdio**. Konfiguracja Cursor z polami `command` + `args` zakłada zwykle **stdio**. Żeby ta ścieżka działała, najpierw **aktywuj stdio** według sekcji [Transport stdio (aktywacja alternatywy do HTTP)](#transport-stdio-aktywacja-alternatywy-do-http) (albo wydziel osobny plik startowy tylko pod stdio, żeby nie przełączać `index.ts` przy każdej zmianie środowiska).

Gdy masz już tryb **stdio** w procesie uruchamianym przez Cursor:

1. Zbuduj projekt: `npm run build`
2. W konfiguracji MCP ustaw serwer uruchamiany przez Node ze ścieżką do **skompilowanego** entry point (ten sam plik co dziś, ale po przełączeniu na stdio w kodzie):

```json
{
  "mcpServers": {
    "unified_agent_context_mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\matej\\Desktop\\projekt JS\\custom_mcp_server\\dist\\src\\index.js"
      ],
      "env": {
        "ENABLE_MODULE_PORTFOLIO": "true",
        "ENABLE_MODULE_TEST_TOOLS": "true",
        "PORTFOLIO_NAMESPACE": "portfolio",
        "PORTFOLIO_CONTENT_ROOT": "C:\\Users\\matej\\Desktop\\projekt JS\\custom_mcp_server\\dist\\src\\modules\\portfolio\\content"
      }
    }
  }
}
```

Klucz `unified_agent_context_mcp` w JSON jest **dowolny** (to etykieta w Cursorze); możesz trzymać np. `mateo2314_mcp_server`, jeśli masz już starą konfigurację.

Dostosuj ścieżki do swojego dysku. Dla samego portfolio możesz wskazać `src\\...\\content` przy `tsx`/dev; przy `npm start` wygodniej jest katalog w `dist` po skrypcie kopiującym.

3. Zrestartuj Cursor i sprawdź panel MCP.

**HTTP (VPS / agenci zdalni):** po `npm start` endpoint MCP jest pod ścieżką **`/mcp`** (Streamable HTTP). Przy `MCP_INTERNAL_TOKEN` dołącz nagłówek `Authorization: Bearer …`. W repozytorium jest przykład portów i `MCP_HOST=0.0.0.0` w [`docker-compose.yml`](./docker-compose.yml).

## Testowanie w Cursor

```
Jakie narzędzia MCP są dostępne?
```

```
Użyj portfolio_get_profile i pokaż wynik
```

```
Wyszukaj "TypeScript" przez portfolio_search
```

## Treść portfolio

Pliki w `src/modules/portfolio/content/` (po buildzie także pod `dist/.../content/`). Struktura zależy od Twojego korpusu; obowiązuje m.in. `manifest.json` zgodny z narzędziem `get_manifest`.

Przykład front matter w `.md`:

```markdown
---
project_name: Mój projekt
project_category: Web Development
tech_stack: Next.js, TypeScript
---

Opis...
```

## Migracja / rozszerzenia

### Baza zamiast plików

Zachowaj nazwy narzędzi i kontrakty; podmień implementację w warstwie lib (np. `corpus.ts`) na odczyt z DB. Zmienne typu `PORTFOLIO_DB_URL` są przygotowane w `.env.example` jako szkic.

### Transport HTTP

Zaimplementowany w [`src/transports/http.ts`](./src/transports/http.ts) (Streamable HTTP, sesje, opcjonalny Bearer). Szerszy opis planu / decyzji mógł być w `MCP.md` — plik może być wyłączony z gita (patrz `.gitignore`); stan faktyczny zawsze w kodzie `index.ts` + `http.ts`.

### Transport stdio

Implementacja: [`src/transports/stdio.ts`](./src/transports/stdio.ts). Aktywacja w entry point: [Transport stdio (aktywacja alternatywy do HTTP)](#transport-stdio-aktywacja-alternatywy-do-http).

## Dodawanie modułu

1. Katalog `src/modules/<nazwa>/` z `index.ts` i `export async function register(server, options)`.
2. Wpis w `config/modules.config.ts` (nazwa = segment ścieżki importu `../modules/${name}/index.js`).
3. Zmienne `ENABLE_MODULE_<NAZWA>` / namespace w `.env` według konwencji projektu.

## Dokumentacja

- [MCP_MVP.md](./MCP_MVP.md) — plan MVP
- [MCP.md](./MCP.md) — architektura globalnego serwera i transporty
- [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro)

## Troubleshooting

### Brak połączenia z klientem MCP

- Logi: Output → MCP
- Ścieżki w Windows: poprawne escapowanie `\\` w JSON
- Czy istnieje `dist/src/index.js` po `npm run build`
- **Cursor + `command`/`args`:** czy proces naprawdę używa **stdio**? Domyślny `index.js` startuje **HTTP** — wtedy Cursor nie „zobaczy” MCP po stdin/stdout; przełącz transport w kodzie albo osobny entry pod stdio

### Brak narzędzi / pusty moduł

- W logach powinna być linia w stylu: `Loaded N modules: portfolio, test-tools`
- `ENABLE_MODULE_PORTFOLIO=false` wyłącza portfolio; to samo dla `test-tools`
- Portfolio: czy `content` istnieje (src lub dist + skrypt kopiujący)

### Path traversal detected

Zamierzone dla ścieżek wychodzących poza `PORTFOLIO_CONTENT_ROOT`. Sprawdź `PORTFOLIO_CONTENT_ROOT` i argumenty narzędzi.

## Licencja

ISC
