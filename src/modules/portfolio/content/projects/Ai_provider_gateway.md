---
project_name: AI Provider Gateway
project_category: Developer Tools
tech_stack: NestJS, TypeScript, Zod, YAML, Redis Stack, ioredis, Ollama, Pino, Prometheus, Grafana, Sentry, Docker, OpenAPI/Swagger, Anthropic SDK, Google GenAI, OpenAI SDK, Helmet, nest-commander,
status: active
year: 2026
github: https://github.com/matej2314/ai-provider-gateway
---

**AI Provider Gateway** to mój **mikroserwis HTTP w NestJS**, który **ukrywa SDK vendorów LLM** i wystawia **jeden spójny kontrakt** do czatu, streamingu SSE, katalogu aliasów modeli oraz health/metrics. Routing do providera jest **konfiguracyjny** (`gateway.config.yaml`: alias → `providerInstance` → adapter), a klucze klientów gateway (**allowlista**, `X-Gateway-Key` / Bearer / `x-api-key` zależnie od powierzchni) są **oddzielone** od kluczy vendorów. Open-source (**MIT**); utrzymuję go jako **własną infrastrukturę** pod IDE i aplikacje agentowe. **Repozytorium:** [github.com/matej2314/ai-provider-gateway](https://github.com/matej2314/ai-provider-gateway).

## Cel i architektura
Chodzi o **bramkę LLM**, która:
- **Normalizuje wywołania** — aplikacje i IDE mówią jednym językiem HTTP, a SDK Anthropic / Gemini / OpenAI zostaje w `src/providers/`.
- **Rozdziela fasady od runtime** — fasady `/api/v1/openai/*` (Cursor) i `/api/v1/anthropic/*` (Claude Code) to **kształt kontraktu klienta**; backendem może być dowolny włączony adapter z YAML.
- **Buduje odporność** — `ResilientExecutor`: retry z backoffem, timeout z `AbortSignal`, opcjonalny fallback aliasu.
- **Trzyma produkcyjne granice** — walidacja env/YAML przy starcie, Helmet, **smart rate limit** (token bucket + cooldown po 429), dwuwarstwowy cache odpowiedzi, Pino, Sentry, Prometheus (`GET /metrics`) + Grafana.

## Co wystawia API
- **Natywny kontrakt:** `POST /api/v1/chat`, `POST /api/v1/chat/stream`, `GET /api/v1/models` (+ szczegóły aliasu), health liveness/readiness.
- **Fasady IDE:** OpenAI Chat Completions oraz Anthropic Messages — nad tym samym `ChatService` / katalogiem modeli.
- **Funkcje generacji:** tool calling, structured outputs (JSON Schema), extended thinking (Anthropic / Gemini / OpenAI Responses), usage details oraz śledzenie `requestId` / `conversationId`.

## Cache i infrastruktura odpowiedzi
Dla `POST /api/v1/chat` i streamu (wspólny magazyn):
- **Exact** — hash żądania w Redis KV (`SET NX`), hit ze znacznikiem `cacheSource: "exact"`.
- **Semantic** — embedding ostatniej wiadomości użytkownika (**Ollama**, np. `qwen3-embedding`) + **KNN w Redis Search**; próg podobieństwa, partycja po aliasie/kliencie/parametrach; fail-open gdy embedding/Search niedostępne.
Pipeline: exact → semantic → provider; zapis tylko bezpiecznych odpowiedzi (`finishReason=stop`, bez tool calls).

## Providerzy i konfiguracja
Adaptery runtime: **Anthropic**, **Google Gemini**, **OpenAI** (Responses API) oraz **OpenAI-compatible** (Chat Completions, np. Ollama). Konfiguracja to **YAML + `.env`** (referencje `apiKeyRef` / `baseUrlRef`); CLI (`gateway config:init`, `provider:test`, CRUD modeli/klientów/providerów) ma **osobny entry point** i nie bootuje pełnego runtime HTTP.

## Jakość, testy i wdrożenie
- **TypeScript** z naciskiem na **brand types** i walidację (**Zod** / class-validator), dokumentacja **OpenAPI 3.1** + Swagger UI; wysoki próg type-coverage.
- Testy: unit, CLI, E2E, integration (Redis / Redis Stack + semantic), security.
- **Docker Compose** (gateway + Redis Stack, Ollama embedding, monitoring Prometheus/Grafana, opcjonalnie Ollama LLM) i deploy na VPS przez **GitHub Actions**.

## Jedno zdanie na pytanie ogólne
**To mój NestJS-owy gateway LLM: jeden kontrakt HTTP i fasady pod Cursor/Claude Code, adaptery wielu providerów z YAML, resilience, dwuwarstwowy cache (exact + semantic) na Redis Stack oraz observability pod własne wdrożenie.**
