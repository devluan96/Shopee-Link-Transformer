# Staging deployment flow

Mục tiêu:

- `staging` hoặc `test` có domain riêng để kiểm thử như app live
- chỉ khi test ổn mới merge sang `main` để lên production
- chặn lỗi cơ bản bằng CI trước khi merge

## Flow đề xuất

1. Developer làm việc trên `feature/*`
2. Tạo PR vào `staging`
3. GitHub Actions chạy `lint`, `test`, `build`
4. Vercel tự deploy branch `staging` lên domain test, ví dụ `test.hotsnew.click`
5. QA/UAT test trên domain test
6. Khi ổn, tạo PR `staging -> main`
7. CI chạy lại
8. Merge vào `main`, Vercel deploy production

## Thiết lập GitHub

Tạo branch mới:

- `staging`

Thiết lập branch protection:

- `main`: bắt buộc PR, cấm push trực tiếp, bắt buộc pass workflow `CI / quality`
- `staging`: nên bắt buộc PR và pass workflow `CI / quality`

Workflow CI đã có sẵn ở [ci.yml](/c:/projects/Shopee-Link-Transformer/.github/workflows/ci.yml).

## Thiết lập Vercel

Giữ production branch là:

- `main`

Tạo domain test riêng, ví dụ:

- `test.hotsnew.click`

Trong Vercel, gắn domain test này vào branch `staging` bằng branch domain hoặc custom preview domain.

Kết quả mong muốn:

- `main` -> `https://hotsnew.click`
- `staging` -> `https://test.hotsnew.click`

## Environment variables

Thiết lập riêng cho `Preview/Staging` và `Production`.

Biến quan trọng:

- `APP_BASE_URL`
- `VITE_APP_BASE_URL`
- `LINK_OUTPUT_DOMAINS`
- `VITE_LINK_OUTPUT_DOMAINS`

Ví dụ `staging`:

```env
APP_BASE_URL=https://test.hotsnew.click
VITE_APP_BASE_URL=https://test.hotsnew.click
LINK_OUTPUT_DOMAINS=test.hotsnew.click
VITE_LINK_OUTPUT_DOMAINS=test.hotsnew.click
```

Ví dụ `production`:

```env
APP_BASE_URL=https://hotsnew.click
VITE_APP_BASE_URL=https://hotsnew.click
LINK_OUTPUT_DOMAINS=hotsnew.click
VITE_LINK_OUTPUT_DOMAINS=hotsnew.click
```

App đã được chỉnh để domain mặc định lấy từ các biến này thay vì hardcode `hotsnew.click` ở các luồng chính.

## Dữ liệu staging

Có 2 cách:

1. Dùng chung Supabase với production.
2. Tách riêng Supabase cho staging.

Khuyến nghị:

- dùng Supabase riêng cho staging nếu muốn test an toàn
- nếu chưa tách được ngay, ít nhất phải dùng `LINK_OUTPUT_DOMAINS` riêng cho staging để không tạo nhầm link live

Nếu staging cần test upload/video/payment/auth thật, nên tách luôn:

- Supabase project
- Cloudinary folder/bucket
- payment callback config
- admin/test user

## Checklist rollout

- tạo branch `staging`
- thêm domain `test.hotsnew.click` vào Vercel
- set env `Preview/Staging`
- set env `Production`
- bật branch protection cho `staging` và `main`
- merge thử một PR vào `staging`
- test trên domain test
- merge `staging` vào `main`
