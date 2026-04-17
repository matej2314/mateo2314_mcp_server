---
title: Introduction to Model Context Protocol
category: AI
platform: Anthropic Academy
provider: Anthropic Education
url: https://anthropic.skilljar.com/introduction-to-model-context-protocol
year: 2026
status: completed
tags: ["ai","mcp", "sdk", "tools", "resources", "prompts"]
duration: 1 godzina
instructor: --
rating: 5
---

## Opis kursu

Przeszedłem [Introduction to Model Context Protocol](https://anthropic.skilljar.com/introduction-to-model-context-protocol) — wprowadzenie do MCP od Anthropic, które pokazuje, jak budować zarówno serwery jak i klienty MCP od podstaw. Kurs skupia się na trzech fundamentalnych prymitywach MCP: **tools** (narzędzia), **resources** (zasoby) i **prompts** (prompty) — i wyjaśnia, jak każdy z nich integruje się z Claude AI.

To nie jest tylko teoria o protokole komunikacji. Kurs prowadzi przez praktyczne implementacje: od definiowania narzędzi przez dekoratory (zamiast ręcznego pisania JSON schemas), przez zarządzanie dokumentami, testowanie w Server Inspectorze, aż po budowanie klientów z obsługą różnych typów MIME i wstrzykiwanie kontekstu do konwersacji AI. Dużo uwagi poświęcono architekturze MCP i temu, jak przesuwa ona ciężar definicji i wykonywania narzędzi z głównego serwera do wyspecjalizowanych serwerów MCP.

## Co wynoszę po kursie

- **Zrozumienie architektury MCP** — wiem, jak MCP deleguje odpowiedzialność za narzędzia do wyspecjalizowanych serwerów zamiast utrzymywać wszystko w jednym miejscu.
- **System komunikacji transport-agnostic** — rozumiem typy wiadomości między klientami a serwerami i kompletny flow request-response od query użytkownika przez MCP client do zewnętrznych serwisów i z powrotem do Claude.
- **Implementacja document management** — potrafię tworzyć narzędzia do czytania i edytowania dokumentów z wykorzystaniem Field descriptions i walidacji typów.
- **MCP Server Inspector** — znam wbudowane narzędzie do testowania i debugowania funkcjonalności serwera w przeglądarce, co oszczędza masę czasu przy developmencie.
- **Definiowanie resources** — umiem eksponować read-only data: zarówno statyczne zasoby z bezpośrednimi URI, jak i templated resources z parametrami.
- **Obsługa resource reading w klientach** — potrafię poprawnie obsługiwać różne MIME types (JSON, text) przy czytaniu zasobów.
- **Budowanie promptów** — wiem, jak tworzyć pre-crafted, wysokiej jakości instrukcje dla typowych workflow (np. formatowanie dokumentów).
- **Kiedy używać którego prymitywu** — rozumiem różnicę: tools (kontrolowane przez model), resources (kontrolowane przez aplikację), prompts (kontrolowane przez użytkownika) — i w jakich scenariuszach sięgać po każdy z nich.
- **Praktyczne wzorce integracji** — znam patterns typu autocomplete i context injection do konwersacji AI.

Kurs dał mi solidny fundament do tworzenia własnych MCP servers i integracji Claude z zewnętrznymi serwisami — teraz mogę rozszerzać możliwości AI bez pisania ton boilerplate code.