---
title: Architektura i wzorce projektowe
category: engineering
tags: ["architecture", "design-patterns", "clean-architecture", "hexagonal", "ports-adapters", "solid", "ddd", "facade", "observer", "strategy", "express", "nestjs", "react", "typescript"]
level: intermediate
type: discipline
yearsOfExperience: 2
---

W projektach webowych świadomie **rozróżniam wzorce architektoniczne od wzorców projektowych (design patterns)** i dobieram je do problemu, a nie do mody. **Architektura** odpowiada za układ systemu, granice modułów i przepływ zależności (np. warstwy, **hexagonal / ports & adapters**, **Clean Architecture**, modularny monolit, cienka warstwa HTTP w Express lub NestJS). **Wzorce projektowe** stosuję wewnątrz modułów, gdy upraszczają wymianę implementacji, testowalność i czytelność kodu — bez budowania „fabryki fabryk” przy prostych przypadkach.

Na poziomie architektury potrafię **projektować granice domenowe**: logika biznesowa i use case’y niezależne od frameworka, **porty** (interfejsy) i **adaptery** (baza, API zewnętrzne, kolejki, pliki), **odwrócenie zależności** oraz **fasadę** tam, gdzie ukrywa złożony podsystem przed resztą aplikacji. W stacku **TypeScript / Node** (Express, NestJS) i **React / Next.js** dbam o podział: prezentacja vs aplikacja vs infrastruktura, stabilne kontrakty między warstwami oraz miejsca na testy jednostkowe reguł bez uruchamiania serwera.

Znam **klasyczne wzorce GoF** w praktyce, pogrupowane według intencji, i potrafię je nazwać oraz zastosować tam, gdzie realnie pomagają:

- **Kreacyjne**: **Factory** / **Abstract Factory** i **Builder** przy wielu wariantach obiektów lub złożonej konfiguracji.
- **Strukturalne**: **Adapter** na granicach z zewnętrznymi API, **Facade** jako uproszczony interfejs do modułu, **Decorator** i **Proxy** przy rozszerzaniu zachowania bez rozlewania if-ów.
- **Behawioralne**: **Strategy** przy wymiennych algorytmach, **Observer** / pub-sub przy reakcji na zdarzenia, **Command** przy kolejkowaniu operacji, **Template Method** przy wspólnym szkielecie kroków.

Stosuję też **zasady SOLID** i **kompozycję zamiast dziedziczenia** tam, gdzie to redukuje sprzężenie, oraz **praktyki utrzymaniowe**: wzorzec rozwiązuje konkretny ból (testowalność, wymiana implementacji, izolacja I/O), a nie „ozdabia” prosty kod; unikam **god object**, **anemic domain** i przenoszenia reguł biznesowych do kontrolerów czy komponentów UI; przy integracjach wybieram **Adapter** zamiast rozlewania typów klienta po całej aplikacji — świadome ograniczenie: nadmiar abstrakcji zwiększa koszt wejścia w projekt; najpierw prosty moduł, potem wzorzec, gdy pojawia się drugi wariant lub granica wymaga stabilnego kontraktu.

Doświadczenie z:
- warstwowaniem i ports & adapters w API Node.js / Express oraz modułach NestJS (cienkie kontrolery, logika za serwisami i portami)
- wzorcami **Strategy**, **Factory**, **Adapter** i **Facade** przy integracjach, płatnościach, mailach i zewnętrznych SDK
- **Observer** / eventami wewnątrz aplikacji (np. reakcja na zmiany stanu bez splątania modułów)
- projektowaniem pod **testy jednostkowe** reguł domenowych i mockowaniem infrastruktury na granicach
- refaktoryzacją „płaskiego” kodu w kierunku czytelnych modułów bez przedwczesnej mikrousługowości
- omawianiem trade-offów (prosty monolit vs moduły vs rozproszenie) i dopasowaniem wzorca do skali zespołu i produktu
