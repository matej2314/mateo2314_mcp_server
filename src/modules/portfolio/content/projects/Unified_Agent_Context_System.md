---
project_name: Unified Agent Context System (MCP)
project_category: Developer Tools
tech_stack: TypeScript, Node.js, ESM, @modelcontextprotocol/sdk, Express, Streamable HTTP, Zod, Markdown,
status: active
year: 2026
---

**Modularny serwer [Model Context Protocol](https://modelcontextprotocol.io/)** to u mnie nie tylko „kolejna integracja z Cursorem”, lecz **docelowy, centralny podsystem architektury na VPS**: **jedno spójne wejście MCP**, przez które **wszystkie agenty** mogą pobierać **autoryzatywny, kontrolowany kontekst** (portfolio, później kolejne korpusy i źródła prawdy), zamiast rozrzucać dostęp do treści po wielu ad hoc endpointach. Technicznie to nadal **rdzeń + transport + moduły domenowe**; semantycznie to **warstwa dostarczania kontekstu** w całym środowisku agentowym.

## Cel i architektura
Chodzi o **jeden proces–byt systemowy**, który:
- **Skaluje się konfiguracją** — nowe domeny kontekstu to kolejny moduł + wpis w `config/modules.config.ts`, bez rozlewania polityki dostępu po całym serwerze.
- **Izoluje odpowiedzialności** — `createMcpServer()` i `ToolRegistry` w `src/core/`, transport w `src/transports/`, zachowania domenowe w `src/modules/<nazwa>/` (łatwiej utrzymać **kontrakt** wobec agentów).
- **Ładuje moduły dynamicznie** — `ToolRegistry` importuje `register()` z włączonych modułów (`ENABLE_MODULE_*`), co pasuje do wizji **rozbudowywania platformy kontekstu** bez przebudowy rdzenia.
- **Agreguje dostęp do kontekstu** — agenci widzą **zestaw narzędzi MCP** jako API do „ziemi opisanej” (korpus, manifest, wyszukiwanie), a nie bezpośredni dostęp do dysku po stronie każdego klienta.

Dzięki temu ten sam szkielet służy jako **fundament**: dziś portfolio i moduł demonstracyjny, jutro kolejne moduły pod ten sam **model sesji i bezpieczeństwa transportu**.

## Moduł portfolio
Treść leży w **`src/modules/portfolio/content/`** (po buildzie kopiowana do `dist`, żeby `npm start` widział ten sam korpus). Warstwa **`lib/`** grupuje m.in.:
- bezpieczne składanie ścieżek (**ochrona przed path traversal**),
- odczyt front matter i korpusu,
- wyszukiwanie po treści.

**Narzędzia** (prefix z namespace, domyślnie `portfolio_`): profil, „o mnie”, manifest, wyszukiwanie, zapytania/listy/szczegóły/tagowanie dla **projektów, umiejętności, doświadczenia i kursów** — spójny model zapytań pod korpus Markdown.

## Transport i sesje

### HTTP (domyślnie)
Entry point (`src/index.ts`) buduje serwer z modułami i uruchamia **transport HTTP** oparty o **Streamable HTTP** z SDK MCP (`StreamableHTTPServerTransport`, `createMcpExpressApp`): **osobna instancja `McpServer` na sesję**, mapowanie sesji po nagłówku, sprzątanie przy zamknięciu transportu. Opcjonalnie można wymusić **Bearer token** (`MCP_INTERNAL_TOKEN`) na każdym żądaniu — sensowny element przy ekspozycji poza strict localhost. Zmienne **`MCP_HOST`**, **`MCP_PORT`** dotyczą wyłącznie tego trybu.

### Stdio (alternatywa, `src/transports/stdio.ts`)
Drugim transportem jest **`StdioServerTransport`**: plik **`src/transports/stdio.ts`** eksportuje **`startStdioTransport(server)`**, które łączy **jedną** instancję `McpServer` z **stdin/stdout** (MCP po strumieniu tekstowym — typowy model dla **Cursora** i innych klientów uruchamiających `node …` bez osobnego portu).

**Aktywacja** nie jest przełącznikiem z `.env` — trzeba **zmienić `src/index.ts`**: odkomentować import `startStdioTransport`, **wyłączyć** start HTTP (`startHttpTransport`) oraz **nie** zamykać wcześniej serwera przez diagnostyczną sondę `probe` + `close()` przed podłączeniem stdio (w kodzie jest zakomentowany wzorzec „jeden proces, jedna sesja”). Po zmianie: `npm run build` i ten sam `dist/src/index.js` w konfiguracji MCP, już w trybie stdio.

Pełna procedura krok po kroku i ostrzeżenia są w sekcji **„Transport stdio (aktywacja alternatywy do HTTP)”** w [`README.md`](../../../../../README.md) (korzeń repozytorium).

## Jakość i kontrakty
- **TypeScript** + **ESM**, walidacja schematów w modułach demonstracyjnych (**Zod**).
- **`@modelcontextprotocol/sdk`** jako oficjalna warstwa protokołu i serwera narzędzi.

## Build i DevOps w miniaturze
- `npm run build`: **kompilacja `tsc`** + skrypt kopiujący **content portfolio** do `dist`.
- `npm run dev`: **`tsx watch`** na źródłach.
- Zmienne środowiskowe: moduły, ścieżka korpusu, wersja korpusu, port/host MCP — szczegóły w `.env.example`.

## Integracja (Cursor i inne klienty MCP)
Konfiguracja MCP wskazuje **skompilowany** entry point i env (namespace, `PORTFOLIO_CONTENT_ROOT`, włączenie modułów). Po stronie każdego agenta narzędzia pojawiają się jako **lista callable tools** zgodna z konwencją namespace — to ten sam **kontrakt**, niezależnie od tego, czy klient to IDE, worker na VPS, czy inny proces łączący się po HTTP.

## Jedno zdanie na pytanie ogólne
**To mój TypeScriptowy, modularny system dostarczania kontekstu przez MCP na VPS: SDK MCP, Streamable HTTP z sesjami i opcjonalnym Bearerem, rejestr modułów oraz portfolio jako pierwszy korpus — z założeniem roli centralnego punktu kontekstu dla wielu agentów.**

---