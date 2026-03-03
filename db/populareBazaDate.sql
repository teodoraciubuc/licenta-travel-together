-- 1. Curatam datele vechi ca sa nu avem duplicate
DELETE FROM "Destination_Tags";
DELETE FROM "Destinations";
DELETE FROM "Tags";

-- 2. Inseram tag-urile fix cum sunt scrise in QuestionnairePage.jsx
INSERT INTO "Tags" ("id", "name") VALUES
(1, 'Munte'), 
(2, 'Plaja / Litoral'), 
(3, 'Oras istoric'), 
(4, 'Natura / Parcuri nationale'), 
(5, 'Lacuri / Cascade'),
(6, 'Soare si caldura'), 
(7, 'Zapada si iarna'), 
(8, 'Clima temperata (primavara/toamna)'),
(9, 'Vizitare muzee'), 
(10, 'Drumetii / Hiking'), 
(11, 'Shopping'), 
(12, 'Gastronomie (Tururi culinare)'), 
(13, 'Sporturi de apa'), 
(14, 'Viata de noapte / Clubbing'),
(15, 'Solo'), 
(16, 'Cuplu (Romantic)'), 
(17, 'Grup de prieteni'), 
(18, 'Familie (Kid-friendly)');

-- 3. Inseram 6 destinatii de test cu coordonate reale
INSERT INTO "Destinations" ("id", "name", "country", "description", "latitude", "longitude") VALUES
(1, 'Paris', 'Franta', 'Orasul luminilor, perfect pentru cultura, arta si plimbari.', 48.8566, 2.3522),
(2, 'Roma', 'Italia', 'Capitala istorica plina de ruine antice si mancare excelenta.', 41.9028, 12.4964),
(3, 'Barcelona', 'Spania', 'Arhitectura superba, plaja si viata de noapte activa.', 41.3851, 2.1734),
(4, 'Zermatt', 'Elvetia', 'Destinatie montana de top pentru peisaje si aer curat.', 46.0207, 7.7491),
(5, 'Santorini', 'Grecia', 'Insula vulcanica faimoasa pentru apusuri si relaxare.', 36.3932, 25.4615),
(6, 'Brasov', 'Romania', 'Oras medieval la poalele muntilor, bogat in istorie.', 45.6427, 25.5887);

-- 4. Legam destinatiile de tag-uri (pe baza ID-urilor de mai sus)
INSERT INTO "Destination_Tags" ("destination_id", "tag_id") VALUES
-- Paris: Oras istoric, Clima temperata, Vizitare muzee, Gastronomie, Cuplu (Romantic)
(1, 3), (1, 8), (1, 9), (1, 12), (1, 16),
-- Roma: Oras istoric, Soare si caldura, Vizitare muzee, Gastronomie, Familie
(2, 3), (2, 6), (2, 9), (2, 12), (2, 18),
-- Barcelona: Plaja, Soare, Viata de noapte, Gastronomie, Grup de prieteni
(3, 2), (3, 6), (3, 14), (3, 12), (3, 17),
-- Zermatt: Munte, Zapada, Drumetii, Cuplu
(4, 1), (4, 7), (4, 10), (4, 16),
-- Santorini: Plaja, Soare, Sporturi de apa, Cuplu
(5, 2), (5, 6), (5, 13), (5, 16),
-- Brasov: Munte, Oras istoric, Clima temperata, Drumetii, Familie
(6, 1), (6, 3), (6, 8), (6, 10), (6, 18);