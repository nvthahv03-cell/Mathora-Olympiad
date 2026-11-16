# MATHORA V1 – KẾ HOẠCH STAGING VÀ TIÊU CHÍ NGHIỆM THU

**Ngày:** 13/11/2026  
**Chủ nhiệm sản phẩm:** Tư lệnh Thà  
**Quy chuẩn:** Kim Quy Pro 1.0  
**Nhánh phát triển:** `develop/mathora-v1-apps-script`  
**Nhánh PRODUCTION hiện có:** `main` – KHÔNG SỬA  
**Trạng thái:** ĐÃ VIẾT MÃ trang theo dõi STAGING; CHƯA PASS TÍCH HỢP.

## 1. Sự khác biệt giữa GitHub Pages và Apps Script
- `docs/index.html` là **bảng kiểm thử tĩnh, chỉ đọc**, không gửi khóa hoặc tạo bài. Nằm trên nhánh phát triển, **chưa xác nhận URL Pages được xuất bản**.
- `mathora-v1/MathoraWebV1.html` cần `google.script.run` và `HtmlService`. Chạy trực tiếp trên GitHub Pages sẽ KHÔNG gọi được bridge. Không dùng giao diện HTML này như một trang Pages hoạt động thật.
- `mathora-v1/MathoraWebV1.gs` được cài vào cùng dự án Apps Script có `MATHORA.gs` V2.3 trong **bản sao TEST**, không đụng bản production trước khi nghiệm thu.
- GitHub Pages chỉ có một cấu hình nguồn xuất bản cho một repository; **không tự chuyển nguồn Pages sang nhánh này** nếu đang có website chính thức. Có thể dùng repository STAGING riêng hoặc workflow Pages sau khi thẩm định cấu hình hiện tại.

## 2. Yêu cầu trước triển khai Apps Script TEST
1. Sao lưu project Apps Script và Google Sheets đã chạy thật.
2. Tạo **bản sao dự án Apps Script** và bảng Sheets riêng cho dữ liệu TEST, giới hạn người truy cập.
3. Xác định chủ sở hữu, cấu hình quyền thực thi và truy cập; khóa để trong Script Properties của TEST, không đưa vào GitHub hoặc ảnh.
4. Đối chiếu các hành động cầu nối với hàm đã có: `maGenerate_`, `maSave_`, `ma23ListPending_`, `ma23GetPending_`, `ma23AttestPending_`, `ma23RejectPending_`, `maGet_`, `maList_`, `maApprove_`.
5. Thêm đúng hai tệp `MathoraWebV1.gs` và `MathoraWebV1.html`; chỉ bổ sung nhánh `if(action==='app')return mathoraV1Ui();` trong `doGet` test.
6. Mở `/exec?action=app` trên deployment TEST và thử bằng tài khoản hợp lệ.

## 3. Bộ kiểm thử bắt buộc

| Mã | Lớp | Tình huống | Bằng chứng PASS |
| --- | --- | --- | --- |
| ST01 | Cú pháp | Kiểm JS/HTML, GS V8 và mã cầu nối | Log kiểm tra và commit |
| ST02 | Chức năng | Người dùng không có mã bị từ chối | Ảnh/log phản hồi từ TEST |
| ST03 | Phân quyền | Giáo viên không được phép thẩm định/duyệt | Log từ TEST |
| ST04 | Tích hợp AI | Gemini sinh nội dung có scope/YCCĐ/năng lực hợp lệ | Job ID + log không chứa bí mật |
| ST05 | Tích hợp dữ liệu | Bản nháp có đáp án vào STAGING TEST và đọc lại | ID + hash + trạng thái |
| ST06 | Kiểm định | Bản thiếu đáp án hoặc sai điều kiện bị từ chối | Log từ TEST |
| ST07 | Human gate | Xác nhận minh chứng mới chuyển DRAFT_REVIEWED | Phiên bản/hash, log |
| ST08 | Publication | Chủ sở hữu duyệt bài đã thẩm định, Kho ghi APPROVED | ID Kho + biên bản |
| ST09 | Bảo vệ | Bài BLOCKED không vào Kho qua đường tắt | Kiểm tra dữ liệu TEST |
| ST10 | Hồi quy | Kiểm các module V2.3 đã PASS | Log thẩm định lại |
| ST11 | Hiện trường | Kiểm Chrome máy tính và điện thoại, thao tác lại | Ảnh hiện trường |
| ST12 | Nghiệm thu | Chủ nhiệm sản phẩm xác nhận | Biên bản, commit, thời điểm |

Mỗi test ghi phiên bản, commit, deployment TEST, thời gian, ID của dữ liệu giả lập, người kiểm tra, kết quả và đường dẫn chứng cứ; không lưu khóa hoặc nội dung nhạy cảm vào log.

## 4. Rủi ro chưa đóng
- Phản hồi `health ok:true` chỉ chứng minh phiên đang đáp ứng, **không** kiểm nghiệm Gemini/Sheets/phê duyệt.
- Mã owner/teacher kiểu shared secret chỉ phù hợp thử nghiệm hạn chế; cần SSO/xác thực danh tính trên server trước triển khai rộng.
- GitHub Pages không gọi trực tiếp `google.script.run`; backend và frontend cần cơ chế triển khai thích hợp.
- Bài toán GS Rùa `RETURN_REVISION` đã thử qua JSON cục bộ, **không** tự được nhập vào STAGING V2.3.
- Frontend V1 chưa bao gồm bốn phân hệ luyện thi, module vẽ hình và xuất học liệu Word/PDF.

## 5. Cổng phát hành
- DEVELOPMENT: mã nguồn, review, mô phỏng, nguồn STAGING nhánh riêng.
- STAGING: chỉ khi cả trang thử và Apps Script TEST được triển khai và có bằng chứng.
- PASS TÍCH HỢP: ST02–ST10 có bằng chứng thực tế trong môi trường TEST.
- PASS NGHIỆM THU: Chủ nhiệm xác nhận ST11–ST12.
- PRODUCTION: chỉ sau khi PASS NGHIỆM THU và có cách khôi phục commit/phiên bản trước.

**Chưa chuyển GitHub Pages đang có, chưa triển khai Backend thật, chưa thay `main`.**

## 6. Chốt bảo vệ V1 vừa bổ sung (chỉ môi trường TEST)
Trong `MathoraWebV1.gs`, các thao tác `generateDraft`, `stageDraft`, `rejectPending`, `attestPending`, `approveProblem` bị khóa mặc định. Chỉ mở khi Script Properties của **bản sao Apps Script TEST** có:
- `MATHORA_V1_TEST_MODE` = `YES`
- `MATHORA_V1_TEST_DB_ID` = đúng chuỗi ID của Google Sheets **TEST**
- `MATHORA_DB_ID` = cùng ID TEST nói trên.

**Không thiết lập các biến TEST trên dự án production.** Cơ chế này bảo vệ khỏi cấu hình nhầm, không thể tự xác nhận DB thực sự là TEST nếu người cấu hình cố tình dùng ID dữ liệu production. Chủ nhiệm phải kiểm tra ID Sheets trước khi mở cổng ghi.

`health`, `listPending`, `getPending`, `listKho`, `getProblem`, `listExamEligible` chỉ đọc; yêu cầu xác thực hợp lệ vẫn được giữ nguyên.

## 7. Kết quả đối chiếu hợp đồng API (nguồn MATHORA.gs V2.3)
- `maGenerate_` nhận `scope, learningOutcome, competency`, sinh `problem` và KHÔNG phát hành.
- `maSave_` ghi STAGING, nhận `problem`; yêu cầu `short_answer` phải được bổ sung trước khi bấm gửi.
- `ma23GetPending_` trả `sourceHash`; `ma23AttestPending_` kiểm tra `expectedHash` và các trường `evidence`.
- `maApprove_` chỉ nhận `DRAFT_REVIEWED` có `human_validation` hợp lệ cùng phiên bản/hash.
- Kiểm tra cú pháp mã bridge và **8 tình huống mô phỏng bổ sung cho chốt TEST**: đạt trong runtime JS biệt lập; chưa chạy Apps Script/Sheets thật.

Không sử dụng kết quả trên để báo PASS TÍCH HỢP.
