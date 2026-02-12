# 🗺️ TRAVEL PLANNER - DATABASE SETUP & LOGIC

Acest fișier conține scriptul de populare și explicația relațiilor dintre date.

---

## 🚀 1. SCRIPT SQL (INSERT DATA)

-- Dezactivăm verificările pentru a evita erorile de tip Foreign Key la inserare
SET FOREIGN_KEY_CHECKS = 0;

-- TABELE PĂRINȚI (Independente)
INSERT INTO `Users` (`id`, `username`, `email`, `password_hash`, `created_at`) VALUES
(1, 'alex_travel', 'alex@example.com', 'hash123', NOW()),
(2, 'maria_explorer', 'maria@example.com', 'hash456', NOW()),
(3, 'dan_vlog', 'dan@example.com', 'hash789', NOW()),
(4, 'elena_trips', 'elena@example.com', 'hash012', NOW()),
(5, 'george_hikes', 'george@example.com', 'hash345', NOW());

INSERT INTO `Tags` (`id`, `name`) VALUES
(1, 'Adventure'), (2, 'Beach'), (3, 'Historical'), (4, 'Foodie'), (5, 'Nature');

INSERT INTO `Destinations` (`id`, `name`, `country`, `description`, `latitude`, `longitude`) VALUES
(1, 'Paris', 'France', 'The city of lights and love.', 48.8566, 2.3522),
(2, 'Tokyo', 'Japan', 'Neon lights and ancient temples.', 35.6762, 139.6503),
(3, 'Rome', 'Italy', 'The eternal city with amazing food.', 41.9028, 12.4964),
(4, 'Bali', 'Indonesia', 'Tropical paradise and surfing.', -8.4095, 115.1889),
(5, 'New York', 'USA', 'The city that never sleeps.', 40.7128, -74.0060);

-- TABELE COPII (Dependente)
INSERT INTO `User_Preferences` (`id`, `user_id`, `tag_id`, `score`) VALUES
(1, 1, 1, 100), (2, 2, 2, 90), (3, 3, 3, 85), (4, 4, 4, 95), (5, 5, 5, 80);

INSERT INTO `Destination_Tags` (`destination_id`, `tag_id`) VALUES
(1, 3), (2, 4), (3, 3), (4, 2), (5, 1);

INSERT INTO `User_Map_Status` (`id`, `user_id`, `destination_id`, `status`) VALUES
(1, 1, 1, 'visited'), (2, 2, 4, 'wishlist'), (3, 3, 2, 'visited'), (4, 4, 3, 'planned'), (5, 5, 5, 'wishlist');

INSERT INTO `Itineraries` (`id`, `user_id`, `title`, `start_date`, `end_date`) VALUES
(1, 1, 'Euro Trip 2026', '2026-06-01', '2026-06-15'),
(2, 2, 'Asian Adventure', '2026-09-10', '2026-09-25'),
(3, 3, 'Italian Food Tour', '2026-05-05', '2026-05-12'),
(4, 4, 'Bali Relaxation', '2026-07-20', '2026-07-30'),
(5, 5, 'NY Express', '2026-12-01', '2026-12-05');

INSERT INTO `Itinerary_Items` (`id`, `itinerary_id`, `destination_id`, `day_number`, `order_index`) VALUES
(1, 1, 1, 1, 1), (2, 2, 2, 3, 1), (3, 3, 3, 2, 1), (4, 4, 4, 1, 1), (5, 5, 5, 1, 1);

-- Reactivăm verificările
SET FOREIGN_KEY_CHECKS = 1;

---

## 🧠 2. EXPLICAȚIA NUMERELOR (CHEI ȘI RELAȚII)

Baza de date funcționează pe principiul "Firelor de legătură". Numerele reprezintă conexiuni:

1. **PRIMARY KEY (ID-ul principal):** - Primul număr dintr-o listă de `VALUES` (ex: `(1, ...)`).
   - Este numărul unic de identificare al acelei înregistrări.

2. **FOREIGN KEY (ID-ul de legătură):**
   - **user_id**: Reprezintă legătura cu tabela `Users`. Dacă scrii `1`, înseamnă că rândul îi aparține lui Alex.
   - **tag_id**: Legătura cu tabela `Tags`. Dacă scrii `3`, înseamnă că se referă la categoria 'Historical'.
   - **destination_id**: Legătura cu tabela `Destinations`. Dacă scrii `1`, te referi la Paris.

**Exemplu Logic:**
Dacă în tabela `Destination_Tags` avem `(1, 3)`, baza de date citește:
- "Destinația cu ID-ul **1** (Paris) este legată de Tag-ul cu ID-ul **3** (Historical)."

3. **COORDONATELE (Latitude/Longitude):**
   - Numerele precum `48.8566` sau `2.3522` sunt coordonatele GPS necesare hărții pentru a afișa locația exactă a orașului Paris.

---