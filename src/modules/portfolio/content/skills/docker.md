---
title: Docker
category: devops
tags: ["docker", "containers", "docker-compose", "devops", "images"]
level: intermediate
type: tool
yearsOfExperience: 2
---

Konteneryzacja z Dockerem to u mnie standard od laptopa po serwer: **powtarzalne obrazy** aplikacji i zależności — od lokalnego środowiska deweloperskiego po wdrożenia zbliżone do produkcyjnych. **Stosuję go na co dzień we własnych projektach**; **wszystkie aplikacje, które utrzymuję na VPS w produkcji, działają w kontenerach Dockera**. Potrafię **pisać Dockerfile’e** (warstwy, cache, multi-stage builds), **składać usługi w Docker Compose** oraz debugować problemy z siecią, wolumenami i zmiennymi środowiskowymi.

Znam **podstawy izolacji procesów i ograniczeń obrazów** oraz stosuję **praktyki bezpieczeństwa i utrzymania**: nieużywanie roota w kontenerach tam, gdzie to możliwe, `.dockerignore`, pinowanie wersji bazowych obrazów, sensowne healthchecki oraz świadome ograniczenia — Docker upraszcza dev/prod parity, ale nie zastępuje strategii backupów, sekretów i obserwowalności na hoście. **CI/CD realizuję jako połączenie możliwości Jenkinsa i Dockera** — pipeline buduje i promuje obrazy oraz prowadzi wdrożenia spójnie z konteneryzacją na serwerze.

Doświadczenie z:
- konteneryzacją aplikacji Node.js / TypeScript i statycznych frontendów za nginx
- Compose z bazami (PostgreSQL, MySQL), wolumenami i sieciami wewnętrznymi
- pełnym stackiem produkcyjnym na VPS opartym o kontenery oraz CI/CD: Jenkins + Docker
