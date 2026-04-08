# Licenta ASE - Travel Together

## Descriere generala

Travel Together este o aplicatie web pentru planificarea calatoriilor si recomandari personalizate. Proiectul reuneste intr-o singura platforma:

- autentificare si profil utilizator
- chestionar de preferinte
- recomandari de destinatii
- harta personala cu tari si destinatii marcate
- creare si administrare de itinerarii
- explorare de zboruri
- cautare de cazari prin linkuri externe

Aplicatia este dezvoltata in contextul lucrarii de licenta din cadrul ASE - Facultatea CSIE.

---

## Stack folosit in proiect

### Frontend

- React
- Vite
- React Router
- Axios
- React Leaflet + Leaflet
- CSS custom

### Backend

- Node.js
- Express
- PostgreSQL prin `pg`
- JWT pentru autentificare
- bcrypt / bcryptjs pentru parole
- node-fetch pentru integrari externe

### Baza de date

- PostgreSQL

---

## Module existente in cod

### Autentificare

- login
- register
- rute protejate cu JWT

### Dashboard

- afisare recomandari
- acces rapid catre harta, itinerarii si zboruri

### Questionnaire

- colectare preferinte de calatorie
- salvare preferinte pentru recomandari personalizate

### Recommendations

- recomandari de destinatii pe baza preferintelor salvate

### My Map

- cautare destinatii
- salvare statusuri precum `visited`, `planned`, `wishlist`
- rating pentru destinatiile vizitate
- adaugare manuala de destinatii

### Itineraries

- creare itinerariu cu destinatie si interval de date
- adaugare opriri manuale
- recomandari de puncte de interes pentru itinerariu
- salvare opriri in baza de date

### Flights

- pagina de explorare zboruri
- filtrare dupa origine si alte optiuni

### Accommodations

- pagina dedicata cautarii de cazari
- integrare prin linkuri externe catre Booking si Airbnb

### Profile

- statistici de utilizator
- editare username
- schimbare parola

---

## API routes existente

In backend exista in prezent urmatoarele grupuri de rute:

- `auth`
- `dashboard`
- `itineraries`
- `map`
- `questionnaire`
- `recommendations`

---

## Observatii

- README-ul a fost actualizat pentru a reflecta structura si tehnologiile care apar acum in cod.
- Modulul AI chatbot mentionat anterior nu este documentat aici, deoarece nu apare ca functionalitate implementata clar in structura actuala a proiectului.
