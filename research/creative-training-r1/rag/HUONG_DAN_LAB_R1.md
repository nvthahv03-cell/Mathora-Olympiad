# MATHORA RAG LAB R1 — BÀN GIAO KIỂM THỬ (17/11/2026)

## Phạm vi đã thực hiện
- Giao diện HTML độc lập (offline), tra cứu **22 nguồn**, **73 tóm tắt bài toán**, **12 chuyên đề**, **6 bổ đề**.
- Tra cứu từ khóa tiếng Việt không phân biệt dấu, lọc theo chuyên đề và địa phương, xem nguồn và cờ kiểm định.
- Phiếu 10 ca kiểm thử trợ lý; tính năng sao chép ngữ cảnh bổ đề vào phiên Gemini LAB thủ công.
- 12 phép thử trên lõi tìm kiếm đều qua; kiểm tra cú pháp 3 script của giao diện qua Node.
- Các tệp kho chỉ mục đã có trên nhánh trong thư mục `research/creative-training-r1/rag/`.

## Trạng thái quan trọng
- Đã xác minh sự nhất quán của **chỉ mục**; **chưa** thu đủ PDF đề gốc, chưa có 73 toàn văn câu.
- Bộ lọc từ khóa và hồ sơ nghiên cứu **không phải RAG embedding** hoặc bộ dữ liệu đã được Gemini nạp tự động.
- Chưa có kết quả chạy thực tế 10 ca trên API Gemini, chưa có AI training PASS.
- Giữ nguyên hệ thống sản xuất MATHORA V2.6. **KHÔNG MERGE** PR nếu chưa có kiểm thử và phê duyệt của thầy.

## Gói LAB để chạy máy cá nhân
Gói ZIP và `MATHORA_RAG_LAB.html` được tạo riêng trong phiên ChatGPT hiện tại và cung cấp trực tiếp cho thầy để tải. Gói ZIP không tự xuất hiện trên GitHub trừ khi được tải lên hoặc commit có chủ đích.

Mở HTML bằng Chrome, xem 5 thẻ; trong thẻ Kiểm thử có chức năng **Sao chép gói tri thức** và **Sao chép yêu cầu T01–T10**. Không nhập API key trên giao diện HTML.

## Nhiệm vụ nghiệm thu tiếp
1. Thu thập tệp đề gốc được phép lưu giữ; có checksum, thông tin trang, loại kỳ thi.
2. Tách từng câu và hình vẽ, chuẩn công thức, kiểm chứng lời giải/đáp án, đối chiếu CT2018.
3. Xây chunk nguồn và kho vector riêng hoặc bộ máy tra cứu xác thực.
4. Nối backend Gemini môi trường LAB, chạy 10 ca có log và GV chấm; sau đó kiểm thử bài sáng tạo có chứng minh.
