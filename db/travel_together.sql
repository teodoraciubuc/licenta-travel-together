-- Stergere tabele daca exista (echivalent SET FOREIGN_KEY_CHECKS = 0 prin CASCADE)
DROP TABLE IF EXISTS "Chat_Logs" CASCADE;
DROP TABLE IF EXISTS "Itinerary_Items" CASCADE;
DROP TABLE IF EXISTS "Itineraries" CASCADE;
DROP TABLE IF EXISTS "User_Map_Status" CASCADE;
DROP TABLE IF EXISTS "Destination_Tags" CASCADE;
DROP TABLE IF EXISTS "User_Preferences" CASCADE;
DROP TABLE IF EXISTS "Destinations" CASCADE;
DROP TABLE IF EXISTS "Tags" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- 1) USERS
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_users_email" UNIQUE ("email")
);

-- 2) TAGS
CREATE TABLE "Tags" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  CONSTRAINT "uq_tags_name" UNIQUE ("name")
);

-- 3) DESTINATIONS
CREATE TABLE "Destinations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  "description" TEXT NULL,
  "latitude" DECIMAL(10,7) NULL,
  "longitude" DECIMAL(10,7) NULL,

  -- pentru seed_opentripmap.mjs
  "source" VARCHAR(50) NULL,
  "source_id" VARCHAR(100) NULL,
  "kinds" TEXT NULL,
  "otm_rate" INT NULL DEFAULT 0,

  -- pentru enrich_destinations_en.mjs
  "country_en" TEXT NULL,
  "description_en" TEXT NULL
);

-- necesar pentru ON CONFLICT (source, source_id)
CREATE UNIQUE INDEX "uq_destinations_source_sourceid"
  ON "Destinations" ("source", "source_id");

CREATE INDEX "idx_destinations_country" ON "Destinations" ("country");

-- 4) USER_PREFERENCES
CREATE TABLE "User_Preferences" (
  "user_id" INT NOT NULL,
  "tag_id" INT NOT NULL,
  "score" INT NOT NULL DEFAULT 0,
  PRIMARY KEY ("user_id", "tag_id"),
  CONSTRAINT "fk_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_user_preferences_tag" FOREIGN KEY ("tag_id") REFERENCES "Tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5) DESTINATION_TAGS (M:N)
CREATE TABLE "Destination_Tags" (
  "destination_id" INT NOT NULL,
  "tag_id" INT NOT NULL,
  PRIMARY KEY ("destination_id", "tag_id"),
  CONSTRAINT "fk_destination_tags_destination" FOREIGN KEY ("destination_id") REFERENCES "Destinations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_destination_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "Tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6) USER_MAP_STATUS
CREATE TABLE "User_Map_Status" (
  "user_id" INT NOT NULL,
  "destination_id" INT NOT NULL,
  "status" VARCHAR(255) NOT NULL,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "destination_id"),
  CONSTRAINT "fk_user_map_status_user" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_user_map_status_destination" FOREIGN KEY ("destination_id") REFERENCES "Destinations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7) ITINERARIES
CREATE TABLE "Itineraries" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "start_date" DATE NULL,
  "end_date" DATE NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_itineraries_user" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8) ITINERARY_ITEMS
CREATE TABLE "Itinerary_Items" (
  "id" SERIAL PRIMARY KEY,
  "itinerary_id" INT NOT NULL,
  "destination_id" INT NOT NULL,
  "day_number" INT NOT NULL DEFAULT 1,
  "order_index" INT NULL,
  CONSTRAINT "fk_items_itinerary" FOREIGN KEY ("itinerary_id") REFERENCES "Itineraries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_items_destination" FOREIGN KEY ("destination_id") REFERENCES "Destinations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9) CHAT_LOGS
CREATE TABLE "Chat_Logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT NOT NULL,
  "message" TEXT NOT NULL,
  "response" TEXT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_chat_logs_user" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 10) DATE INITIALE PENTRU TAGS
INSERT INTO "Tags" (id, name) VALUES
(1, 'Munte'),
(2, 'Plaja / Litoral'),
(3, 'Oras istoric'),
(4, 'Natura / Parcuri nationale'),
(5, 'Lacuri / Cascade'),
(6, 'Soare si caldura'),
(7, 'Zapada si iarna'),
(8, 'Clima temperata'),
(9, 'Vizitare muzee'),
(10, 'Drumetii / Hiking'),
(11, 'Shopping'),
(12, 'Gastronomie'),
(13, 'Sporturi de apa'),
(14, 'Viata de noapte / Clubbing')
ON CONFLICT (name) DO NOTHING;

-- Resetare secventa pentru ID-uri la Tags 
SELECT setval(' "Tags_id_seq" ', (SELECT MAX(id) FROM "Tags"));

-- 11) ADAUGARE COLOANA IMAGE_URL DACA LIPSESTE
ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- 12) CONSTRANGERI SUPLIMENTARE (PENTRU LOGICA DIN COD)
ALTER TABLE "User_Map_Status" DROP CONSTRAINT IF EXISTS "uq_user_map_status_user_dest";
ALTER TABLE "User_Map_Status" ADD CONSTRAINT "uq_user_map_status_user_dest" UNIQUE ("user_id", "destination_id");

-- Previne dublarea aceleiasi preferinte pentru user
ALTER TABLE "User_Preferences" DROP CONSTRAINT IF EXISTS "uq_user_preferences_user_tag";
ALTER TABLE "User_Preferences" ADD CONSTRAINT "uq_user_preferences_user_tag" UNIQUE ("user_id", "tag_id");