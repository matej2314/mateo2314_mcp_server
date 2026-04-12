---
project_name: Portfolio Next.js
project_category: Web Development
tech_stack: Next.js, TypeScript, Tailwind CSS, React, Prisma, MySQL, Redis, Docker, Lucia Auth, Zod, next-intl, Radix UI, Server Actions, Nodemailer, React Email, Motion, Winston, Anthropic SDK, Three.js,
status: active
year: 2025
---

**Portfolio Next.js** to moje **główne portfolio developerskie** — publiczna witryna z sekcjami (start, o mnie, umiejętności, projekty, kursy/certyfikaty, blog, kontakt) oraz **osobnym panelem administracyjnym** pod `/control`. Całość buduję w **Next.js z App Router**, **TypeScript**, **Tailwind CSS** (w repozytorium Tailwind 4), z naciskiem na **SEO** (meta, mapa witryny, robots), **dostępność** (m.in. nawigacja klawiaturą) i **responsywność**.

## Dla odwiedzającego
- **Wielojęzyczność PL/EN** (`next-intl`), z automatycznym dopasowaniem języka w README projektu.
- **Tryb jasny/ciemny** i spójny UI oparty m.in. o **Radix UI** oraz komponenty w stylu shadcn w `components/ui`.
- **Blog** z treścią w **Markdown** (rendering po stronie klienta/serwera w zależności od widoku), **galeria projektów** z rozbudowanymi opisami (także pola pod PL), **oś czasu kursów**.
- **Formularz kontaktowy** z **walidacją (Zod)** i wysyłką maili (**Nodemailer** / szablony w ekosystemie **React Email**).
- **Animacje i scroll** w warstwie prezentacji (m.in. **Motion**, Lenis — bez wchodzenia w szczegóły implementacji).
- Opcjonalnie na stronie występują **bogatsze wizualizacje** (np. ekosystem **Three.js / R3F** tam, gdzie sekcja tego wymaga).

## Panel `/control` i dane
- **Logowanie** przez **Lucia Auth** z adapterem **Prisma**; hasła obsługuję bezpiecznie (**bcryptjs**).
- **CRUD na treści portfolio**: projekty (w tym zdjęcia), wpisy bloga, umiejętności (kategorie, ikony), kursy, fragmenty „about”, itd. — spójnie z modelem w **`prisma/schema.prisma`** (**MySQL**).
- Operacje idą w dużej mierze przez **Server Actions** z walidacją **Zod**; część rzeczy jest cache’owana.

## Redis, asystent i DevOps
- **Redis (`ioredis`)** służy do **cache’u** odczytów (np. fragmenty treści, doświadczenie) oraz — tam gdzie włączę — **krótkotrwałego cache’u odpowiedzi** wbudowanego **czatu/asystenta** na stronie.
- **API asystenta** (`/api/assistant/chat`) łączy się z **Anthropic**, ma **bramkę tematów** (pytania tylko w dozwolonym zakresie), normalizację historii i limity długości wiadomości — to warstwa „**portfolio, które o mnie odpowiada**”, ale kontrolowana i z możliwością odrzucenia tematu.
- **Logi** serwerowe prowadzę przez **Winston** (rotacja plików), jak w innych moich projektach produkcyjnych.
- **Docker**: wieloetapowy **Dockerfile** (build Prisma + `next build`, osobny stage produkcyjny), start **`next start`** na ustawionym porcie — typowe wdrożenie kontenerowe obok MySQL i Redis.

## Jedno zdanie na pytanie ogólne
**To moje portfolio w Next.js: TypeScript, Tailwind, Prisma/MySQL, panel admina z Lucią, Redis, Docker, i dodatkowo asystent AI na stronie z kontrolą tematów i cache’m.**
