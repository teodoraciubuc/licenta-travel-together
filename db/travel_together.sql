CREATE TABLE `Users` (
  `id` integer PRIMARY KEY,
  `username` varchar(255),
  `email` varchar(255) UNIQUE,
  `password_hash` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `Tags` (
  `id` integer PRIMARY KEY,
  `name` varchar(255)
);

CREATE TABLE `User_Preferences` (
  `id` integer PRIMARY KEY,
  `user_id` integer,
  `tag_id` integer,
  `score` integer
);

CREATE TABLE `Destination_Tags` (
  `destination_id` integer,
  `tag_id` integer
);

CREATE TABLE `Destinations` (
  `id` integer PRIMARY KEY,
  `name` varchar(255),
  `country` varchar(255),
  `description` text,
  `latitude` float,
  `longitude` float
);

CREATE TABLE `User_Map_Status` (
  `id` integer PRIMARY KEY,
  `user_id` integer,
  `destination_id` integer,
  `status` varchar(255)
);

CREATE TABLE `Itineraries` (
  `id` integer PRIMARY KEY,
  `user_id` integer,
  `title` varchar(255),
  `start_date` date,
  `end_date` date
);

CREATE TABLE `Itinerary_Items` (
  `id` integer PRIMARY KEY,
  `itinerary_id` integer,
  `destination_id` integer,
  `day_number` integer,
  `order_index` integer
);

CREATE TABLE `Chat_Logs` (
  `id` integer PRIMARY KEY,
  `user_id` integer,
  `message` text,
  `response` text,
  `timestamp` timestamp
);

ALTER TABLE `User_Preferences` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

ALTER TABLE `User_Preferences` ADD FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`);

ALTER TABLE `Destination_Tags` ADD FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`);

ALTER TABLE `Destination_Tags` ADD FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`);

ALTER TABLE `User_Map_Status` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

ALTER TABLE `User_Map_Status` ADD FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`);

ALTER TABLE `Itineraries` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

ALTER TABLE `Itinerary_Items` ADD FOREIGN KEY (`itinerary_id`) REFERENCES `Itineraries` (`id`);

ALTER TABLE `Itinerary_Items` ADD FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`);

ALTER TABLE `Chat_Logs` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);
