---
project_name: Homelab
project_category: Infrastructure
tech_stack: Ubuntu Server, Docker, Jenkins, Prometheus, Grafana, NestJS, PostgreSQL, pgvector, MongoDB, pgAdmin, mongo-express, Wake-on-LAN,
status: active
year: 2026
github: https://github.com/matej2314/homelab-infrastructure
---

**Homelab** to moje **głównie testowe i naukowe** środowisko na własnym sprzęcie — **nie produkcja kliencka**, lecz miejsce, w którym **ćwiczę i sprawdzam**: **IT security** (z naciskiem na **web security**), **hardening Linuksa**, **DevOps** oraz — w miarę możliwości — **AI**. Korzystam z niego **regularnie w codziennej nauce i eksperymentach**, równolegle do pracy komercyjnej. **Repozytorium:** [github.com/matej2314/homelab-infrastructure](https://github.com/matej2314/homelab-infrastructure).

## Sprzęt i host
- **CPU:** Intel Core **i5-9500T**
- **RAM:** **16 GB**
- **Dysk:** **512 GB SSD NVMe**
- **OS:** **Ubuntu Server 26.04**
- **Wake-on-LAN (WoL)** — dopełnienie **bezdotykowej obsługi zdalnej** (włączenie maszyny na żądanie, bez fizycznego dostępu do hosta)

## Cel labów
Homelab służy mi przede wszystkim do:
- **web / IT security** — kontrolowane testy, narzędzia i scenariusze bez ryzyka dla infrastruktury klientów;
- **hardeningu Linuksa** — praktyka utwardzania hosta i usług na realnym serwerze;
- **DevOps** — CI/CD, kontenery, monitoring (metriki, dashboardy), powtarzalne stacki;
- **AI** — uruchamianie i obserwacja własnych komponentów agentowych / LLM (w granicach sprzętu).

## Co działa na stałe
Na hoście / jako stała warstwa labowa:
- **Docker** — baza pod usługi kontenerowe
- **Jenkins** — pipeline’y i automatyzacja pod eksperymenty DevOps
- **Prometheus** + **Grafana** — metryki i wizualizacja stanu labów

## Usługi w kontenerach
- **[AI Provider Gateway](Ai_provider_gateway.md)** — własny mikroserwis NestJS (bramka LLM); opis w osobnym wpisie projektu
- **PostgreSQL** z rozszerzeniem **pgvector**
- **MongoDB**
- **pgAdmin** oraz **mongo-express** — UI do administracji bazami

## Jedno zdanie na pytanie ogólne
**To mój homelab na Ubuntu Server (i5-9500T, 16 GB, NVMe): głównie lab testowo-naukowy pod web security, hardening, DevOps i AI — z Dockerem, Jenkinsem, Prometheusem/Grafaną, gatewayem LLM oraz PostgreSQL/pgvector i MongoDB w kontenerach, plus Wake-on-LAN do zdalnego startu.**
