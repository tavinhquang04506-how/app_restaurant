import { create } from 'zustand';

export type Language = 'vi' | 'en';

const dictionary = {
  vi: {
    // Bottom Tab
    tabHome: 'Trang chủ',
    tabMenu: 'Thực đơn',
    tabBooking: 'Đặt bàn',
    tabUser: 'Tài khoản',

    // Home
    welcome: 'Xin chào',
    dealsForYou: 'Khuyến mãi dành cho bạn',
    featuredDishes: 'Món nổi bật',
    branches: 'Chi nhánh',
    viewAll: 'Xem tất cả',
    code: 'Mã',
    bestSellerDesc: 'Đây là ký hiệu dành cho các món ăn bán chạy nhất tại nhà hàng (Best Seller).',
    promoDetail: 'Chi tiết Khuyến mãi',
    promoDescTitle: 'Mô tả chương trình',
    promoCodeTitle: 'Mã khuyến mãi',
    durationLabel: 'Thời gian',
    promoSaved: 'Đã lưu mã này',
    promoOutOfStock: 'Đã hết lượt nhận',
    savePromoBtn: 'Lưu mã khuyến mãi',
    branchDetail: 'Chi tiết Chi nhánh',
    branchIntro: 'Giới thiệu chi nhánh',
    contactInfo: 'Thông tin liên hệ',
    addressLabel: 'Địa chỉ',
    hotlineLabel: 'Số điện thoại hotline',
    callHotlineBtn: 'Gọi hotline',
    getDirectionsBtn: 'Chỉ đường',
    bookTableNowBtn: 'Đặt bàn ngay',
    errorTitle: 'Lỗi',
    callError: 'Không thể thực hiện cuộc gọi vào lúc này.',
    mapError: 'Không thể mở bản đồ chỉ đường.',

    // Food Menu
    searchDishes: 'Tìm kiếm món ăn...',
    all: 'Tất cả',
    mainDish: 'Món chính',
    dessert: 'Tráng miệng',
    drink: 'Đồ uống',
    orderingForTable: 'Đang chọn món cho bàn: ',
    bestSellerTitle: 'Món Ăn Bán Chạy',

    // Food Detail Modal
    description: 'Mô tả',
    reviews: 'Đánh giá',
    averageRatingText: 'Đánh giá trung bình từ',
    reviewsCountText: 'lượt trải nghiệm',
    ingredientsTitle: 'Nguyên liệu chính:',
    tasteTitle: 'Hương vị & Trải nghiệm:',
    addToCart: 'Thêm vào giỏ hàng',
    selected: 'Đã chọn',
    preOrderCart: 'Giỏ hàng pre-order',

    // Booking Stepper
    bookingHistory: 'Lịch sử đặt bàn',
    bookNow: 'Đặt bàn ngay',
    selectBranch: 'Chọn chi nhánh',
    numGuests: 'Số lượng khách',
    bookingDate: 'Ngày đặt',
    bookingTime: 'Giờ đặt',
    next: 'Tiếp tục',
    selectTable: 'Chọn bàn',
    confirm: 'Xác nhận đặt bàn',
    fullName: 'Họ tên',
    phoneNumber: 'Số điện thoại',
    notes: 'Ghi chú',
    selectedDishes: 'Món ăn đã chọn',
    addDishesBtn: 'Thêm món ăn',
    completeBooking: 'Hoàn tất đặt bàn',
    status: 'Trạng thái',
    table: 'Bàn',
    branch: 'Chi nhánh',
    noActiveBooking: 'Bạn chưa có tiến trình đặt bàn nào.',
    maxGuestsLimit: 'Tối đa 8 người',
    back: 'Quay lại',
    activeBookingBanner: 'Tiến trình đặt bàn dở dang:',

    // User Profile
    personalInfo: 'Thông tin cá nhân',
    favorites: 'Yêu thích',
    myReviews: 'Đánh giá của tôi',
    notifications: 'Hộp thư thông báo',
    liveHelp: 'Trợ lý hỗ trợ 3Ship',
    settings: 'Cài đặt hệ thống',
    logOut: 'Đăng xuất',

    // Settings
    changeLanguage: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    pushNotifications: 'Thông báo đẩy',
    darkMode: 'Chế độ tối',

    // Live Help Chat
    liveSupport: 'Hỗ trợ trực tuyến',
    startNewChat: 'Bắt đầu cuộc trò chuyện mới',
    endChat: 'Kết thúc cuộc trò chuyện',
    botWelcome: 'Xin chào quý khách! Tôi là trợ lý ảo 3Ship. Quý khách cần hỗ trợ thông tin gì ạ?',
    optionBookingGuide: 'Hướng dẫn đặt bàn',
    optionCancelPolicy: 'Chính sách hủy bàn',
    optionCurrentDeals: 'Ưu đãi hiện tại',
    optionContactAgent: 'Gặp tổng đài viên',
    connectingAgent: 'Đang kết nối tổng đài viên...',
    agentConnected: 'Tổng đài viên Nguyễn Tuấn Anh đã kết nối.',
    agentGreeting: 'Xin chào, tôi là Nguyễn Tuấn Anh. Tôi có thể giúp gì cho quý khách?',
    chatEndedStatus: 'Đoạn chat đã kết thúc. Bạn có thể xem lại lịch sử trò chuyện trong 10 phút.',
    chatPlaceholder: 'Nhập tin nhắn của bạn...',

    // Notifications
    markAllRead: 'Đánh dấu đã xem tất cả',
    notificationDetail: 'Chi tiết thông báo',
    close: 'Đóng',
    noNotifications: 'Không có thông báo nào.',

    // Common
    cancel: 'Hủy',
    save: 'Lưu',
    invalidBookingInfo: 'Thông tin đặt bàn không hợp lệ',
    bookingInfo: 'Thông tin đặt bàn',
    guestsCountSuffix: 'người',
    totalLabel: 'Tổng cộng',
    noPreOrderText: 'Chưa chọn món đặt trước',
    noPreOrderDesc: 'Đặt trước món ăn giúp nhà hàng chuẩn bị chu đáo và phục vụ nhanh chóng hơn!',
    confirmBookingSuccess: 'Đặt bàn thành công! Chúng tôi sẽ xác nhận sớm nhất.',
    successTitle: 'Thành công',
    preOrderTip: 'Bạn có thể đặt trước món ăn bằng cách thêm vào giỏ hàng trước khi xác nhận.',
    confirmBookingBtn: 'Xác nhận đặt bàn',
    guests: 'khách',
    seats: 'chỗ',
    booked: 'Đã đặt',
    available: 'Trống',
    checkingTables: 'Đang kiểm tra bàn trống...',
    noEmptyTables: 'Không có bàn {capacity} chỗ nào trống',
    tryAnotherTime: 'Hãy thử chọn ngày/giờ hoặc chi nhánh khác',
    confirmSelectedTable: 'Xác nhận bàn đã chọn',
    loginRequired: 'Yêu cầu đăng nhập',
    loginRequiredCartDesc: 'Vui lòng đăng nhập để thêm món ăn vào giỏ hàng và sử dụng đầy đủ dịch vụ.',
    loginRequiredFavDesc: 'Vui lòng đăng nhập để thêm món ăn vào danh sách yêu thích.',
    addedToCartSuccess: 'Đã thêm món "{name}" vào giỏ hàng!',
    noDishesFound: 'Không tìm thấy món ăn nào',
    alertTitle: 'Thông báo',
    failedFavUpdate: 'Không thể cập nhật danh sách yêu thích.',

    // Saved Promotions
    savedPromotions: 'Ưu đãi đã lưu',
    noSavedPromos: 'Bạn chưa lưu mã ưu đãi nào',
    removePromo: 'Xóa',
    promoExpired: 'Đã hết hạn',
    promoValid: 'Còn hiệu lực',
    validUntil: 'Có hiệu lực đến',
    discount: 'Giảm giá',
  },
  en: {
    // Bottom Tab
    tabHome: 'Home',
    tabMenu: 'Menu',
    tabBooking: 'Booking',
    tabUser: 'Account',

    // Home
    welcome: 'Welcome',
    dealsForYou: 'Deals For You',
    featuredDishes: 'Featured Dishes',
    branches: 'Branches',
    viewAll: 'View All',
    code: 'Code',
    bestSellerDesc: 'This is the indicator for the best-selling dishes at our restaurant (Best Seller).',
    promoDetail: 'Promotion Details',
    promoDescTitle: 'Program Description',
    promoCodeTitle: 'Promotion Code',
    durationLabel: 'Duration',
    promoSaved: 'Saved this code',
    promoOutOfStock: 'Out of stock',
    savePromoBtn: 'Save Promo Code',
    branchDetail: 'Branch Details',
    branchIntro: 'Branch Introduction',
    contactInfo: 'Contact Information',
    addressLabel: 'Address',
    hotlineLabel: 'Hotline number',
    callHotlineBtn: 'Call Hotline',
    getDirectionsBtn: 'Get Directions',
    bookTableNowBtn: 'Book Table Now',
    errorTitle: 'Error',
    callError: 'Unable to make the call at this time.',
    mapError: 'Unable to open navigation map.',

    // Food Menu
    searchDishes: 'Search dishes...',
    all: 'All',
    mainDish: 'Mains',
    dessert: 'Desserts',
    drink: 'Drinks',
    orderingForTable: 'Ordering for table: ',
    bestSellerTitle: 'Best Selling Dish',

    // Food Detail Modal
    description: 'Description',
    reviews: 'Reviews',
    averageRatingText: 'Average rating from',
    reviewsCountText: 'reviews',
    ingredientsTitle: 'Main Ingredients:',
    tasteTitle: 'Taste & Texture:',
    addToCart: 'Add to Cart',
    selected: 'Selected',
    preOrderCart: 'Pre-order list',

    // Booking Stepper
    bookingHistory: 'Booking History',
    bookNow: 'Book Table Now',
    selectBranch: 'Select Branch',
    numGuests: 'Number of Guests',
    bookingDate: 'Booking Date',
    bookingTime: 'Booking Time',
    next: 'Continue',
    selectTable: 'Select Table',
    confirm: 'Confirm Booking',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    notes: 'Notes',
    selectedDishes: 'Selected Dishes',
    addDishesBtn: 'Add Dishes',
    completeBooking: 'Complete Booking',
    status: 'Status',
    table: 'Table',
    branch: 'Branch',
    noActiveBooking: 'You have no active bookings.',
    maxGuestsLimit: 'Maximum 8 guests',
    back: 'Back',
    activeBookingBanner: 'Current Booking Progress:',

    // User Profile
    personalInfo: 'Personal Info',
    favorites: 'Favorites',
    myReviews: 'My Reviews',
    notifications: 'Notifications',
    liveHelp: '3Ship Live Help',
    settings: 'System Settings',
    logOut: 'Log Out',

    // Settings
    changeLanguage: 'Language',
    vietnamese: 'Vietnamese',
    english: 'English',
    pushNotifications: 'Push Notifications',
    darkMode: 'Dark Mode',

    // Live Help Chat
    liveSupport: 'Live Support',
    startNewChat: 'Start New Chat',
    endChat: 'End Chat',
    botWelcome: 'Hello! I am the 3Ship Virtual Assistant. How can I help you today?',
    optionBookingGuide: 'Booking Guide',
    optionCancelPolicy: 'Cancellation Policy',
    optionCurrentDeals: 'Current Deals',
    optionContactAgent: 'Speak with Agent',
    connectingAgent: 'Connecting to customer agent...',
    agentConnected: 'Support Agent Nguyen Tuan Anh has connected.',
    agentGreeting: 'Hello, this is Nguyen Tuan Anh. How may I assist you today?',
    chatEndedStatus: 'Chat session ended. You can review history for 10 minutes.',
    chatPlaceholder: 'Type a message...',

    // Notifications
    markAllRead: 'Mark all as read',
    notificationDetail: 'Notification Detail',
    close: 'Close',
    noNotifications: 'No notifications available.',

    // Common
    cancel: 'Cancel',
    save: 'Save',
    invalidBookingInfo: 'Invalid booking information',
    bookingInfo: 'Booking Information',
    guestsCountSuffix: 'people',
    totalLabel: 'Total',
    noPreOrderText: 'No pre-ordered dishes yet',
    noPreOrderDesc: 'Pre-ordering dishes helps the restaurant prepare and serve you faster!',
    confirmBookingSuccess: 'Booking successful! We will confirm it as soon as possible.',
    successTitle: 'Success',
    preOrderTip: 'You can pre-order dishes by adding them to the cart before confirming.',
    confirmBookingBtn: 'Confirm Booking',
    guests: 'guests',
    seats: 'seats',
    booked: 'Booked',
    available: 'Available',
    checkingTables: 'Checking available tables...',
    noEmptyTables: 'No empty tables with {capacity} seats available',
    tryAnotherTime: 'Please try another date/time or branch',
    confirmSelectedTable: 'Confirm Selected Table',
    loginRequired: 'Login Required',
    loginRequiredCartDesc: 'Please log in to add items to cart and use full services.',
    loginRequiredFavDesc: 'Please log in to add items to your favorites.',
    addedToCartSuccess: 'Added "{name}" to cart successfully!',
    noDishesFound: 'No dishes found',
    alertTitle: 'Notification',
    failedFavUpdate: 'Failed to update favorites.',

    // Saved Promotions
    savedPromotions: 'Saved Promotions',
    noSavedPromos: 'No saved promotions yet',
    removePromo: 'Remove',
    promoExpired: 'Expired',
    promoValid: 'Valid',
    validUntil: 'Valid until',
    discount: 'Discount',
  },
};

interface LanguageState {
  language: Language;
  t: (key: keyof typeof dictionary['vi']) => string;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi',
  t: (key) => {
    const lang = get().language;
    return dictionary[lang][key] || dictionary['vi'][key] || String(key);
  },
  setLanguage: (lang) => set({ language: lang }),
}));

export const dbTranslations: Record<string, string> = {
  // Food Names
  'Vịt Quay Bắc Kinh': 'Peking Duck',
  'Đậu Hũ Ma Bà': 'Mapo Tofu',
  'Thịt Kho Đông Pha': 'Dongpo Pork',
  'Sủi Cảo Tôm Thịt': 'Pork & Shrimp Dumplings',
  'Mì Vịt Tiềm': 'Braised Duck Noodle Soup',
  'Cơm Chiên Dương Châu': 'Yangzhou Fried Rice',
  'Lẩu Tứ Xuyên': 'Sichuan Hotpot',
  'Há Cảo Triều Châu': 'Chaozhou Dumplings',
  'Bánh Tart Trứng Hồng Kông': 'Hong Kong Egg Tart',
  'Chè Trôi Nước Mè Đen': 'Black Sesame Glutinous Rice Balls',
  'Bánh Bao Kim Sa': 'Golden Custard Bun',
  'Thạch Quy Linh Cao': 'Guilinggao Jelly',
  'Trà Thảo Mộc Vương Lão Cát': 'Wong Lo Kat Herbal Tea',
  'Coca-Cola': 'Coca-Cola',
  'Pepsi': 'Pepsi',
  'Nước Lọc Aquafina': 'Aquafina Mineral Water',
  'Trà Hoa Cúc Mật Ong': 'Chrysanthemum Honey Tea',

  // New Main Dishes
  'Phật Nhảy Tường': 'Buddha Jumps Over the Wall',
  'Nhất Phẩm Tay Cầm': 'Premium Abalone Claypot',
  'Heo Sữa Quay': 'Roasted Suckling Pig',
  'Xá Xíu Mật Ong': 'Honey Char Siu Pork',
  'Gà Hấp Muối': 'Salt-Baked Chicken',
  'Bồ Câu Hồng Xíu': 'Braised Pigeon',
  'Thịt Heo Quay Da Giòn': 'Crispy Roasted Pork Belly',
  'Phá Lấu Kiểu Triều Châu': 'Chaozhou Braised Platter',
  'Tôm Hùm Hấp Tỏi': 'Garlic Steamed Lobster',
  'Tôm Càng Rang Muối Ớt': 'Salt & Pepper River Prawns',
  'Cơm Chiên Hải Sản': 'Seafood Fried Rice',
  'Mì Xào Hải Sản': 'Seafood Stir-Fried Noodles',
  'Hủ Tíu Xào Bò Khô': 'Dry Stir-Fried Beef Ho Fun',
  'Cơm Chiên Bò': 'Beef Fried Rice',
  'Đậu Hũ Tứ Xuyên Chay': 'Vegetarian Sichuan Mapo Tofu',
  'Gỏi Nấm Mèo Chua Cay': 'Spicy Wood Ear Mushroom Salad',
  'Khoai Tây Sợi Chua Cay': 'Sichuan Shredded Potato',

  // New Desserts
  'Chè Hạnh Nhân': 'Almond Cream Dessert',
  'Bánh Bò Nướng': 'Steamed Honeycomb Cake',
  'Xoài Sago Dừa': 'Mango Pomelo Sago',
  'Chè Đậu Đỏ Trần Bì': 'Red Bean Soup with Orange Peel',
  'Thạch Hoa Cúc Kỷ Tử': 'Chrysanthemum Jelly with Goji',
  'Rau Câu Dừa Lá Dứa': 'Pandan Coconut Jelly',
  'Bánh Mochi Đậu Đỏ': 'Red Bean Mochi',
  'Trái Cây Thượng Hạng': 'Premium Seasonal Fruit Platter',
  'Kem Matcha Đậu Đỏ': 'Matcha Red Bean Ice Cream',
  'Chè Khúc Bạch': 'Panna Cotta Vietnamese Style',
  'Bánh Flan Caramel': 'Caramel Crème Custard',

  // New Drinks
  'Nước Ép Cam Tươi': 'Fresh Orange Juice',
  'Nước Ép Dưa Hấu': 'Watermelon Juice',
  'Nước Ép Táo': 'Apple Juice',
  'Sinh Tố Xoài': 'Mango Smoothie',
  'Sinh Tố Bơ': 'Avocado Smoothie',
  'Trà Đào Cam Sả': 'Peach Lemongrass Tea',
  'Sữa Đậu Nành': 'Soya Bean Milk',
  'Bia Tiger': 'Tiger Beer',
  'Bia Heineken': 'Heineken Beer',
  'Bia Sài Gòn': 'Saigon Beer',
  'Rượu Vang Đỏ (Ly)': 'Red Wine (Glass)',
  'Rượu Vang Trắng (Ly)': 'White Wine (Glass)',
  'Champagne (Ly)': 'Champagne (Glass)',
  'Chivas 18 (Ly)': 'Chivas 18 (Glass)',
  'Sprite': 'Sprite',
  'Nước Chanh Mật Ong': 'Honey Lemon Water',
  'Trà Phổ Nhĩ': 'Pu-erh Tea',

  // Categories
  'Món chính': 'Mains',
  'Tráng miệng': 'Desserts',
  'Đồ uống': 'Drinks',

  // Branch Names & Addresses
  'Nhà hàng 3Ship - Quận 1': '3Ship Restaurant - District 1',
  'Nhà hàng 3Ship - Quận 3': '3Ship Restaurant - District 3',
  '123 Lê Lợi, Quận 1, TP.HCM': '123 Le Loi St, District 1, HCMC',
  '456 Võ Văn Tần, Quận 3, TP.HCM': '456 Vo Van Tan St, District 3, HCMC',

  // Promotions
  'Khai trương chi nhánh mới': 'Grand Opening Promotion',
  'Giảm 20% cho tất cả các món ăn trong tuần lễ khai trương': '20% off all dishes during grand opening week',
  'Ưu đãi mùa hè rực rỡ': 'Splendid Summer Offer',
  'Giảm 15% cho mọi hóa đơn đặt trước từ 500.000đ trở lên': '15% off for all pre-orders from 500,000 VND',
  'Happy Hour buổi xế': 'Afternoon Happy Hour',
  'Giảm 10% cho thực đơn đồ uống áp dụng từ 14h00 đến 17h00 hàng ngày': '10% off drinks applied daily from 2:00 PM to 5:00 PM',
};

export function translateDbText(text: string | null | undefined, currentLanguage?: Language): string {
  if (!text) return '';
  const lang = currentLanguage || useLanguageStore.getState().language;
  if (lang === 'vi') return text;
  return dbTranslations[text] || text;
}
