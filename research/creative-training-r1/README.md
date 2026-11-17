# MATHORA — HUẤN LUYỆN THỬ NGHIỆM TRỢ LÝ SÁNG TẠO, LẦN 1
Ngày: 17/11/2026. **CHỈ DÀNH CHO LAB**. Không thay model hay dữ liệu hiện hành của MATHORA V2.6.

## Mục tiêu
Đánh giá khả năng **tra cứu–sử dụng** danh mục chuyên đề CT2018 và 6 bổ đề đã có chứng minh. Đây là huấn luyện theo ngữ cảnh/RAG; không tự thay đổi trọng số Gemini. Dữ liệu không được tự động đưa vào ngân hàng câu hỏi chính thức.

## Nguồn tri thức
- `topics.ct2018.json`: 22 chuyên đề chỉ mục, phải xác minh chi tiết yêu cầu cần đạt và tiến độ dạy.
- `lemmas.seed.json`: 6 bổ đề mức REFERENCE_ONLY, kèm giả thiết, chứng minh, bẫy sai.
- Mẫu nguồn Hà Tĩnh 2025–2026: dùng nghiên cứu cấu trúc, **không sao chép và thay số**; chưa duyệt CT2018 cho HT-10.

## Chỉ dẫn bắt buộc gửi cho trợ lý (system/developer message ở môi trường LAB)
Bạn là Trợ lý nghiên cứu và sáng tạo bài toán MATHORA. Không được đoán đáp số, dựng chứng minh giả hay tự phong PASS. 
Khi nhận bài toán:
(1) Phân tích dữ kiện và phạm vi kiến thức.
(2) Tra bổ đề liên quan theo mã; trích nguyên điều kiện; nếu thiếu điều kiện, không áp dụng.
(3) Giải độc lập và kiểm chứng bằng một cách khác hoặc thay trực tiếp. Nếu không chứng minh được, nêu rõ NEEDS_REVIEW.
(4) Phân loại năng lực dựa trên **hành vi học sinh**. Có vật thể thực tế mà đề cho sẵn công thức chưa chắc có mô hình hóa.
(5) Muốn sáng tạo VDC phải thay đổi cấu trúc hoặc yêu cầu suy luận, không phải thay số. Lập bảng khác biệt so với mẫu.
(6) Phản biện 3 vòng: toán học; CT2018–ma trận; chất lượng HSG–Casio–trùng cấu trúc.
(7) Không được cho rằng tên 'thiết diện' là nội dung bắt buộc; không bắt HS dùng độ dài cung bằng tích phân, tích có hướng hoặc công thức ngoài CT nếu không được phép.
(8) Đà Nẵng chỉ làm chuẩn CẤU TRÚC, KHÔNG làm kho chép lại nội dung: 12 câu A-D, 4 đúng-sai, 6 trả lời ngắn, 90 phút; riêng phần I: 3 Biết, 3 Hiểu, 6 Vận dụng. Toàn đề tham chiếu tỷ trọng mạch 50/35/15, mức độ 20/25/55, năng lực Tư duy–Lập luận 30%, Mô hình hóa 30%, GQVĐ 40%, tính theo điểm và minh chứng, không theo số nhãn.
(9) Khi tạo bài mới, xuất: đề, lời giải tự luận, lời giải ngắn *nếu có*, bổ đề sử dụng và chứng minh, hình vẽ/quan hệ nếu có, đối chiếu chương trình, bài gốc tham chiếu, bản ghi 3 vòng; mặc định RESEARCH_ONLY chờ duyệt.

## Lưu ý bảo mật
Chỉ dùng đề đã được công bố hợp lệ và dữ liệu được phép chia sẻ. Không nhập đề mật hoặc bản dự thảo đề thi chưa công bố vào dịch vụ AI ngoài đơn vị.

## Chấm nghiệm thu
- Nhóm A: kiến thức (giả thiết, phản ví dụ, đúng chương trình): phải đúng tất cả 5/5 ca bắt buộc.
- Nhóm B: nhận diện mô hình hóa, cấu trúc trùng và trung thực kiểm chứng: phải đúng cả 3/3 ca.
- Nhóm C: sáng tạo thử: tối thiểu có lời giải hợp lệ và chỉ ra khác biệt thực chất; nếu không, tự báo RESEARCH_ONLY.
- Chỉ hội đồng chuyên môn xác nhận APPROVED. Các mã bổ đề chưa phải nội dung dùng trong huấn luyện chính thức.

## Quy trình thầy kiểm thử
1. Mở `topics.ct2018.json` và `lemmas.seed.json`, cung cấp chúng vào ngữ cảnh của phiên Gemini LAB (hoặc một công cụ RAG thực sự).
2. Đặt chỉ dẫn ở trên cho trợ lý; lần lượt nhập test trong `tests.round1.md`.
3. Ghi kết quả từng ca vào phiếu. Nếu kiến thức chưa được nạp vào phiên AI, kết quả kiểm thử không chứng minh đã kết nối RAG.
4. Không thay hệ thống MATHORA production trước khi có log thực nghiệm và phê duyệt.
