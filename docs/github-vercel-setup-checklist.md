# GitHub + Vercel setup checklist

Checklist ngắn để bật flow `test -> live` cho app này.

## 1. Local Git

Tạo branch `staging` và đẩy lên remote:

```powershell
git checkout -b staging
git push -u origin staging
git checkout main
```

## 2. GitHub Branch Protection

Vào:

- `Settings`
- `Branches`
- `Add branch ruleset` hoặc `Add branch protection rule`

Thiết lập cho `main`:

- Branch name pattern: `main`
- Require a pull request before merging: `On`
- Require status checks to pass before merging: `On`
- Required check: `quality`
- Block force pushes: `On`
- Restrict deletions: `On`

Thiết lập cho `staging`:

- Branch name pattern: `staging`
- Require a pull request before merging: `On`
- Require status checks to pass before merging: `On`
- Required check: `quality`

## 3. Vercel Production Branch

Vào project trên Vercel:

- `Settings`
- `Git`

Xác nhận:

- Production Branch = `main`

## 4. Vercel Test Domain

Vào:

- `Settings`
- `Domains`

Thêm domain test:

- `test.hotsnew.click`

Sau đó gắn domain này cho branch `staging` bằng branch domain hoặc custom environment domain nếu project của bạn đang dùng flow preview/staging.

Kết quả mong muốn:

- `main` -> `https://hotsnew.click`
- `staging` -> `https://test.hotsnew.click`

## 5. Vercel Environment Variables

Vào:

- `Settings`
- `Environment Variables`

Thiết lập cho `Preview` hoặc `Staging`:

```env
APP_BASE_URL=https://test.hotsnew.click
VITE_APP_BASE_URL=https://test.hotsnew.click
LINK_OUTPUT_DOMAINS=test.hotsnew.click
VITE_LINK_OUTPUT_DOMAINS=test.hotsnew.click
```

Thiết lập cho `Production`:

```env
APP_BASE_URL=https://hotsnew.click
VITE_APP_BASE_URL=https://hotsnew.click
LINK_OUTPUT_DOMAINS=hotsnew.click
VITE_LINK_OUTPUT_DOMAINS=hotsnew.click
```

Nếu cần copy nhanh, dùng:

- [.env.staging.example](/c:/projects/Shopee-Link-Transformer/.env.staging.example:1)
- [.env.production.example](/c:/projects/Shopee-Link-Transformer/.env.production.example:1)

## 6. Merge Flow

Flow làm việc:

1. Tạo branch `feature/*`
2. Mở PR vào `staging`
3. Chờ workflow `CI` pass
4. Test trên `test.hotsnew.click`
5. Khi ổn, mở PR `staging -> main`
6. Chờ workflow `CI` pass
7. Merge vào `main` để lên live

## 7. Smoke Test Sau Deploy

Sau khi deploy `staging`, kiểm tra nhanh:

1. Đăng nhập được
2. Tạo link mới xong URL sinh ra dùng domain `test.hotsnew.click`
3. Trang public mở được bằng domain test
4. Copy link, QR code, preview card không còn trỏ về `hotsnew.click`
5. API upload/video vẫn chạy
6. Payment callback hoặc redirect không nhảy sai domain
