---
project_name: AI Provider Gateway
project_category: Developer Tools
tech_stack: NestJS, TypeScript, Zod, YAML, Redis, ioredis, Pino, Prometheus, Sentry, Docker, OpenAPI/Swagger, Anthropic SDK, Google GenAI, OpenAI SDK, Helmet,
status: active
year: 2026
---

**AI Provider Gateway** to mój **mikroserwis HTTP w NestJS**, który **ukrywa SDK vendorów LLM** i wystawia **jeden spójny kontrakt** do czatu, streamingu SSE, katalogu aliasów modeli oraz health/metrics. Routing do providera jest **konfiguracyjny** (`gateway.config.yaml`: alias → `providerInstance` → adapter), a klucze klientów gateway są **oddzielone** od kluczy vendorów. Open-source (**MIT**); utrzymuję go jako **własną infrastrukturę** pod IDE i aplikacje agentowe.

## Cel i architektura
Chodzi o **bramkę LLM**, która:
- **Normalizuje wywołania** — aplikacje i IDE mówią jednym językiem HTTP, a SDK Anthropic / Gemini / OpenAI zostaje w `src/providers/`.
- **Rozdziela fasady od runtime** — fasady `/api/v1/openai/*` (Cursor) i `/api/v1/anthropic/*` (Claude Code) to **kształt kontraktu klienta**; backendem może być dowolny włączony adapter z YAML.
- **Buduje odporność** — `ResilientExecutor`: retry, timeout z `AbortSignal`, opcjonalny fallback aliasu.
- **Trzyma produkcyjne granice** — walidacja env/YAML przy starcie, Helmet, rate limit i opcjonalny cache odpowiedzi na Redis, Pino, Sentry, Prometheus (`GET /metrics`).

## Co wystawia API
- **Natywny kontrakt:** `POST /api/v1/chat`, `POST /api/v1/chat/stream`, `GET /api/v1/models`, health liveness/readiness.
- **Fasady IDE:** OpenAI Chat Completions oraz Anthropic Messages — nad tym samym `ChatService` / katalogiem modeli.
- **Funkcje generacji:** tool calling, structured outputs (JSON Schema), extended thinking (Anthropic / Gemini / OpenAI Responses), usage details i śledzenie `requestId` / `conversationId`.

## Providerzy i konfiguracja
Adaptery runtime: **Anthropic**, **Google Gemini**, **OpenAI** (Responses API) oraz **OpenAI-compatible** (np. Ollama). Konfiguracja to **YAML + `.env`** (referencje `apiKeyRef` / `baseUrlRef`); CLI (`gateway config:init`, `provider:test`, zarządzanie modelami/klientami) ma **osobny entry point** i nie bootuje pełnego runtime HTTP.

## Jakość, testy i wdrożenie
- **TypeScript** z naciskiem na **brand types** i walidację (**Zod** / class-validator), dokumentacja **OpenAPI 3.1** + Swagger UI.
- Testy: unit, CLI, E2E, integration (Redis), security.
- **Docker Compose** (gateway + opcjonalnie Redis, monitoring, Ollama) i deploy na VPS przez **GitHub Actions**.

## Jedno zdanie na pytanie ogólne
**To mój NestJS-owy gateway LLM: jeden kontrakt HTTP i fasady pod Cursor/Claude Code, adaptery wielu providerów z YAML, resilience, Redis oraz observability pod własne wdrożenie.**
