SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET @branch1 = '5517b4ac-51d4-11f1-8260-088fc3077434';
SET @branch2 = '5517ba1e-51d4-11f1-8260-088fc3077434';
SET @cat_main = '55183d17-51d4-11f1-8260-088fc3077434';
SET @cat_dessert = '551844f3-51d4-11f1-8260-088fc3077434';
SET @cat_drink = '55184c5c-51d4-11f1-8260-088fc3077434';

-- ==================== FOODS ====================
SET @f1 = UUID(); SET @f2 = UUID(); SET @f3 = UUID(); SET @f4 = UUID();
SET @f5 = UUID(); SET @f6 = UUID(); SET @f7 = UUID(); SET @f8 = UUID();
SET @f9 = UUID(); SET @f10 = UUID(); SET @f11 = UUID(); SET @f12 = UUID();

INSERT INTO foods (id, name, description, price, category_id, thumb_url, avg_rating, rating_count, sold, created_at, updated_at) VALUES
(@f1, 'Beefsteak Sot Tieu Den', 'Than bo My hao hang nuong than hoa, ruoi xot tieu den dac biet', 250000, @cat_main, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', 4.8, 120, 500, NOW(), NOW()),
(@f2, 'Ca Hoi Ap Chao', 'Ca hoi Na Uy ap chao sot bo chanh beo ngay', 220000, @cat_main, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2', 4.5, 85, 300, NOW(), NOW()),
(@f3, 'Tiramisu Y', 'Banh Tiramisu mem min, thom mui ca phe va cacao', 65000, @cat_dessert, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', 4.9, 200, 1000, NOW(), NOW()),
(@f4, 'Tra Dao Cam Sa', 'Thanh mat giai nhiet mua he', 45000, @cat_drink, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 4.6, 150, 800, NOW(), NOW()),
(@f5, 'Mi Y Sot Bo Bam', 'Spaghetti voi sot ca chua, thit bo bam va pho mai Parmesan', 120000, @cat_main, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8', 4.3, 95, 420, NOW(), NOW()),
(@f6, 'Com Chien Hai San', 'Com chien voi tom, muc, so diep va rau thom', 95000, @cat_main, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 4.4, 110, 650, NOW(), NOW()),
(@f7, 'Suon Nuong BBQ', 'Suon heo nuong mat ong sot BBQ, an kem khoai tay chien', 180000, @cat_main, 'https://images.unsplash.com/photo-1544025162-d76694265947', 4.7, 88, 380, NOW(), NOW()),
(@f8, 'Ga Ran Gion Tan', 'Ga ran kieu Han Quoc gion rum, kem sot cay ngot', 135000, @cat_main, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58', 4.6, 200, 900, NOW(), NOW()),
(@f9, 'Che Khuc Bach', 'Che khuc bach thach luu, nhan, vai thieu mat lanh', 35000, @cat_dessert, 'https://images.unsplash.com/photo-1551024506-0bccd828d307', 4.5, 75, 500, NOW(), NOW()),
(@f10, 'Banh Flan Caramel', 'Banh flan min mang voi lop caramel dang nhe', 30000, @cat_dessert, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', 4.4, 60, 350, NOW(), NOW()),
(@f11, 'Sinh To Bo', 'Sinh to bo beo ngay, them sua dac ngot ngao', 40000, @cat_drink, 'https://images.unsplash.com/photo-1638176067000-28ef0f22a6e1', 4.7, 130, 700, NOW(), NOW()),
(@f12, 'Ca Phe Sua Da', 'Ca phe phin truyen thong Viet Nam pha sua dac', 30000, @cat_drink, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 4.8, 250, 1500, NOW(), NOW());

-- ==================== BRANCH_FOODS ====================
INSERT INTO branch_foods (id, branch_id, food_id, price, active) VALUES
(UUID(), @branch1, @f1, 250000, 1), (UUID(), @branch1, @f2, 220000, 1),
(UUID(), @branch1, @f3, 65000, 1), (UUID(), @branch1, @f4, 45000, 1),
(UUID(), @branch1, @f5, 120000, 1), (UUID(), @branch1, @f6, 95000, 1),
(UUID(), @branch1, @f7, 180000, 1), (UUID(), @branch1, @f8, 135000, 1),
(UUID(), @branch1, @f9, 35000, 1), (UUID(), @branch1, @f10, 30000, 1),
(UUID(), @branch1, @f11, 40000, 1), (UUID(), @branch1, @f12, 30000, 1),
(UUID(), @branch2, @f1, 250000, 1), (UUID(), @branch2, @f4, 45000, 1),
(UUID(), @branch2, @f5, 120000, 1), (UUID(), @branch2, @f7, 180000, 1),
(UUID(), @branch2, @f8, 135000, 1), (UUID(), @branch2, @f9, 35000, 1),
(UUID(), @branch2, @f11, 40000, 1), (UUID(), @branch2, @f12, 30000, 1);

-- ==================== PROMOTIONS ====================
INSERT INTO promotions (id, name, code, description, discount_percent, quantity, used, active, start_date, end_date, image_url, created_at, updated_at) VALUES
(UUID(), 'Khai truong chi nhanh moi', 'WELCOME20', 'Giam 20% cho tat ca cac mon trong tuan khai truong', 20, 100, 12, 1, '2026-05-01 00:00:00', '2026-06-30 23:59:59', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', NOW(), NOW()),
(UUID(), 'Uu dai mua he', 'SUMMER15', 'Giam 15% cho don tu 500.000d tro len', 15, 200, 45, 1, '2026-05-15 00:00:00', '2026-08-31 23:59:59', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', NOW(), NOW()),
(UUID(), 'Happy Hour', 'HAPPY10', 'Giam 10% do uong tu 14h-17h', 10, 500, 80, 1, '2026-05-01 00:00:00', '2026-12-31 23:59:59', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87', NOW(), NOW());

-- ==================== NOTIFICATIONS ====================
INSERT INTO notifications (id, title, message, type, scope, is_read, image, created_at) VALUES
(UUID(), 'Chao mung ban den GiaBuh!', 'Cam on ban da dang ky tai khoan. Hay kham pha thuc don phong phu cua chung toi!', 'PROMOTION', 'GLOBAL', 0, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', NOW()),
(UUID(), 'Khuyen mai mua he 2026', 'Giam 15% cho tat ca don hang tu 500.000d. Su dung ma SUMMER15 ngay hom nay!', 'PROMOTION', 'GLOBAL', 0, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', NOW()),
(UUID(), 'Chi nhanh moi tai Quan 3', 'Nha hang GiaBuh chinh thuc khai truong chi nhanh Quan 3. Giam 20% trong tuan dau!', 'PROMOTION', 'GLOBAL', 0, 'https://images.unsplash.com/photo-1552566626-52f8b828add9', NOW());

-- ==================== TABLES ====================
INSERT INTO `tables` (id, table_code, capacity, location, status, branch_id, created_at, updated_at) VALUES
(UUID(), 'A01', 2, 'Tang 1 - Cua so', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'A02', 2, 'Tang 1 - Cua so', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'A03', 4, 'Tang 1 - Trung tam', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'A04', 4, 'Tang 1 - Trung tam', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'B01', 6, 'Tang 2 - Ban cong', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'B02', 6, 'Tang 2 - Ban cong', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'VIP01', 8, 'Tang 2 - Phong VIP', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'VIP02', 10, 'Tang 2 - Phong VIP lon', 'AVAILABLE', @branch1, NOW(), NOW()),
(UUID(), 'C01', 2, 'Tang tret - Quay bar', 'AVAILABLE', @branch2, NOW(), NOW()),
(UUID(), 'C02', 4, 'Tang tret - San vuon', 'AVAILABLE', @branch2, NOW(), NOW()),
(UUID(), 'C03', 4, 'Tang tret - San vuon', 'AVAILABLE', @branch2, NOW(), NOW()),
(UUID(), 'D01', 6, 'Tang 1 - Lau', 'AVAILABLE', @branch2, NOW(), NOW()),
(UUID(), 'D02', 8, 'Tang 1 - Phong rieng', 'AVAILABLE', @branch2, NOW(), NOW()),
(UUID(), 'VIP03', 12, 'Tang 1 - Phong VIP', 'AVAILABLE', @branch2, NOW(), NOW());
