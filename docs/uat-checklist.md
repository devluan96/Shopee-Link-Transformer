# UAT checklist for `staging -> main`

Dùng checklist này trên `https://test.hotsnew.click` trước khi merge từ `staging` sang `main`.

## 1. Đăng nhập và quyền truy cập

- Đăng nhập bằng tài khoản admin thành công
- Đăng nhập bằng tài khoản user thường thành công
- User không có quyền admin không nhìn thấy luồng quản trị ngoài phạm vi cho phép
- Workspace hiện đúng và không bị sai quyền `owner/editor/viewer`

## 2. Tạo link mới

- Tạo được link Shopee
- Tạo được link TikTok
- Link kết quả sinh ra dùng domain `test.hotsnew.click`
- Toast success hiển thị đúng domain test
- QR code sinh đúng domain test
- Copy link không còn trả về `hotsnew.click`

## 3. Public page và redirect

- Mở public URL trên `test.hotsnew.click` được
- Metadata/preview card hiển thị đúng title, description, image hoặc video
- Redirect tới link đích hoạt động đúng
- Nếu có step-2 flow thì step-2 hoạt động đúng
- Nếu có link hết hạn thì hành vi đúng như mong đợi

## 4. Chỉnh sửa và quản lý link

- Sửa title/description thành công
- Sửa short code hoặc slug thành công
- Xóa link thành công
- Danh sách link cập nhật đúng sau create/update/delete
- QR code và link trong danh sách vẫn dùng domain test

## 5. Upload media

- Upload thumbnail thành công
- Upload video thành công
- Preview video hiển thị đúng
- Quota video nếu có vẫn tính đúng

## 6. Analytics và tracking

- Click tracking vẫn ghi nhận
- Analytics page tải được
- Số click hiển thị không lỗi hoặc lệch rõ ràng
- Event click từ public page vẫn ghi nhận đúng

## 7. Thanh toán và subscription

- Pricing page tải được
- Các CTA nâng cấp gói không lỗi
- Nếu có manual payment flow thì submit/confirm flow không vỡ
- Redirect/callback không nhảy sai domain

## 8. Admin và cấu hình hệ thống

- Admin panel tải được
- Quản lý output domains không lỗi
- Approval/subscription update không lỗi
- Không có dữ liệu staging nào vô tình trỏ về live domain

## 9. Smoke test giao diện

- Desktop hiển thị đúng
- Mobile hiển thị đúng
- Không có lỗi console nghiêm trọng
- Không có request 4xx/5xx bất thường ở các luồng chính

## 10. Điều kiện được merge sang `main`

Chỉ merge khi:

- Không còn lỗi blocker
- Link mới sinh ra hoàn toàn dùng domain test
- Các luồng chính create/edit/delete/public page hoạt động bình thường
- CI `quality` pass trên PR `staging -> main`

## Gợi ý quy trình

1. Merge code vào `staging`
2. Đợi Vercel deploy `test.hotsnew.click`
3. Chạy checklist này
4. Nếu pass, mở PR `staging -> main`
5. Merge `main`
