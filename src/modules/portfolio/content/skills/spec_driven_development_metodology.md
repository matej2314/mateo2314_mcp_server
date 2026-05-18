---
title: Spec-Driven Development (SDD)
category: process
tags: ["sdd", "spec-driven-development", "specification", "planning", "requirements", "acceptance-criteria", "methodology", "documentation"]
level: intermediate
type: methodology
yearsOfExperience: 1
---

W codziennej pracy stosuję **Spec-Driven Development** — metodologię, w której **najpierw precyzuję oczekiwania i kryteria akceptacji**, a dopiero potem przechodzę do implementacji. Potrafię **prowadzić feature od specyfikacji przez plan po zadania** (artefakty w markdown: `spec.md`, `plan.md`, `tasks.md`), utrzymywać **konstytucję projektu** (`constitution.md`) oraz współpracować z agentami AI na **jednoznacznym kontrakcie** zamiast „zgadywania” wymagań w trakcie kodowania.

Znam **rozdzielenie WHAT/WHY od HOW** (specyfikacja bez szczegółów stacku vs plan techniczny) oraz stosuję **praktyki, które ograniczają rozjazd między dokumentem a kodem**: numerowane wymagania testowalne, user stories z **kryteriami akceptacji** (Given/When/Then lub checklisty), jawne **out of scope**, oznaczenia **`[NEEDS CLARIFICATION: ...]`** zamiast domysłów oraz weryfikacja spójności spec ↔ plan ↔ tasks przed startem implementacji — świadome ograniczenie: SDD ma **skracać pętle feedbacku**, a nie zastępować review, testów ani rozmowy z interesariuszami.

Doświadczenie z:
- lokalnym drzewem `specs/<feature>/` (spec, plan, tasks, opcjonalnie checklist i kontrakty API)
- pracą spec-first przy nowych funkcjach i refaktorach większego zakresu
- współpracą z agentami AI na podstawie artefaktów SDD zamiast ad-hoc promptów
- dopinaniem zadań do sekcji spec/planu i utrzymaniem śladu decyzji w repozytorium
