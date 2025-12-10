# Database – Travel Together

Acest folder conține fișiere legate de proiectarea și implementarea bazei de date MySQL

## Fișiere planificate

- **travel_together.sql** – schema completă a bazei de date

## Structura bazei de date

Baza de date va include următoarele tabele principale:

- **users** – date despre utilizatori
- **preferences** – preferințele utilizatorilor (intrare necesară pentru recomandări)
- **destinations** – destinații și atribute turistice
- **visited** – țările/locurile vizitate (utilizate pentru afișarea pe hartă)
- **reviews / interactions** – informații folosite pentru îmbunătățirea recomandărilor
- **recommendations_history** – arhivarea recomandărilor generate

## Caracteristici ale bazei de date

- Model relațional realizat în etapa de proiectare a sistemului
- Suport pentru operații CRUD utilizate în backend
- Relații 1:N și N:M între utilizatori, preferințe și destinații
- Construită pentru a susține motorul de recomandări personalizate

Baza de date este un element critic al aplicației, întrucât gestionează toate informațiile necesare pentru recomandări, vizualizarea pe hartă și profilul utilizatorului.
