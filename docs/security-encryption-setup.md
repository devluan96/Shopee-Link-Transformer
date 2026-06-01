# Cấu hình Khóa Mã hóa Bảo mật

## Tổng quan

Ứng dụng sử dụng `SECURITY_ENCRYPTION_KEY` để mã hóa các dữ liệu nhạy cảm bao gồm:
- **OAuth tokens** (YouTube, TikTok, Facebook Page)
- **2FA secrets** (Xác thực hai yếu tố)

Khóa này phải được cấu hình trong tất cả các môi trường (development, staging, production).

## Cách tạo khóa

### Lựa chọn 1: Sử dụng Node.js (Khuyến nghị)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Lệnh này sẽ in ra một chuỗi 64 ký tự hex, ví dụ:
```
a3f9e2c1d5b8f7a4e6c9d2f1b5e8a3c6d9f2e5a8b1c4d7f0e3a6c9d2f5a8
```

### Lựa chọn 2: OpenSSL

```bash
openssl rand -hex 32
```

## Cấu hình

### Development

Thêm vào file `.env`:

```env
SECURITY_ENCRYPTION_KEY=a3f9e2c1d5b8f7a4e6c9d2f1b5e8a3c6d9f2e5a8b1c4d7f0e3a6c9d2f5a8
```

### Staging/Production

Đặt biến môi trường trên hosting platform của bạn:

**Vercel:**
```bash
vercel env add SECURITY_ENCRYPTION_KEY
```

**Docker:**
```bash
docker run -e SECURITY_ENCRYPTION_KEY=<your-key> ...
```

**Heroku:**
```bash
heroku config:set SECURITY_ENCRYPTION_KEY=<your-key>
```

## Kiểm tra

Ứng dụng sẽ tự động kiểm tra khóa khi khởi động. Nếu khóa không được cấu hình, bạn sẽ thấy lỗi:

```
Error: SECURITY_ENCRYPTION_KEY is not configured. 
Set SECURITY_ENCRYPTION_KEY environment variable to encrypt sensitive data.
```

## Bảo mật

⚠️ **QUAN TRỌNG:**
- Không bao giờ commit `.env` vào Git
- Không bao giờ chia sẻ khóa công khai
- Mỗi môi trường nên có khóa riêng
- Nếu khóa bị lộ, tạo khóa mới và cập nhật tất cả các tokens được mã hóa

## Chuyển đổi khóa

Nếu bạn cần thay đổi khóa:

1. Tạo khóa mới: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Chạy script chuyển đổi (cần được thêm):
   ```bash
   npm run migrate-encryption-key -- --old-key=<old> --new-key=<new>
   ```
3. Cập nhật biến môi trường

## Tài liệu tham khảo

- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
