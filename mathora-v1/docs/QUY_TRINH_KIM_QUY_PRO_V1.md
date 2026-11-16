# KIM QUY PRO – ANH CẢ
## QUY TRÌNH QUẢN LÝ MÃ NGUỒN, TRIỂN KHAI VÀ NGHIỆM THU ỨNG DỤNG

**Đơn vị tiếp nhận:** GS Rùa MATHORA  
**Phạm vi áp dụng:** Hệ sinh thái MATHORA  
**Phiên bản quy trình:** 1.0 – Ngày 13/11/2026

### I. NGUYÊN TẮC BẮT BUỘC

1. Không chỉnh sửa trực tiếp chức năng đã PASS nếu không có yêu cầu thay đổi được xác định rõ.
2. Không ghi đè toàn bộ tệp chỉ để sửa một chức năng nhỏ khi có thể sửa cục bộ.
3. Không lấy bản thử nghiệm làm bản chính thức.
4. Không đưa API key, mật khẩu, token hoặc thông tin học sinh lên GitHub.
5. Không báo PASS khi mới kiểm tra cú pháp hoặc kiểm thử bằng dữ liệu giả lập.
6. Mọi lần cập nhật phải có khả năng xác định phiên bản, truy nguyên thay đổi và khôi phục.

### II. KIẾN TRÚC QUẢN LÝ PHIÊN BẢN

MATHORA cần phân biệt ba trạng thái phát triển:

**1. DEVELOPMENT – Phát triển**

Nơi xây dựng chức năng, sửa lỗi, thử nghiệm giao diện và xử lý nghiệp vụ. Cho phép thay đổi thường xuyên nhưng phải ghi nhận nội dung sửa.

**2. STAGING – Kiểm thử tích hợp**

Nơi kiểm tra mã đã hoàn thiện, dùng cấu hình và dữ liệu thử nghiệm riêng khi có thể. Không để thao tác kiểm thử làm thay đổi dữ liệu thật.

**3. PRODUCTION – Chính thức**

Chỉ nhận bản đã nghiệm thu. Các thay đổi phải được kiểm soát; có phương án khôi phục nếu xảy ra sự cố.

Có thể tổ chức bằng nhánh Git riêng hoặc repository riêng tùy khả năng vận hành. Tuy nhiên, phải xác định rõ nhánh hoặc repository nào được GitHub Pages dùng để xuất bản.

### III. QUY TRÌNH CẬP NHẬT GITHUB

**Bước 1. Kiểm tra mã nguồn hiện tại**

Trước khi sửa phải xác định:

- Repository và nhánh đang sử dụng.
- Tệp cần thay đổi.
- Chức năng liên quan và các module đã PASS.
- Commit hoặc phiên bản có thể khôi phục.

**Bước 2. Xác định phạm vi thay đổi**

Ghi rõ chức năng cần sửa, phần được phép chỉnh và phần tuyệt đối không được tác động.

**Bước 3. Chỉnh mã tại môi trường phát triển**

Ưu tiên thay đổi cục bộ, tách module độc lập, giữ tương thích các giao diện và API đang sử dụng.

**Bước 4. Kiểm tra trước khi cập nhật**

Kiểm tra cú pháp, cấu trúc dữ liệu, lỗi JavaScript, liên kết, phân quyền và các chức năng liên quan.

**Bước 5. Commit có mô tả rõ ràng**

Ví dụ:

`fix(mathora): correct geometry validation without changing drawing engine`

Không dùng những thông điệp chung chung như “Update code” hoặc “Fixed”.

**Bước 6. Triển khai STAGING**

Đẩy mã thử nghiệm lên GitHub Pages STAGING. Kiểm tra đúng URL, đúng nhánh, đúng tệp, không nhầm sang PRODUCTION.

**Bước 7. Nghiệm thu**

Chỉ sau khi đủ kiểm thử mới hợp nhất mã và phát hành phiên bản chính thức.

### IV. QUẢN LÝ MODULE ĐÃ PASS

Mỗi module có một hồ sơ tối thiểu gồm:

| Trường | Nội dung |
| --- | --- |
| Module | Tên và mã chức năng |
| Phiên bản | Phiên bản được nghiệm thu |
| Commit | Mã commit chính thức |
| Trạng thái | DEVELOPMENT / STAGING / PASS / LOCKED |
| Kết quả kiểm thử | Các tình huống đã chạy |
| Phụ thuộc | Backend, API, dữ liệu, thư viện |
| Người nghiệm thu | Người có thẩm quyền xác nhận |

**LOCKED** nghĩa là không được tùy tiện sửa module đã nghiệm thu. Khi bắt buộc thay đổi, cần mở một yêu cầu thay đổi mới, kiểm thử lại và ghi nhận phiên bản thay thế.

### V. QUY TRÌNH KIỂM THỬ

MATHORA phải thực hiện ít nhất năm lớp kiểm tra:

1. **Kiểm tra cú pháp:** JavaScript, HTML, CSS và cấu trúc tệp.
2. **Kiểm tra chức năng:** Đầu vào, thao tác, kết quả và xử lý lỗi.
3. **Kiểm tra tích hợp:** Frontend, Backend, API, dữ liệu, phân quyền.
4. **Kiểm tra hồi quy:** Các module đã PASS vẫn hoạt động sau thay đổi.
5. **Kiểm tra thực tế:** Trên trình duyệt, máy tính, điện thoại hoặc PWA nếu có triển khai.

Với MATHORA, phải bổ sung kiểm định chuyên môn Toán học: dữ kiện, điều kiện xác định, kết quả, lời giải, hình vẽ, tính đúng đắn của mô hình và độ phù hợp với Chương trình GDPT 2018.

**Đặc biệt:** Mã vẽ chạy thành công không đồng nghĩa hình học đúng. AI sinh được lời giải không đồng nghĩa lời giải đã được thẩm định.

### VI. QUẢN LÝ GITHUB PAGES VÀ PWA

Trước khi công bố phải kiểm tra:

- Nguồn triển khai GitHub Pages.
- Đường dẫn tương đối giữa các tệp.
- Trường hợp mở trực tiếp một module.
- Khả năng tải bản mới và vấn đề bộ nhớ đệm.
- `manifest.json`, Service Worker nếu ứng dụng có PWA.
- Cơ chế cập nhật không làm mất dữ liệu đang nhập.
- Các chức năng cần đăng nhập không được truy cập trái quyền.

Không đổi tùy tiện `manifest.id`, `start_url`, `scope`, tên miền hoặc URL Backend của phiên bản chính thức.

### VII. QUẢN LÝ BACKEND VÀ DỮ LIỆU

Frontend và Backend phải sử dụng hợp đồng API được mô tả rõ: tên action, trường đầu vào, phản hồi, mã lỗi và quyền gọi.

Đặc biệt:

- Xác thực và phân quyền phải được kiểm tra tại Backend.
- Dữ liệu nhạy cảm không được nhúng vào HTML hoặc JavaScript công khai.
- Ghi dữ liệu cần chống trùng khi người dùng gửi lại.
- Hoạt động quan trọng phải có nhật ký.
- Mọi thay đổi cấu trúc dữ liệu phải có kế hoạch chuyển đổi và sao lưu.
- Không sử dụng dữ liệu giả lập để báo cáo kết quả thực tế.

### VIII. NGUYÊN TẮC BÁO CÁO TIẾN ĐỘ

Sử dụng các trạng thái:

- **CHƯA TRIỂN KHAI:** Chưa có mã hoàn chỉnh.
- **ĐÃ VIẾT MÃ:** Có mã nhưng chưa kiểm thử.
- **PASS CÚ PHÁP:** Mã hợp lệ, chưa chứng minh nghiệp vụ hoạt động.
- **PASS MÔ PHỎNG:** Đạt tình huống giả lập.
- **PASS TÍCH HỢP:** Đã kiểm thử hệ thống và Backend trong môi trường xác định.
- **PASS NGHIỆM THU:** Được kiểm tra thực tế và người có thẩm quyền xác nhận.
- **LOCKED:** Bản đã nghiệm thu và được bảo vệ thay đổi.

Không sử dụng từ PASS chung chung, không có điều kiện và minh chứng.

### IX. QUY TRÌNH PHÁT HÀNH CHÍNH THỨC

1. Hoàn tất chức năng và kiểm thử STAGING.
2. Kiểm tra hồi quy những module đã PASS.
3. Tổng hợp báo cáo thay đổi và các rủi ro còn lại.
4. Trình Chủ nhiệm sản phẩm nghiệm thu.
5. Ghi nhận phiên bản phát hành.
6. Triển khai PRODUCTION.
7. Kiểm tra sau phát hành.
8. Theo dõi lỗi và sẵn sàng khôi phục commit trước.

### X. YÊU CẦU RIÊNG ĐỐI VỚI GS RÙA MATHORA

GS Rùa MATHORA chịu trách nhiệm:

- Phân tách rõ bốn phân hệ luyện thi của MATHORA.
- Quản lý các module chuyên môn, thư viện bài toán và công cụ vẽ hình theo phiên bản.
- Bảo đảm việc bổ sung chức năng không làm thay đổi các module đã nghiệm thu.
- Kiểm định độc lập kết quả Toán học và độ chính xác hình vẽ.
- Không để API key hoặc dữ liệu người học xuất hiện trong repository công khai.
- Bàn giao đầy đủ mã, hướng dẫn, kết quả kiểm thử và lịch sử thay đổi cho Chủ nhiệm sản phẩm.

**Kết luận:** Chất lượng sản phẩm không chỉ nằm ở giao diện đẹp và mã chạy được, mà phải thể hiện ở tính đúng đắn, độ ổn định, khả năng bảo trì, bảo mật, truy nguyên và nghiệm thu rõ ràng.

**Kim Quy Pro – Anh Cả**  
*Bàn giao quy trình kỹ thuật cho GS Rùa MATHORA*
