# MATHORA Publish Standard V1

Trạng thái: Đặc tả đầu ra và hợp đồng giao diện — **không** tự phê duyệt, không ghi Kho.

## Luồng chuẩn
1. AI tạo bài → 2. Giải độc lập/3 vòng phản biện → 3. Giáo viên kiểm tra và quyết định → 4. Xuất hồ sơ.
Trong giai đoạn nghiên cứu, cho phép **xem trước, sao chép và tải bản nháp** có watermark CHƯA DUYỆT; không đồng nghĩa phát hành đề chính thức.

## Giao diện một màn hình
- **Bản đọc đẹp:** đề, điều kiện, lời giải, lời giải ngắn, đáp án; MathJax dàn công thức LaTeX như tài liệu Toán học; khi thư viện không tải được phải báo và giữ nguồn, không làm mất dữ liệu.
- **Sao chép:** Copy đề, Copy lời giải, Copy toàn bộ, Copy LaTeX; khi bài có hình, Copy prompt hình.
- **Tải LaTeX (.tex):** file nguồn minh bạch là bản nháp; kiểm thử sơ bộ cấu trúc trường. Chỉ xác nhận biên dịch khi có dịch vụ compiler + log.
- **Word Equation:** chưa mở nút cho đến khi có dịch vụ tạo DOCX với phương trình OMML chỉnh sửa được, đối chiếu mẫu nhiều dòng/hệ phương trình/ma trận/phân số/dấu tiếng Việt.
- **PDF:** sau khi có quy trình biên dịch, dùng PDF xuất từ TeX với font tiếng Việt và cấu hình in được kiểm nghiệm.

## Contract MATHORA_PUBLISH_V1
Dữ liệu bài toán, không chứa quyền phê duyệt. Trường `status` chỉ mô tả tình trạng nghiên cứu, tuyệt đối không là `APPROVED` tự động.

```json
{
  "schema_version": "MATHORA_PUBLISH_V1",
  "status": "RESEARCH_ONLY",
  "teacherApproved": false,
  "stored": false,
  "problem": {
    "title": "Tên bài",
    "statement_latex": "Đề bài bằng LaTeX (inline \\( ... \\), display \\[ ... \\])",
    "conditions_latex": "Điều kiện xác định, tham số, quy ước",
    "solution_latex": "Lời giải chặt chẽ",
    "short_solution_latex": "Lời giải ngắn nhất đã thử",
    "answer_latex": "Đáp án",
    "creative_core": "Hạt nhân biến đổi cấu trúc",
    "difficulty_rationale": "Nút thắt và cơ sở đánh giá",
    "novelty_rationale": "Chưa xác minh nếu chưa có nguồn",
    "casio_assessment": "Khả năng kiểm tra/giải tắt",
    "competency_evidence": "Biểu hiện năng lực toán học",
    "needs_figure": false,
    "figure_prompt": "",
    "tikz_code": ""
  },
  "review": {
    "math": "NEEDS_REVIEW",
    "curriculum": "NEEDS_REVIEW",
    "novelty": "NEEDS_REVIEW",
    "latex_compile": "NOT_TESTED",
    "figure_verified": "NOT_APPLICABLE",
    "word_omml_verified": "NOT_TESTED",
    "blockers": []
  }
}
```

## Kiểm tra tối thiểu
- Đề bài, lời giải phải có nội dung; kiểm tra cú pháp LaTeX sơ bộ không thay thế trình biên dịch.
- Không xuất thành đề chính thức khi chưa được giáo viên duyệt.
- Điều kiện xác định, số nghiệm, các trường hợp biên phải có căn cứ toán học, không suy ra từ điểm số đánh giá AI.
- Khi có hình: prompt cần đối tượng, quan hệ, nhãn, góc nhìn, nét thấy/khuất, đơn vị khi có căn cứ; không tự thêm giả thiết.
- Word: sử dụng Equation theo OMML trong DOCX, không giả mạo Equation bằng chữ thô hay ảnh nếu thầy yêu cầu Equation chỉnh sửa được.

## Phân kỳ
- **V1 hiện thực:** dàn trang MathJax, 4 copy, copy prompt hình, xuất nguồn .tex, Word vô hiệu hóa rõ ràng.
- **V1.1:** kiểm tra biên dịch TeX và PDF thật, có log.
- **V1.2:** TeX → OMML → DOCX, kiểm thử phương trình chỉnh sửa được trong Word.
