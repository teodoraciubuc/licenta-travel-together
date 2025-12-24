# Database – Travel Together

Acest folder contine fisierele legate de proiectarea si implementarea bazei de date MySQL utilizate in aplicatia web Travel Together.

Baza de date a fost conceputa pentru a sustine functionalitatile principale ale aplicatiei:
managementul utilizatorilor, recomandari personalizate, harta interactiva a destinatiilor, planificarea itinerariilor, componenta sociala si suportul AI.

## Fișiere planificate

- **travel_together.sql** – schema completă a bazei de date

## Structura bazei de date

users – stocheaza datele de baza ale utilizatorilor (autentificare si identificare)
tags – defineste categoriile de interese (ex: natura, cultura, relaxare)
user_preferences – scorurile 1–5 asociate preferintelor utilizatorilor
destination_tags – asocierea dintre destinatii si etichetele lor
destinations – destinatii turistice cu coordonate geografice (latitudine, longitudine)
user_map_status – marcheaza destinatiile ca „visited” sau „wishlist” pentru fiecare utilizator
itineraries – calatoriile create de utilizatori
itinerary_items – lista ordonata de destinatii pentru fiecare itinerariu, organizata pe zile
travel_posts – postari si amintiri de calatorie asociate destinatiilor
chat_logs – inregistreaza interactiunile utilizatorilor cu chatbot-ul AI

## Caracteristici ale bazei de date

- Model relațional realizat în etapa de proiectare a sistemului
- Suport pentru operații CRUD utilizate în backend
- Relații 1:N și N:M între utilizatori, preferințe și destinații
- Construită pentru a susține motorul de recomandări personalizate

Baza de date este un element critic al aplicației, întrucât gestionează toate informațiile necesare pentru recomandări, vizualizarea pe hartă și profilul utilizatorului.
