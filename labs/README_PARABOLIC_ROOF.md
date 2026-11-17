# MATHORA LAB — TRẢI PHẲNG MÁI TRỤ PARABOL
Ngày 17/11/2026. **RESEARCH_ONLY; chưa phát hành bản chính thức.**

## Vị trí trong app
- Trang **Vẽ hình Toán học**: nút “Mở bài toán mái parabol (LAB)”.
- Trang **Sáng tạo bài toán**: nút “Kiểm thử mái parabol”.
- Địa chỉ tương đối của LAB: `./labs/parabolic-roof.html`.

## Kiểm thử
1. Tải về cùng thư mục `index.html` và `labs/parabolic-roof.html` của nhánh này (đảm bảo đường dẫn).
2. Mở `index.html` rồi đến Vẽ hình Toán học hoặc Sáng tạo bài toán.
3. Giữ mặc định nhịp 6m, độ cao 2m, công trình 12m, tôn rộng 7.50m, mép giữ 0.05m, n=8.
4. Kết quả chặn dưới: 7.455190149m > 7.45m; kết luận **không đủ tôn** không cần công thức tích phân độ dài cung.
5. Đổi số đoạn lên 64: chặn dưới khoảng 7.471617m, chặn trên 7.472398m, hai chặn tiến sát nhau.
6. Thử tôn rộng 8m và 7m để kiểm nghiệm hai nhánh “đủ” và “không đủ”; thử gần ngưỡng 7.47m với n=8 để hiện trạng thái “chưa kết luận”.
7. Kiểm tra nút Khôi phục, Sao chép đề bài, In phiếu.

## Đánh giá toán học
- Mặt cắt: `y=h(1-4x²/w²)`, `-w/2 ≤ x ≤ w/2`.
- Dây cung tạo **chặn dưới** `P_n ≤ L`.
- Đa giác tiếp tuyến bao cung tạo **chặn trên** `L ≤ T_n`. Với parabol, giao điểm của hai tiếp tuyến tại hai đầu một đoạn có hoành độ là trung điểm đoạn đó.
- Công thức Simpson n=4096 dùng **chỉ để đối chiếu số**, không phải lời giải dành cho học sinh CT2018.
- Quyết định “đủ” khi `T_n ≤ usable`; “thiếu” khi `P_n > usable`; còn lại cần tăng n hoặc đánh giá kỹ hơn.
- Tuyên bố chiều dài cung chính xác không được thay bằng độ dài dây.
- Kiểm thử toán học mẫu đã qua 7/7 quan hệ bất đẳng thức; 5 script trong app + LAB đã kiểm tra cú pháp; **chưa có test trình duyệt tự động và chưa test Gemini API**.

## Không vượt quyền
Thay đổi chỉ trên nhánh `research/creative-training-r1-20261117`. Không cập nhật `main`, không ghi Sheets, không lưu vào ngân hàng đề, không triển khai GitHub Pages production. Để người dùng mở được trực tiếp trên URL app chính thức cần có quy trình triển khai preview/tích hợp được phê duyệt.

## Mục tiêu học thuật
Đây là bài **nghiên cứu mô hình hóa**. Chưa chứng minh mới hoàn toàn, chưa thẩm định Vận dụng cao và chưa được dùng tự động để huấn luyện AI bằng dữ liệu đã phê duyệt.
