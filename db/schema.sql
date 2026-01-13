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


CREATE TABLE IF NOT EXISTS `orders`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_no` VARCHAR(64) NOT NULL,
    `member_id` INT UNSIGNED NOT NULL,

    `status` ENUM('PAID','UNPAID') NOT NULL DEFAULT ('UNPAID'),
    `amount_total` INT UNSIGNED NOT NULL,

    -- Booking content
    `spot_id` INT UNSIGNED NOT NULL,
    `booking_date` DATE NOT NULL,
    `booking_time` ENUM('morning', 'afternoon') NOT NULL,
    `price` INT UNSIGNED NOT NULL,

    `paid_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_orders_order_no` (`order_no`),
    KEY `idx_orders_member_created` (`member_id`, `created_at`),
    KEY `idx_orders_status_created` (`status`, `created_at`),

    CONSTRAINT `fk_orders_member`
        FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `payment`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT UNSIGNED NOT NULL,


    `provider` VARCHAR(20) NOT NULL DEFAULT 'tappay',      -- 之後可擴充 linepay 等
    `method` VARCHAR(20) NOT NULL DEFAULT 'credit_card',   -- 之後可擴充其他方式
    `status` ENUM('INITIATED','SUCCESS','FAILED') NOT NULL DEFAULT 'INITIATED',

    `amount` INT UNSIGNED NOT NULL

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- 這裏的update 是因為：按下付款 -> 拿prime -> 新增一筆資料(初始為initiated) -> 送給 TapPay -> update 狀態成功/失敗以及時間

    -- TapPay 回應資料暫不設定
    -- TapPay 交易識別（依你實際回應選存；rec_trade_id 通常很重要）
    -- `tappay_rec_trade_id` VARCHAR(64) NULL,
    -- `tappay_bank_transaction_id` VARCHAR(64) NULL,

    -- -- 卡片辨識（只存非敏感摘要，不存完整卡號、不存 CCV）
    -- `card_bin` CHAR(6) NULL,
    -- `card_last4` CHAR(4) NULL,

    -- -- 失敗資訊（方便 debug/客服）
    -- `error_code` VARCHAR(32) NULL,
    -- `error_message` VARCHAR(255) NULL,

    KEY `idx_payments_order_created` (`order_id`, `created_at`),
    KEY `idx_payments_order_status` (`status`, `created_at`)

    CONSTRAINT `fk_payments_order`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE

)ENGINE=InnoDB;
