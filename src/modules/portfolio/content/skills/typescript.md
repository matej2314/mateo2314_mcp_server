---
title: TypeScript
category: frontend
tags: ["javascript", "language", "typed", "compiler", "design-patterns"]
level: intermediate
type: language
yearsOfExperience: 2
---

Projekty webowe piszę przede wszystkim w TypeScript — **główny język**, w którym typy łapią błędy przy edycji, zanim trafią do runtime. Potrafię **modelować dane API i komponentów** (interfejsy, unie, generics), pisać **bezpieczniejszy kod asynchroniczny** oraz współpracować z ekosystemem (`strict`, path aliases, typy z bibliotek).

Znam **zaawansowane konstrukcje typów** (generics, conditional types, mapped types) w zakresie potrzebnym w praktyce oraz stosuję **nawyki utrzymaniowe**: unikanie `any`, sensowne `unknown` i zwężanie, typy współdzielone między frontendem a backendem, Zod lub podobne przy granicach I/O oraz świadome ograniczenia — typy nie zastępują testów ani walidacji danych z sieci.

W kodzie TypeScript stosuję **wzorce projektowe** tam, gdzie realnie upraszczają utrzymanie: **kompozycja** i **odwrócenie zależności**, **Strategy** i **Factory** przy wymiennych implementacjach, **Adapter** przy granicach z zewnętrznymi API oraz czytelne moduły zamiast nadmiernej abstrakcji — świadome ograniczenie: wzorzec ma rozwiązywać konkretny problem, a nie „ozdabiać” prosty kod.

Doświadczenie z:
- React, Next.js i Node.js / Express w jednym stacku typowanym
- integracją z narzędziami build (Vite, bundlery) i ścisłą konfiguracją kompilatora
- refaktoryzacją JavaScript → TypeScript bez „zaślepienia” błędów przez luźne typy
- warstwami serwisów i kontraktami typowanymi przy wymiennych implementacjach (wzorce pod testowalność i rozszerzalność)