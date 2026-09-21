# Graph Report - custom_mcp_server  (2026-09-21)

## Corpus Check
- 90 files · ~30,307 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 468 nodes · 874 edges · 52 communities (19 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `606c0b91`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- portfolio/index.ts
- parseEtapi.ts
- Unified Agent Context System (MCP)
- FAZA 1 — Postman: weryfikacja ETAPI przed implementacją — **WYKONANA**
- modules.config.ts
- http.ts
- package.json
- Ai_provider_gateway.md
- compilerOptions
- Główne obszary odpowiedzialności
- TriliumClientPort
- Web_Home_Budget_Manager.md
- Główne obszary pracy
- Notes_WebApp.md
- manifest.json
- Polish_Salary_Calculator.md
- portfolio-nextjs.md
- copy-portfolio-content.mjs
- body.md
- Claude_Code_In_Action.md
- Introduction_to_Model_Context_Protocol.md
- Model_Context_Protocol_Advanced_Topics.md
- The_Complete_Javascript_Course_2025.md
- Web_Security_Master_from_Sekurak.md
- trilium/index.ts

## God Nodes (most connected - your core abstractions)
1. `registerInstrumentedTool()` - 26 edges
2. `startHttpTransport()` - 18 edges
3. `noteId` - 17 edges
4. `Unified Agent Context System (MCP)` - 17 edges
5. `readFile()` - 15 edges
6. `toolError()` - 15 edges
7. `toStrList()` - 14 edges
8. `parseNoteMetadata()` - 14 edges
9. `TriliumClient` - 14 edges
10. `toolJson()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `startHttpTransport()` --calls--> `getEnabledModuleByName()`  [EXTRACTED]
  src/transports/http.ts → config/modules.config.ts
- `main()` --calls--> `startHttpTransport()`  [EXTRACTED]
  src/index.ts → src/transports/http.ts
- `register()` --indirect_call--> `getProductsTool()`  [INFERRED]
  src/modules/test-tools/index.ts → src/modules/test-tools/tools/getProducts.ts
- `register()` --indirect_call--> `getUserDataTool()`  [INFERRED]
  src/modules/test-tools/index.ts → src/modules/test-tools/tools/getUserData.ts
- `register()` --calls--> `TriliumClient`  [EXTRACTED]
  src/modules/trilium/index.ts → src/modules/trilium/lib/triliumClient.ts

## Import Cycles
- None detected.

## Communities (52 total, 6 thin omitted)

### Community 0 - "portfolio/index.ts"
Cohesion: 0.11
Nodes (50): zod, register(), listFiles(), loadSectionDocuments(), readAllFiles(), readFile(), matchesCourse(), matchesExperience() (+42 more)

### Community 1 - "parseEtapi.ts"
Cohesion: 0.11
Nodes (35): parseAppInfo(), parseAttribute(), parseAttributes(), parseBranchInfo(), parseCreateNoteResult(), parseJsonBody(), parseNoteIdArray(), parseNoteIdField() (+27 more)

### Community 2 - "Unified Agent Context System (MCP)"
Cohesion: 0.05
Nodes (39): Architektura, Baza zamiast plików, Brak narzędzi / pusty moduł, Brak połączenia z klientem MCP, Dodawanie modułu, Dokumentacja, Health (`health.ts`), Instalacja (+31 more)

### Community 3 - "FAZA 1 — Postman: weryfikacja ETAPI przed implementacją — **WYKONANA**"
Cohesion: 0.05
Nodes (38): Decyzje podjęte przed implementacją, FAZA 0 — Infrastruktura: uruchomienie Trilium w Docker — **WYKONANA**, FAZA 1 — Postman: weryfikacja ETAPI przed implementacją — **WYKONANA**, FAZA 2 — Konfiguracja projektu, FAZA 3 — Implementacja modułu `src/modules/trilium/`, FAZA 4 — Weryfikacja integracji (lokalna), Krok 0.1 — Utwórz `docker-compose.trilium.yml`, Krok 0.2 — Pierwsze uruchomienie i konfiguracja ETAPI (+30 more)

### Community 4 - "modules.config.ts"
Cohesion: 0.09
Nodes (25): defaultPortfolioContentRoot, ModuleConfig, ModuleId, modulesConfig, PortfolioModuleConfig, repoRoot, TriliumModuleConfig, dotenv (+17 more)

### Community 5 - "http.ts"
Cohesion: 0.13
Nodes (32): getEnabledModuleByName(), buildHealthPayload(), AuthFailureReason, authFailures, buildInfo, httpRequests, initMetrics(), isMetricsEnabled() (+24 more)

### Community 6 - "package.json"
Cohesion: 0.07
Nodes (28): author, dependencies, dotenv, @modelcontextprotocol/sdk, prom-client, zod, description, devDependencies (+20 more)

### Community 7 - "Ai_provider_gateway.md"
Cohesion: 0.11
Nodes (16): Cache i infrastruktura odpowiedzi, Cel i architektura, Co wystawia API, Jakość, testy i wdrożenie, Jedno zdanie na pytanie ogólne, Providerzy i konfiguracja, Architektura (monorepo) — założenie, Cel produktu (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, skipLibCheck (+5 more)

### Community 10 - "Główne obszary odpowiedzialności"
Cohesion: 0.20
Nodes (9): Główne obszary odpowiedzialności, Migracje projektów opartych o CMS, Opis stanowiska, Osiągnięcia, Projekty WordPress, Rozwój aplikacji React i Next.js, Technologie i narzędzia, Usprawnianie pracy z Cursor IDE i MCP (+1 more)

### Community 12 - "Web_Home_Budget_Manager.md"
Cohesion: 0.25
Nodes (7): Backend i infrastruktura, Cel i model „domu”, Co robi użytkownik (funkcje), Co warto wiedzieć przy pytaniach kontekstowych, DevOps (jak to wdrażam), Frontend i UX, Jedno zdanie na pytanie ogólne

### Community 13 - "Główne obszary pracy"
Cohesion: 0.29
Nodes (6): Code review i współpraca, Główne obszary pracy, Opis stanowiska, Optymalizacja i performance, Rozwój aplikacji webowych, Zdobyte umiejętności

### Community 14 - "Notes_WebApp.md"
Cohesion: 0.29
Nodes (6): Alternatywny backend (NestJS), Cel i kontekst, Co robi użytkownik, Co warto wiedzieć przy pytaniach „kontekstowych”, Jak to jest złożone (w skrócie), Jedno zdanie na pytanie ogólne

### Community 15 - "manifest.json"
Cohesion: 0.33
Nodes (4): lastUpdated, sections, version, validSections

### Community 16 - "Polish_Salary_Calculator.md"
Cohesion: 0.33
Nodes (5): Cel i kontekst domenowy, Co robi użytkownik, Co warto wiedzieć przy pytaniach kontekstowych, Jak to jest złożone (w skrócie), Jedno zdanie na pytanie ogólne

### Community 17 - "portfolio-nextjs.md"
Cohesion: 0.40
Nodes (4): Dla odwiedzającego, Jedno zdanie na pytanie ogólne, Panel administracyjny i zarządzanie danymi, Redis, asystent i DevOps

### Community 18 - "copy-portfolio-content.mjs"
Cohesion: 0.50
Nodes (3): dest, root, src

### Community 19 - "body.md"
Cohesion: 0.50
Nodes (3): Homelab, Moje wartości, Narzędzia, z których korzystam

### Community 52 - "trilium/index.ts"
Cohesion: 0.19
Nodes (21): checkHealth(), register(), buildNoteTree(), isHidden(), walk(), isProtectedEtapiError(), toolError(), toolJson() (+13 more)

## Knowledge Gaps
- **204 isolated node(s):** `repoRoot`, `TriliumModuleConfig`, `defaultPortfolioContentRoot`, `ModuleId`, `name` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 245 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zod` connect `portfolio/index.ts` to `modules.config.ts`, `package.json`, `trilium/index.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `registerInstrumentedTool()` connect `portfolio/index.ts` to `trilium/index.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `TriliumClientPort` connect `TriliumClientPort` to `parseEtapi.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `repoRoot`, `TriliumModuleConfig`, `defaultPortfolioContentRoot` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `portfolio/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11106233538191396 - nodes in this community are weakly interconnected._
- **Should `parseEtapi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11183673469387755 - nodes in this community are weakly interconnected._
- **Should `Unified Agent Context System (MCP)` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._