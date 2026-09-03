---
project_name: Portfolio Next.js
project_category: Web Development
tech_stack: Next.js, TypeScript, Tailwind CSS, React, Prisma, MySQL, Redis, ioredis, Ollama, Docker, Lucia Auth, Zod, next-intl, Radix UI, Server Actions, Nodemailer, React Email, Motion, Winston, Anthropic SDK, MCP SDK, prom-client,
status: active
year: 2025
github: https://github.com/matej2314/my_portfolio_nextjs
---

**Portfolio Next.js** to moje **główne portfolio developerskie** — publiczna witryna z intro, sekcjami (o mnie, doświadczenie, umiejętności, projekty, kursy/certyfikaty, kontakt) oraz **osobnym panelem administracyjnym** pod `/control`. Całość buduję w **Next.js** (App Router, w repozytorium Next 16) z **TypeScript** i **Tailwind CSS 4**, z naciskiem na **SEO** (meta, mapa witryny, robots), **dostępność** (m.in. nawigacja klawiaturą) i **responsywność**. **Repozytorium:** [github.com/matej2314/my_portfolio_nextjs](https://github.com/matej2314/my_portfolio_nextjs).

## Dla odwiedzającego
- **Wielojęzyczność PL/EN** (`next-intl`), z automatycznym dopasowaniem języka przeglądarki.
- **Ciemna kolorystyka** (tylko tryb ciemny) i spójny UI oparty m.in. o **Radix UI** oraz komponenty w stylu shadcn w `components/ui`.
- **Intro** na `/` (animowany ekran powitalny), potem `/home` ze snap-scroll sekcjami; **galeria projektów** z osobnymi stronami szczegółów oraz **oś czasu kursów** i sekcja **doświadczenia**.
- **Asystent AI** w pływającym oknie czatu — gość pyta o **projekty, umiejętności, doświadczenie, kursy i kontakt**; odpowiedzi **streamowane (SSE)**, naturalne (PL/EN), oparte o **narzędzia MCP** do aktualnego korpusu portfolio; poza zakresem zawodowym asystent **miękko odmawia** i wskazuje bezpośredni kontakt.
- **Formularz kontaktowy** z **walidacją (Zod)** i wysyłką maili (**Nodemailer** / szablony **React Email**).
- **Animacje i scroll** w warstwie prezentacji (m.in. **Motion**, Lenis).
- **Google Analytics** (gtag) do pomiaru kluczowych interakcji.

## Panel administracyjny i zarządzanie danymi
- **Logowanie** przez **Lucia Auth** z adapterem **Prisma**; hasła (**bcryptjs**); sesje w **MySQL**.
- **CRUD na treści**: projekty (w tym zdjęcia), umiejętności (kategorie, ikony), kursy, doświadczenie, fragmenty „about”, CV/resume — spójnie z **`prisma/schema.prisma`** (**MySQL**).
- Operacje w dużej mierze przez **Server Actions** z walidacją **Zod**; odczyty treści cache’owane w Redis.

## Redis, asystent i DevOps
- **Redis (`ioredis`)** — cache odczytów (m.in. doświadczenie, fragmenty treści) oraz **dwuwarstwowy cache odpowiedzi asystenta**: exact (KV) i **semantic** (embedding **Ollama** + KNN w Redis Search), z rate limitem i metrykami (**prom-client**, `/api/metrics`).
- **API asystenta** (`/api/assistant/chat`) łączy **Anthropic** z klientem **MCP** (Streamable HTTP), ma **bramkę tematów**, normalizację historii i limity długości wiadomości — kontrolowana warstwa „portfolio, które o mnie odpowiada”.
- **Logi** serwerowe: **Winston** (rotacja plików).
- **Docker**: wieloetapowy **Dockerfile** (Prisma + `next build`, stage produkcyjny), start **`next start`** — wdrożenie kontenerowe obok MySQL i Redis.

## Jedno zdanie na pytanie ogólne
**To moje portfolio w Next.js: TypeScript, Tailwind, Prisma/MySQL, panel admina z Lucią, Redis, Docker oraz asystent AI z MCP, kontrolą tematów i dwuwarstwowym cache’m odpowiedzi.**
