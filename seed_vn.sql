SET NAMES utf8mb4;
SET @b1 = '5517b4ac-51d4-11f1-8260-088fc3077434';
SET @b2 = '5517ba1e-51d4-11f1-8260-088fc3077434';
SET @c1 = '55183d17-51d4-11f1-8260-088fc3077434';
SET @c2 = '551844f3-51d4-11f1-8260-088fc3077434';
SET @c3 = '55184c5c-51d4-11f1-8260-088fc3077434';
SET @f1=UUID();SET @f2=UUID();SET @f3=UUID();SET @f4=UUID();
SET @f5=UUID();SET @f6=UUID();SET @f7=UUID();SET @f8=UUID();
SET @f9=UUID();SET @f10=UUID();SET @f11=UUID();SET @f12=UUID();
INSERT INTO foods(id,name,description,price,category_id,thumb_url,avg_rating,rating_count,sold,created_at,updated_at) VALUES
(@f1,'Beefsteak Sốt Tiêu Đen','Thăn bò Mỹ hảo hạng nướng than hoa rưới xốt tiêu đen',250000,@c1,'https://images.unsplash.com/photo-1600891964092-4316c288032e',4.8,120,500,NOW(),NOW()),
(@f2,'Cá Hồi Áp Chảo','Cá hồi Na Uy áp chảo sốt bơ chanh béo ngậy',220000,@c1,'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',4.5,85,300,NOW(),NOW()),
(@f3,'Tiramisu Ý','Bánh Tiramisu mềm mịn thơm mùi cà phê và cacao',65000,@c2,'https://images.unsplash.com/photo-1571115177098-24ec42ed204d',4.9,200,1000,NOW(),NOW()),
(@f4,'Trà Đào Cam Sả','Thanh mát giải nhiệt mùa hè',45000,@c3,'https://images.unsplash.com/photo-1556679343-c7306c1976bc',4.6,150,800,NOW(),NOW()),
(@f5,'Mì Ý Sốt Bò Bằm','Spaghetti với sốt cà chua thịt bò bằm và phô mai Parmesan',120000,@c1,'https://images.unsplash.com/photo-1563379926898-05f4575a45d8',4.3,95,420,NOW(),NOW()),
(@f6,'Cơm Chiên Hải Sản','Cơm chiên với tôm mực sò điệp và rau thơm',95000,@c1,'https://images.unsplash.com/photo-1603133872878-684f208fb84b',4.4,110,650,NOW(),NOW()),
(@f7,'Sườn Nướng BBQ','Sườn heo nướng mật ong sốt BBQ ăn kèm khoai tây chiên',180000,@c1,'https://images.unsplash.com/photo-1544025162-d76694265947',4.7,88,380,NOW(),NOW()),
(@f8,'Gà Rán Giòn Tan','Gà rán kiểu Hàn Quốc giòn rụm kèm sốt cay ngọt',135000,@c1,'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58',4.6,200,900,NOW(),NOW()),
(@f9,'Chè Khúc Bạch','Chè khúc bạch thạch lựu nhãn vải thiều mát lạnh',35000,@c2,'https://images.unsplash.com/photo-1551024506-0bccd828d307',4.5,75,500,NOW(),NOW()),
(@f10,'Bánh Flan Caramel','Bánh flan mịn màng với lớp caramel đắng nhẹ',30000,@c2,'https://images.unsplash.com/photo-1624353365286-3f8d62daad51',4.4,60,350,NOW(),NOW()),
(@f11,'Sinh Tố Bơ','Sinh tố bơ béo ngậy thêm sữa đặc ngọt ngào',40000,@c3,'https://images.unsplash.com/photo-1638176067000-28ef0f22a6e1',4.7,130,700,NOW(),NOW()),
(@f12,'Cà Phê Sữa Đá','Cà phê phin truyền thống Việt Nam pha sữa đặc',30000,@c3,'https://images.unsplash.com/photo-1509042239860-f550ce710b93',4.8,250,1500,NOW(),NOW());
INSERT INTO branch_foods(id,branch_id,food_id,price,active) VALUES
(UUID(),@b1,@f1,250000,1),(UUID(),@b1,@f2,220000,1),(UUID(),@b1,@f3,65000,1),(UUID(),@b1,@f4,45000,1),
(UUID(),@b1,@f5,120000,1),(UUID(),@b1,@f6,95000,1),(UUID(),@b1,@f7,180000,1),(UUID(),@b1,@f8,135000,1),
(UUID(),@b1,@f9,35000,1),(UUID(),@b1,@f10,30000,1),(UUID(),@b1,@f11,40000,1),(UUID(),@b1,@f12,30000,1),
(UUID(),@b2,@f1,250000,1),(UUID(),@b2,@f4,45000,1),(UUID(),@b2,@f5,120000,1),(UUID(),@b2,@f7,180000,1),
(UUID(),@b2,@f8,135000,1),(UUID(),@b2,@f9,35000,1),(UUID(),@b2,@f11,40000,1),(UUID(),@b2,@f12,30000,1);
