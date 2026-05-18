---
title: Testy jednostkowe
category: engineering
tags: ["unit-testing", "jest", "vitest", "nestjs", "backend", "mocking", "tdd", "typescript", "express"]
level: intermediate
type: practice
yearsOfExperience: 1
---

W projektach TypeScript stosuję **testy jednostkowe** jako sposób na weryfikację reguł biznesowych i modułów w izolacji — bez uruchamiania całego serwera ani przeglądarki. Do testowania aplikacji wykorzystuję przede wszystkim **Jest** i **Vitest** (w zależności od toolchainu: Create React App / starsze setupy vs Vite / nowsze projekty). Potrafię **pisać czytelne przypadki** (arrange–act–assert), grupować je w `describe`, mockować zależności zewnętrzne oraz utrzymywać testy blisko kodu, który chronią.

Znam **różnicę między testem jednostkowym a integracyjnym** oraz stosuję **praktyki, które ograniczają kruche testy**: testuję zachowanie, nie szczegóły implementacji; wstrzykuję zależności (DI) zamiast sięgać po globalne singletony; używam **stubów i mocków** na granicach I/O (baza, HTTP, kolejki, zegar). W **NestJS** korzystam z **`@nestjs/testing`** — `TestingModule`, mockowanie providerów, testy serwisów i kontrolerów w izolacji. W backendzie **Express / Node** testuję warstwy serwisów i use case’ów oddzielnie od routingu — świadome ograniczenie: testy jednostkowe nie zastępują testów kontraktu API ani E2E na krytycznych ścieżkach.

Doświadczenie z:
- Jest w projektach React / Node oraz Vitest przy stacku Vite
- testami serwisów, guardów i kontrolerów w NestJS (`TestingModule`, mock providerów)
- testowaniem logiki domenowej i helperów bez bazy i bez pełnego HTTP
- mockowaniem repozytoriów, klientów API i modułów zewnętrznych na portach
- dopinaniem testów do refaktorów i architektury pod testowalność (ports & adapters)
- uruchamianiem testów w CI oraz utrzymaniem szybkiej, deterministycznej suite
