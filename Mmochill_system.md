# Tổng quan Hệ thống MMOChill

**MMOChill** là một nền tảng Web3/MMO hiện đại, được thiết kế để kết nối người dùng với các nhiệm vụ kiếm tiền trực tuyến thông qua việc vượt link rút gọn (shortlinks). Hệ thống được xây dựng với kiến trúc tối ưu (Go Backend, Next.js Frontend), tích hợp bộ nhớ đệm Redis và các tính năng tương tác thời gian thực.

---

## 1. Mục đích và Phân loại Người dùng

### Mục đích cốt lõi
Cung cấp một giải pháp kiếm tiền thụ động đơn giản, minh bạch và có tính cộng đồng cao, đồng thời hỗ trợ các đối tác quảng cáo phân phối nội dung thông qua hệ thống nhiệm vụ.

### Vai trò (Roles)
*   **Người dùng (User):** Thực hiện nhiệm vụ, tham gia các hoạt động vòng quay/điểm danh, giới thiệu bạn bè và rút tiền.
*   **Quản trị viên (Admin):** Kiểm soát toàn bộ hệ thống, quản lý nhiệm vụ, duyệt thanh toán và tùy chỉnh giao diện/cấu hình.

---

## 2. Các Chức năng Chính

### Dành cho Người dùng
1.  **Hệ thống Nhiệm vụ (Tasks):** Vượt các link rút gọn từ các đối tác lớn (TapLayMa, NhapMa, Traffic68) để nhận VND.
2.  **Ví & Giao dịch (Wallet):** Quản lý số dư, lịch sử biến động số dư chi tiết.
3.  **Hệ thống Giới thiệu (Referral):** Nhận hoa hồng trọn đời (10%) từ hoa hồng các nhiệm vụ mà bạn bè cấp dưới hoàn thành.
4.  **Hoạt động Bonus:**
    *   **Điểm danh hàng ngày:** Tăng chuỗi để nhận thưởng lớn hơn.
    *   **Vòng quay may mắn:** Quay thưởng ngẫu nhiên hàng ngày.
5.  **Cộng đồng (Community):**
    *   Thư viện sách (Tài chính, MMO, Phát triển bản thân).
    *   Tin tức tổng hợp tự động từ các nguồn uy tín.
    *   *Lưu ý: Chức năng này ưu tiên cho thành viên VIP và Admin.*
6.  **Hỗ trợ (Support):** Gửi yêu cầu trợ giúp và chat trực tiếp với đội ngũ Admin.

### Dành cho Admin
1.  **Dashboard Thống kê:** Theo dõi số lượng User đang online, tổng tiền đã rút, tổng nhiệm vụ hoàn thành trong ngày.
2.  **Quản lý Người dùng:** Tìm kiếm, xem chi tiết lịch sử cá nhân, Ban/Unban tài khoản nghi vấn.
3.  **Quản lý Rút tiền:** Duyệt các yêu cầu rút tiền qua Bank, Momo hoặc Crypto.
4.  **Quản lý Nhiệm vụ:** Thêm/sửa/xóa các task, cấu hình mức thưởng và giới hạn IP.
5.  **Cấu hình Hệ thống:** Thay đổi toàn bộ màu sắc chủ đạo, âm thanh click/thông báo, và kích hoạt các sự kiện theo mùa (Lễ Tết, Halloween...).

---

## 3. Luồng Hoạt động Chi tiết (Flows)

### A. Luồng Vượt Link & Cộng Tiền
1.  **User khởi tạo:** Nhấn thực hiện Task -> Hệ thống kiểm tra Rate Limit IP (3 lượt/IP/ngày cho mỗi nhà cung cấp).
2.  **Tạo phiên (Claim):** Backend tạo một `Bypass Token` duy nhất và yêu cầu link rút gọn từ đối tác (TapLayMa, NhapMa, Traffic68).
3.  **Vượt link:** User hoàn thành các bước trên trang của đối tác.
4.  **Xác nhận (Callback):** Đối tác gửi tín hiệu về cổng `Callback` của MMOChill.
5.  **Cộng thưởng:**
    *   Cộng tiền thưởng trực tiếp vào ví User.
    *   **Hoa hồng giới thiệu:** Tự động trích 10% giá trị thưởng cộng cho người đã giới thiệu User này (Người giới thiệu nhận tiền ngay lập tức).
    *   Gửi thông báo thành công cho cả User và Người giới thiệu qua hệ thống Real-time.
6.  **Admin:** Nhận thông báo thời gian thực về việc User vừa hoàn thành nhiệm vụ thành công.

### B. Luồng Rút Tiền (Withdrawal)
1.  **Đặt lệnh:** User gửi yêu cầu rút tiền -> Hệ thống thực hiện lệnh `LockBalance` (Khóa số tiền tương ứng để tránh gian lận).
2.  **Thông báo Admin:** Hệ thống gửi cảnh báo "Yêu cầu rút tiền mới" cho Admin qua chuông thông báo và danh sách chờ.
3.  **Duyệt lệnh (Admin):**
    *   Admin kiểm tra tính hợp lệ của User (có gian lận không).
    *   Thực hiện chuyển tiền qua ngân hàng/ví điện tử.
    *   Nhấn **Phê duyệt** trên hệ thống -> Số tiền bị trừ vĩnh viễn khỏi ví User -> Gửi thông báo thành công.
    *   Nếu **Từ chối**: Số tiền bị khóa sẽ được hoàn trả lại ví User -> Gửi thông báo lý do từ chối.

### C. Cơ chế Thông báo Real-time
*   **User:** Nhận thông báo "Nổi" ngay lập tức khi được cộng tiền thưởng, hoa hồng, hoặc yêu cầu rút tiền được duyệt. Có âm thanh thông báo đi kèm.
*   **Admin:** Nhận thông báo về mọi hoạt động quan trọng của User (Đăng nhập, Claim Task, Rút tiền) để kịp thời hỗ trợ hoặc phát hiện bất thường.

---

## 4. Công nghệ Sử dụng
*   **Backend:** Golang (Gin Framework), PostgreSQL (Database), Redis (Caching & Pub/Sub).
*   **Frontend:** Next.js, Tailwind CSS (Vanilla CSS components), Framer Motion (Animations).
*   **Real-time:** Redis Pub/Sub kết hợp với Server-Sent Events (SSE).
*   **Bảo mật:** WebAuthn (Đăng nhập bằng vân tay/khuôn mặt), JWT Authentication, RBAC (Role-Based Access Control).
