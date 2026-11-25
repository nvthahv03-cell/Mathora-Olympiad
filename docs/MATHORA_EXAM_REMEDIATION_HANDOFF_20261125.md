# MATHORA EXAM & HỌC TỪ SAI LẦM — BÀN GIAO KỸ THUẬT 25/11/2026

## 1. Phạm vi của nhánh thử nghiệm

Pull Request #13: `feature/math-input-lab-20261125`. **Không triển khai trên `main`**.
- `labs/mathora-exam-connected.html`: giao diện đăng nhập, xem đề, thi thử, nộp, xem bài sửa sai; phía GV có tạo đề JSON, xem bài và phê duyệt.
- `labs/math-input-practice.html`: nhập toán nhanh/LaTeX, cột hướng dẫn, MathJax.
- `labs/mathora-exam-core.mjs`: chấm mẫu độc lập; kiểm thử bằng Node.
- `backend/MATHORA_EXAMS_V1.gs`: tạo đề dự thảo, phát hành bởi quản trị, lấy đề không đáp án, chấm có đáp án máy chủ, lưu lần nộp đầu, tạo yêu cầu sửa sai.
- `backend/MATHORA_REMEDIATION_V1.gs`: giao bài sửa sai, nộp tự luận dạng văn bản, lưu phiên bản, giáo viên xem và kết luận.
- `backend/MATHORA_V23_ACCOUNTS_READY.gs`: bản sửa có thêm 2 nhánh định tuyến, **không có thêm `doPost`**.
- `labs/mathora-exams-backend.test.mjs`, `labs/mathora-remediation-backend.test.mjs`: kiểm thử mock của Google Sheets/phiên, không phải kiểm thử tích hợp thật.

## 2. Biểu điểm đã chốt

- A–B–C–D: đúng 0,25; sai 0.
- Đúng/Sai: đúng 0/1/2/3/4 ý = 0/0,10/0,25/0,50/1,00 điểm cho cả câu.
- Trả lời ngắn: đúng 0,50; sai 0.
- Mỗi **câu** sai tạo **một** yêu cầu sửa tự luận; câu Đ/S sai dù một ý cũng phải giải lại, giải thích cả bốn ý.
- Điểm lần đầu **không thay đổi** sau khi nộp sửa sai.

## 3. Trạng thái quyền

- Học sinh: lấy đề `ACTIVE`, nộp đề một lần, chỉ xem điểm của mình, xem và nộp bài sửa sai của mình.
- Giáo viên: tạo đề `DRAFT`, theo dõi bài sửa sai thuộc các yêu cầu mình giao/chủ trì; xác nhận `APPROVED` hoặc `NEEDS_REVISION`.
- Quản trị: phát hành đề, xem và duyệt bài.
- Đáp án không nằm trong phản hồi `examGet` dành cho học sinh.
- Các tuyến đều bắt buộc có phiên `sessionToken` hợp lệ phía Apps Script.

## 4. Tuyến API dự kiến

| Action | Quyền | Chức năng |
|---|---|---|
| `examCreate` | GV / quản trị | Tạo đề DRAFT |
| `examPublish` | Quản trị | Mở đề ACTIVE |
| `examList`, `examGet` | Đăng nhập | Danh sách đề, nội dung không kèm đáp án |
| `examSubmit` | HS | Chấm, lưu điểm và sinh nhiệm vụ giải lại |
| `examResults` | HS (của mình), GV / quản trị | Tra cứu kết quả |
| `remAssign` | GV / quản trị | Giao yêu cầu sửa sai thủ công |
| `remMyTasks`, `remSubmit` | HS | Xem và nộp lời giải |
| `remTeacherTasks`, `remReview` | GV / quản trị | Theo dõi, nhận xét, kết luận |
| `remHistory` | Tài khoản có quyền | Các phiên bản lời giải |
| `remAiReview` | GV / quản trị | Phản biện sơ bộ bằng Gemini, mặc định **tắt** |

## 5. Các Sheet mới (tự tạo khi gọi module đúng quyền)

- `MATHORA_EXAMS`
- `MATHORA_EXAM_ATTEMPTS`
- `MATHORA_REMED_TASKS`
- `MATHORA_REMED_SUBMISSIONS`
- `MATHORA_REMED_AI_REVIEWS` (chỉ khi bật AI và gọi phản biện)

**Mọi dữ liệu bài làm là dữ liệu học sinh, cần quy chế quyền truy cập, sao lưu và thời gian lưu phù hợp trước khi mở cho học sinh thật.** Không ghi mật khẩu vào Sheet, frontend, GitHub hoặc ảnh chụp.

## 6. Quy trình triển khai Apps Script trên môi trường TEST — CHƯA THỰC HIỆN

1. Sao lưu dự án Apps Script và Spreadsheet hiện hành.
2. Đối chiếu phiên bản đang triển khai với `backend/MATHORA_V23_ACCOUNTS_READY.gs` trên nhánh PR. **Thay nội dung file Backend hiện hành**, không tạo thêm `doGet/doPost` trùng.
3. Thêm `MATHORA_EXAMS_V1.gs` và `MATHORA_REMEDIATION_V1.gs` vào **cùng dự án Apps Script**. Không đưa hai module này lên dự án khác không có `maDb_`, `maAccountSession_`, `maAccountFind_`, `maProp_`.
4. Kiểm tra `MATHORA_DB_ID` ở Script Properties và bảng người dùng `MATHORA_USERS`; tạo tài khoản thử với mật khẩu mạnh (không dùng tài khoản học sinh thật).
5. Deploy một **phiên bản TEST**; cập nhật endpoint TEST trong bản sao cấu hình frontend thử nghiệm, không đè endpoint sản xuất.
6. Thử 3 vai trò: admin, teacher và student; kiểm tra đề `DRAFT` không hiện cho HS; đề `ACTIVE` không trả đáp án; chỉ admin phát hành.
7. Làm bài với số ý đúng 0–4, trắc nghiệm 0,25 và trả lời ngắn 0,5; xác nhận điểm và mã hồ sơ trong Sheet.
8. Chấm sai -> tự tạo một nhiệm vụ/câu -> nộp tự luận -> GV yêu cầu sửa -> HS nộp lần 2 -> GV duyệt; kiểm tra học sinh khác không đọc được bài.
9. Test xử lý mất mạng, gửi trùng, cache, khóa phiên, dữ liệu đầu vào lạ, phục hồi khi lỗi ghi Sheet.

## 7. Gemini phản biện bài tự luận

- **Mặc định bị vô hiệu hóa.** Chỉ bật khi có quy định nội bộ cho phép gửi bài giải của học sinh đến dịch vụ AI:
  `MATHORA_AI_REVIEW_ENABLED=true` trong Script Properties.
- Phải có `MATHORA_GEMINI_KEY` trong Script Properties; không đưa khóa lên GitHub.
- Giáo viên chủ động nhấn yêu cầu AI; AI chỉ trả `AI_DRAFT` với quan sát và gợi ý, không chấm điểm chính thức và không đổi trạng thái bài.
- Chỉ giáo viên/quản trị xác nhận `APPROVED` hoặc `NEEDS_REVISION`.
- Cần kiểm thử Gemini thật, hạn mức, an toàn prompt, kiểm soát chi phí và quyền riêng tư trước khi dùng thực.

## 8. Chưa hoàn thành / chưa PASS vận hành

- Chưa triển khai Apps Script, chưa kiểm tra POST thực từ GitHub Pages qua GAS (CORS và chuyển hướng), chưa nghiệm thu trình duyệt desktop/mobile.
- Giao diện này là trang `labs` độc lập, **chưa được tích hợp vào `index.html` chính**.
- Chưa có upload ảnh/PDF bài viết tay lên Drive; bản kết nối hỗ trợ lời giải dạng văn bản. Trang demo cho chọn ảnh chỉ xem trước trên máy.
- AI có mã thực thi phụ thuộc cấu hình và phê duyệt; chưa có kết quả gọi Gemini thật; chưa có quy trình kiểm định toán nâng cao bằng giáo viên trên dữ liệu thực.
- Đề mẫu cơ bản để kiểm thử mã, không phải chất lượng đề HSG thành phố. Chưa có sinh đề tự động từ ngân hàng `APPROVED`; khâu tạo đề JSON phải do giáo viên có quyền thực hiện.
- Chưa có điều khiển thời gian thi, mã đề, lịch mở đóng, chống gian lận, giới hạn lượt thi theo kỳ, nhật ký sự kiện đầy đủ, phân quyền theo lớp, và cơ chế phục hồi khi ghi nhiều Sheet không thành công giữa chừng.
- Không phát hành đại trà, không merge PR cho đến khi xử lý các mục trên và nghiệm thu trực tiếp.

## 9. CI

GitHub Actions kiểm thử cú pháp JS, chấm điểm, nguyên tắc 1 nhiệm vụ/câu sai và quyền truy cập mô phỏng. **CI PASS không đồng nghĩa PASS tích hợp hoặc PASS chất lượng toán học.**
