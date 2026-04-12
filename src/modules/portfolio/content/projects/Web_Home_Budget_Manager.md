---
project_name: Web Home Budget Manager
project_category: Web Development
tech_stack: React, Vite, Tailwind CSS, Zustand, Framer Motion, i18next, Chart.js, Express.js, MySQL, Socket.io, JWT, Docker, Jenkins, Nginx,
status: active
year: 2025
---

**Web Home Budget Manager** to moja **aplikacja do domowego budżetu wieloosobowego**: użytkownik zakłada **gospodarstwo domowe** (wystarczy nazwa — bez wrażliwych danych adresowych), zaprasza **współlokatorów** i wspólnie prowadzi **przychody, wydatki, statystyki** oraz **komunikację w obrębie domu**. To **większy projekt niż moje wcześniejsze portfolio** i **drugi poważniejszy projekt w React** — dużo nowych bibliotek i praktyk w jednym produkcie. **Demo:** [budgetapp.msliwowski.net](https://budgetapp.msliwowski.net) (dane testowe są opisane w README repozytorium — nie powielam ich tutaj).

## Cel i model „domu”
Bez utworzenia gospodarstwa aplikacja nie wchodzi w pełny funkcjonalny tryb — **świadomie wiążę dane z kontekstem „dom”**, żeby transakcje i uprawnienia miały sens. **Host** (kto dodał dom) ma **szersze prawa**, m.in. **może usuwać dowolnego domownika**; **mates** korzystają ze wspólnego budżetu i funkcji społecznościowych w ramach zaproszeń i ról z bazy.

## Co robi użytkownik (funkcje)
- **Zaproszenia i skład domu:** zapraszanie współlokatorów, akceptacje / odrzucenia w modelu zaproszeń (tabele typu `invitations` w logice backendu).
- **Transakcje:** dodawanie **przychodów i wydatków**, widoki i **rozbudowane statystyki** (frontend: **Chart.js** / `react-chartjs-2`).
- **Komunikacja:** **komunikacja wewnątrz gospodarstwa** (realtime przez **Socket.io** po stronie klienta i serwera — m.in. aktualizacje salda / broadcast do domowników).
- **Kalendarz / czas:** w stacku frontu jest **react-big-calendar** i **moment** — pod planowanie lub podgląd zdarzeń budżetowych w czasie (szczegóły zależą od ekranu, ale agent wie, że czas jest pierwszoklasowy w UI).
- **Pliki i OCR:** backend ma **multer**, **sharp** (obróbka obrazów) oraz **tesseract.js** — typowy tor pod **paragony / skany** i wyciąganie tekstu (README wymienia Tesseract jako część stacku).
- **Eksport:** w zależności od wdrożenia wykorzystuję też **XLSX** po stronie API (zależność w backendzie).

## Frontend i UX
- **React 18** z **Vite** (szybki dev/build), routing **React Router**, styl **Tailwind CSS**.
- Stan aplikacji: **Zustand**; animacje: **Framer Motion**; powiadomienia: **react-toastify**; formularze/wybory: m.in. **react-select**.
- **i18next** — **wielojęzyczność** (README wymienia i18next po stronie klienta).
- **SEO-ślady:** zależność **sitemap** w frontendzie; w backendzie endpointy pod `sitemap.xml` / `robots.txt` mogą być **wyłączone lub zwracać 404** w zależności od konfiguracji — nie zakładam gotowej mapy bez sprawdzenia wdrożenia.

## Backend i infrastruktura
- **Express** na **HTTP + cookie-parser**, **CORS** z **listą dozwolonych originów** (produkcja + localhost + adres serwera w kodzie).
- **MySQL (`mysql2`)**, **JWT** + **bcrypt** w typowym modelu sesji/uwierzytelniania.
- **WebSocket** inicjalizowany na tym samym serwerze co Express (`socket.io`).
- **Zadania cykliczne (`node-cron`)**: m.in. **zapis dziennych transakcji/budżetu** i **operacje bilansujące** — logika finansowa jest też **rozłożona w czasie**, nie tylko „na kliknięcie”.
- **Bezpieczeństwo i jakość API:** **helmet**, dokumentacja **Swagger** (`swagger-jsdoc` + `swagger-ui-express`).
- **Poczta:** **nodemailer** (np. zaproszenia / powiadomienia — dokładny scenariusz w kodzie tras).
- **Logi:** **Winston** z rotacją plików, spójnie z moimi innymi serwisami Node.

## DevOps (jak to wdrażam)
README wskazuje **Jenkins, Docker, Nginx, phpMyAdmin** — to ten sam rodzaj pipeline’u, co w moich opisach **CI/CD + kontenery + reverse proxy + zarządzanie MySQL**.

## Co warto wiedzieć przy pytaniach kontekstowych
- Projekt jest **full stack rozdzielony na `frontend/` i `backend/`** z osobnymi `package.json` — **nie jest to monolit Next.js**.
- **Skala:** więcej domenowych ścieżek (dom, role, realtime, statystyki, pliki) niż w prostym CRUD — dobry przykład **„React jako SPA + Express jako API”**.
- **Demo i konta testowe** — wyłącznie z README; w korpusie portfolio **nie umieszczam haseł**.

## Jedno zdanie na pytanie ogólne
**To mój React + Vite + Express: wspólny budżet domowy z zaproszeniami, Socket.io, wykresami, i18n, cronami i Dockerem/Jenkins/Nginx w opisie wdrożenia.**
