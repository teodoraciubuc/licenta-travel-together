SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Chat_Logs`;
DROP TABLE IF EXISTS `Itinerary_Items`;
DROP TABLE IF EXISTS `Itineraries`;
DROP TABLE IF EXISTS `User_Map_Status`;
DROP TABLE IF EXISTS `Destination_Tags`;
DROP TABLE IF EXISTS `User_Preferences`;
DROP TABLE IF EXISTS `Destinations`;
DROP TABLE IF EXISTS `Tags`;
DROP TABLE IF EXISTS `Users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1) USERS
CREATE TABLE `Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) TAGS
CREATE TABLE `Tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tags_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) DESTINATIONS
CREATE TABLE `Destinations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `country` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_destinations_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) USER_PREFERENCES
CREATE TABLE `User_Preferences` (
  `user_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`, `tag_id`),
  KEY `idx_user_preferences_tag` (`tag_id`),
  CONSTRAINT `fk_user_preferences_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_preferences_tag`
    FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) DESTINATION_TAGS (M:N)
CREATE TABLE `Destination_Tags` (
  `destination_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`destination_id`, `tag_id`),
  KEY `idx_destination_tags_tag` (`tag_id`),
  CONSTRAINT `fk_destination_tags_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_destination_tags_tag`
    FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) USER_MAP_STATUS
CREATE TABLE `User_Map_Status` (
  `user_id` INT NOT NULL,
  `destination_id` INT NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `destination_id`),
  KEY `idx_user_map_status_destination` (`destination_id`),
  CONSTRAINT `fk_user_map_status_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_map_status_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) ITINERARIES
CREATE TABLE `Itineraries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_itineraries_user` (`user_id`),
  CONSTRAINT `fk_itineraries_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) ITINERARY_ITEMS
CREATE TABLE `Itinerary_Items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `itinerary_id` INT NOT NULL,
  `destination_id` INT NOT NULL,
  `day_number` INT NOT NULL DEFAULT 1,
  `order_index` INT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_items_itinerary` (`itinerary_id`),
  KEY `idx_items_destination` (`destination_id`),
  CONSTRAINT `fk_items_itinerary`
    FOREIGN KEY (`itinerary_id`) REFERENCES `Itineraries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `Destinations` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9) CHAT_LOGS
CREATE TABLE `Chat_Logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `response` TEXT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_logs_user` (`user_id`),
  CONSTRAINT `fk_chat_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
