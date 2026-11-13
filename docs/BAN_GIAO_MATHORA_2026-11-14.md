# BIÊN BẢN BÀN GIAO MATHORA – 14/11/2026

**Lệnh:** Kim Quy Pro – Anh Cả.  
**Nguồn giao diện do chủ nhiệm chọn:** `index(20261112-082813).html` (79.324 byte trong Library).  
**Repository:** `nvthahv03-cell/Mathora-Olympiad`.  
**Nhánh triển khai mã nguồn:** `main`.  
**URL GitHub Pages dự kiến:** https://nvthahv03-cell.github.io/Mathora-Olympiad/

## 1. Công việc đã commit

| Commit | Phạm vi | Ghi chú |
| --- | --- | --- |
| `1bbb9602bac07909f74870acc5e028f63283ee9c` | `index.html` | Thay giao diện MathSphere bằng nguyên bản MATHORA được chọn, chỉ điều chỉnh khối AI để vô hiệu hai đường dẫn API cũ và dùng cấu hình Anh Cả |
| `0c29ebfd867896f73458d836aab97e3602d9da26` | `service-worker.js` | Đổi cache sang `mathora-olympiad-v1`, ưu tiên network cho điều hướng, xóa cache MathSphere cũ |
| `6563a292ce84590c2d193927cd1f4b842114a817` | `manifest.json` | Đổi tên PWA, `start_url` và `scope` tương đối, phù hợp repository mới |
| `73fd377ddd829ea5e644a23ef4190ee31f8a44a9` | `index.html` | Khai báo manifest, favicon, đăng ký Service Worker mới |

**Phạm vi bảo toàn:** toàn bộ phân hệ của bản HTML gốc (chuyên đề, bài toán, luyện tập, đề thi, kiểm định, hình vẽ, giao nhiệm vụ, học sinh mẫu, xưởng AI, sao lưu JSON). Không viết giao diện mới. Các dữ liệu lưu localStorage vẫn chỉ nằm trên trình duyệt, không được xem là lưu ở Google Sheets.

**Kế thừa nguyên trạng:**
- `mathora-backend-config.js`
- `pages/MathoraBackend.html`
- `docs/GITHUB_BACKEND_HANDOFF.md`

## 2. Kiểm thử có bằng chứng trong phạm vi công cụ

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Truy xuất đúng HTML nguồn | **PASS** | Tệp Library khớp tên chính xác `index(20261112-082813).html`, 79.324 byte |
| Commit thay thế MathSphere | **PASS** | Đọc lại `main/index.html`, title MATHORA |
| Kiểm tra cú pháp JS sau chỉnh sửa | **PASS CÚ PHÁP** | Phân tích tất cả block JS trong runtime kiểm thử |
| Giữ phân hệ chính | **PASS ĐỐI CHIẾU MÃ** | Có `home()`, `aiLab()`, `draw()` và `reviewTask()`; không đồng nghĩa mọi nút đã PASS trình duyệt |
| Bỏ API cũ | **PASS ĐỐI CHIẾU MÃ** | Không còn `fetch('/api/ai')` hoặc `fetch('/api/health')` |
| Giữ cấu hình Backend của Anh Cả | **PASS** | Đọc lại ba tệp nguyên trạng |
| Không đưa khóa bí mật mới lên GitHub | **PASS PHẠM VI THAY ĐỔI** | Không chèn API key hoặc token vào mã vừa sửa; chưa phải quét bảo mật toàn repository |
| Chuyển cache sang MATHORA | **PASS ĐỐI CHIẾU MÃ** | `service-worker.js` có namespace mới, ưu tiên network-first cho navigation |
| GitHub Pages thực tế trên desktop/mobile | **CHƯA KIỂM THỬ** | Công cụ truy cập trực tiếp URL Pages không xác minh được giao diện đã được xuất bản và render |
| GET health từ trang công khai | **CHƯA KIỂM THỬ TRỰC TIẾP** | URL đã khai báo; ảnh kiểm tra trước đây có phản hồi V2.3, chưa chứng minh trang hiện tại gọi được |
| Gọi Gemini, ghi STAGING, duyệt Kho từ Pages | **CHƯA PASS TÍCH HỢP** | Apps Script V2.3 doPost dùng mã truy cập prototype; chưa có session/SSO + CORS/proxy tin cậy |
| Phân quyền ở Backend từ trang Pages | **CHƯA KIỂM THỬ** | Không gửi owner/teacher secret từ trình duyệt công khai |
| Nghiệm thu chủ nhiệm sản phẩm | **CHƯA NGHIỆM THU** | Chờ kiểm tra thực tế |

## 3. Tồn tại kỹ thuật cần đóng

Backend V2.3 đã có các nghiệp vụ xử lý hồ sơ trên Apps Script, nhưng để GitHub Pages gọi trực tiếp vẫn cần thiết kế cơ chế xác thực **phía máy chủ** bảo đảm không lộ mã truy cập, đồng thời có đường truyền được phép theo chính sách trình duyệt (CORS). Vì chưa có cơ chế như vậy được kiểm thử, nút AI trong HTML chính thức thông báo chưa kết nối và **không phát sinh POST**. Trang health hiện mở đường dẫn Backend trong tab mới, không tuyên bố nhận phản hồi đã xác minh.

Lưu ý: GitHub Pages chỉ host static frontend. CORS không thể xử lý một cách an toàn bằng cách nhúng mã teacher/owner vào JavaScript; không nên sử dụng JSONP hay iframe để vượt quyền.

## 4. Quy trình nghiệm thu tiếp theo

1. Kiểm tra trực tiếp URL Pages trên desktop và mobile, làm mới cứng / PWA cache.
2. Kiểm tra các màn hình hiện có, nhập và xuất JSON dữ liệu thử.
3. Cung cấp một tầng session/API được triển khai an toàn, có quyền truy cập Apps Script Backend (không đưa secret lên GitHub).
4. Chạy Gemini → STAGING Sheets TEST → thẩm định → APPROVED → EXAM_ELIGIBLE với log; nghiệm thu.
5. Chỉ sau đó cập nhật trạng thái **PASS TÍCH HỢP** và **PASS NGHIỆM THU**.

**Không chỉnh sửa Backend V2.3; không thêm HTML hoặc .gs vào Apps Script.**
