---
title: Architektura oprogramowania
category: engineering
tags: ["software-architecture", "system-design", "modular-monolith", "boundaries", "scalability", "maintainability", "express", "nestjs", "react", "nextjs", "typescript"]
level: intermediate
type: discipline
yearsOfExperience: 2
---

Aplikacje webowe projektuję **od architektury**, nie tylko od ekranów i endpointów: **granice modułów**, przepływ danych, zależności między warstwami oraz to, co ma być stabilne przy zmianach (kontrakty API, domena, infrastruktura). W stacku **TypeScript** — **React / Next.js** po stronie UI oraz **Node.js** (**Express**, **NestJS**) po stronie backendu — potrafię **rozłożyć system na czytelne obszary** (prezentacja, aplikacja, domena, infrastruktura), zaplanować **modularny monolit** zamiast przedwczesnych mikrousług oraz dopasować strukturę do skali produktu i zespołu.

Znam **wymagania funkcjonalne i niefunkcjonalne** (wydajność, bezpieczeństwo na poziomie granic, utrzymanie, testowalność) oraz stosuję **projektowanie oparte na trade-offach**: prosty start vs przyszła rozbudowa, stan w bazie vs cache, render po stronie serwera vs klienta w Next.js, cienkie kontrolery vs logika w serwisach. Przed implementacją większych feature’ów **spisuję decyzje** (np. w planie SDD lub krótkim ADR): co jest w scope, jakie są ryzyka migracji i gdzie leżą granice integracji z zewnętrznymi systemami. Unikam typowych antywzorów: **god modules**, mieszanie reguł biznesowych z warstwą HTTP/UI, ukryte zależności globalne oraz architektury „na pokaz” bez realnego problemu — świadome ograniczenie: dobra architektura to **najprostszy układ, który da się utrzymać**, a nie maksimum warstw i diagramów.

Doświadczenie z:
- projektowaniem API i aplikacji full-stack (frontend + backend + baza) pod długoterminowe utrzymanie
- warstwowaniem i odwróceniem zależności w Express i NestJS (moduły, serwisy, porty na zewnętrzne systemy)
- podziałem **Server / Client Components** i odpowiedzialności routingu w Next.js
- planowaniem refaktorów (rozbicie „płaskiego” kodu, wydzielenie bounded areas) bez rozwalania produkcji
- łączeniem architektury ze **Spec-Driven Development** (plan techniczny, kontrakty, ślad decyzji)
- omawianiem kosztów zmian: gdzie warto abstrakcję, a gdzie wystarczy prosty, testowalny moduł
