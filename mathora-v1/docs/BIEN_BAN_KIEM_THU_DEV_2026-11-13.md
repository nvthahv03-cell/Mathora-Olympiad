# MATHORA V1 — BIÊN BẢN KIỂM THỬ DEVELOPMENT
Ngày: 13/11/2026

## Đối tượng
- `mathora-v1/MathoraWebV1.gs`
- `mathora-v1/MathoraWebV1.html`
- `mathora-v1/tests/test_bridge.js`

## Kết quả cục bộ
1. Node.js v22 kiểm tra cú pháp Javascript cầu nối: **PASS CÚ PHÁP**.
2. Node.js kiểm tra mã Javascript trích từ HTML: **PASS CÚ PHÁP**.
3. **14 phép kiểm tra (assertions)** phân quyền và điều phối bằng mock: **14/14 PASS MÔ PHỎNG**. Chúng kiểm tra khóa sai, phân quyền teacher/owner, không cho duyệt/thẩm định/từ chối bằng teacher, bản nháp thiếu đáp án, các action hợp lệ và không hợp lệ. **KHÔNG** chứng minh phân quyền trên Apps Script thật.
4. Backend /exec?action=health theo ảnh chủ nhiệm đã xác nhận: `ok:true`, phiên `2.3-controlled-staging`, AI và DB được cấu hình. Đây là kiểm tra read-only, không phải ghi dữ liệu.

## Những việc CHƯA kiểm thử
- Chưa xác nhận URL GitHub Pages mới cho nhánh DEVELOPMENT hoặc STAGING.
- Chưa chạy HTML bằng `HtmlService` và `google.script.run` trên dự án Apps Script TEST.
- Chưa gọi Gemini thực tế qua giao diện V1.
- Chưa ghi/đọc STAGING Google Sheets TEST.
- Chưa kiểm thử workflow duyệt từ giao diện đến Kho.
- Chưa chạy hồi quy bằng môi trường thật.
- Chưa có biên bản nghiệm thu của Chủ nhiệm sản phẩm.
- Chưa triển khai production.

## Trạng thái công bố
**ĐÃ VIẾT MÃ + PASS CÚ PHÁP + PASS MÔ PHỎNG** (theo đúng phạm vi trên).  
**CHƯA PASS TÍCH HỢP. CHƯA PASS NGHIỆM THU. KHÔNG LOCKED.**

## Khuyến nghị an toàn
Repository hiện **public**. Cấm đưa Gemini key, owner/teacher key hoặc dữ liệu học sinh vào tệp nguồn. Không chuyển nguồn Pages đang có sang nhánh mới trước khi xác định chính xác website hiện hữu. Chỉ kiểm thử chức năng có quyền bằng project Apps Script TEST và bảng dữ liệu TEST.
