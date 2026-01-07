CREATE DATABASE IF NOT EXISTS `travel`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `travel`;

CREATE TABLE IF NOT EXISTS `spot`(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NULL,
    description TEXT NULL,
    address TEXT NULL,
    transport TEXT NULL,
    mrt VARCHAR(255) NULL,
    lat DECIMAL(9,6) NULL,
    lng DECIMAL(9,6) NULL,
    images JSON NULL
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `members`(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE KEY uk_email(email)
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `booking`(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    spot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time ENUM('morning', 'afternoon') NOT NULL,
    price INT NOT NULL,

    UNIQUE KEY uk_booking_member (member_id),
    KEY idx_booking_spot (spot_id),

    CONSTRAINT fk_booking_member
        FOREIGN KEY (member_id) REFERENCES members (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_booking_spot
        FOREIGN KEY (spot_id) REFERENCES spot (id)
        ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;