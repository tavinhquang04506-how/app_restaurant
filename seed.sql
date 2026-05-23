SET @branch1 = UUID();
SET @branch2 = UUID();

INSERT INTO branches (id, name, address, phone, open_time, close_time, image_url, created_at, updated_at) VALUES 
(@branch1, 'Nhà hàng GiaBuh - Quận 1', '123 Lê Lợi, Quận 1, TP.HCM', '0901234567', '09:00:00', '23:00:00', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', NOW(), NOW()),
(@branch2, 'Nhà hàng GiaBuh - Quận 3', '456 Võ Văn Tần, Quận 3, TP.HCM', '0907654321', '09:00:00', '23:00:00', 'https://images.unsplash.com/photo-1552566626-52f8b828add9', NOW(), NOW());

SET @cat1 = UUID();
SET @cat2 = UUID();
SET @cat3 = UUID();

INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
(@cat1, 'Món chính', 'Các món ăn chính đậm đà hương vị', NOW(), NOW()),
(@cat2, 'Tráng miệng', 'Đồ ngọt và tráng miệng hấp dẫn', NOW(), NOW()),
(@cat3, 'Đồ uống', 'Nước ép, sinh tố và đồ uống có cồn', NOW(), NOW());

SET @food1 = UUID();
SET @food2 = UUID();
SET @food3 = UUID();
SET @food4 = UUID();

INSERT INTO foods (id, name, description, price, category_id, thumb_url, avg_rating, rating_count, sold, created_at, updated_at) VALUES
(@food1, 'Beefsteak Sốt Tiêu Đen', 'Thăn bò Mỹ hảo hạng nướng than hoa, rưới xốt tiêu đen đặc biệt', 250000, @cat1, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', 4.8, 120, 500, NOW(), NOW()),
(@food2, 'Cá Hồi Áp Chảo', 'Cá hồi Na Uy áp chảo sốt bơ chanh béo ngậy', 220000, @cat1, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2', 4.5, 85, 300, NOW(), NOW()),
(@food3, 'Tiramisu Ý', 'Bánh Tiramisu mềm mịn, thơm mùi cà phê và cacao', 65000, @cat2, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', 4.9, 200, 1000, NOW(), NOW()),
(@food4, 'Trà Đào Cam Sả', 'Thanh mát giải nhiệt mùa hè', 45000, @cat3, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 4.6, 150, 800, NOW(), NOW());

INSERT INTO branch_foods (id, branch_id, food_id, price, active) VALUES
(UUID(), @branch1, @food1, 250000, 1),
(UUID(), @branch1, @food2, 220000, 1),
(UUID(), @branch1, @food3, 65000, 1),
(UUID(), @branch1, @food4, 45000, 1),
(UUID(), @branch2, @food1, 250000, 1),
(UUID(), @branch2, @food4, 45000, 1);
