# MATHORA – Kết nối trực tiếp theo mô hình HVA–EDOS (14/11/2026)

**Kiến trúc chính thức:** GitHub Pages → Google Apps Script V2.3 → Google Sheets. Không cần Cloudflare.

## Đã sửa trực tiếp trên GitHub

- `mathora-backend-client.js`: POST trực tiếp `/exec` bằng `Content-Type: text/plain;charset=UTF-8`, body JSON, `idToken` phiên đăng nhập Google. **Không gửi teacher/owner key** từ trình duyệt.
- `mathora-backend-client.js`: GET `/exec?action=health`, kiểm tra `service=MATHORA`, hiển thị tình trạng Gemini/Sheets mà không đồng nhất với nghiệm thu.
- Giữ nguyên 7 bước nghiệp vụ: Gemini → STAGING → list/get pending → owner thẩm định → owner duyệt → list/get Kho → listExamEligible.
- `mathora-backend-config.js`: endpoint Apps Script của thầy giữ nguyên; chỉ cần Google OAuth **Web Client ID công khai** khi Backend có khả năng nhận ID token.
- `backend/MATHORA_V23_GOOGLE_AUTH_ADDON.gs`: hàm hỗ trợ mới, **KHÔNG phải backend thay thế**. Không thay đổi hàm tạo bài, kiểm định, Kho, Sheets.

## Việc bắt buộc trên Apps Script (một lần, vì GitHub không có quyền sửa hoặc deploy dự án Apps Script)

**Chỉ bổ sung xác thực Google vào doPost đang có. KHÔNG tạo hàm doPost thứ hai.** Sao lưu phiên bản đang chạy trước khi sửa, ưu tiên kiểm thử trên bản sao Apps Script và bản sao Sheets.

### 1. Thêm một tệp .gs, không có khóa trong mã

Sao chép nội dung `backend/MATHORA_V23_GOOGLE_AUTH_ADDON.gs` vào một tệp trong dự án Apps Script V2.3 TEST. Đây là hàm `maWebGoogleAuth_(idToken)` bổ sung, không gọi tự động.

### 2. Thay đúng phần xác thực trong doPost

Trong `MATHORA.gs`, tìm:
```js
const owner=maAuthorized_(p.key,'MATHORA_OWNER_KEY');
const teacher=owner||maAuthorized_(p.key,'MATHORA_TEACHER_KEY');
```

Thay bằng:
```js
const webIdentity=maWebGoogleAuth_(p.idToken);
const owner=webIdentity.owner||maAuthorized_(p.key,'MATHORA_OWNER_KEY');
const teacher=owner||webIdentity.teacher||maAuthorized_(p.key,'MATHORA_TEACHER_KEY');
```

Giữ nguyên toàn bộ `switch(action)` và các điều kiện phê duyệt của V2.3.

Trong cuối `doPost`, tìm **duy nhất**:
```js
return maJson_(result);
```
và thay **ở trong doPost** bằng:
```js
return maJson_(Object.assign({},result,{authenticatedRole:owner?'owner':'teacher'}));
```
Điều này giúp giao diện nhận biết quyền `owner` sau khi Backend đã xác minh. Không tin vào `role` do trình duyệt gửi.

### 3. Cài Script Properties (tại Apps Script; không trên GitHub)

- `MATHORA_WEB_CLIENT_ID`: Google OAuth Client ID loại **Web application**, ví dụ `xxx.apps.googleusercontent.com`, JavaScript authorized origin: `https://nvthahv03-cell.github.io`.
- `MATHORA_WEB_OWNER_EMAILS`: danh sách email của chủ sở hữu, phân cách dấu phẩy.
- `MATHORA_WEB_TEACHER_EMAILS`: danh sách email giáo viên được phép, phân cách dấu phẩy.

**Không thay hoặc xóa** `MATHORA_DB_ID`, `MATHORA_GEMINI_KEY`, `MATHORA_TEACHER_KEY`, `MATHORA_OWNER_KEY`. Không đưa giá trị bí mật vào GitHub.

### 4. Deploy bản Backend TEST

Tạo phiên bản Deploy mới từ dự án Apps Script TEST. Nếu dùng URL Web App mới, chỉ sửa giá trị công khai `endpoint` và `healthUrl` trong `mathora-backend-config.js` cho đúng URL bản TEST. Xác minh `?action=health` còn hoạt động.

### 5. Kích hoạt đăng nhập GitHub Pages

Trong `mathora-backend-config.js`, đặt `googleClientId` bằng **Web Client ID công khai** ở bước 3. Không điền Google client secret.

### 6. Kiểm thử có minh chứng, không dùng dữ liệu production

- GET health trả đúng phiên bản; mở tab riêng là kiểm chứng riêng khỏi `fetch`.
- Đăng nhập email không trong allowlist → bị từ chối.
- Giáo viên xem pending được nhưng không thể `approveProblem` và `attestPending`.
- Owner được thực hiện đúng quyền, không vượt bước thẩm định.
- Sinh Gemini (bản nháp) → thêm đáp án ngắn → STAGING → mở lại từ Sheets TEST → minh chứng → DRAFT_REVIEWED → APPROVED → đủ điều kiện đề thi.
- Test hồ sơ bị sửa ngoài quy trình, hash sai, phiên bản sai, lưu trùng và lỗi CORS. Nếu `fetch` bị CORS do Web App/redirect, báo FAIL có log; không dùng `mode:no-cors` hay khóa client để né lỗi.

## Phân biệt PASS

- **PASS mã nguồn:** cú pháp và các lời gọi action được kiểm tra tại GitHub.
- **CHƯA PASS tích hợp:** chưa cập nhật doPost lên Apps Script và chưa có `MATHORA_WEB_CLIENT_ID` thực tế; đăng nhập/ghi Sheets chưa thực hiện.
- Chỉ ghi **PASS nghiệp vụ** khi có ID hồ sơ, SHA256/phiên bản, log Apps Script và dữ liệu đọc lại từ Sheets TEST.

### Tại sao không dùng khóa Backend cũ trực tiếp trong GitHub?

Khóa `MATHORA_TEACHER_KEY` và `MATHORA_OWNER_KEY` là bí mật máy chủ; mọi người xem mã JavaScript GitHub Pages có thể đánh cắp nếu nhúng khóa vào đó. ID token đăng nhập Google chỉ có hiệu lực ngắn hạn, có danh tính và được backend xác minh chữ ký/hết hạn/audience/allowlist bằng dịch vụ Google.

## Ghi chú bảo tồn dự án

Không xóa `gateway/` hoặc tài liệu cũ khỏi lịch sử repository; **ứng dụng hiện tại không gọi Gateway**. Các tệp `gateway/` chỉ là phương án cũ, không thuộc triển khai đã chốt. Không thay giao diện hoặc nghiệp vụ Toán đã có.

**Trạng thái: ĐÃ SỬA FRONTEND; ĐÃ CHUẨN BỊ ADDON BACKEND; CHƯA DEPLOY ADDON VÀ CHƯA PASS TÍCH HỢP.**
