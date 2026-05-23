# Restaurant App - Hệ Thống Quản Lý & Đặt Bàn Nhà Hàng 3Ship

Dự án bao gồm 3 phân hệ chính được cấu trúc phân quyền (RBAC) toàn diện:
1. **Spring Boot Backend** (`backend_restaurant`): API Service phục vụ cho cả Mobile App và Web Dashboard.
2. **Mobile App (React Native - Expo)** (`mobile_restaurant`): Ứng dụng dành riêng cho **Khách hàng** đặt bàn, gọi món và trò chuyện với trợ lý hỗ trợ. Hệ thống chặn hoàn toàn các tài khoản nội bộ (Admin/Manager/Staff) đăng nhập trên app.
3. **Web Dashboard (Vite - React)** (`fontend_restaurant`): Trang quản trị dành riêng cho **Admin**, **Manager (Quản lý)** và **Staff (Nhân viên)**. Hệ thống chặn tài khoản Khách hàng đăng nhập trên Web.

---

## 🔑 Thông Tin Tài Khoản Thử Nghiệm (Test Accounts)

Dưới đây là danh sách các tài khoản thử nghiệm đã được cài đặt sẵn trong cơ sở dữ liệu (`init_mysql.sql`) để phục vụ việc kiểm thử các tính năng phân quyền:

| Vai trò (Role) | Email Đăng Nhập | Số Điện Thoại | Mật Khẩu (Plaintext) | Phân Hệ Được Phép Đăng Nhập | Mô Tả Quyền Hạn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@gmail.com` | `0999888777` | **`123456`** | Web Dashboard | Toàn quyền quản trị tất cả 4 chi nhánh, cấu hình thực đơn gốc, phân quyền tài khoản. |
| **Quản lý CN1 (MANAGER)** | `manager@gmail.com` | `0999555444` | **`123456`** | Web Dashboard | Quản lý độc quyền **Chi nhánh 1 (Quận 1)** (Doanh thu, Bàn ăn, Thực đơn chi nhánh, Tạo tài khoản **STAFF** cho chi nhánh). |
| **Quản lý CN2 (MANAGER)** | `manager2@gmail.com`| `0999444333` | **`123456`** | Web Dashboard | Quản lý độc quyền **Chi nhánh 2 (Quận 3)**. |
| **Nhân viên CN1 (STAFF)** | `staff@gmail.com`   | `0999666555` | **`123456`** | Web Dashboard | Thao tác quản lý sơ đồ bàn và danh sách đặt bàn tại **Chi nhánh 1**. |
| **Nhân viên CN2 (STAFF)** | `staff2@gmail.com`  | `0999333222` | **`123456`** | Web Dashboard | Thao tác quản lý sơ đồ bàn và danh sách đặt bàn tại **Chi nhánh 2**. |
| **Khách hàng (CUSTOMER)** | `test@gmail.com`    | `0987654321` | **`123456`** | Mobile App | Đăng nhập app di động, xem món, đặt bàn, chat với chatbot thông minh hỗ trợ 3ship. |

> [!NOTE]  
> - **4 Chi Nhánh Hệ Thống:** Chi nhánh 1 (Quận 1), Chi nhánh 2 (Quận 3), Chi nhánh 3 (Bình Thạnh), Chi nhánh 4 (Gò Vấp).
> - Tất cả mật khẩu plaintext ở trên đều tương ứng với mã băm BCrypt đã được thiết lập sẵn trong cơ sở dữ liệu và tự động đồng bộ khi backend khởi chạy.

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh & Lệnh Khởi Động Chi Tiết

Để khởi chạy toàn bộ hệ thống trên máy tính của bạn, vui lòng mở các cửa sổ Terminal (PowerShell hoặc Command Prompt) riêng biệt và chạy các lệnh tương ứng dưới đây:

### 0. Khởi tạo Cơ sở dữ liệu (MySQL)
* **Yêu cầu**: Đảm bảo dịch vụ MySQL Server đang hoạt động trên máy tính của bạn (Cổng `3006` mặc định, tài khoản `root`, mật khẩu `123456` hoặc tùy chỉnh trong tệp `application.yaml`).
* **Các bước thực hiện**:
  1. Tạo một cơ sở dữ liệu trống tên là `restaurant`:
     ```sql
     CREATE DATABASE IF NOT EXISTS restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```
  2. Mở công cụ quản trị CSDL của bạn (MySQL Workbench, DBeaver, Navicat, v.v.) và thực thi toàn bộ nội dung tệp [init_mysql.sql](file:///c:/Users/tavin/Downloads/app_restaurant/init_mysql.sql).
  3. Tệp SQL này sẽ tự động khởi tạo cấu trúc bảng hoàn chỉnh và nạp toàn bộ dữ liệu mẫu cao cấp bao gồm: Thực đơn chi tiết, các chương trình Khuyến mại, Tài khoản kiểm thử và **sơ đồ dải 120 bàn ăn (bao gồm cả bàn VIP & bàn thường từ 2, 4, 6, đến 8 người được thiết kế ngẫu nhiên logic cho cả 4 chi nhánh)**.

### 1. Khởi chạy Spring Boot Backend (API Server)
* **Thư mục làm việc**: `backend_restaurant`
* **Lệnh cài đặt**: Gradle sẽ tự động tải các dependencies cần thiết khi khởi chạy lần đầu.
* **Lệnh khởi chạy**:
  * **Trên Windows**:
    ```powershell
    .\gradlew.bat bootRun
    ```
  * **Trên macOS / Linux**:
    ```bash
    ./gradlew bootRun
    ```
* **Cổng mặc định (Port)**: `8080` (API URL: `http://localhost:8080/api/v1`)
* *💡 Mẹo: Hệ thống backend sẽ tự động đồng bộ tất cả mật khẩu của tài khoản test về `123456` và tự động tạo mới tài khoản Manager nếu cơ sở dữ liệu trống khi khởi chạy!*

### 2. Khởi chạy Web Dashboard (Trang Quản Trị)
* **Thư mục làm việc**: `fontend_restaurant`
* **Lệnh cài đặt dependencies** (chỉ cần chạy 1 lần đầu tiên):
  ```bash
  npm install
  ```
* **Lệnh khởi chạy**:
  ```bash
  npm run dev
  ```
* **Cổng mặc định (Port)**: `3000` (Truy cập trực tiếp: [http://localhost:3000](http://localhost:3000))

### 3. Khởi chạy Ứng dụng di động (Mobile App - Expo)
* **Thư mục làm việc**: `mobile_restaurant`
* **Lệnh cài đặt dependencies** (chỉ cần chạy 1 lần đầu tiên):
  ```bash
  npm install
  ```
* **Lệnh khởi chạy**:
  ```bash
  npx expo start
  ```
  *Hoặc:*
  ```bash
  npm run dev
  ```
* **Cổng mặc định (Port)**: `8081` (Dùng ứng dụng Expo Go trên điện thoại quét mã QR hiển thị trên màn hình terminal để kết nối và chạy app).
