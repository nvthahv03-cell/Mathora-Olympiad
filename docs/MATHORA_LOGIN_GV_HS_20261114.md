# MATHORA OLYMPIAD — BÀN GIAO ĐĂNG NHẬP GIÁO VIÊN / HỌC SINH

Ngày 14/11/2026. Kiến trúc: **GitHub Pages → Apps Script V2.3 → Google Sheets**. Không Cloudflare, không Google OAuth.

## Giao diện đã cập nhật

Tệp `index.html` trên nhánh `main` có hộp đăng nhập bắt buộc khi mở trang:
- Chọn **Giáo viên / Quản trị** hoặc **Học sinh**.
- Nhập **Tên đăng nhập** và **Mật khẩu**, có nút Hiện/Ẩn.
- `POST` `{"action":"login","username":"...","password":"...","role":"teacher|student"}` tới Web App Apps Script, dùng `Content-Type: text/plain;charset=UTF-8` theo mẫu EDOS.
- Apps Script trả `sessionToken`, `authenticatedRole`, `displayName`; frontend chỉ giữ token **trong bộ nhớ tab**, không lưu mật khẩu/token trong localStorage hay trên GitHub.
- Các nghiệp vụ `generateProblem/saveToKho/listPending/getPending/attestPending/approveProblem/listExamEligible` dùng `sessionToken` gửi về Apps Script và được kiểm tra phân quyền ở Backend.
- Nút Đăng xuất hủy phiên cả phía frontend và Apps Script. Trang chủ học sinh được giới hạn quyền bởi Backend; phần nhiệm vụ mẫu V0.6 hiện chỉ lưu cục bộ, **chưa phải dữ liệu học sinh thật trên Sheets**.

## Cần thực hiện một lần trên Apps Script

### 1. Thay tệp `MATHORA.gs` bằng bản đã tích hợp

**Sao lưu tệp hiện tại trước.** Mở:
`backend/MATHORA_V23_ACCOUNTS_READY.gs`

Đường dẫn:
https://github.com/nvthahv03-cell/Mathora-Olympiad/blob/main/backend/MATHORA_V23_ACCOUNTS_READY.gs

Dán **toàn bộ nội dung tệp mới thay thế nội dung tệp `MATHORA.gs` cũ trong dự án đang dùng**; không tạo thêm `doPost` hoặc `doGet` trùng tên. Không sửa/xóa các tệp Apps Script nghiệp vụ khác (Sáng tạo PRO, thống kê Kho, khởi tạo kho, kiểm định đa thức).

Bản mới giữ lại:
- Gemini V2.3
- `MATHORA_STAGING`, `MATHORA_PROBLEMS`, `MATHORA_AUDIT`
- Gating `DRAFT_REVIEWED` → `APPROVED`
- Các khóa Backend cũ (vẫn có thể dùng cho ứng dụng server-to-server đã kết nối).

Bổ sung:
- `login`, `logout`
- HMAC mật khẩu với salt riêng từng tài khoản và pepper riêng trong Script Properties
- CacheService session TTL 6 giờ
- Chặn login sai liên tiếp: 5 lần / 15 phút trên mỗi tài khoản
- Kiểm tra lại trạng thái/role trong Sheet mỗi khi dùng session
- Không cho học sinh tạo bài, ghi STAGING, thẩm định hoặc duyệt.

### 2. Thiết lập hai mật khẩu khởi tạo trong Script Properties

Tại Apps Script → **Cài đặt dự án → Thuộc tính tập lệnh (Script Properties)**, nhập:
- `MATHORA_BOOTSTRAP_ADMIN_PASSWORD` = mật khẩu admin thử nghiệm do thầy đã chốt trong cuộc trò chuyện.
- `MATHORA_BOOTSTRAP_STUDENT_PASSWORD` = mật khẩu tài khoản học sinh `mathora` do thầy đã chốt.

Không đưa mật khẩu vào mã nguồn hay ảnh chụp màn hình; đừng gửi mật khẩu/khóa vào GitHub. Đây là mật khẩu ngắn chỉ phù hợp **thử nghiệm nội bộ**, phải đổi sang mật khẩu mạnh trước khi cung cấp cho nhiều người.

Giữ nguyên `MATHORA_DB_ID` trỏ đến Google Spreadsheet hiện hành. **Không phải tạo Spreadsheet khác**: hàm khởi tạo sẽ tạo thêm tab `MATHORA_USERS` và tab `MATHORA_ACCOUNT_AUDIT` trong Spreadsheet này, nếu chưa có. Nếu thầy muốn một Spreadsheet riêng cho người dùng, cần điều chỉnh thêm sau; chưa cần bây giờ.

### 3. Khởi tạo hai tài khoản

Trong trình biên tập Apps Script, chọn hàm:

`maAccountsInitializeFromProperties`

Nhấn **Chạy**, chấp thuận quyền Apps Script nếu được yêu cầu. Hàm tạo tài khoản:
- `admin` — role `admin` (đăng nhập bằng lựa chọn **Giáo viên / Quản trị**).
- `mathora` — role `student` (đăng nhập bằng lựa chọn **Học sinh**).

**Mật khẩu không lưu dạng rõ trong Sheet.** Tab `MATHORA_USERS` chỉ có `PasswordHmac`, `Salt`, trạng thái và thông tin người dùng. Sau khi tạo, hàm **tự xóa** hai mật khẩu khởi tạo khỏi Script Properties. Nếu người dùng đã tồn tại, hàm **không ghi đè** mật khẩu.

### 4. Triển khai lại Web App

Apps Script → **Triển khai → Quản lý bản triển khai → Chỉnh sửa → Phiên bản mới → Triển khai**. Dùng URL `/exec` hiện có khi vẫn dùng deployment ID cũ. Quyền truy cập Web App cần phù hợp người sử dụng, chỉ thử với dữ liệu nội bộ và xác minh chế độ cho người ngoài truy cập trước khi mở cho HS.

### 5. Kiểm thử thật

1. Mở `https://nvthahv03-cell.github.io/Mathora-Olympiad/`: màn hình đăng nhập bắt buộc xuất hiện.
2. Chọn giáo viên, đăng nhập `admin` và mật khẩu thầy đã chốt: vào được giao diện quản trị.
3. Đăng xuất, chọn học sinh, đăng nhập `mathora`: vào giao diện học sinh.
4. Cố tình chọn sai vai trò, sai mật khẩu: Backend phải từ chối.
5. Từ học sinh, thử gọi `generateProblem` hoặc `approveProblem`: Backend phải từ chối.
6. Đăng xuất: token cũ phải hết hiệu lực.
7. Chỉ sau đó kiểm thử Gemini → STAGING → thẩm định → Kho với dữ liệu TEST, đối chiếu mã hồ sơ và nhật ký.

## Trạng thái nghiệm thu

- PASS cú pháp tệp nguồn JavaScript/GAS đã kiểm tra trước commit.
- **CHƯA PASS** đăng nhập thật, Google Sheets thật, kiểm thử UI desktop/mobile thực tế và tính tương thích với Apps Script deployment, vì bản mới chưa được Deploy vào dự án của thầy.
- Không kết luận `admin` hay `mathora` đã được tạo thành công trước khi chạy `maAccountsInitializeFromProperties()`.
