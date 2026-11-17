# MATHORA RAG – QUY ĐỊNH SẮP XẾP NGÂN HÀNG ĐỀ HSG 12 (V1)
Ngày: 17/11/2026 · **LAB ONLY — CHƯA KẾT NỐI RAG RUNTIME**

## Phân tách bốn kho
1. `01_sources/`: **tài liệu gốc** (PDF, Word được phép lưu), giữ tên nguyên gốc và checksum; không sửa đề.
2. `02_question-index/`: **mỗi câu một bản ghi**, có mã, trang/vị trí, đề nguồn, lớp/chuyên đề CT2018, dạng thức, lời giải, bổ đề và trạng thái xác minh. Một câu có nhiều chuyên đề nhưng có đúng một chuyên đề chính.
3. `03_lemma-bank/`: bổ đề, chứng minh, phản ví dụ, điều kiện áp dụng và hồ sơ học thuật; liên kết đến câu gốc bằng ID.
4. `04_creative-lab/`: bài mới do AI đề xuất, so sánh cấu trúc với đề nguồn, kiểm định ba vòng, phê duyệt giáo viên. Không trộn bài mới chưa kiểm với đề gốc.

## Nhận dạng nguồn / phân luồng
- `PROVINCIAL_HSG`: đề HSG Sở chính thức, có bản gốc xác minh.
- `TEAM_SELECTION`: chọn đội tuyển (HSG quốc gia/chuyên).
- `SCHOOL` / `INTER_SCHOOL`: cấp trường, khảo sát liên trường.
- `HISTORICAL`: nguồn lịch sử để tham khảo.
- `USER_SUPPLIED`: tài liệu thầy chuyển; ghi `provided_by_user` nhưng **chỉ khi nhận diện được file gốc**, không gắn nhãn sai cho URL tìm kiếm.
- `FOREIGN`: tài liệu nước ngoài, bản dịch do MATHORA biên soạn tách khỏi nguyên tác và giữ quyền tác giả.

## Quy tắc gắn nhãn theo CT2018
- Hệ thống dùng `topics.ct2018.json` làm chỉ mục bước đầu; phải đối chiếu từng yêu cầu cần đạt và thời điểm dạy.
- Hình học không gian: quan hệ song song/vuông góc, góc, khoảng cách, thể tích; vectơ và Oxyz theo kiến thức đã học.
- Không dùng **dựng thiết diện phức tạp** làm kiến thức bắt buộc. Thuật ngữ lịch sử trong tệp nguồn có thể giữ nguyên khi trích, nhưng gắn nhãn `EXTENSION_REVIEW`, không tự đưa vào đề CT2018.
- Độ dài cung qua tích phân, tích có hướng hoặc kiến thức đại học: `OUT_OF_SCOPE` trừ khi được quy định hoặc cung cấp rõ.
- Giữ địa phương theo tên tại năm phát hành; Quảng Nam trước sáp nhập là nhãn lịch sử, không được gộp lẫn.

## Bộ lọc nhập kho (không bỏ qua)
`DISCOVERED → LINK_VERIFIED → ORIGINAL_ACQUIRED → TEXT_EXTRACTED → QUESTION_SPLIT → MATHEMATICALLY_CHECKED → CT2018_CHECKED → HUMAN_APPROVED → RAG_READY`

Không đặt `RAG_READY` nếu chỉ có URL hoặc mô tả vài câu. Nguồn trong `source-manifest.json` hiện **chỉ là chỉ mục** và chưa được xác nhận nạp văn bản vào công cụ tìm kiếm.

## Dấu vết một câu
`question_id`, `source_id`, `page`, `part`, `question_no`, `historical_locality`, `year`, `exam_type`, `primary_topic`, `secondary_topics`, `grade`, `ct2018_requirements`, `taught_before_exam`, `difficulty`, `competency_evidence`, `solution_status`, `lemma_ids`, `casio_test`, `near_duplicate_ids`, `review_rounds`, `approval`, `source_asset_path`, `source_url`.

## Chống trùng và chống khai man
- DN25 và DN25v là **cùng kỳ thi**; không đếm thành 2 đề.
- Hình thức mã đề khác mà nội dung trùng: một bản chính, các bản còn lại liên kết `duplicate_of`.
- Bản có nguồn bài nhưng chưa lấy được văn bản đầy đủ: `asset_ingested=false`.
- Bản đề của thầy đã từng gửi trong các cuộc chat khác: chỉ đưa vào sau khi xác định được **đúng tệp gốc** từ Library/attachment; không suy từ danh mục rằng tệp đã lưu trong repo.
- Không đưa đề chưa công bố hoặc tài liệu mật vào GitHub hay AI.

## Phản biện trước sáng tạo
1. Giải và kiểm chứng; nêu rõ lời giải tối ưu và bổ đề.
2. Đối chiếu CT2018, ma trận ba năng lực, thời điểm học và bộ môn.
3. So cấu trúc với nguồn HSG các địa phương; kiểm thử Casio; phân hóa thực tế; GV phê duyệt.

**Đà Nẵng là chuẩn cấu trúc ra đề, không phải nguồn độc quyền về ý tưởng.**
