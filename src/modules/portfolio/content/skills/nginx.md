---
title: Nginx
category: devops
tags: ["nginx", "reverse-proxy", "http", "ssl", "web-server", "load-balancing"]
level: intermediate
type: tool
yearsOfExperience: 1
---

Ruch HTTP i statyki obsługuję m.in. przez Nginx — **lekki serwer** i reverse proxy pod terminację TLS oraz kierowanie do aplikacji (Node, PHP-FPM, inne upstreamy). Potrafię **pisać i czytać konfiguracje** (`server`, `location`, `proxy_pass`), ustawiać **nagłówki bezpieczeństwa** na poziomie proxy oraz rozumieć podstawowe scenariusze cache i kompresji.

Znam **model workerów i logów** w stopniu umożliwiającym diagnostykę oraz stosuję **praktyki wdrożeniowe**: osobne pliki konfiguracyjne per serwis, walidacja składni przed reloadem, certyfikaty (Let’s Encrypt lub wewnętrzne CA) oraz świadome ograniczenia — jedna literówka w `location` może wystawić niewłaściwy backend lub złamać routing.

Doświadczenie z:
- reverse proxy przed aplikacjami kontenerowymi i tradycyjnymi procesami
- podstawową konfiguracją HTTPS i przekierowaniami HTTP → HTTPS
- współpracą z Docker Compose i innymi warstwami infrastruktury
