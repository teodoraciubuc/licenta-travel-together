# Database – Travel Together

Acest folder contine fisierele legate de proiectarea si implementarea bazei de date MySQL utilizate in aplicatia web **Travel Together**.

Baza de date a fost conceputa pentru a sustine functionalitatile principale ale aplicatiei:
managementul utilizatorilor, recomandari personalizate, harta interactiva a destinatiilor, planificarea itinerariilor, componenta sociala si suportul AI.

---

## Fisiere planificate

- **travel_together.sql** – schema completa a bazei de date

---

## Structura bazei de date

Baza de date este organizata modular si include urmatoarele tabele:

- **users** – stocheaza datele de baza ale utilizatorilor (autentificare si identificare)
- **tags** – defineste categoriile de interese (ex: natura, cultura, relaxare)
- **user_preferences** – scorurile 1–5 asociate preferintelor utilizatorilor
- **destination_tags** – asocierea dintre destinatii si etichetele lor
- **destinations** – destinatii turistice cu coordonate geografice (latitudine, longitudine)
- **user_map_status** – marcheaza destinatiile ca `visited` sau `wishlist` pentru fiecare utilizator
- **itineraries** – calatoriile create de utilizatori
- **itinerary_items** – lista ordonata de destinatii pentru fiecare itinerariu, organizata pe zile
- **travel_posts** – postari si amintiri de calatorie asociate destinatiilor
- **chat_logs** – inregistreaza interactiunile utilizatorilor cu chatbot-ul AI

---

## Caracteristici ale bazei de date

- model relational realizat in etapa de proiectare a sistemului
- suport pentru operatii CRUD utilizate in backend
- relatii de tip 1:N si N:M intre utilizatori, preferinte si destinatii
- structura normalizata, fara redundanta
- construita pentru a sustine motorul de recomandari personalizate
- suport direct pentru harta interactiva realizata cu Leaflet.js

---

Baza de date reprezinta un element central al aplicatiei **Travel Together**, gestionand informatiile necesare pentru personalizare, planificarea calatoriilor, vizualizarea geografica si interactiunea utilizatorilor cu platforma.
