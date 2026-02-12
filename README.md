# 🎓 Licență ASE – „Travel Together: Web Application for Travel Management & Personalized Recommendations”

## 📌 Descriere generală

**Travel Together** este o aplicație web ce își propune să integreze într-o singură platformă:

- managementul călătoriilor,
- recomandări personalizate în funcție de preferințele utilizatorului,
- vizualizarea destinațiilor vizitate pe o hartă interactivă,
- un modul AI chatbot care poate oferi răspunsuri personalizate despre destinații.

Proiectul se bazează pe identificarea unei nevoi reale: utilizatorii folosesc în prezent mai multe aplicații separate pentru informații, rezervări, hărți, inspirație și recomandări. Această fragmentare creează dificultăți în planificarea eficientă a unei călătorii.  
Scopul aplicației este **unificarea acestui proces** într-o platformă coerentă și inteligentă.

Aplicația a fost dezvoltată ca parte a lucrării de licență la **ASE – Facultatea CSIE**, specializarea **Informatică Economică**.

---

## 🌐 Frontend

- **HTML5** – structurarea interfeței
- **CSS3**
- **Bootstrap 5** – layout responsive
- **JavaScript** – funcționalități dinamice
- **Leaflet.js** – pentru harta interactivă
- **OpenStreetMap** – furnizor de hartă gratuit

## 🖥 Backend

- **Node.js & Express** – mediul de rulare si framework-ul pentru server[cite: 972].
- **JWT (JSON Web Tokens)** – securizarea rutelor si autentificarea utilizatorilor[cite: 532, 801].
- **Bcrypt** – hashing pentru stocarea securizata a parolelor[cite: 801, 1746].
- **Motor de recomandare** – algoritm de filtrare bazat pe continut (Content-based filtering)[cite: 120, 126].

## 🗄 Bază de date

- **MySQL (XAMPP)** – stocarea utilizatorilor, destinațiilor, preferințelor și recenziilor
- Interogări optimizate pentru CRUD

---

## 🤖 AI (Chatbot)

- Modul AI bazat pe un LLM (Large Language Model)
- Răspunsuri contextuale despre destinații
- Poate sugera locuri, explica recomandări sau ghida utilizatorul
- Extensie opțională a aplicației (nivel prototip)

---

## 🗺 Module pentru hartă

- **Leaflet.js + GeoJSON** – evidențierea țărilor vizitate
- Marcaje dinamice pentru destinațiile recomandate
- Posibilitatea de a vizualiza trasee sau zone de interes

---

# 🚀 Funcționalități cheie

### ✔ Managementul utilizatorilor

- înregistrare / autentificare
- editare profil + preferințe de călătorie

### ✔ Sistem recomandări personalizate

- scorare automată în funcție de preferințele selectate
- generarea unei liste de destinații recomandate
- integrare cu harta

### ✔ Harta interactivă

- marcarea destinațiilor vizitate
- evidențierea recomandărilor
- afișarea informațiilor detaliate

### ✔ Chatbot AI

- recomandări conversaționale
- explicații despre destinații
- suport tip „asistent de călătorie”

---
