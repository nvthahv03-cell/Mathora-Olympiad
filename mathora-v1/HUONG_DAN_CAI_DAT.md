# MATHORA OLYMPIAD – CỔNG TÍCH HỢP V1 (13/11/2026)

## Mục tiêu

Giao diện **phục vụ ngay trên dự án Apps Script đang chứa Backend MATHORA.gs V2.3**, không phụ thuộc file://, không dùng `/api/ai` bên ngoài; sử dụng lại tất cả hàm Backend đã có:

- Tạo **bản nháp Gemini thật**: `maGenerate_`; **chưa kiểm định**.
- Gửi vào **MATHORA_STAGING thật**: `maSave_` (hồ sơ phải có `short_answer` và đáp ứng kiểm tra Backend).
- Tra cứu hồ sơ chờ: `ma23ListPending_`, `ma23GetPending_`.
- Chủ sở hữu từ chối: `ma23RejectPending_`.
- Chủ sở hữu xác nhận có minh chứng: `ma23AttestPending_` → `DRAFT_REVIEWED`.
- Chủ sở hữu duyệt cuối: `maApprove_` → `APPROVED`.
- Tra cứu Kho: `maList_`, `maGet_`; tra cứu bài đủ điều kiện làm đề: `ma23ListExamEligible_`.

**Không** thay đổi ba module đã PASS: MATHORA.gs (trừ đúng 1 dòng `doGet`), MathoraSangTaoPro.gs V2.3.1 và MathoraKiemDinhDaThucV2.gs.

## Thầy thao tác trên dự án Apps Script hiện có

1. **Sao lưu mã nguồn Apps Script** hiện đang vận hành.
2. Chọn **+ → Script**: tạo tệp tên `MathoraWebV1.gs` và dán nguyên nội dung tệp cùng tên trong gói.
3. Chọn **+ → HTML**: tạo tệp tên `MathoraWebV1` và dán nguyên nội dung tệp `MathoraWebV1.html`.
4. Vào tệp `MATHORA.gs` hiện có, tìm:

   ```js
   function doGet(e){const action=String((e&&e.parameter&&e.parameter.action)||'health');
   ```

   Chèn **ngay sau dòng này** một dòng:

   ```js
   if(action==='app')return mathoraV1Ui();
   ```

   **Không thay toàn bộ `MATHORA.gs` hiện hữu.** Nếu doGet viết khác, chỉ thêm nhánh `action==='app'` trước nhánh từ chối request, giữ nguyên hoạt động `health`.
5. Lưu. Trong **Deploy → Manage deployments → Edit**, tạo **New version**, triển khai lại đúng Web App MATHORA. Chỉ cấp quyền truy cập hạn chế cho người có thẩm quyền khi kiểm thử; không mở công khai như một dịch vụ nhiều người dùng.
6. Mở đường dẫn Web App đã triển khai và **thêm `?action=app` vào cuối URL `/exec`**. Nếu URL đã có `?` thì dùng `&action=app`.
7. Điền **MATHORA_TEACHER_KEY** hoặc **MATHORA_OWNER_KEY** của riêng mình (đã cấu hình trong Script Properties); **không nhập `MATHORA_GEMINI_KEY`**. Key không được ghi trong URL hay lưu localStorage.

## Thử nghiệm thật (chỉ làm trên dữ liệu thử nghiệm)

1. **Kết nối:** bấm *Xác thực và kiểm tra*. Kiểm tra vai trò `teacher` hoặc `owner` và thông tin cấu hình. Đây mới chỉ là xác thực.
2. **Tạo bài:** nhập phạm vi, YCCĐ, năng lực; bấm *Gọi Gemini tạo bản nháp*. Nếu Gemini trả lỗi, kiểm tra log Apps Script và cấu hình mô hình, không suy diễn PASS.
3. **Đáp án:** Backend `maGenerate_` V2.3 chưa bắt buộc Gemini xuất `short_answer`. Giáo viên phải tự kiểm tra và điền trường JSON `"short_answer": "..."` (tối đa 4 ký tự), bảo đảm lời giải khớp đáp án; chưa xác nhận Toán học bằng AI.
4. **STAGING:** bấm *Gửi hồ sơ vào STAGING thật*. Kiểm tra trong Google Sheets bảng `MATHORA_STAGING` có mã `MS-...` mới, trạng thái `WAITING_HUMAN`. Nếu không có bản ghi, chưa PASS.
5. **Thẩm định:** trên tab *Chờ thẩm định*, bấm mã `MS-...`. Chỉ chủ sở hữu mới có quyền từ chối hoặc nhập minh chứng. Cần điền **các minh chứng thực chất**: lời giải kiểm định, đối chiếu CT2018, độ khó, tính mới/trùng lặp, Casio, nhận xét, đáp án độc lập; xác nhận đúng sự thật. Không tích bừa cho đủ điều kiện.
6. **Kho:** sau khi xác nhận và ghi thật, mở tab Kho để tìm trạng thái `DRAFT_REVIEWED`, rà soát mã bài và hash, ghi quyết định cuối. Bấm *Phê duyệt* nếu thực sự đồng ý; bài chuyển `APPROVED`.
7. **Đối chiếu:** chọn bộ lọc *Đủ điều kiện tạo đề* để xác minh Backend trả về bài vừa duyệt. Đối chiếu Google Sheets `MATHORA_PROBLEMS`, `MATHORA_AUDIT`.

## Giới hạn / chưa PASS

- Chưa triển khai lên dự án Google Apps Script của thầy; chưa có xác nhận HTTP Web App, đọc/ghi Google Sheets, Gemini thật trong phiên cài đặt này.
- Đây là **cổng nghiệp vụ**, không phải toàn bộ giao diện MATHORA V0.9 được chuyển vào Apps Script. Các chức năng vẽ hình, giao nhiệm vụ HS, phân hệ luyện thi và xuất Word/PDF chưa tích hợp.
- Luồng **GS Rùa ChatGPT tự động** chưa kết nối vì không có API ChatGPT tích hợp, vẫn cần JSON thủ công.
- Backend V2.3 có quy trình PRO 7 bước phục vụ thử nghiệm trước đó, nhưng `mathoraProBatDau` sử dụng yêu cầu DEMO cố định. Cổng V1 **không mạo nhận** đã nối quy trình đó với yêu cầu tự do của giáo viên. Cổng này dùng đường `maGenerate_` thật và các cổng duyệt thật.
- Teacher/Owner key là xác thực prototype; trước khi mở đa người dùng phải thay bằng danh tính và phân quyền được xác thực máy chủ. Các hàm công khai sẵn có trong cùng dự án GAS cũng cần rà soát quyền trước khi triển khai công khai.

## Phép kiểm thử cục bộ

- Cú pháp: `MATHORA.gs` (phiên bản nguồn V2.3 + 1 dòng), `MathoraWebV1.gs`, JS trong `MathoraWebV1.html` đều được Node.js kiểm tra cú pháp.
- 12/12 trường hợp điều phối/phân quyền mô phỏng đạt bằng `test_bridge.js`.
- **Không** gọi mạng, Gemini hoặc Apps Script/Sheets trong các kiểm thử cục bộ. Không ghi PASS hệ thống trực tuyến.

## Lưu ý quyền và an toàn dữ liệu

- Không lưu khóa vào JSON, ZIP, ảnh chụp, nhật ký hoặc thông báo Zalo.
- Không đưa kho thật lên dịch vụ công khai khi chưa có SSO và kiểm thử bảo mật.
- Không sửa hoặc xóa các sheet MATHORA hiện có chỉ để chạy thử.
- `RETURN_REVISION` của giao diện V0.9 cũ không tự động trở thành bản ghi của STAGING V2.3; cần một luồng nhập/xử lý riêng nếu muốn lưu lịch sử phản biện GS Rùa lên Backend.