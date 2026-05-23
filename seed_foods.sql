SET NAMES utf8mb4;
SET @b1 = '5517b4ac-51d4-11f1-8260-088fc3077434';
SET @b2 = '5517ba1e-51d4-11f1-8260-088fc3077434';
SET @c1 = '55183d17-51d4-11f1-8260-088fc3077434';
SET @c2 = '551844f3-51d4-11f1-8260-088fc3077434';
SET @c3 = '55184c5c-51d4-11f1-8260-088fc3077434';

SET @f1=UUID(); SET @f2=UUID(); SET @f3=UUID(); SET @f4=UUID();
SET @f5=UUID(); SET @f6=UUID(); SET @f7=UUID(); SET @f8=UUID();
SET @f9=UUID(); SET @f10=UUID(); SET @f11=UUID(); SET @f12=UUID();

INSERT INTO foods (id,name,description,price,category_id,thumb_url,avg_rating,rating_count,sold,created_at,updated_at) VALUES
(@f1,  N'Beefsteak S\u1ed1t Ti\u00eau \u0110en',       N'Th\u0103n b\u00f2 M\u1ef9 h\u1ea3o h\u1ea1ng n\u01b0\u1edbng than hoa, r\u01b0\u1edbi x\u1ed1t ti\u00eau \u0111en \u0111\u1eb7c bi\u1ec7t', 250000, @c1, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', 4.8, 120, 500, NOW(), NOW()),
(@f2,  N'C\u00e1 H\u1ed3i \u00c1p Ch\u1ea3o',          N'C\u00e1 h\u1ed3i Na Uy \u00e1p ch\u1ea3o s\u1ed1t b\u01a1 chanh b\u00e9o ng\u1eady', 220000, @c1, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2', 4.5, 85, 300, NOW(), NOW()),
(@f3,  N'Tiramisu \u00dd',                              N'B\u00e1nh Tiramisu m\u1ec1m m\u1ecbn, th\u01a1m m\u00f9i c\u00e0 ph\u00ea v\u00e0 cacao', 65000, @c2, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', 4.9, 200, 1000, NOW(), NOW()),
(@f4,  N'Tr\u00e0 \u0110\u00e0o Cam S\u1ea3',           N'Thanh m\u00e1t gi\u1ea3i nhi\u1ec7t m\u00f9a h\u00e8', 45000, @c3, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 4.6, 150, 800, NOW(), NOW()),
(@f5,  N'M\u00ec \u00dd S\u1ed1t B\u00f2 B\u1eb1m',     N'Spaghetti v\u1edbi s\u1ed1t c\u00e0 chua, th\u1ecbt b\u00f2 b\u1eb1m v\u00e0 ph\u00f4 mai Parmesan', 120000, @c1, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8', 4.3, 95, 420, NOW(), NOW()),
(@f6,  N'C\u01a1m Chi\u00ean H\u1ea3i S\u1ea3n',        N'C\u01a1m chi\u00ean v\u1edbi t\u00f4m, m\u1ef1c, s\u00f2 \u0111i\u1ec7p v\u00e0 rau th\u01a1m', 95000, @c1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 4.4, 110, 650, NOW(), NOW()),
(@f7,  N'S\u01b0\u1eddn N\u01b0\u1edbng BBQ',           N'S\u01b0\u1eddn heo n\u01b0\u1edbng m\u1eadt ong s\u1ed1t BBQ, \u0103n k\u00e8m khoai t\u00e2y chi\u00ean', 180000, @c1, 'https://images.unsplash.com/photo-1544025162-d76694265947', 4.7, 88, 380, NOW(), NOW()),
(@f8,  N'G\u00e0 R\u00e1n Gi\u00f2n Tan',               N'G\u00e0 r\u00e1n ki\u1ec3u H\u00e0n Qu\u1ed1c gi\u00f2n r\u1ee5m, k\u00e8m s\u1ed1t cay ng\u1ecdt', 135000, @c1, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58', 4.6, 200, 900, NOW(), NOW()),
(@f9,  N'Ch\u00e8 Kh\u00fac B\u1ea1ch',                 N'Ch\u00e8 kh\u00fac b\u1ea1ch th\u1ea1ch l\u1ef1u, nh\u00e3n, v\u1ea3i thi\u1ec1u m\u00e1t l\u1ea1nh', 35000, @c2, 'https://images.unsplash.com/photo-1551024506-0bccd828d307', 4.5, 75, 500, NOW(), NOW()),
(@f10, N'B\u00e1nh Flan Caramel',                       N'B\u00e1nh flan m\u1ecbn m\u00e0ng v\u1edbi l\u1edbp caramel \u0111\u1eafng nh\u1eb9', 30000, @c2, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', 4.4, 60, 350, NOW(), NOW()),
(@f11, N'Sinh T\u1ed1 B\u01a1',                          N'Sinh t\u1ed1 b\u01a1 b\u00e9o ng\u1eady, th\u00eam s\u1eefa \u0111\u1eb7c ng\u1ecdt ng\u00e0o', 40000, @c3, 'https://images.unsplash.com/photo-1638176067000-28ef0f22a6e1', 4.7, 130, 700, NOW(), NOW()),
(@f12, N'C\u00e0 Ph\u00ea S\u1eefa \u0110\u00e1',        N'C\u00e0 ph\u00ea phin truy\u1ec1n th\u1ed1ng Vi\u1ec7t Nam pha s\u1eefa \u0111\u1eb7c', 30000, @c3, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 4.8, 250, 1500, NOW(), NOW());

INSERT INTO branch_foods (id,branch_id,food_id,price,active) VALUES
(UUID(),@b1,@f1,250000,1),(UUID(),@b1,@f2,220000,1),(UUID(),@b1,@f3,65000,1),(UUID(),@b1,@f4,45000,1),
(UUID(),@b1,@f5,120000,1),(UUID(),@b1,@f6,95000,1),(UUID(),@b1,@f7,180000,1),(UUID(),@b1,@f8,135000,1),
(UUID(),@b1,@f9,35000,1),(UUID(),@b1,@f10,30000,1),(UUID(),@b1,@f11,40000,1),(UUID(),@b1,@f12,30000,1),
(UUID(),@b2,@f1,250000,1),(UUID(),@b2,@f4,45000,1),(UUID(),@b2,@f5,120000,1),(UUID(),@b2,@f7,180000,1),
(UUID(),@b2,@f8,135000,1),(UUID(),@b2,@f9,35000,1),(UUID(),@b2,@f11,40000,1),(UUID(),@b2,@f12,30000,1);
