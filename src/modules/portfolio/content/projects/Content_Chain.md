---
project_name: Content Chain
project_category: AI
tech_stack: NestJS, Next.js, TypeScript, LangChain, LangGraph, Prisma, SQLite, pnpm, Zod, Pino, Prometheus, Helmet, Tailwind CSS, shadcn/ui, AI Provider Gateway,
status: active
year: 2026
---

**Content Chain** to mój **aktualny główny projekt w budowie**: publiczna, **self-hostowalna (MIT)** aplikacja agentowa, która **ma** generować treści **Social** (posty i rolki) oraz **Content** (copy stron / artykułów w podstawowej formie) — od briefu, przez **orchestrację agentów** i **weryfikację względem kontekstu firmy**, po zapis wyników i **obserwowalny przebieg runu**. Cel: uruchamialny dowód stacku agentowego, a nie sam opis procesu w IDE.

## Cel produktu
Docelowo system **ma**:
- **Pokazywać praktyczne AI w produkcie** — monorepo z frontendem, API i osobnym gateway LLM, z realnym use-case’em **[AI Provider Gateway](Ai_provider_gateway.md)** (API **nie** będzie wołać vendorów bezpośrednio).
- **Trzymać treść spójną z firmą** — jeden wspólny, kanoniczny kontekst w DB; runy zablokowane do uzupełnienia bramki kompletności; verifier przed uznaniem wyniku.
- **Być self-hostem pod jedną organizację** — jedna instalacja = jedna firma = jeden kontekst; **bez** multi-tenant SaaS.
- **Zostawiać czytelny ślad** — logi runu + SSE, tak by dało się odtworzyć przebieg generowania i decyzji.

## Architektura (monorepo) — założenie
Modularny monolit z trzema procesami + wspólnym pakietem kontraktów:
- **`apps/api`** (NestJS) — domena: auth, kontekst firmy, pipeline Social i Content, runy, logi, persistence (port/adapter, MVP: **SQLite** / Prisma)
- **`apps/frontend`** (Next.js) — cienki dashboard (flow’y, podgląd logów); bez reguł domenowych i bez dostępu do vendorów LLM
- **`apps/ai-provider-gateway`** — osobny deployable: routing / providery LLM; **zero** logiki Content Chain
- **`packages/shared`** — lekkie typy publicznego kontraktu API

Pipeline’y Social i Content **mają być** orkestrowane **LangGraph** za fasadą application service; start runu i HITL **zostaną** w bounded contextcie **Runs** (HTTP + SSE).

## Zakres MVP (produkt) — plan
- **Social — posty:** `post_ideas`, `post_content`, `post_ideas_then_content` (LinkedIn, Facebook, Instagram)
- **Social — rolki:** `reel_ideas`, `reel_script`, `reel_ideas_then_scripts`
- **Content (podstawowa forma):** `page_copy` oraz `page_outline_then_copy` dla `blog` / `service_page` / `landing`
- Języki generowanych treści: **PL i EN**
- **Auth** (admin + użytkownicy) oraz **dashboard** w zakresie MVP; kolejność budowy: **backend-first** (API + gateway + pipeline’y → auth → web)
- HITL tylko przy taskach dwuetapowych (wybór z listy); taski jednoetapowe — full-auto

## Stan prac (w toku)
- **Zrobione:** fundament monorepo, runtime API/gateway, kontekst firmy, cykl życia runów (w tym recovery / SSE), pipeline **Social (posty i rolki)** z weryfikacją i zapisem.
- **W toku:** bounded context **Content** (`page_*`) + klej composite pod wspólny worker runów.
- **Przed nami w MVP:** auth API, fundament zapisu feedbacku, dashboard Next.js domykający self-host UX.

## Jedno zdanie na pytanie ogólne
**To mój greenfield MIT w budowie: monorepo NestJS + Next.js + gateway LLM (LangGraph), które ma dać agentowe Social/Content z kontekstem firmy, runami SSE i SQLite — dziś z pipeline’em postów/rolek, w trakcie BC Content, przed auth i dashboardem.**
