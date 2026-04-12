---
project_name: Notes WebApp
project_category: Web Development
tech_stack: HTML, CSS, JavaScript, Node.js, Express.js,
status: active
year: 2024
---

**Notes WebApp** to moja prosta, ale obsługująca wielu użytkowników jednocześnie aplikacja do prowadzenia osobistych notatek: funkcjonalności rejestracji i logowania, prowadzenia własnej listy notatek na koncie, wykonania podstawowych operacji na treści oraz eksportu wybranej notatki do PDF i ustawienia awatara profilu. To była **moja druga aplikacja FullStack w Node.js** — świadomie **nie klonowałem gotowych tutoriali**, tylko budowałem **własną** wersję menedżera notatek. **Publiczna instancja:** [notesapp.msliwowski.net](https://notesapp.msliwowski.net).

## Cel i kontekst
Aplikacja służyła mi przede wszystkim **nauce tworzenia backendu** w Express, pracy z **relacyjną bazą (MySQL)** oraz połączeniu **klasycznego frontu (HTML + JS)** z API. **Funkcjonalność mnie satysfakcjonuje**; jednocześnie **planuję przebudowę** (np. React + SCSS) — **sam traktuję** obecną wersję jako **mój działający etap nauki**, a nie finalny produkt komercyjny.

## Co robi użytkownik
- **Konto:** **zaimplementowałem** rejestrację z walidacją pól (m.in. hasło wg założeń siły, unikalność e-maila), logowanie i sesję opartą o **JWT w ciasteczku** (`httpOnly` w konfiguracji). Hasła **hashuję (bcrypt)**.
- **Notatki:** użytkownik może tworzyć, przeglądać, edytować i usuwać notatki **tylko w swoim koncie**; treści i metadane zapisuję w MySQL. W modelu danych **dodałem** pole „wagi” / priorytetu notatki.
- **PDF:** **dodałem** generowanie **PDF wybranej notatki** po stronie serwera.
- **Profil:** **upload awatara** — plik zapisuję po stronie serwera w katalogu publicznym aplikacji, nazwę powiązuję z użytkownikiem.

## Jak to jest złożone (w skrócie)
- **Backend:** **Postawiłem** jeden proces **Express**, który serwuje statyczne pliki z `public` oraz **REST-owe endpointy** (m.in. prefiks `/notes` z middleware weryfikującym token). **Połączenie z MySQL** (`mysql2`) **obsługuję** z logiką **ponownego łączenia** przy zerwaniu połączenia.
- **Frontend:** **Piszę** strony w HTML, style buduję przez **Tailwind CSS** (pipeline PostCSS w skryptach npm), logikę **rozbiłem na moduły JS** w katalogu publicznym zamiast jednego monolitycznego pliku.
- **Cross-origin:** CORS **świadomie zawęziłem** (w kodzie m.in. localhost) — na własnym hostingu **dopasowuję** origin do domeny produkcyjnej.
- **Logi operacyjne:** używam **Winstona** z codzienną rotacją plików logów i osobnym strumieniem błędów — **tak łatwiej diagnozuję** serwer bez ograniczania się do konsoli.

## Co warto wiedzieć przy pytaniach „kontekstowych”
- **Dla kogo:** projekt celował w **naukę full stacku**; mogę go polecić osobom szukającym **prostego, działającego przykładu** CRUD + auth + pliki + PDF, a nie gotowego SaaS z analityką i zespołowym backlogiem.
- **Baza i admin:** w README **wspominam phpMyAdmin** jako wygodną warstwę do zarządzania schematem i danymi w MySQL.
- **Wdrożenie / Docker:** w README **opisuję możliwość opakowania w kontener** (własny Dockerfile, dostosowanie CORS i adresów fetch) — typowy scenariusz, w którym **uczyłem się devopsu obok aplikacji**.
- **Ograniczenia i szczerość:** **przyznaję błędy i niedoskonałości** oraz plan przebudowy; gdy pytają o jakość produkcyjną, **sam mówię o mojej wersji edukacyjnej z realnym deploymentem**, a nie o „enterprise-grade” od pierwszej iteracji.
- **Prywatność danych:** notatki trzymam **per użytkownik** w bazie — **nie zakładam współdzielenia treści między kontami** (w kodzie nie ma takiego modelu).

## Jedno zdanie na pytanie ogólne
**Notes WebApp to moja nauka full stacku w Node/Express z MySQL: własne konta, CRUD notatek, PDF i awatar, front w HTML/JS z Tailwindem, z ideą dalszej przebudowy na nowocześniejszy stack.**
