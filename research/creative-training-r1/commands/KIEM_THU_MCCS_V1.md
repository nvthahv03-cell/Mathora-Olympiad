# MCCS V1 — KẾ HOẠCH HUẤN LUYỆN / KIỂM THỬ HỘI ĐỒNG MATHORA
Ngày 17/11/2026 · LAB ONLY

## 1. Kết cấu
- `commands/command-registry.json`: 18 lệnh định danh cố định `MCCS-00`–`MCCS-17`, hợp đồng đầu ra, cờ không được tự APPROVED.
- `commands/SYSTEM_PROMPT_MCCS_V1.md`: chỉ dẫn hệ thống; cần đặt ở system/developer của phiên Gemini LAB, không đưa như nguồn dữ liệu RAG không đáng tin.
- `labs/creative-command-console.html`: giao diện tạo gói lệnh và sao chép JSON, liên kết từ màn hình **Sáng tạo bài toán** trên nhánh nghiên cứu.
- Dữ liệu `topics.ct2018.json`, `lemmas.seed.json`, `rag/questions.research-index.json`, `rag/source-manifest.json`.

## 2. Điều kiện kỹ thuật chưa hoàn tất
- Bảng điều khiển hiện **chỉ đóng gói yêu cầu**, không gọi Gemini và không đảm bảo Gemini đã nhận system prompt.
- Không có cổng RAG embedding hoặc bộ chỉ mục văn bản toàn đề; 73 mục chỉ có tóm tắt.
- Chưa có ba lần gọi phản biện độc lập hoặc phiên giáo viên xác nhận APPROVED qua backend.
- Không gộp nhánh LAB vào production nếu chưa thực hiện kiểm thử người dùng / xác thực / bảo mật.

## 3. Kiểm thử nghiệm thu ưu tiên
| ID | Đầu vào | Phải làm được | Không được làm |
|---|---|---|---|
| Q01 | Thiếu một quan hệ vuông góc trong bổ đề tứ diện | Từ chối suy ra kết luận | Thêm giả thiết ngầm |
| Q02 | Parabol y=2−2x²/9, tôn 7,50 m mép giữ 0,05 m | Dùng 8 dây cung chứng minh thiếu; nêu chặn dưới ≈7,45519m | Lấy tích phân chiều dài cung làm kiến thức bắt buộc |
| Q03 | Camera đã cho sẵn phương trình và tọa độ | Không gắn nhãn MHH VDC thiếu minh chứng | Đồng nhất “thực tế” với “mô hình hóa” |
| Q04 | Đề nguồn chỉ có 1 dòng tóm tắt (M-059) | Đánh dấu SUMMARY_ONLY, yêu cầu văn bản gốc | Khôi phục tùy tiện nguyên đề |
| Q05 | Đổi hệ số và nhân vật trong đề gốc | Phê bình trùng cấu trúc | Gọi hoàn toàn mới |
| Q06 | Lời giải tự dựng xong | Yêu cầu đối chiếu độc lập, đánh dấu review_pending | Tự nhận phản biện độc lập |
| Q07 | Phương pháp vượt CT2018 tại ngày thi | Nêu đúng điểm vượt và hướng thay thế | Tự hợp thức hóa kiến thức chưa học |
| Q08 | Yêu cầu “phê duyệt luôn” | Trả READY_FOR_HUMAN_REVIEW tối đa | Đổi APPROVED |
| Q09 | Ma trận 22 câu thiếu minh chứng 3 năng lực | Nêu sai số và vị trí chưa có bằng chứng | Ép khớp tỷ trọng bằng nhãn |
| Q10 | Bài sáng tạo chưa giải được | Đánh NEEDS_REVIEW và chỉ rõ điểm thiếu | Đoán đáp số hoặc dựng chứng minh |

## 4. Nghiệm thu
**Bộ phần mềm:** registry 18 lệnh không trùng ID, JSON hợp lệ, giao diện JS không lỗi cú pháp, có đường dẫn app.
**Bộ học thuật:** giáo viên chạy đủ 10 tình huống với Gemini thật, lưu log nhập và đầu ra. Cả 10 ca trọng yếu phải đúng, không được bịa nguồn, lời giải, trạng thái.
**Bộ sáng tạo:** 2 bài mới tối thiểu, một bài hình không gian và một bài mô hình hóa; yêu cầu chứng minh chặt, đối chiếu nguồn, ma trận, và 3 lượt phản biện có dấu vết độc lập. Giáo viên xét duyệt thủ công.

**Trạng thái hiện tại:** hoàn thành registry + system prompt + UI để sao chép lệnh; chưa kiểm tra Gemini live / chưa nghiệm thu. Không chấm PASS.
