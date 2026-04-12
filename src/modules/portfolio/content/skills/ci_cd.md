---
title: CI/CD
category: devops
tags: ["ci", "cd", "jenkins", "docker", "github", "webhook", "nginx", "automation", "deployment", "pipeline"]
level: intermediate
type: tool
yearsOfExperience: 1
---

Procesy CI/CD ustawiam jako **połączenie Jenkinsa i Dockera**: **uniwersalny pipeline** uruchamiany **webhookiem z GitHuba** — zadanie w Jenkinsie nasłuchuje na dedykowanym i bezpiecznym adresie, a po odbiorze żądania **mapuję body webhooka na parametry joba** (np. gałąź, repozytorium, identyfikatory wdrożenia), żeby jedna definicja obsłużyła wiele projektów bez ręcznego klikania.

Dalej pipeline **klonuje repozytorium, które wysłało webhook**, przechodzi przez **budowanie obrazu Dockera** i **uruchomienie kontenera lub zestawu kontenerów** (Compose tam, gdzie stack tego wymaga). Gdy zmienia się sposób wystawienia usługi lub routing, **aktualizuję konfigurację Nginx** (reverse proxy, TLS, `location` / upstream) tak, by ruch trafiał na właściwe kontenery po wdrożeniu.

Znam **rolę triggerów, parametrów i izolacji kroków** oraz stosuję **praktyki utrzymaniowe**: sekrety i tokeny poza repozytorium, weryfikacja pochodzenia webhooka tam, gdzie to możliwe, sensowne logi i artefakty z builda, rollback przez znany tag obrazu oraz świadome ograniczenia — webhook + jeden job to elastyczność, ale wymaga **discipliny w walidacji payloadu** i **porządku w uprawnieniach do repo i hosta**, inaczej łatwo o przypadkowe lub złośliwe uruchomienia.

Doświadczenie z:
- GitHub → webhook → Jenkins (mapowanie body na parametry, checkout właściwego repozytorium)
- buildem i promocją obrazów Docker oraz uruchamianiem kontenerów w środowisku docelowym
- dostosowywaniem Nginx po wdrożeniu (proxy, przekierowania, integracja z kontenerami)
- spójnym CI/CD na VPS w zestawieniu z konteneryzacją i pipeline’ami Node.js / frontend
