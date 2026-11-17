# MATHORA MCCS — Gemini LAB Bridge v1.0

Cập nhật 17/11/2026. **Mã nguồn đã đưa lên MATHORA, nhưng dịch vụ Gemini CHƯA được triển khai / chưa được nghiệm thu.**

## 1. Các tệp
- `labs/mccs-backend/MCCS_LAB.gs`: Apps Script **độc lập**; kiểm Google ID token và email whitelist trước khi gọi Gemini; hai chế độ `propose` và `review3` (ba cuộc gọi Gemini riêng trong lượt phản biện).
- `labs/mccs-runtime-config.js`: cấu hình công khai của LAB, mặc định `enabled:false`.
- `labs/creative-command-console.html`: trang 18 lệnh, 10 tình huống, phiếu đánh giá và khu vực chạy Gemini (chỉ hoạt động khi đã xác thực).
- Không đổi `mathora-backend-config.js`, không thay cơ chế AI đang khóa của ứng dụng V2.6.

## 2. Triển khai bởi quản trị viên MATHORA
1. Tạo **một dự án Apps Script riêng biệt** (không dán đè backend EDOS/MATHORA); tạo tệp `MCCS_LAB.gs`.
2. Trong Script Properties của dự án đó, cấu hình:
   - `MCCS_GEMINI_KEY`: khóa Gemini do đơn vị quản lý; **không lưu ở trình duyệt hoặc GitHub**.
   - `MCCS_GOOGLE_CLIENT_ID`: OAuth Web Client ID công khai của Google Cloud, thuộc chính ứng dụng MATHORA.
   - `MCCS_ALLOWED_EMAILS`: danh sách email giáo viên được phép, phân cách bằng dấu phẩy.
   - `MCCS_MODEL`: tên model Gemini cho phép, ví dụ `gemini-3.1-flash-lite` nếu môi trường đang hỗ trợ.
3. Cấu hình Google OAuth Web Client tại Google Cloud, thêm GitHub Pages origin đúng URL chạy app (origin là `https://nvthahv03-cell.github.io`).
4. Chạy `MCCS_selfTest()` trong Apps Script, kết quả chỉ kiểm tra lệnh/chuỗi, không gọi Gemini.
5. Deploy web app LAB (do quản trị viên cấu hình quyền thực thi và đối tượng truy cập). **Lưu ý:** Vì dự án cần truy cập Script Properties của chủ sở hữu, nên giới hạn tài khoản bằng bước kiểm Google ID token + whitelist; tuyệt đối không coi URL triển khai là lớp xác thực.
6. Kiểm tra `GET /exec`: có `service=MCCS_LAB`, `version=mccs-lab-1.0`. GET health không xác minh quyền gọi AI.
7. Trước khi mở `enabled:true`, **kiểm thử POST từ đúng domain GitHub Pages**. Apps Script có thể trả HTTP redirect hoặc bị trình duyệt chặn CORS; nếu thất bại phải đặt một gateway an toàn phía máy chủ. Không dùng `mode:no-cors`, không nhúng API key hay khóa giáo viên trong JS.
8. Khi POST có thể đọc phản hồi JSON và đã kiểm tra các ca bảo mật, điền **chỉ thông tin công khai** vào `labs/mccs-runtime-config.js`: `endpoint`, `googleClientId`, rồi mới chuyển `enabled:true`.
9. Trong bảng MCCS, giáo viên đăng nhập Google, nhập nhiệm vụ, chạy tạo nháp, sau đó chạy `review3`: ba cuộc gọi Gemini lần lượt đánh giá toán học, CT2018–khảo thí, tính mới–Casio với chỉ dẫn hệ thống riêng; không lấy kết luận vòng trước làm giả thiết vòng sau. Kết quả luôn `teacher_approved:false`. Có thể xuất log JSON **không chứa ID token**.

## 3. Bảo mật / không được bỏ qua
- Token đầu vào là ID token ngắn hạn, được gửi trong thân POST; backend phải xác thực token qua Google tokeninfo, kiểm `aud`, `email_verified`, whitelist email.
- Không ghi log khóa Gemini, ID token, dữ liệu cá nhân học sinh hoặc đề mật; mô-đun LAB không nhận đầu vào nguồn bí mật.
- Mọi câu hỏi gửi Gemini **vẫn phải được kiểm duyệt nội dung**. Không dùng đề chưa công bố hoặc thông tin cá nhân HS.
- Có giới hạn tần suất sơ bộ bằng CacheService 15 giây; đây không phải bộ hạn mức đầy đủ. Trước khi mở rộng cần quotas, audit, chống lạm dụng, quản lý đồng thời và chính sách lưu dữ liệu.
- Ngay cả khi model nói "PASS", cổng máy chủ **không cấp APPROVED**.
- Mode `review3` gồm **ba cuộc gọi Gemini mới**, lần lượt với ba system instruction khác nhau. Đây vẫn có thể là cùng một mô hình Gemini, nên không tương đương ba người phản biện độc lập về nhân sự; cần giáo viên nghiệm thu. Giáo viên vẫn phải nghiệm thu.

## 4. Những gì đã kiểm thử và chưa kiểm thử
**Đã kiểm chứng:** cú pháp JavaScript của ứng dụng, Apps Script và bảng MCCS; `MCCS_selfTest()` chạy cục bộ; cấu hình mặc định khóa; 15/15 phép kiểm thử mock backend đã qua bao gồm audience, whitelist, trạng thái không tự phê duyệt, 3 lần gọi reviewer có chỉ dẫn khác nhau. Tất cả là giả lập, không dùng khóa Gemini thật.

**Chưa kiểm chứng:** cấp quyền OAuth thực tế, URL Web App hoạt động, CORS khi POST, kết nối Gemini trả JSON, chi phí và quota, kết quả 10 bài test AI, chất lượng lời giải. Vì vậy trạng thái **CHƯA PASS LIVE**.

## 5. Tiêu chí nghiệm thu tối thiểu
- Không có token hoặc token không hợp lệ → từ chối; tài khoản không whitelist → từ chối; token có `aud` khác → từ chối.
- Tài khoản được cho phép → tạo nháp và phản biện gọi riêng, có log theo ca; cùng một model không tự duyệt kết quả.
- 10/10 tình huống MCCS được giáo viên chấm, có phản hồi thực tế từ Gemini.
- Bài mái parabol chứng minh độ dài 8 dây cung lớn hơn 7,45 m, không dùng tích phân độ dài cung để giả làm lời giải chuẩn CT2018.
- Chỉ khi đủ điều kiện mới xem xét liên thông backend chính, không tự thay thế bản V2.6.
