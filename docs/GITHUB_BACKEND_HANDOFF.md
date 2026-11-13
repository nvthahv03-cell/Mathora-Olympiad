# MATHORA OLYMPIAD – Kết nối GitHub Pages ↔ Apps Script V2.3

## Quyết định kiến trúc

- **Giao diện** đặt tại GitHub Pages, giữ cấu trúc ứng dụng hiện hành.
- **Apps Script MATHORA_AI_BACKEND_V1** tiếp tục xử lý nghiệp vụ, Gemini và lưu Google Sheets.
- **Không bắt thầy thêm MathoraWebV1.html hay MathoraWebV1.gs chỉ để lưu giao diện trong Apps Script.** Hai tệp đó là giải pháp *HTML Service* khác kiến trúc nên **không triển khai nguyên xi** sang GitHub.
- Mã `.gs` không chạy trên GitHub Pages; chỉ các endpoint do Apps Script triển khai mới chạy nghiệp vụ phía máy chủ.

## Endpoint đã cung cấp

https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec

Kiểm tra GET công khai (không chứa khóa):

https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec?action=health

Backend V2.3, theo mã nguồn đã đối chiếu, có `doGet(action=health)` trả JSON `ok/service/version/aiConfigured/dbConfigured`; các tác vụ tạo/sửa/duyệt đều dùng `doPost` với khóa thử nghiệm `MATHORA_TEACHER_KEY` / `MATHORA_OWNER_KEY`.

## Tình trạng thực tế

- URL được ghi nhận từ người dùng; **chưa xác nhận HTTP GET, CORS, quyền truy cập hay hoạt động bản triển khai**.
- Giao diện gốc vẫn là bản xem trước, không đồng nghĩa đã kết nối chức năng tạo đề/kho.
- Không đưa `MATHORA_GEMINI_KEY`, `MATHORA_TEACHER_KEY`, `MATHORA_OWNER_KEY`, ID Google Sheets nhạy cảm hoặc token vào GitHub (kể cả tệp cấu hình hoặc localStorage).
- **Không gọi POST có khóa prototype từ trình duyệt GitHub công khai**. Cần lớp xác thực máy chủ (session/SSO, phân quyền owner/teacher), giới hạn truy cập và hỗ trợ CORS hoặc proxy đáng tin cậy trước khi bật ghi dữ liệu.
- Chỉ xem là PASS sau khi thử GET health, đăng nhập thật, tạo bản nháp Gemini, lưu STAGING, rà soát/duyệt, tra cứu và kiểm toán đầu-cuối.

## Bước tiếp theo

1. Xác nhận URL triển khai thực sự trỏ tới phiên bản V2.3 mong muốn và chạy `?action=health`.
2. Thiết kế và kiểm thử cầu nối xác thực + CORS giữa GitHub Pages và Backend, không lộ khóa.
3. Kết nối các module nghiệp vụ hiện có vào API, lần lượt theo mức an toàn; bảo toàn các module đã PASS.
