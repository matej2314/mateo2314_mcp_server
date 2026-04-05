# mateo2314_mcp_server - Globalny serwer MCP z architekturą modułową

Globalny serwer MCP (Model Context Protocol) z separacją warstwy transportu i modularyzacją narzędzi per projekt.

## Architektura

- **Core** - Rdzeń serwera niezależny od transportu i modułów
- **Transports** - Wymienne adaptery (stdio dla Cursor IDE, HTTP dla produkcji)
- **Modules** - Niezależne moduły projektów z własnym namespace

## MVP: Moduł Portfolio

Pierwsza implementacja zawiera tylko moduł `portfolio` z narzędziami do odczytu treści portfolio z plików `.md`.

### Struktura projektu

```
mateo2314_mcp_server/
├── config/
│   └── modules.config.ts     # Konfiguracja modułów
├── src/
│   ├── index.ts              # Entry point
│   ├── core/                 # Rdzeń serwera
│   │   ├── server.ts
│   │   ├── toolRegistry.ts
│   │   └── types.ts
│   ├── transports/           # Warstwa transportu
│   │   └── stdio.ts
│   └── modules/
│       └── portfolio/        # Moduł portfolio (MVP)
│           ├── index.ts
│           ├── content/      # Pliki .md (MVP)
│           ├── lib/          # Helpery
│           └── tools/        # Narzędzia MCP
└── dist/                     # Skompilowane pliki
```

## Instalacja

```bash
npm install
```

## Konfiguracja

Skopiuj `.env.example` do `.env` i dostosuj:

```bash
cp .env.example .env
```

## Uruchomienie

### Rozwój (z watch mode)

```bash
npm run dev
```

### Produkcja

```bash
npm run build
npm start
```

## Integracja z Cursor IDE

1. Skompiluj projekt: `npm run build`

2. Dodaj konfigurację do `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "mateo2314_mcp_server": {
      "command": "node",
      "args": [
        "C:\\Users\\matej\\Desktop\\projekt JS\\custom_mcp_server\\dist\\index.js"
      ],
      "env": {
        "ENABLE_MODULE_PORTFOLIO": "true",
        "PORTFOLIO_NAMESPACE": "portfolio",
        "PORTFOLIO_CONTENT_ROOT": "C:\\Users\\matej\\Desktop\\projekt JS\\custom_mcp_server\\src\\modules\\portfolio\\content"
      }
    }
  }
}
```

3. Zrestartuj Cursor IDE

4. Sprawdź panel MCP - powinien pokazać serwer "mateo2314_mcp_server" jako Connected

## Narzędzia (MVP - moduł portfolio)

Wszystkie narzędzia mają prefix `portfolio_`:

- `portfolio_get_profile` - Publiczny profil
- `portfolio_get_about` - Sekcja "O mnie"
- `portfolio_list_projects` - Lista projektów
- `portfolio_get_project` - Szczegóły projektu
- `portfolio_list_skills` - Lista umiejętności
- `portfolio_get_skill` - Szczegóły umiejętności
- `portfolio_search` - Wyszukiwanie pełnotekstowe
- ... i inne (łącznie ~20 narzędzi)

## Testowanie w Cursor

```
Czy możesz sprawdzić jakie narzędzia MCP są dostępne?
```

```
Użyj narzędzia portfolio_get_profile i pokaż mi wynik
```

```
Wyszukaj wszystkie treści związane z "TypeScript" używając portfolio_search
```

## Dodawanie treści (MVP)

Dodaj pliki `.md` do `src/modules/portfolio/content/`:

```
content/
├── profile.md
├── about/body.md
├── projects/
│   ├── project-1.md
│   └── project-2.md
└── skills/
    ├── typescript.md
    └── react.md
```

Format pliku z front matter:

```markdown
---
project_name: Mój Projekt
project_category: Web Development
tech_stack: Next.js, TypeScript
---

Opis projektu...
```

## Migracja do produkcji

### Zmiana źródła danych: pliki → baza danych

1. Dodaj Prisma:
```bash
npm install @prisma/client
npm install -D prisma
```

2. Skonfiguruj połączenie z bazą (read-only user):
```env
PORTFOLIO_DB_URL=postgresql://mcp_readonly:password@localhost:5432/portfolio
```

3. Zamień implementację w `src/modules/portfolio/lib/corpus.ts`:
   - MVP: `fs.readFile()`, `fs.readdir()`
   - Produkcja: Prisma queries

4. **Nazwy narzędzi i kontrakt API pozostają bez zmian!**

### Dodanie transportu HTTP

1. Dodaj Express:
```bash
npm install express
```

2. Utwórz `src/transports/http.ts` (zgodnie z dokumentacją MCP.md)

3. Zmień transport w `.env`:
```env
MCP_TRANSPORT=http
MCP_PORT=3333
```

## Dodawanie nowych modułów

1. Utwórz katalog `src/modules/nazwa-modulu/`
2. Zaimplementuj `index.ts` z funkcją `register()`
3. Dodaj konfigurację do `config/modules.config.ts`
4. Włącz moduł w `.env`:
```env
ENABLE_MODULE_NAZWA=true
NAZWA_NAMESPACE=nazwa
```

## Dokumentacja

- [MCP_MVP.md](./MCP_MVP.md) - Plan implementacji MVP
- [MCP.md](./MCP.md) - Architektura globalnego serwera
- [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) - Oficjalna dokumentacja

## Troubleshooting

### Serwer nie łączy się z Cursor

1. Sprawdź logi w Output → MCP
2. Zweryfikuj ścieżki w konfiguracji (podwójne backslashe `\\`)
3. Upewnij się że projekt jest skompilowany: `npm run build`

### Brak narzędzi w panelu MCP

1. Sprawdź logi: powinno być `Loaded 1 modules: portfolio`
2. Zweryfikuj czy `ENABLE_MODULE_PORTFOLIO=true`
3. Sprawdź czy pliki `.md` istnieją w `content/`

### Path traversal detected

To oczekiwane zachowanie dla nieprawidłowych ścieżek. Sprawdź czy `PORTFOLIO_CONTENT_ROOT` wskazuje na istniejący katalog.

## Licencja

ISC
