SET NAMES utf8mb4;
DELETE FROM promotions;
DELETE FROM notifications WHERE scope='GLOBAL';
INSERT INTO promotions(id,name,code,description,discount_percent,quantity,used,active,start_date,end_date,image_url,created_at,updated_at) VALUES
(UUID(),'Khai trương chi nhánh mới','WELCOME20','Giảm 20% cho tất cả các món trong tuần khai trương',20,100,12,1,'2026-05-01','2026-06-30','https://images.unsplash.com/photo-1555396273-367ea4eb4db5',NOW(),NOW()),
(UUID(),'Ưu đãi mùa hè','SUMMER15','Giảm 15% cho đơn từ 500.000đ trỞ lên',15,200,45,1,'2026-05-15','2026-08-31','https://images.unsplash.com/photo-1414235077428-338989a2e8c0',NOW(),NOW()),
(UUID(),'Happy Hour','HAPPY10','Giảm 10% đồ uống từ 14h-17h',10,500,80,1,'2026-05-01','2026-12-31','https://images.unsplash.com/photo-1551024709-8f23befc6f87',NOW(),NOW());
INSERT INTO notifications(id,title,message,type,scope,is_read,image,created_at) VALUES
(UUID(),'Chào mừng bạn đến GiaBuh!','Cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá thực đơn phong phú của chúng tôi!','PROMOTION','GLOBAL',0,'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',NOW()),
(UUID(),'Khuyến mãi mùa hè 2026','Giảm 15% cho tất cả đơn hàng từ 500.000đ. Sử dụng mã SUMMER15 ngay hôm nay!','PROMOTION','GLOBAL',0,'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',NOW()),
(UUID(),'Chi nhánh mới tại Quận 3','Nhà hàng GiaBuh chính thức khai trương chi nhánh Quận 3. Giảm 20% trong tuần đầu!','PROMOTION','GLOBAL',0,'https://images.unsplash.com/photo-1552566626-52f8b828add9',NOW());
