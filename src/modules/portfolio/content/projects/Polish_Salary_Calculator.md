---
project_name: Polish Salary Calculator
project_category: Web Development
tech_stack: HTML, CSS, JavaScript, Node.js, Express.js,
status: active
year: 2024
---

**Polish Salary Calculator** to moja aplikacja webowa do **szacowania wynagrodzenia netto w polskim prawie podatkowym i prawie pracy** — osobny algorytm obliczeń dla **umowy o pracę**, **umowy zlecenia** i **umowy o dzieło**. To był **mój pierwszy „prawdziwy” projekt w Node.js i JavaScript** w momencie powstania; celowałem w **działający produkt z domenową logiką**, a nie tylko ćwiczenie z tutoriala. **Publiczna instancja:** [salarycalc.msliwowski.net](https://salarycalc.msliwowski.net).

## Cel i kontekst domenowy
Projekt powstał we **współpracy z koleżanką z HR i płac** — od niej otrzymałem **zasady obliczeń, interpretację pól formularza i oczekiwania co do przebiegu w UI**. Dzięki temu kalkulatory mają sens **biznesowo**, nie tylko technicznie; jednocześnie **prawo i stawki się zmieniają**, więc wyniki warto traktować jako **orientacyjne** i weryfikować w aktualnych przepisach / u użytkownika księgowości.

## Co robi użytkownik
- **Konto:** rejestracja i logowanie; **MySQL** trzyma użytkowników, sesję opieram o **JWT** (m.in. nagłówek `Authorization` przy wywołaniach API po stronie frontu).
- **Ścieżka kalkulacji:** po zalogowaniu wybór **typu umowy** i odpowiedniego kalkulatora, uzupełnienie pól (m.in. **brutto**, składki ZUS w wariantach, koszty uzyskania, zaliczka na podatek, ulgi, opcje związane z **wiekiem poniżej 26 lat** oraz **PPK** tam, gdzie to w modelu występuje) — duża część to pola typu **select**, żeby ograniczyć błędne kombinacje.
- **Wynik:** po wysłaniu formularza dane idą na endpoint API, **wykonuję obliczenia po stronie serwera**, użytkownik trafia na **podstronę wyników**, która **po załadowaniu DOM pobiera dane z API** — ten sam schemat przepływu powtarzam dla wariantów kalkulatorów.
- **Eksport:** mogę **pobrać zestawienie jako PDF** (generowanie po stronie serwera, w README opisuję też **porzucenie Puppeteera na rzecz PDFKit**, bo generowany widok wychodził pusty) oraz **jako arkusz XLSX** (`xlsx`) — tam **mapowałem JSON na tablicę** pod wymagania biblioteki i **scalalem dwa możliwe źródła danych** w jedną ścieżkę eksportu.

## Jak to jest złożone (w skrócie)
- **Backend:** **Express** serwuje **statyczne HTML/CSS/JS** z katalogu projektu oraz endpointy kalkulacji i plików (`/calcresult`, `/calcu26`, generowanie PDF/Excel itd.). W `app.js` jest też middleware **weryfikacji JWT** pod chronione operacje.
- **Logika podatkowa/skadkowa:** osobne moduły i ścieżki dla **pełnego modelu** oraz uproszczeń (**np. pracownik do 26. roku życia**), stawki składek wyciągam z **konfigurowalnych współczynników** (np. warianty „wszystkie”, bez chorobowej, bez ZUS itd.).
- **Logi:** **Winston** z rotacją plików — podobnie jak w późniejszych projektach, **loguję błędy walidacji i problemy po stronie API**.
- **Baza:** **mysql2**, połączenie przez zmienne **`.env`**; README opisuje wymagany **schemat tabeli `users`**.

## Co warto wiedzieć przy pytaniach kontekstowych
- **Dla kogo:** osoby **uczące się Node/Express** oraz **szukające przykładu** łączenia formularzy, API, JWT, PDF i Excela w jednym produkcie **o konkretnej domenie polskiej**.
- **Ograniczenia:** to **projekt edukacyjny z realnym deploymentem**; nie zastępuje audytu płacowego ani aktualnej wiedzy prawniczej — **współpraca z HR nie czyni z aplikacji urzędowego źródła prawdy**.
- **Stack vs. frontmatter:** w treści wspominam m.in. **MySQL, JWT, bcrypt, PDFKit, xlsx, Winston** — w **frontmatterze** nadal widnieje zestaw zgodny z Twoim wpisem (HTML, CSS, JS, Node, Express).

## Jedno zdanie na pytanie ogólne
**Polish Salary Calculator to mój pierwszy poważniejszy Node/Express: polskie umowy (praca, zlecenie, dzieło), JWT + MySQL, wyniki w osobnym widoku oraz eksport do PDF i Excela, z merytorycznym wsparciem HR.**
