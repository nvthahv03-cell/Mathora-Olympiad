# MATHORA OLYMPIAD — Bản index thống nhất theo mẫu EDOS

Ngày 14/11/2026. **Không Cloudflare, không OAuth Client ID, không thay Backend V2.3.**

## Đã commit

- `index.html` tự chứa cấu hình API và bộ điều khiển MATHORA. Giao diện MATHORA chính thức từ `index(20261112-082813).html` và toàn bộ các phân hệ gốc được giữ lại.
- Các panel AI cũ V0.6 được ẩn khi panel mới mở, tránh hai nút AI với cơ chế trái ngược cùng xuất hiện.
- `fetch` gọi trực tiếp Web App Apps Script đã Deploy, body JSON, Content-Type `text/plain;charset=UTF-8` theo mẫu EDOS. Không dùng Cloudflare.
- Kiểm tra `GET ?action=health` và login thử một lệnh **chỉ đọc** `listPending` sau khi người quản trị tự nhập teacher/owner key; nhận vai trò từ `doPost` đã xác thực.
- Mã được giữ trong **biến JavaScript của tab đang mở**, không đi vào mã GitHub, URL, localStorage hoặc sessionStorage. Tải lại/đóng tab mất phiên.
- 10 actions của V2.3 tiếp tục gọi đúng tên; Backend vẫn kiểm định hash, version, trùng, chứng cứ người thẩm định.

## Giới hạn an toàn

**Đây là chế độ thử nghiệm giới hạn cho người có quyền truy cập khóa teacher/owner**, KHÔNG phải đăng nhập theo tài khoản cá nhân HVA–EDOS. MATHORA V2.3 hiện không có action `login` riêng hay sessionToken như EDOS, nên không thể tạo màn hình tên đăng nhập/mật khẩu có thực bằng Frontend đơn thuần. Không được đưa khóa vào mã nguồn, tài liệu hoặc nhắn tin. Khi mở rộng cho nhiều người dùng, phải triển khai phiên đăng nhập do Backend cấp, phân quyền và thu hồi được.

## Kiểm thử

- PASS cú pháp JS và đối chiếu 10 tên action sau khi commit trên GitHub.
- **CHƯA PASS** kiểm thử `GET health` từ trình duyệt, POST với khóa được cấp, Gemini, STAGING, Kho thực. Công cụ hiện không có khóa thử nghiệm và không đọc được Web App.
- Không kết luận đã có dữ liệu Sheets nếu chưa tra cứu ID bản ghi, hash, nhật ký từ Backend.

## Hướng dẫn thử trực tiếp

1. Truy cập https://nvthahv03-cell.github.io/Mathora-Olympiad/
2. Vào **AI tạo bài toán & đề thi**, bấm **Kiểm tra Backend /health**.
3. Với tài khoản vận hành được ủy quyền, nhập mã truy cập Backend vào hộp mật khẩu trên trang (không gửi mã vào chat). Bấm **Đăng nhập**; bước này kiểm chứng bằng `listPending` và không tạo hồ sơ AI.
4. Chỉ khi xác thực thành công mới thử tạo nháp Gemini. Trước ghi vào STAGING, sử dụng dữ liệu TEST và kiểm tra thông báo xác nhận.
5. Chụp thông báo lỗi nếu bị CORS / Unauthorized; không chuyển mã truy cập cho người khác để chữa lỗi.

Các file Cloudflare và Google OAuth add-on trước đây giữ lại trong repository làm tư liệu kỹ thuật, **không được tải hoặc thực thi bởi `index.html` này**.
