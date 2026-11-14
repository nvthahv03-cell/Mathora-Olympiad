# MATHORA OLYMPIAD — KẾT NỐI GITHUB PAGES ↔ BACKEND V2.3

**Ngày 14/11/2026 — triển khai mã nguồn, chưa phát hành Gateway.**

## Kiến trúc thực hiện

- **GitHub Pages:** `index.html` giao diện gốc được thầy chọn; `mathora-backend-client.js` gắn vào màn hình AI, gọi Gateway khi có cấu hình.
- **Gateway (Cloudflare Worker):** `gateway/cloudflare-worker.mjs`. Nhận Google ID token qua HTTPS, xác minh token trên máy chủ với Google, kiểm tra danh sách email có quyền teacher/owner, kiểm tra CORS và action, bổ sung khóa Backend lấy từ biến bí mật phía máy chủ, rồi chuyển tiếp tới Apps Script.
- **Google Apps Script V2.3:** GIỮ NGUYÊN các hàm đã có: `doGet(health)`, `doPost(generateProblem/saveToKho/listPending/getPending/attestPending/rejectPending/listKho/getProblem/approveProblem/listExamEligible)`.
- **Google Sheets:** `MATHORA_STAGING`, `MATHORA_PROBLEMS`, nhật ký do V2.3 quản lý.

**Không gửi khóa Gemini, teacher, owner từ GitHub Pages. Không dùng JSONP, no-cors hoặc nhúng mã vào URL.**

## Các tệp đã thực hiện

- `index.html`: liên kết client mới, không sửa menu hoặc nội dung bản gốc của thầy.
- `mathora-backend-client.js`: giao diện 7 bước có Google login, tạo nháp, lưu STAGING, tra cứu, thẩm định, duyệt Kho, tra cứu bài đủ điều kiện.
- `mathora-backend-config.js`: thêm `gatewayUrl` và `googleClientId`, mặc định rỗng, không chứa bí mật.
- `gateway/cloudflare-worker.mjs`: xác thực và phân quyền ở máy chủ; mặc định chặn thao tác ghi.
- `gateway/gateway.test.mjs`: 12 tình huống kiểm thử không dùng dữ liệu thật.

## Điều kiện triển khai Gateway TEST — cần quyền sở hữu tài khoản

**Chỉ thao tác trên Apps Script TEST / Sheets TEST; không dùng dữ liệu nhà trường.**

1. Tạo **Google OAuth Client ID loại Web application**, cho phép nguồn gốc JavaScript:
   `https://nvthahv03-cell.github.io`. Đây là **Client ID công khai**, không phải client secret.
2. Tạo Cloudflare Worker mới từ tệp `gateway/cloudflare-worker.mjs`. Dùng tài khoản Cloudflare mà Chủ nhiệm sản phẩm có quyền quản trị. Không thể triển khai Worker chỉ bằng thao tác commit GitHub.
3. Cấu hình Worker variables (trong Cloudflare, không commit vào GitHub):
   - `ALLOWED_ORIGIN`: `https://nvthahv03-cell.github.io`
   - `GOOGLE_CLIENT_ID`: ID Google OAuth Web vừa tạo
   - `GAS_ENDPOINT`: URL Web App **TEST** đã triển khai bằng bản sao Backend V2.3
   - `OWNER_EMAILS`: email được phép giữ vai trò owner (chỉ cấu hình ở máy chủ)
   - `TEACHER_EMAILS`: email giáo viên được phép
   - `MATHORA_WRITE_ENABLED`: `NO` ban đầu
   - `GAS_TEST_APPROVED`: `NO` ban đầu
4. Cấu hình **Worker Secrets** (không dùng Variables thông thường nếu có lựa chọn Secret):
   - `GAS_OWNER_KEY`: khóa owner của Backend TEST
   - `GAS_TEACHER_KEY`: khóa teacher của Backend TEST
5. Mở `https://<worker-name>.<account>.workers.dev/health`. Phải nhận JSON có `service: MATHORA-GATEWAY`, `backendReady: true`, `writeEnabled: false`.
6. Trên GitHub sửa **duy nhất hai giá trị công khai** trong `mathora-backend-config.js`:
   - `gatewayUrl`: URL HTTPS của Worker (không có dấu / cuối).
   - `googleClientId`: Web Client ID của Google.
   Không viết API key hoặc secret vào file này.
7. Kiểm thử đăng nhập hai vai trò. Mọi thao tác ghi vẫn bị khóa. Sau khi đã xác minh Worker trỏ đúng GAS/Sheets TEST, mới đặt đồng thời `MATHORA_WRITE_ENABLED=YES` và `GAS_TEST_APPROVED=YES`.
8. Chạy bài toán TEST từ giao diện: tạo nháp → thêm `short_answer` → lưu STAGING → mở lại → thẩm định bằng minh chứng độc lập → duyệt Kho TEST → kiểm tra danh sách bài đủ điều kiện ra đề. Ghi lại ID, SHA256, phiên bản, nhật ký.
9. Không bật hai biến cho Backend production khi chưa được duyệt riêng. Trước phát hành chính thức phải bổ sung kiểm soát vận hành (giới hạn tần suất, giám sát lỗi, chính sách dữ liệu và kế hoạch khôi phục).

### Lưu ý về đăng nhập

Google ID token được giữ trong **bộ nhớ tab**, không đặt vào URL, localStorage hoặc GitHub. Token được gửi bằng Authorization Bearer đến Worker và Worker xác minh qua Google; danh sách người dùng phân quyền nằm ở Worker. Tài khoản đăng nhập Google bất kỳ không mặc nhiên có quyền truy cập MATHORA.

### Giới hạn đang tồn tại

- **Chưa deploy Cloudflare Worker:** `gatewayUrl` và `googleClientId` cố ý để trống. Frontend đang ở trạng thái READ-ONLY.
- **Chưa chạy với Gemini/Sheets:** Mọi kiểm thử hiện có là cú pháp, mock hoặc ảnh trang chủ; không suy diễn PASS tích hợp.
- **Chưa có bài toán được người có thẩm quyền nghiệm thu:** AI chỉ sinh bản nháp, không tự duyệt.
- **Chưa triển khai rate limiting theo danh tính:** cần hoàn thiện cho production nhiều người dùng.

## Kiểm thử

Chạy: `node --test gateway/gateway.test.mjs`. Các kiểm thử không gọi Apps Script/Google Sheets/Gemini thật vì sử dụng mock `fetch`. Kết quả unit test không thay thế kiểm thử tích hợp.

### Tiêu chí PASS TÍCH HỢP

- Có URL Worker TEST và ảnh/log phản hồi health.
- Có đăng nhập Google owner/teacher thực tế, xác minh teacher bị chặn action owner.
- Có minh chứng sinh bài Gemini thực tế từ giao diện.
- Có hồ sơ STAGING / Kho đọc lại từ Sheets TEST theo ID, phiên bản, hash.
- Có bằng chứng chống ghi trùng, khóa hồ sơ bị thay đổi, kiểm tra lỗi và hồi quy.
- Có nghiệm thu bằng văn bản của Chủ nhiệm sản phẩm.

**Trạng thái bàn giao: ĐÃ VIẾT MÃ; PASS CÚ PHÁP; PASS MÔ PHỎNG 11 tình huống Gateway trong runtime kiểm thử; CHƯA PASS TÍCH HỢP.**
