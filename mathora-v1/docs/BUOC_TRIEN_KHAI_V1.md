# MATHORA OLYMPIAD V1 — BÀN GIAO BẢN CÓ THỂ TRIỂN KHAI

**Ngày:** 13/11/2026  
**Trạng thái:** ĐÃ VIẾT MÃ · PASS CÚ PHÁP · PASS MÔ PHỎNG (24/24 trong gói phát hành cục bộ)  
**Chưa xác nhận:** Apps Script TEST, Gemini thật, Google Sheets TEST, phê duyệt Kho, nghiệm thu chủ nhiệm.

## Bản có thể chạy ở đâu?
`MathoraWebV1.html` dùng `google.script.run`; chức năng nghiệp vụ chạy được khi tệp HTML này được phục vụ bằng **HtmlService trong cùng project Google Apps Script Backend V2.3**. Không thể chỉ mở `MathoraWebV1.html` bằng GitHub Pages và gọi Backend an toàn.

## Cài bản TEST (không sửa dữ liệu thật)
1. Sao lưu project Backend V2.3 và cơ sở dữ liệu.
2. Trong Google Apps Script, tạo **bản sao project** để kiểm thử. Tạo Google Sheets **TEST riêng**.
3. Trên bản sao project, dùng **Script Properties** (không ghi vào file):  
   - `MATHORA_DB_ID` = ID Google Sheets TEST  
   - `MATHORA_V1_TEST_DB_ID` = cùng ID Google Sheets TEST  
   - `MATHORA_V1_TEST_MODE` = `YES`  
   - Thiết lập `MATHORA_GEMINI_KEY`, `MATHORA_TEACHER_KEY`, `MATHORA_OWNER_KEY` theo cơ chế hiện có, **giữ kín**.
4. Thêm file Script `MathoraWebV1.gs` và file HTML tên `MathoraWebV1` bằng mã trong repo. **Không thay ba module Backend đã PASS.**
5. Trong `doGet(e)` hiện có, ngay sau dòng tính `action`, chèn **một dòng duy nhất**:
   ```js
   if(action==='app')return mathoraV1Ui();
   ```
   Không tạo thêm `doGet` trùng.
6. Deploy bản **TEST** bằng Web App giới hạn người dùng. Mở `[WebApp TEST]/exec?action=app`.
7. Kiểm thử lần lượt: kết nối (phải có `stagingWriteEnabled: true` ở health của bridge) → tạo nháp AI → bổ sung `short_answer` (tối đa bốn ký tự) → gửi STAGING TEST → đọc lại → ghi nhận thẩm định có minh chứng → duyệt Kho TEST.
8. Ghi ID, phiên bản, log và minh chứng thực tế. Chỉ sau khi Chủ nhiệm nghiệm thu mới được cân nhắc production.

## Chốt an toàn
- Nếu `MATHORA_V1_TEST_MODE` khác `YES`, hoặc ID TEST không khớp ID DB trong Script Properties, **toàn bộ action tạo AI/ghi/thẩm định/duyệt bị khóa**.
- Không chuyển cờ TEST sang production.
- Không công khai Web App shared-key cho nhiều người dùng; phải thay bằng cơ chế xác thực danh tính và phân quyền server.
- Không đưa khóa hoặc dữ liệu học sinh lên GitHub.
- Không đổi GitHub Pages, service worker, manifest và nhánh `main` đã tồn tại.

## Mã nguồn
- [Bridge](../MathoraWebV1.gs)
- [HTML](../MathoraWebV1.html)
- [Kế hoạch 12 tình huống nghiệm thu](KE_HOACH_STAGING_V1.md)
- [Sổ trạng thái module](SO_THEO_DOI_MODULE.md)
- [Quy trình Kim Quy Pro](QUY_TRINH_KIM_QUY_PRO_V1.md)

### Điểm phải nói đúng
GitHub lưu **mã nguồn chạy được khi triển khai đúng môi trường**, không đồng nghĩa Web App đã được cập nhật trên tài khoản người dùng. Kết quả health 2.3 chỉ kiểm tra đường dẫn, chưa kiểm chứng Gemini/Sheets. **Chưa báo PASS tích hợp hoặc nghiệm thu.**
