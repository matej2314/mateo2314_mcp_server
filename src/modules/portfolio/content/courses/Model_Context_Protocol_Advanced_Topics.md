---
title: "Model Context Protocol: Advanced Topics"
category: AI
platform: Anthropic Academy
provider: Anthropic Education
url: https://anthropic.skilljar.com/model-context-protocol-advanced-topics
year: 2026
status: completed
tags: ["ai","mcp", "python", "sampling", "notifications", "stdio", "http", "sse", "production"]
duration: 1 godzina
instructor: --
rating: 5
---

## Opis kursu

Przeszedłem [Model Context Protocol: Advanced Topics](https://anthropic.skilljar.com/model-context-protocol-advanced-topics) — kontynuację i rozszerzenie wiedzy z kursu [Introduction to Model Context Protocol](https://anthropic.skilljar.com/introduction-to-model-context-protocol). Podczas gdy kurs wprowadzający skupiał się na fundamentach (tools, resources, prompts), ten kurs idzie głębiej: zaawansowane wzorce implementacji, komunikacja server-client, mechanizmy transportowe i zagadnienia produkcyjnego wdrożenia MCP servers.

Kurs bada zaawansowane funkcje MCP: **sampling** (jak serwer może żądać wywołań modelu AI przez połączonego klienta), **systemy notyfikacji** (real-time feedback dla długo działających operacji), **roots-based file access** (bezpieczny dostęp do systemu plików z kontrolą uprawnień) oraz szczegóły techniczne różnych protokołów transportowych (stdio, StreamableHTTP). Dużo praktycznych walkthroughów pokazujących, jak te mechanizmy działają w prawdziwym kodzie.

Kluczowy element to zrozumienie trade-offów: stateful vs stateless servers, kiedy używać HTTP do horizontal scaling z load balancerami, jak różne flagi konfiguracji wpływają na funkcjonalność, i jak wybierać transport w zależności od wymagań deployment i skalowania.

## Co wynoszę po kursie

- **Implementacja sampling** — rozumiem, jak MCP server może requestować wywołania language model przez połączonego klienta, i jak architektura ta przesuwa koszty AI i złożoność z serwera na klienta.
- **Progress i logging notifications** — umiem implementować real-time feedback używając context objects, logging callbacks i progress reporting dla długo działających operacji.
- **Roots-based file access** — znam system uprawnień, który daje MCP serverom dostęp do konkretnych katalogów z granicami bezpieczeństwa i user-friendly file discovery.
- **Architektura JSON messages** — rozumiem kompletną specyfikację wiadomości MCP, różnicę między request-result pairs a notification messages, i bidirectional communication patterns.
- **Mechanizmy stdio transport** — wiem, jak klienci i serwery MCP komunikują się przez standard input/output streams, włącznie z wymaganą sekwencją initialization handshake.
- **Implementacja StreamableHTTP transport** — rozumiem, jak Server-Sent Events (SSE) umożliwiają komunikację server-to-client przez HTTP, włącznie z zarządzaniem sesjami i dual-connection architectures.
- **Limitacje HTTP transport** — znam wpływ flag konfiguracji na funkcjonalność, szczególnie w kontekście server-initiated requests i streaming capabilities.
- **Production scaling considerations** — wiem, kiedy używać stateless HTTP dla horizontal scaling z load balancerami i jakie są trade-offy między stateful a stateless server configurations.
- **Kryteria wyboru transportu** — potrafię wybrać odpowiednią metodę transportu bazując na wymaganiach deployment, potrzebach funkcjonalnych i ograniczeniach skalowania.

Ten kurs zamknął lukę między podstawową wiedzą o MCP a produkcyjnymi implementacjami — teraz rozumiem nie tylko "jak", ale też "dlaczego" i "kiedy" stosować konkretne wzorce architektoniczne przy budowaniu MCP servers.