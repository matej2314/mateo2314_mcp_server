---
title: MCP (Model Context Protocol)
category: ai
tags: ["mcp", "ai", "protocol", "tools", "cursor", "stdio", "typescript"]
level: intermediate
type: tool
yearsOfExperience: 1
---

Model Context Protocol traktuję jako warstwę łączącą modele językowe z narzędziami i danymi w sposób przewidywalny i bezpieczny. Potrafię **korzystać z gotowych serwerów MCP** w edytorze (np. Cursor) oraz **projektować i implementować własne serwery** — od prostych narzędzi po modułową architekturę z namespace’ami, rejestrem narzędzi i czytelnym kontraktem (nazwy, opisy, schematy wejścia).

Znam **założenia protokołu** (stdio vs HTTP, cykl życia połączenia, narzędzia, zasoby, prompty) i stosuję **praktyki, które ułatwiają utrzymanie i integrację**: jednoznaczne nazewnictwo narzędzi, walidacja argumentów (np. Zod), obsługa błędów z `isError`, rozdzielenie transportu od logiki domenowej, sensowne komunikaty dla modelu oraz świadome ograniczenia (bezpieczeństwo ścieżek, read-only do treści, brak sekretów w odpowiedziach).

Doświadczenie z:
- integracją MCP w codziennej pracy z agentami AI
- implementacją serwerów w Node.js / TypeScript (SDK MCP)
- projektowaniem zestawów narzędzi pod konkretne domeny (np. portfolio, wewnętrzne API)
