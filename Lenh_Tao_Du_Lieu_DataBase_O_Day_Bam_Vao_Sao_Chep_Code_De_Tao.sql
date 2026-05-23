-- ====================================================================
-- DỰ ÁN QUẢN LÝ NHÀ HÀNG - FILE KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN TRÊN MYSQL
-- ====================================================================
-- File này bao gồm cấu trúc bảng (schema) tối ưu, các khóa ngoại, ràng buộc
-- và bộ dữ liệu mẫu (seed data) tiếng Việt hoàn chỉnh cho dự án.
-- ====================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Tạo database nếu chưa tồn tại và chuyển sang sử dụng nó
CREATE DATABASE IF NOT EXISTS `restaurant` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `restaurant`;

-- Tắt kiểm tra khóa ngoại tạm thời để xóa/tạo bảng không bị lỗi ràng buộc
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Drop các bảng cũ nếu đã tồn tại để làm sạch dữ liệu
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_conversations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `food_ratings`;
DROP TABLE IF EXISTS `favorite_foods`;
DROP TABLE IF EXISTS `booking_dishes`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `tables`;
DROP TABLE IF EXISTS `branch_foods`;
DROP TABLE IF EXISTS `foods`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `roles`;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- PHẦN 1: ĐỊNH NGHĨA CẤU TRÚC BẢNG (SCHEMA)
-- ====================================================================

-- Bảng 1: Nhóm Quyền (roles)
CREATE TABLE `roles` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 2: Chi Nhánh Nhà Hàng (branches)
CREATE TABLE `branches` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `open_time` TIME DEFAULT NULL,
  `close_time` TIME DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 3: Người Dùng (users)
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `gender` VARCHAR(50) DEFAULT NULL, -- MALE, FEMALE, OTHER
  `role_id` VARCHAR(36) DEFAULT NULL,
  `branch_id` VARCHAR(36) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_users_email` (`email`),
  CONSTRAINT `FK_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_users_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 4: Danh Mục Món Ăn (categories)
CREATE TABLE `categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 5: Món Ăn (foods)
CREATE TABLE `foods` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `thumb_url` VARCHAR(255) DEFAULT NULL,
  `price` BIGINT NOT NULL,
  `sold` BIGINT NOT NULL DEFAULT '0',
  `avg_rating` DOUBLE DEFAULT NULL,
  `rating_count` BIGINT DEFAULT NULL,
  `category_id` VARCHAR(36) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_foods_categories` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 6: Thực Đơn Theo Chi Nhánh (branch_foods)
CREATE TABLE `branch_foods` (
  `id` VARCHAR(36) NOT NULL,
  `branch_id` VARCHAR(36) DEFAULT NULL,
  `food_id` VARCHAR(36) DEFAULT NULL,
  `price` BIGINT NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_branchfoods_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_branchfoods_foods` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 7: Bàn Ăn (tables)
CREATE TABLE `tables` (
  `id` VARCHAR(36) NOT NULL,
  `table_code` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED
  `branch_id` VARCHAR(36) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_tables_code` (`table_code`),
  CONSTRAINT `FK_tables_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 8: Chương Trình Khuyến Mãi (promotions)
CREATE TABLE `promotions` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `discount_percent` INT NOT NULL,
  `quantity` INT NOT NULL,
  `used` INT NOT NULL DEFAULT '0',
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_promotions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 9: Đơn Đặt Bàn (bookings)
CREATE TABLE `bookings` (
  `id` VARCHAR(36) NOT NULL,
  `reserved_from` DATETIME NOT NULL,
  `reserved_to` DATETIME NOT NULL,
  `guests` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED', -- PENDING, CONFIRMED, COMPLETED, CANCELLED
  `subtotal_amount` DECIMAL(38,2) DEFAULT NULL,
  `discount_amount` DECIMAL(38,2) DEFAULT NULL,
  `total_amount` DECIMAL(38,2) DEFAULT NULL,
  `deposit_amount` DECIMAL(38,2) DEFAULT NULL,
  `deposit_refunded` TINYINT(1) DEFAULT '0',
  `special_request` VARCHAR(255) DEFAULT NULL,
  `checkin_code` VARCHAR(255) DEFAULT NULL,
  `reminder` TINYINT(1) NOT NULL DEFAULT '0',
  `user_id` VARCHAR(36) DEFAULT NULL,
  `branch_id` VARCHAR(36) DEFAULT NULL,
  `table_id` VARCHAR(36) DEFAULT NULL,
  `promotion_id` VARCHAR(36) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_bookings_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_bookings_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_bookings_tables` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_bookings_promotions` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 10: Chi Tiết Món Ăn Trong Đơn Đặt Bàn (booking_dishes)
CREATE TABLE `booking_dishes` (
  `id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` BIGINT NOT NULL,
  `serving_order` INT NOT NULL,
  `special_note` VARCHAR(255) DEFAULT NULL,
  `food_id` VARCHAR(36) DEFAULT NULL,
  `booking_id` VARCHAR(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_bookingdishes_foods` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_bookingdishes_bookings` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 11: Món Ăn Yêu Thích (favorite_foods)
CREATE TABLE `favorite_foods` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `food_id` VARCHAR(36) NOT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fav_user_food` (`user_id`, `food_id`),
  CONSTRAINT `FK_favfoods_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_favfoods_foods` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 12: Đánh Giá Món Ăn (food_ratings)
CREATE TABLE `food_ratings` (
  `id` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` VARCHAR(1000) DEFAULT NULL,
  `food_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36) NOT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ratings_foods` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ratings_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ratings_bookings` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 13: Thông Báo (notifications)
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` VARCHAR(1000) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT NULL, -- PROMOTION, SYSTEM, ORDER
  `scope` VARCHAR(50) DEFAULT NULL, -- GLOBAL, PERSONAL
  `image` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` DATETIME DEFAULT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_notifications_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_conversations` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `last_message_at` DATETIME DEFAULT NULL,
  `last_message_preview` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'WAITING',
  `assigned_staff_id` VARCHAR(36) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_conversations_user` (`user_id`),
  CONSTRAINT `FK_conversations_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_conversations_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 15: Tin Nhắn Chat (chat_messages)
CREATE TABLE `chat_messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) DEFAULT NULL,
  `sender_type` VARCHAR(20) NOT NULL, -- CUSTOMER, STAFF, BOT
  `content` VARCHAR(1000) NOT NULL,
  `sender_name` VARCHAR(255) DEFAULT NULL,
  `sender_id` VARCHAR(255) DEFAULT NULL,
  -- Các trường kế thừa từ BaseEntity
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_messages_conversations` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- PHẦN 2: DỮ LIỆU MẪU CỰC KỲ ĐẦY ĐỦ VÀ CHUẨN HÓA (SEED DATA)
-- ====================================================================

-- 1. SEED DATA CHO BẢNG ROLES (Nhóm quyền bắt buộc)
SET @r_admin = '55170001-51d4-11f1-8260-088fc3077434';
SET @r_staff = '55170002-51d4-11f1-8260-088fc3077434';
SET @r_user  = '55170003-51d4-11f1-8260-088fc3077434';
SET @r_manager = '55170004-51d4-11f1-8260-088fc3077434';

INSERT INTO `roles` (`id`, `name`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@r_admin, 'ADMIN', NOW(), NOW(), 'system', 'system'),
(@r_staff, 'STAFF', NOW(), NOW(), 'system', 'system'),
(@r_user,  'USER',  NOW(), NOW(), 'system', 'system'),
(@r_manager, 'MANAGER', NOW(), NOW(), 'system', 'system');

-- 2. SEED DATA CHO BẢNG BRANCHES (Chi nhánh)
SET @b1 = '5517b4ac-51d4-11f1-8260-088fc3077434';
SET @b2 = '5517ba1e-51d4-11f1-8260-088fc3077434';
SET @b3 = '5517c003-51d4-11f1-8260-088fc3077434';
SET @b4 = '5517c004-51d4-11f1-8260-088fc3077434';

INSERT INTO `branches` (`id`, `name`, `address`, `phone`, `image_url`, `open_time`, `close_time`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@b1, 'Nhà hàng 3Ship - Quận 1', '123 Lê Lợi, Quận 1, TP.HCM', '0901234567', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '09:00:00', '23:00:00', NOW(), NOW(), 'system', 'system'),
(@b2, 'Nhà hàng 3Ship - Quận 3', '456 Võ Văn Tần, Quận 3, TP.HCM', '0907654321', 'https://images.unsplash.com/photo-1552566626-52f8b828add9', '09:00:00', '23:00:00', NOW(), NOW(), 'system', 'system'),
(@b3, 'Nhà hàng 3Ship - Bình Thạnh', '789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', '0908889999', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '09:00:00', '23:00:00', NOW(), NOW(), 'system', 'system'),
(@b4, 'Nhà hàng 3Ship - Gò Vấp', '321 Quang Trung, Quận Gò Vấp, TP.HCM', '0901112222', 'https://images.unsplash.com/photo-1552566626-52f8b828add9', '09:00:00', '23:00:00', NOW(), NOW(), 'system', 'system');

-- 3. SEED DATA CHO BẢNG USERS (Tài khoản thử nghiệm)
SET @u_admin    = '5517a001-51d4-11f1-8260-088fc3077434';
SET @u_staff    = '5517a002-51d4-11f1-8260-088fc3077434';
SET @u_customer = '5517a003-51d4-11f1-8260-088fc3077434';
SET @u_manager  = '5517a004-51d4-11f1-8260-088fc3077434';
SET @u_manager2 = '5517a005-51d4-11f1-8260-088fc3077434';
SET @u_staff2   = '5517a006-51d4-11f1-8260-088fc3077434';

INSERT INTO `users` (`id`, `email`, `username`, `password`, `phone`, `avatar_url`, `gender`, `role_id`, `branch_id`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@u_admin, 'admin@gmail.com', 'Nguyễn Hoàng Nam', '$2b$10$sZz.Z83PSBApYPJGmytZv.tETKhTtFm9pAdUL5w2CqH7DkkoTerQm', '0999888777', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c', 'MALE', @r_admin, @b1, NOW(), NOW(), 'system', 'system'),
(@u_staff, 'staff@gmail.com', 'Phan Thị Tuyết Mai', '$2b$10$8.t.RRtin8dmIWhfd4U4uu.efEkbGGspyMdLCL0o7KZNRrhkPly3a', '0999666555', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16', 'FEMALE', @r_staff, @b1, NOW(), NOW(), 'system', 'system'),
(@u_customer, 'test@gmail.com', 'Khách Hàng Demo', '$2b$10$vekLXamZzTnUZoFeA.jB9uI1nLEsJ1/STavvzMqE5LIl309g0lIpm', '0987654321', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'FEMALE', @r_user, NULL, NOW(), NOW(), 'system', 'system'),
(@u_manager, 'manager@gmail.com', 'Lê Thanh Tùng', '$2b$10$vekLXamZzTnUZoFeA.jB9uI1nLEsJ1/STavvzMqE5LIl309g0lIpm', '0999555444', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'MALE', @r_manager, @b1, NOW(), NOW(), 'system', 'system'),
(@u_manager2, 'manager2@gmail.com', 'Trần Minh Đức', '$2b$10$vekLXamZzTnUZoFeA.jB9uI1nLEsJ1/STavvzMqE5LIl309g0lIpm', '0999444333', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'MALE', @r_manager, @b2, NOW(), NOW(), 'system', 'system'),
(@u_staff2, 'staff2@gmail.com', 'Nguyễn Thị Thu Hà', '$2b$10$vekLXamZzTnUZoFeA.jB9uI1nLEsJ1/STavvzMqE5LIl309g0lIpm', '0999333222', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16', 'FEMALE', @r_staff, @b2, NOW(), NOW(), 'system', 'system');

-- 4. SEED DATA CHO BẢNG CATEGORIES (Danh mục món ăn)
SET @c1 = '55183d17-51d4-11f1-8260-088fc3077434'; -- Món chính
SET @c2 = '551844f3-51d4-11f1-8260-088fc3077434'; -- Tráng miệng
SET @c3 = '55184c5c-51d4-11f1-8260-088fc3077434'; -- Đồ uống

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@c1, 'Món chính', 'Các món ăn chính đậm đà hương vị và đầy đủ dinh dưỡng', NOW(), NOW(), 'system', 'system'),
(@c2, 'Tráng miệng', 'Bánh ngọt, kem và đồ ngọt tráng miệng hấp dẫn sau bữa ăn', NOW(), NOW(), 'system', 'system'),
(@c3, 'Đồ uống', 'Nước ép trái cây tươi, sinh tố, trà và các đồ uống thanh mát', NOW(), NOW(), 'system', 'system');

-- 5. SEED DATA CHO BẢNG FOODS (Các món ăn chi tiết)
SET @f1 = '55188001-51d4-11f1-8260-088fc3077434';
SET @f2 = '55188002-51d4-11f1-8260-088fc3077434';
SET @f3 = '55188003-51d4-11f1-8260-088fc3077434';
SET @f4 = '55188004-51d4-11f1-8260-088fc3077434';
SET @f5 = '55188005-51d4-11f1-8260-088fc3077434';
SET @f6 = '55188006-51d4-11f1-8260-088fc3077434';
SET @f7 = '55188007-51d4-11f1-8260-088fc3077434';
SET @f8 = '55188008-51d4-11f1-8260-088fc3077434';
SET @f9 = '55188009-51d4-11f1-8260-088fc3077434';
SET @f10 = '55188010-51d4-11f1-8260-088fc3077434';
SET @f11 = '55188011-51d4-11f1-8260-088fc3077434';
SET @f12 = '55188012-51d4-11f1-8260-088fc3077434';
SET @f13 = '55188013-51d4-11f1-8260-088fc3077434';
SET @f14 = '55188014-51d4-11f1-8260-088fc3077434';
SET @f15 = '55188015-51d4-11f1-8260-088fc3077434';
SET @f16 = '55188016-51d4-11f1-8260-088fc3077434';
SET @f17 = '55188017-51d4-11f1-8260-088fc3077434';
SET @f18 = '55188018-51d4-11f1-8260-088fc3077434';
SET @f19 = '55188019-51d4-11f1-8260-088fc3077434';
SET @f20 = '55188020-51d4-11f1-8260-088fc3077434';
SET @f21 = '55188021-51d4-11f1-8260-088fc3077434';
SET @f22 = '55188022-51d4-11f1-8260-088fc3077434';
SET @f23 = '55188023-51d4-11f1-8260-088fc3077434';
SET @f24 = '55188024-51d4-11f1-8260-088fc3077434';
SET @f25 = '55188025-51d4-11f1-8260-088fc3077434';
SET @f26 = '55188026-51d4-11f1-8260-088fc3077434';
SET @f27 = '55188027-51d4-11f1-8260-088fc3077434';
SET @f28 = '55188028-51d4-11f1-8260-088fc3077434';
SET @f29 = '55188029-51d4-11f1-8260-088fc3077434';
SET @f30 = '55188030-51d4-11f1-8260-088fc3077434';
SET @f31 = '55188031-51d4-11f1-8260-088fc3077434';
SET @f32 = '55188032-51d4-11f1-8260-088fc3077434';
SET @f33 = '55188033-51d4-11f1-8260-088fc3077434';
SET @f34 = '55188034-51d4-11f1-8260-088fc3077434';
SET @f35 = '55188035-51d4-11f1-8260-088fc3077434';
SET @f36 = '55188036-51d4-11f1-8260-088fc3077434';
SET @f37 = '55188037-51d4-11f1-8260-088fc3077434';
SET @f38 = '55188038-51d4-11f1-8260-088fc3077434';
SET @f39 = '55188039-51d4-11f1-8260-088fc3077434';
SET @f40 = '55188040-51d4-11f1-8260-088fc3077434';
SET @f41 = '55188041-51d4-11f1-8260-088fc3077434';
SET @f42 = '55188042-51d4-11f1-8260-088fc3077434';
SET @f43 = '55188043-51d4-11f1-8260-088fc3077434';
SET @f44 = '55188044-51d4-11f1-8260-088fc3077434';
SET @f45 = '55188045-51d4-11f1-8260-088fc3077434';
SET @f46 = '55188046-51d4-11f1-8260-088fc3077434';
SET @f47 = '55188047-51d4-11f1-8260-088fc3077434';
SET @f48 = '55188048-51d4-11f1-8260-088fc3077434';
SET @f49 = '55188049-51d4-11f1-8260-088fc3077434';
SET @f50 = '55188050-51d4-11f1-8260-088fc3077434';
SET @f51 = '55188051-51d4-11f1-8260-088fc3077434';
SET @f52 = '55188052-51d4-11f1-8260-088fc3077434';
SET @f53 = '55188053-51d4-11f1-8260-088fc3077434';
SET @f54 = '55188054-51d4-11f1-8260-088fc3077434';
SET @f55 = '55188055-51d4-11f1-8260-088fc3077434';
SET @f56 = '55188056-51d4-11f1-8260-088fc3077434';
SET @f57 = '55188057-51d4-11f1-8260-088fc3077434';
SET @f58 = '55188058-51d4-11f1-8260-088fc3077434';
SET @f59 = '55188059-51d4-11f1-8260-088fc3077434';
SET @f60 = '55188060-51d4-11f1-8260-088fc3077434';
SET @f61 = '55188061-51d4-11f1-8260-088fc3077434';
SET @f62 = '55188062-51d4-11f1-8260-088fc3077434';

INSERT INTO `foods` (`id`, `name`, `description`, `price`, `category_id`, `thumb_url`, `avg_rating`, `rating_count`, `sold`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@f1, 'Vịt Quay Bắc Kinh', 'Lớp da giòn rụm màu bánh mật, thịt ngọt mềm mọng nước ăn kèm bánh tráng và nước sốt tương ngọt đặc trưng của Bắc Kinh.', 380000, @c1, 'https://images.unsplash.com/photo-1529042410759-befb1204b468', 4.8, 120, 1200, NOW(), NOW(), 'system', 'system'),
(@f2, 'Đậu Hũ Ma Bà', 'Món đậu hũ Tứ Xuyên trứ danh, mềm mịn quyện cùng thịt băm và xốt ớt Tứ Xuyên cay nồng, thơm mùi tiêu Tứ Xuyên đặc trưng.', 120000, @c1, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 4.5, 85, 300, NOW(), NOW(), 'system', 'system'),
(@f3, 'Thịt Kho Đông Pha', 'Thịt ba chỉ cắt vuông vức, hầm nhừ trong rượu Thiệu Hưng, nước tương và đường phèn, béo ngậy tan ngay trong miệng.', 180000, @c1, 'https://images.unsplash.com/photo-1544025162-d76694265947', 4.9, 200, 880, NOW(), NOW(), 'system', 'system'),
(@f4, 'Sủi Cảo Tôm Thịt', 'Vỏ bánh mỏng dai ôm trọn nhân tôm tươi và thịt heo băm đậm đà, ăn kèm xì dầu pha giấm đỏ Tàu.', 90000, @c1, 'https://images.unsplash.com/photo-1563245372-f21724e3856d', 4.6, 150, 900, NOW(), NOW(), 'system', 'system'),
(@f5, 'Mì Vịt Tiềm', 'Mì trứng sợi dai ngập trong nước dùng thơm lừng thảo mộc thuốc bắc, kèm đùi vịt chiên giòn da mềm thịt.', 130000, @c1, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624', 4.3, 95, 420, NOW(), NOW(), 'system', 'system'),
(@f6, 'Cơm Chiên Dương Châu', 'Cơm chiên tơi xốp với lạp xưởng, tôm, đậu hà lan, cà rốt và trứng chiên vàng ruộm bùi béo.', 95000, @c1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 4.4, 110, 950, NOW(), NOW(), 'system', 'system'),
(@f7, 'Lẩu Tứ Xuyên', 'Nước lẩu hai ngăn độc đáo: một ngăn cay tê đậm vị tiêu ớt Tứ Xuyên, một ngăn thanh ngọt từ xương và nấm thảo mộc bổ dưỡng.', 350000, @c1, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8', 4.7, 88, 1100, NOW(), NOW(), 'system', 'system'),
(@f8, 'Há Cảo Triều Châu', 'Há cảo nhân thịt heo, hẹ và củ sắn thái hạt lựu, vỏ bánh dai trong suốt cực kỳ hấp dẫn.', 85000, @c1, 'https://images.unsplash.com/photo-1496116211227-7239d88bc0e6', 4.6, 200, 700, NOW(), NOW(), 'system', 'system'),
(@f9, 'Bánh Tart Trứng Hồng Kông', 'Lớp vỏ ngàn lớp giòn rụm bọc phần nhân kem trứng nướng vàng óng, ngọt ngào béo ngậy.', 60000, @c2, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', 4.5, 75, 820, NOW(), NOW(), 'system', 'system'),
(@f10, 'Chè Trôi Nước Mè Đen', 'Những viên chè trôi nước dẻo mịn bọc nhân mè đen thơm phức, chan nước đường gừng ấm nồng và mè rang thơm.', 45000, @c2, 'https://images.unsplash.com/photo-1551024506-0bccd828d307', 4.4, 60, 350, NOW(), NOW(), 'system', 'system'),
(@f11, 'Bánh Bao Kim Sa', 'Bánh bao nóng hổi, khi bẻ đôi lớp nhân trứng muối sữa béo ngậy vàng óng chảy sệt mịn như dòng cát vàng.', 75000, @c2, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb', 4.7, 130, 550, NOW(), NOW(), 'system', 'system'),
(@f12, 'Thạch Quy Linh Cao', 'Cao quy linh mát lạnh, đắng nhẹ thanh mát ăn kèm mật ong hoặc sữa đặc giúp thanh nhiệt cơ thể hiệu quả.', 50000, @c2, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', 4.8, 250, 700, NOW(), NOW(), 'system', 'system'),
(@f13, 'Trà Thảo Mộc Vương Lão Cát', 'Trà thảo mộc Trung Hoa đóng lon nổi tiếng, giúp thanh nhiệt giải độc cực kỳ hiệu quả sau khi ăn đồ cay nóng.', 30000, @c3, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 4.8, 180, 650, NOW(), NOW(), 'system', 'system'),
(@f14, 'Coca-Cola', 'Nước ngọt có ga Coca-Cola sảng khoái mát lạnh chai thủy tinh cực ngon.', 25000, @c3, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97', 4.9, 310, 2400, NOW(), NOW(), 'system', 'system'),
(@f15, 'Pepsi', 'Nước ngọt có ga Pepsi giải khát mát lạnh bùng nổ sảng khoái.', 25000, @c3, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e', 4.7, 260, 1900, NOW(), NOW(), 'system', 'system'),
(@f16, 'Nước Lọc Aquafina', 'Nước khoáng tinh khiết đóng chai Aquafina 500ml thanh mát, bảo vệ sức khỏe.', 15000, @c3, 'https://images.unsplash.com/photo-1608885898957-a599fb16ec18', 4.6, 140, 750, NOW(), NOW(), 'system', 'system'),
(@f17, 'Trà Hoa Cúc Mật Ong', 'Trà hoa cúc ướp mật ong thanh khiết giúp thư giãn đầu óc và ngủ ngon giấc.', 35000, @c3, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3', 4.8, 190, 600, NOW(), NOW(), 'system', 'system'),
-- Món chính mới (@f18 - @f34)
(@f18, 'Phật Nhảy Tường', 'Món ăn hoàng cung nổi tiếng Phúc Kiến, tổng hợp bào ngư, hải sâm, vi cá, nấm đông cô và thịt gà hầm nhừ trong vò sành.', 2680000, @c1, 'https://images.unsplash.com/photo-1567529692333-de9fd6772897', 4.9, 85, 850, NOW(), NOW(), 'system', 'system'),
(@f19, 'Nhất Phẩm Tay Cầm', 'Bào ngư tươi hầm cùng nấm linh chi và các loại hải sản quý trong nồi đất, nước dùng đậm đà tinh túy.', 888000, @c1, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', 4.8, 65, 250, NOW(), NOW(), 'system', 'system'),
(@f20, 'Heo Sữa Quay', 'Heo sữa nguyên con quay giòn vàng rượm, da giòn tan, thịt mềm ngọt tự nhiên, phục vụ kèm nước chấm đặc biệt.', 1080000, @c1, 'https://images.unsplash.com/photo-1606491956689-2ea866880049', 4.7, 92, 480, NOW(), NOW(), 'system', 'system'),
(@f21, 'Xá Xíu Mật Ong', 'Thịt heo nướng phong cách Quảng Đông, tẩm ướp mật ong và ngũ vị hương, nướng than hoa đỏ rực thơm lừng.', 168000, @c1, 'https://images.unsplash.com/photo-1623689046286-01907b348055', 4.6, 150, 420, NOW(), NOW(), 'system', 'system'),
(@f22, 'Gà Hấp Muối', 'Gà ta nguyên con hấp muối hột kiểu Quảng Đông, da vàng bóng, thịt mềm ngọt thanh, chấm kèm muối tiêu chanh.', 350000, @c1, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6', 4.5, 130, 350, NOW(), NOW(), 'system', 'system'),
(@f23, 'Bò Câu Hồng Xíu', 'Bồ câu non hầm nhừ trong nước sốt hồng xíu đậm đà, thịt mềm tan trong miệng, bổ dưỡng.', 190000, @c1, 'https://images.unsplash.com/photo-1606728035253-49e8a23146de', 4.4, 78, 200, NOW(), NOW(), 'system', 'system'),
(@f24, 'Thịt Heo Quay Da Giòn', 'Thịt ba chỉ quay giòn da, lớp da phồng rộp vàng rực, thịt bên trong mềm mọng, ăn kèm nước mắm chua ngọt.', 188000, @c1, 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc', 4.5, 165, 400, NOW(), NOW(), 'system', 'system'),
(@f25, 'Phá Lấu Kiểu Triều Châu', 'Tổng hợp các loại nội tạng hầm trong nước phá lấu ngũ vị hương đặc trưng Triều Châu, thơm nồng đậm vị.', 238000, @c1, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec', 4.3, 88, 220, NOW(), NOW(), 'system', 'system'),
(@f26, 'Tôm Hùm Hấp Tỏi', 'Tôm hùm Alaska tươi sống hấp tỏi băm, miến dong, giữ nguyên vị ngọt tự nhiên của hải sản.', 680000, @c1, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62', 4.8, 55, 120, NOW(), NOW(), 'system', 'system'),
(@f27, 'Tôm Càng Rang Muối Ớt', 'Tôm càng xanh tươi rang muối ớt kiểu Hồng Kông, vỏ giòn rụm, thịt tôm ngọt chắc.', 320000, @c1, 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa', 4.6, 110, 310, NOW(), NOW(), 'system', 'system'),
(@f28, 'Cơm Chiên Hải Sản', 'Cơm chiên Dương Châu đặc biệt với tôm, mực, sò điệp, trứng và rau củ tươi, hạt cơm tơi rời thơm lừng.', 158000, @c1, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 4.4, 200, 450, NOW(), NOW(), 'system', 'system'),
(@f29, 'Mì Xào Hải Sản', 'Mì trứng xào cùng tôm, mực, nghêu và rau cải, sốt dầu hào thơm béo đậm đà.', 168000, @c1, 'https://images.unsplash.com/photo-1585032226651-759b368d7246', 4.3, 180, 420, NOW(), NOW(), 'system', 'system'),
(@f30, 'Hủ Tíu Xào Bò Khô', 'Hủ tiếu Triều Châu xào khô với thịt bò mềm, giá đỗ, hẹ, nước tương đen thơm lừng khói bếp.', 158000, @c1, 'https://images.unsplash.com/photo-1552611052-33e04de1b100', 4.4, 145, 380, NOW(), NOW(), 'system', 'system'),
(@f31, 'Cơm Chiên Bò', 'Cơm chiên với thịt bò xào mềm, trứng, hành lá, hạt cơm tơi rời thấm đều gia vị.', 158000, @c1, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 4.3, 160, 400, NOW(), NOW(), 'system', 'system'),
(@f32, 'Đậu Hũ Tứ Xuyên Chay', 'Đậu hũ non nấu chay phong cách Tứ Xuyên, thay thịt bằng nấm xay, giữ nguyên vị cay nồng đặc trưng.', 168000, @c1, 'https://images.unsplash.com/photo-1541014741259-de529411b96a', 4.2, 75, 160, NOW(), NOW(), 'system', 'system'),
(@f33, 'Gỏi Nấm Mèo Chua Cay', 'Nấm mèo đen thái sợi trộn cùng giấm đen, ớt, tỏi và rau mùi, mát lạnh giòn sần sật.', 138000, @c1, 'https://images.unsplash.com/photo-1543339308-d6c4b1d3973d', 4.1, 90, 180, NOW(), NOW(), 'system', 'system'),
(@f34, 'Khoai Tây Sợi Chua Cay', 'Khoai tây thái sợi mỏng xào chua cay kiểu Tứ Xuyên, giòn sần sật kích thích vị giác.', 128000, @c1, 'https://images.unsplash.com/photo-1518977676601-b53f82aed631', 4.0, 120, 250, NOW(), NOW(), 'system', 'system'),
-- Tráng miệng mới (@f35 - @f45)
(@f35, 'Chè Hạnh Nhân', 'Chè hạnh nhân thơm béo ngọt thanh kiểu Quảng Đông, nấu từ bột hạnh nhân nguyên chất, ăn nóng hoặc lạnh.', 55000, @c2, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb', 4.5, 95, 280, NOW(), NOW(), 'system', 'system'),
(@f36, 'Bánh Bò Nướng', 'Bánh bò hấp xốp mềm nhiều lớp, thoang thoảng hương lá dứa và nước cốt dừa.', 40000, @c2, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35', 4.2, 80, 200, NOW(), NOW(), 'system', 'system'),
(@f37, 'Xoài Sago Dừa', 'Xoài chín ngọt lịm cắt miếng phục vụ cùng hạt sago dẻo mềm và nước cốt dừa béo ngậy.', 65000, @c2, 'https://images.unsplash.com/photo-1587314168485-3236d6710814', 4.6, 110, 320, NOW(), NOW(), 'system', 'system'),
(@f38, 'Chè Đậu Đỏ Trần Bì', 'Đậu đỏ hầm nhừ cùng trần bì 30 năm tuổi và viên nếp nhỏ, ngọt thanh ấm bụng.', 48000, @c2, 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25', 4.3, 70, 180, NOW(), NOW(), 'system', 'system'),
(@f39, 'Thạch Hoa Cúc Kỷ Tử', 'Thạch trong suốt nấu từ hoa cúc tươi, điểm thêm hạt kỷ tử đỏ và nhãn nhục, thanh mát giải nhiệt.', 58000, @c2, 'https://images.unsplash.com/photo-1488477181946-6428a0291777', 4.4, 65, 150, NOW(), NOW(), 'system', 'system'),
(@f40, 'Rau Câu Dừa Lá Dứa', 'Rau câu nhiều lớp xanh trắng xen kẽ, hương lá dứa thơm nhẹ quyện cùng nước cốt dừa béo mịn.', 42000, @c2, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb', 4.3, 85, 200, NOW(), NOW(), 'system', 'system'),
(@f41, 'Bánh Mochi Đậu Đỏ', 'Vỏ mochi dẻo mềm bọc nhân đậu đỏ ngọt bùi, phủ bột gạo nếp mịn bên ngoài.', 50000, @c2, 'https://images.unsplash.com/photo-1582716401356-b9d16ab51f1b', 4.5, 100, 260, NOW(), NOW(), 'system', 'system'),
(@f42, 'Trái Cây Thượng Hạng', 'Đĩa trái cây theo mùa tuyển chọn: thanh long, xoài, dưa hấu, nho và dâu tây trang trí tinh tế.', 120000, @c2, 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea', 4.2, 60, 150, NOW(), NOW(), 'system', 'system'),
(@f43, 'Kem Matcha Đậu Đỏ', 'Kem matcha Nhật Bản thượng hạng phục vụ cùng đậu đỏ hầm nhừ và bột kinako thơm lừng.', 55000, @c2, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a', 4.6, 90, 230, NOW(), NOW(), 'system', 'system'),
(@f44, 'Chè Khúc Bạch', 'Thạch sữa trắng muốt mềm mịn ăn cùng nước đường hoa bưởi và hạt lựu đỏ mọng.', 48000, @c2, 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81', 4.4, 75, 190, NOW(), NOW(), 'system', 'system'),
(@f45, 'Bánh Flan Caramel', 'Bánh flan mềm mịn vị trứng sữa, phủ lớp caramel vàng óng ngọt đắng hài hòa.', 35000, @c2, 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c', 4.3, 130, 350, NOW(), NOW(), 'system', 'system'),
-- Đồ uống mới (@f46 - @f62)
(@f46, 'Nước Ép Cam Tươi', 'Cam sành tươi vắt nguyên chất, giàu vitamin C, mát lạnh sảng khoái.', 45000, @c3, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b', 4.4, 150, 400, NOW(), NOW(), 'system', 'system'),
(@f47, 'Nước Ép Dưa Hấu', 'Dưa hấu đỏ xay nhuyễn tươi mát, ngọt tự nhiên không đường, giải khát mùa hè.', 40000, @c3, 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38', 4.3, 120, 300, NOW(), NOW(), 'system', 'system'),
(@f48, 'Nước Ép Táo', 'Táo xanh ép nguyên chất, chua ngọt thanh mát, tốt cho tiêu hóa.', 45000, @c3, 'https://images.unsplash.com/photo-1576673442511-7e39b6545c87', 4.2, 95, 220, NOW(), NOW(), 'system', 'system'),
(@f49, 'Sinh Tố Xoài', 'Xoài cát Hòa Lộc chín mọng xay nhuyễn cùng sữa tươi và đá bào, ngọt lịm thơm nức.', 55000, @c3, 'https://images.unsplash.com/photo-1546173159-315724a31696', 4.5, 135, 380, NOW(), NOW(), 'system', 'system'),
(@f50, 'Sinh Tố Bơ', 'Bơ sáp Đắk Lắk xay cùng sữa đặc và đá bào, béo ngậy mát lạnh cực kỳ bổ dưỡng.', 55000, @c3, 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd', 4.5, 125, 340, NOW(), NOW(), 'system', 'system'),
(@f51, 'Trà Đào Cam Sả', 'Trà xanh hãm cùng đào ngâm, cam tươi lát mỏng và sả tươi, hương vị tropical sảng khoái.', 45000, @c3, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87', 4.4, 160, 450, NOW(), NOW(), 'system', 'system'),
(@f52, 'Sữa Đậu Nành', 'Sữa đậu nành nóng hoặc lạnh, xay từ đậu nành nguyên hạt, thơm béo thanh mát.', 30000, @c3, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba', 4.1, 80, 200, NOW(), NOW(), 'system', 'system'),
(@f53, 'Bia Tiger', 'Bia Tiger lon 330ml, vị bia lager đậm đà mạnh mẽ, phù hợp các món nướng và hải sản.', 35000, @c3, 'https://images.unsplash.com/photo-1608270586620-248524c67de9', 4.0, 200, 500, NOW(), NOW(), 'system', 'system'),
(@f54, 'Bia Heineken', 'Bia Heineken lon 330ml, hương bia Hà Lan thanh nhẹ cao cấp, hậu vị đắng dịu.', 40000, @c3, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9', 4.1, 180, 450, NOW(), NOW(), 'system', 'system'),
(@f55, 'Bia Sài Gòn', 'Bia Sài Gòn Special lon 330ml, vị bia Việt Nam truyền thống nhẹ nhàng thanh khiết.', 28000, @c3, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13', 4.0, 170, 480, NOW(), NOW(), 'system', 'system'),
(@f56, 'Rượu Vang Đỏ (Ly)', 'Một ly rượu vang đỏ Chile thượng hạng, hương trái cây chín mọng đậm đà, tannin mềm mại.', 150000, @c3, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', 4.3, 60, 120, NOW(), NOW(), 'system', 'system'),
(@f57, 'Rượu Vang Trắng (Ly)', 'Một ly rượu vang trắng Pháp thanh nhã, hương hoa quả nhiệt đới và vani nhẹ.', 150000, @c3, 'https://images.unsplash.com/photo-1474722883778-792e7990302f', 4.2, 55, 100, NOW(), NOW(), 'system', 'system'),
(@f58, 'Champagne (Ly)', 'Một ly Champagne Pháp sủi bọt tinh tế, hương hoa hồng và bưởi tươi mát.', 200000, @c3, 'https://images.unsplash.com/photo-1549918864-48ac978761a4', 4.5, 40, 80, NOW(), NOW(), 'system', 'system'),
(@f59, 'Chivas 18 (Ly)', 'Một ly Chivas Regal 18 năm, whisky Scotland đỉnh cao với hương vị socola, trái cây khô và khói gỗ sồi.', 280000, @c3, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8', 4.6, 35, 60, NOW(), NOW(), 'system', 'system'),
(@f60, 'Sprite', 'Sprite lon 330ml, vị chanh lime sảng khoái, ga mạnh.', 25000, @c3, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3', 4.0, 190, 380, NOW(), NOW(), 'system', 'system'),
(@f61, 'Nước Chanh Mật Ong', 'Chanh vàng vắt tươi pha cùng mật ong nguyên chất và nước ấm, thanh lọc cơ thể.', 35000, @c3, 'https://images.unsplash.com/photo-1544252890-c3e95e867734', 4.3, 100, 250, NOW(), NOW(), 'system', 'system'),
(@f62, 'Trà Phổ Nhĩ', 'Trà Phổ Nhĩ Vân Nam lên men tự nhiên, hương đất mộc ấm áp, hỗ trợ tiêu hóa tuyệt vời.', 40000, @c3, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574', 4.4, 70, 160, NOW(), NOW(), 'system', 'system');

-- 6. SEED DATA CHO BẢNG BRANCH_FOODS (Liên kết món ăn và chi nhánh)
INSERT INTO `branch_foods` (`id`, `branch_id`, `food_id`, `price`, `active`) VALUES
(UUID(), @b1, @f1, 380000, 1),
(UUID(), @b1, @f2, 120000, 1),
(UUID(), @b1, @f3, 180000, 1),
(UUID(), @b1, @f4, 90000, 1),
(UUID(), @b1, @f5, 130000, 1),
(UUID(), @b1, @f6, 95000, 1),
(UUID(), @b1, @f7, 350000, 1),
(UUID(), @b1, @f8, 85000, 1),
(UUID(), @b1, @f9, 60000, 1),
(UUID(), @b1, @f10, 45000, 1),
(UUID(), @b1, @f11, 75000, 1),
(UUID(), @b1, @f12, 50000, 1),
(UUID(), @b1, @f13, 30000, 1),
(UUID(), @b1, @f14, 25000, 1),
(UUID(), @b1, @f15, 25000, 1),
(UUID(), @b1, @f16, 15000, 1),
(UUID(), @b1, @f17, 35000, 1),
-- Chi nhánh 2
(UUID(), @b2, @f1, 380000, 1),
(UUID(), @b2, @f2, 120000, 1),
(UUID(), @b2, @f3, 180000, 1),
(UUID(), @b2, @f4, 90000, 1),
(UUID(), @b2, @f5, 130000, 1),
(UUID(), @b2, @f6, 95000, 1),
(UUID(), @b2, @f7, 350000, 1),
(UUID(), @b2, @f8, 85000, 1),
(UUID(), @b2, @f9, 60000, 1),
(UUID(), @b2, @f10, 45000, 1),
(UUID(), @b2, @f11, 75000, 1),
(UUID(), @b2, @f12, 50000, 1),
(UUID(), @b2, @f13, 30000, 1),
(UUID(), @b2, @f14, 25000, 1),
(UUID(), @b2, @f15, 25000, 1),
(UUID(), @b2, @f16, 15000, 1),
(UUID(), @b2, @f17, 35000, 1),
-- Chi nhánh 1 - Món mới
(UUID(), @b1, @f18, 2680000, 1),
(UUID(), @b1, @f19, 888000, 1),
(UUID(), @b1, @f20, 1080000, 1),
(UUID(), @b1, @f21, 168000, 1),
(UUID(), @b1, @f22, 350000, 1),
(UUID(), @b1, @f23, 190000, 1),
(UUID(), @b1, @f24, 188000, 1),
(UUID(), @b1, @f25, 238000, 1),
(UUID(), @b1, @f26, 680000, 1),
(UUID(), @b1, @f27, 320000, 1),
(UUID(), @b1, @f28, 158000, 1),
(UUID(), @b1, @f29, 168000, 1),
(UUID(), @b1, @f30, 158000, 1),
(UUID(), @b1, @f31, 158000, 1),
(UUID(), @b1, @f32, 168000, 1),
(UUID(), @b1, @f33, 138000, 1),
(UUID(), @b1, @f34, 128000, 1),
(UUID(), @b1, @f35, 55000, 1),
(UUID(), @b1, @f36, 40000, 1),
(UUID(), @b1, @f37, 65000, 1),
(UUID(), @b1, @f38, 48000, 1),
(UUID(), @b1, @f39, 58000, 1),
(UUID(), @b1, @f40, 42000, 1),
(UUID(), @b1, @f41, 50000, 1),
(UUID(), @b1, @f42, 120000, 1),
(UUID(), @b1, @f43, 55000, 1),
(UUID(), @b1, @f44, 48000, 1),
(UUID(), @b1, @f45, 35000, 1),
(UUID(), @b1, @f46, 45000, 1),
(UUID(), @b1, @f47, 40000, 1),
(UUID(), @b1, @f48, 45000, 1),
(UUID(), @b1, @f49, 55000, 1),
(UUID(), @b1, @f50, 55000, 1),
(UUID(), @b1, @f51, 45000, 1),
(UUID(), @b1, @f52, 30000, 1),
(UUID(), @b1, @f53, 35000, 1),
(UUID(), @b1, @f54, 40000, 1),
(UUID(), @b1, @f55, 28000, 1),
(UUID(), @b1, @f56, 150000, 1),
(UUID(), @b1, @f57, 150000, 1),
(UUID(), @b1, @f58, 200000, 1),
(UUID(), @b1, @f59, 280000, 1),
(UUID(), @b1, @f60, 25000, 1),
(UUID(), @b1, @f61, 35000, 1),
(UUID(), @b1, @f62, 40000, 1),
-- Chi nhánh 2 - Món mới
(UUID(), @b2, @f18, 2680000, 1),
(UUID(), @b2, @f19, 888000, 1),
(UUID(), @b2, @f20, 1080000, 1),
(UUID(), @b2, @f21, 168000, 1),
(UUID(), @b2, @f22, 350000, 1),
(UUID(), @b2, @f23, 190000, 1),
(UUID(), @b2, @f24, 188000, 1),
(UUID(), @b2, @f25, 238000, 1),
(UUID(), @b2, @f26, 680000, 1),
(UUID(), @b2, @f27, 320000, 1),
(UUID(), @b2, @f28, 158000, 1),
(UUID(), @b2, @f29, 168000, 1),
(UUID(), @b2, @f30, 158000, 1),
(UUID(), @b2, @f31, 158000, 1),
(UUID(), @b2, @f32, 168000, 1),
(UUID(), @b2, @f33, 138000, 1),
(UUID(), @b2, @f34, 128000, 1),
(UUID(), @b2, @f35, 55000, 1),
(UUID(), @b2, @f36, 40000, 1),
(UUID(), @b2, @f37, 65000, 1),
(UUID(), @b2, @f38, 48000, 1),
(UUID(), @b2, @f39, 58000, 1),
(UUID(), @b2, @f40, 42000, 1),
(UUID(), @b2, @f41, 50000, 1),
(UUID(), @b2, @f42, 120000, 1),
(UUID(), @b2, @f43, 55000, 1),
(UUID(), @b2, @f44, 48000, 1),
(UUID(), @b2, @f45, 35000, 1),
(UUID(), @b2, @f46, 45000, 1),
(UUID(), @b2, @f47, 40000, 1),
(UUID(), @b2, @f48, 45000, 1),
(UUID(), @b2, @f49, 55000, 1),
(UUID(), @b2, @f50, 55000, 1),
(UUID(), @b2, @f51, 45000, 1),
(UUID(), @b2, @f52, 30000, 1),
(UUID(), @b2, @f53, 35000, 1),
(UUID(), @b2, @f54, 40000, 1),
(UUID(), @b2, @f55, 28000, 1),
(UUID(), @b2, @f56, 150000, 1),
(UUID(), @b2, @f57, 150000, 1),
(UUID(), @b2, @f58, 200000, 1),
(UUID(), @b2, @f59, 280000, 1),
(UUID(), @b2, @f60, 25000, 1),
(UUID(), @b2, @f61, 35000, 1),
(UUID(), @b2, @f62, 40000, 1);

-- Tự động đồng bộ hóa danh sách món ăn cho Chi nhánh 3 (Bình Thạnh) và Chi nhánh 4 (Gò Vấp) từ Chi nhánh 1
INSERT INTO `branch_foods` (`id`, `branch_id`, `food_id`, `price`, `active`)
SELECT UUID(), @b3, `food_id`, `price`, `active` FROM `branch_foods` WHERE `branch_id` = @b1 COLLATE utf8mb4_unicode_ci;

INSERT INTO `branch_foods` (`id`, `branch_id`, `food_id`, `price`, `active`)
SELECT UUID(), @b4, `food_id`, `price`, `active` FROM `branch_foods` WHERE `branch_id` = @b1 COLLATE utf8mb4_unicode_ci;

-- 7. SEED DATA CHO BẢNG TABLES (Bàn ăn trong nhà hàng)
INSERT INTO `tables` (`id`, `table_code`, `capacity`, `location`, `status`, `branch_id`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
-- Chi nhánh Quận 1 (@b1)
(UUID(), 'VIP-Q1-2-1', 2, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q1-4-1', 4, 'Tầng 2 - Phòng VIP Lầu Hoa - Ghế Da Cao Cấp', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q1-6-1', 6, 'Tầng 2 - View Kính Trọn Cảnh Thành Phố', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q1-8-1', 8, 'Tầng 2 - Phòng VIP Thượng Uyển - Ghế Da Cao Cấp', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q1-8-2', 8, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-1', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-2', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-3', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-4', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-5', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-2-6', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-1', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-2', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-3', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-4', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-5', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-6', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-7', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-4-8', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-1', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-2', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-3', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-4', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-5', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-6-6', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-8-1', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-8-2', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-8-3', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q1-8-4', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b1, NOW(), NOW(), 'system', 'system'),
-- Chi nhánh Quận 3 (@b2)
(UUID(), 'VIP-Q3-2-1', 2, 'Tầng 2 - Phòng VIP Thượng Uyển - Ghế Da Cao Cấp', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q3-4-1', 4, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q3-6-1', 6, 'Tầng 2 - Phòng VIP Riêng Tư Cận Cảnh - Ghế Da Cao Cấp', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q3-8-1', 8, 'Tầng 2 - View Kính Trọn Cảnh Thành Phố - Ghế Da Cao Cấp', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-Q3-8-2', 8, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-1', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-2', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-3', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-4', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-5', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-2-6', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-1', 4, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-2', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-3', 4, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-4', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-5', 4, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-6', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-7', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-4-8', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-1', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-2', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-3', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-4', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-5', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-6-6', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-8-1', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-8-2', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-8-3', 8, 'Tầng 1 - Dãy Liên Kết Họp Mặt', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-Q3-8-4', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b2, NOW(), NOW(), 'system', 'system'),
-- Chi nhánh Bình Thạnh (@b3)
(UUID(), 'VIP-BT-2-1', 2, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-BT-4-1', 4, 'Tầng 2 - View Kính Trọn Cảnh Thành Phố - Ghế Da Cao Cấp', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-BT-6-1', 6, 'Tầng 2 - Phòng VIP Lầu Hoa - Ghế Da Cao Cấp', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-BT-8-1', 8, 'Tầng 2 - Phòng VIP Lầu Hoa - Ghế Da Cao Cấp', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-BT-8-2', 8, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-1', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-2', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-3', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-4', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-5', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-2-6', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-1', 4, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-2', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-3', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-4', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-5', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-6', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-7', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-4-8', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-1', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-2', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-3', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-4', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-5', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-6-6', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-8-1', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-8-2', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-8-3', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-BT-8-4', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b3, NOW(), NOW(), 'system', 'system'),
-- Chi nhánh Gò Vấp (@b4)
(UUID(), 'VIP-GV-2-1', 2, 'Tầng 2 - Phòng VIP Lầu Hoa - Ghế Da Cao Cấp', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-GV-4-1', 4, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-GV-6-1', 6, 'Tầng 2 - Phòng VIP Lầu Hoa - Ghế Da Cao Cấp', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-GV-8-1', 8, 'Tầng 2 - Phòng VIP Thượng Uyển - Ghế Da Cao Cấp', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'VIP-GV-8-2', 8, 'Tầng 2 - Phòng VIP Hoàng Gia - Ghế Da Cao Cấp', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-1', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-2', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-3', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-4', 2, 'Tầng 1 - Cạnh Cửa Sổ Hướng Phố', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-5', 2, 'Tầng 1 - Góc Ban Công Tình Yêu', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-2-6', 2, 'Tầng Trệt - Quầy Bar Ấm Cúng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-1', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-2', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-3', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-4', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-5', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-6', 4, 'Tầng 1 - Cạnh Bể Cá Cảnh', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-7', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-4-8', 4, 'Tầng Trệt - Sân Vườn Thoáng Đãng', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-1', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-2', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-3', 6, 'Tầng 1 - Gần Lối Đi Sân Khấu', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-4', 6, 'Tầng 1 - Trung Tâm Sảnh Chính', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-5', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-6-6', 6, 'Tầng Trệt - Sân Vườn Rộng Rãi', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-8-1', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-8-2', 8, 'Tầng Trệt - Cận Cửa Ra Vào', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-8-3', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system'),
(UUID(), 'STD-GV-8-4', 8, 'Tầng 1 - Góc Riêng Gia Đình', 'AVAILABLE', @b4, NOW(), NOW(), 'system', 'system');

-- 8. SEED DATA CHO BẢNG PROMOTIONS (Mã giảm giá)
SET @promo1 = '55198001-51d4-11f1-8260-088fc3077434';
SET @promo2 = '55198002-51d4-11f1-8260-088fc3077434';
SET @promo3 = '55198003-51d4-11f1-8260-088fc3077434';
SET @promo4 = '55198004-51d4-11f1-8260-088fc3077434';
SET @promo5 = '55198005-51d4-11f1-8260-088fc3077434';
SET @promo6 = '55198006-51d4-11f1-8260-088fc3077434';
SET @promo7 = '55198007-51d4-11f1-8260-088fc3077434';
SET @promo8 = '55198008-51d4-11f1-8260-088fc3077434';
SET @promo9 = '55198009-51d4-11f1-8260-088fc3077434';
SET @promo10 = '55198010-51d4-11f1-8260-088fc3077434';

INSERT INTO `promotions` (`id`, `code`, `name`, `description`, `image_url`, `discount_percent`, `quantity`, `used`, `start_date`, `end_date`, `active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(@promo1, 'WELCOME20', 'Khai trương chi nhánh mới', 'Giảm 20% cho tất cả các món ăn trong tuần lễ khai trương', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', 20, 100, 12, '2026-05-01 00:00:00', '2026-06-30 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo2, 'SUMMER15', 'Ưu đãi mùa hè rực rỡ', 'Giảm 15% cho mọi hóa đơn đặt trước từ 500.000đ trở lên', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 15, 200, 45, '2026-05-15 00:00:00', '2026-08-31 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo3, 'HAPPY10', 'Happy Hour buổi xế', 'Giảm 10% cho thực đơn đồ uống áp dụng từ 14h00 đến 17h00 hàng ngày', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87', 10, 500, 80, '2026-05-01 00:00:00', '2026-12-31 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo4, 'MIDYEAR25', 'Siêu tiệc giữa năm hoành tráng', 'Giảm ngay 25% cho tất cả các đơn đặt bàn họp nhóm hoặc liên hoan công ty dịp giữa năm', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7', 25, 150, 0, '2026-05-20 00:00:00', '2026-07-20 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo5, 'WEEKEND12', 'Đoàn viên cuối tuần ấm cúng', 'Giảm 12% cho gia đình khi đặt bàn vào thứ 7 và chủ nhật từ 4 người trở lên', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 12, 300, 0, '2026-05-01 00:00:00', '2026-12-31 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo6, 'HALLOWEEN20', 'Đêm hội hóa trang Halloween', 'Giảm giá 20% cho tất cả các booking trong tuần lễ hội Halloween từ 25/10 đến 31/10', 'https://images.unsplash.com/photo-1508349682734-18c0202a561f', 20, 100, 0, '2026-10-25 00:00:00', '2026-10-31 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo7, 'NOEL30', 'Giáng sinh ấm áp cặp đôi', 'Ưu đãi đặc biệt giảm tới 30% cho các cặp đôi đặt bàn lãng mạn tối ngày 24/12', 'https://images.unsplash.com/photo-1544816155-12df9643f363', 30, 50, 0, '2026-12-24 00:00:00', '2026-12-24 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo8, 'NEWYEAR20', 'Mừng xuân phát tài khai tiệc', 'Giảm 20% cho hóa đơn khai xuân, đón chào năm mới may mắn tài lộc', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 20, 250, 0, '2027-01-01 00:00:00', '2027-01-10 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo9, 'BIRTHDAY15', 'Món quà sinh nhật ý nghĩa', 'Đặc quyền thành viên: giảm ngay 15% tổng hóa đơn đặt bàn đúng ngày sinh nhật của bạn', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3', 15, 999, 0, '2026-05-01 00:00:00', '2027-12-31 23:59:59', 1, NOW(), NOW(), 'system', 'system'),
(@promo10, 'BEERFEST10', 'Lễ hội bia tuyết sảng khoái', 'Giảm 10% cho thực đơn các loại bia lạnh hảo hạng khi đặt kèm món nhậu đặc sản cuối tuần', 'https://images.unsplash.com/photo-1436018626274-89acd67ae29e', 10, 400, 0, '2026-05-01 00:00:00', '2026-09-30 23:59:59', 1, NOW(), NOW(), 'system', 'system');

-- 9. SEED DATA CHO BẢNG NOTIFICATIONS (Thông báo toàn hệ thống)
INSERT INTO `notifications` (`id`, `title`, `message`, `type`, `scope`, `image`, `is_read`, `created_at`, `user_id`) VALUES
(UUID(), 'Chào mừng bạn đến với 3Ship!', 'Cảm ơn bạn đã đăng ký tài khoản thành viên. Hãy cùng khám phá thực đơn đa dạng và ưu đãi đặc quyền của chúng tôi!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY), NULL),
(UUID(), 'Khuyến mãi mùa hè 2026 cực sốc', 'Giảm ngay 15% cho tất cả đơn đặt bàn trị giá từ 500k. Nhập mã SUMMER15 ngay hôm nay nhé!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY), NULL),
(UUID(), 'Khai trương chi nhánh Quận 3 hoành tráng', '3Ship hân hạnh chào đón chi nhánh mới tại Quận 3 với nhiều ưu đãi giảm sâu đến 20% trong tuần lễ đầu tiên!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1552566626-52f8b828add9', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY), NULL),
(UUID(), 'Đón Chờ Siêu Tiệc Giữa Năm - Nhập Mã MIDYEAR25', 'Siêu tiệc giữa năm hoành tráng giảm ngay 25% cho tất cả đơn hàng liên hoan công ty hoặc họp lớp!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 12 HOUR), NULL),
(UUID(), 'Mở Rộng Hệ Thống: Đã Có Mặt Tại Bình Thạnh và Gò Vấp!', '3Ship vui mừng thông báo khai trương thêm 2 chi nhánh mới tại Bình Thạnh và Gò Vấp để phục vụ quý khách tốt hơn!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 HOUR), NULL),
(UUID(), 'Đêm Hội Hóa Trang Halloween - Ưu Đãi Nhóm Bạn 20%', 'Lập kèo cùng nhóm bạn tham dự đêm hội hóa trang Halloween rùng rợn tại 3Ship và nhận ngay giảm giá 20% khi nhập mã HALLOWEEN20 nhé!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1508349682734-18c0202a561f', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 HOUR), NULL),
(UUID(), 'Giáng Sinh Ấm Áp 2026 Cùng 3Ship - Ưu Đãi Đặt Bàn Cặp Đôi', 'Tận hưởng bữa tối lãng mạn ngày Giáng Sinh trong không gian lung linh ấm cúng và nhận giảm giá tới 30% khi dùng mã NOEL30!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1544816155-12df9643f363', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE), NULL),
(UUID(), 'Lễ Hội Ẩm Thực Bia Tuyết Thượng Hạng Cuối Tuần', 'Giải nhiệt mùa hè cực sảng khoái với lễ hội bia tuyết, giảm 10% các loại bia lạnh thượng hạng cùng thực đơn mồi nhắm phong phú!', 'PROMOTION', 'GLOBAL', 'https://images.unsplash.com/photo-1436018626274-89acd67ae29e', 0, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), NULL);

-- 10. SEED DATA CHO BẢNG FAVORITE_FOODS (Món ăn yêu thích mẫu)
INSERT INTO `favorite_foods` (`id`, `user_id`, `food_id`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(UUID(), @u_customer, @f1, NOW(), NOW(), 'system', 'system'),
(UUID(), @u_customer, @f3, NOW(), NOW(), 'system', 'system'),
(UUID(), @u_customer, @f4, NOW(), NOW(), 'system', 'system');

-- 11. ĐẢM BẢO CÁC CHỈ MỤC TỐI ƯU HÓA HỆ THỐNG
ALTER TABLE `users` ADD INDEX `idx_users_role` (`role_id`);
ALTER TABLE `users` ADD INDEX `idx_users_branch` (`branch_id`);
ALTER TABLE `foods` ADD INDEX `idx_foods_category` (`category_id`);
ALTER TABLE `branch_foods` ADD INDEX `idx_branchfoods_lookup` (`branch_id`, `food_id`);
ALTER TABLE `tables` ADD INDEX `idx_tables_branch` (`branch_id`);
ALTER TABLE `bookings` ADD INDEX `idx_bookings_user` (`user_id`);
ALTER TABLE `bookings` ADD INDEX `idx_bookings_branch` (`branch_id`);
ALTER TABLE `bookings` ADD INDEX `idx_bookings_table` (`table_id`);
ALTER TABLE `booking_dishes` ADD INDEX `idx_bookingdishes_booking` (`booking_id`);
ALTER TABLE `food_ratings` ADD INDEX `idx_ratings_food` (`food_id`);
ALTER TABLE `chat_messages` ADD INDEX `idx_chatmessages_conv` (`conversation_id`);

COMMIT;
