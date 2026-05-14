# Hướng dẫn nhanh - AWS Lambda Demo

## 🚀 Triển khai trong 15 phút

### Bước 1: Deploy Lambda Function (5 phút)

1. **Tạo file ZIP**
```bash
cd lambda
zip -r function.zip demo-products-handler.js package.json
```

2. **Upload lên AWS Lambda**
   - Vào AWS Console → Lambda → Create function
   - Function name: `demo-products-handler`
   - Runtime: Node.js 20.x
   - Upload file `function.zip`
   - Handler: `demo-products-handler.handler`
   - Timeout: 30 seconds
   - Memory: 256 MB
   - **Deploy**

3. **Test Lambda**
   - Tab Test → Create test event:
```json
{
  "httpMethod": "GET",
  "path": "/demo/products"
}
```
   - Click Test → Xem kết quả

### Bước 2: Tạo API Gateway (5 phút)

1. **Tạo HTTP API**
   - AWS Console → API Gateway → Create API
   - Chọn **HTTP API** → Build
   - Integration: Lambda → Chọn `demo-products-handler`
   - API name: `demo-products-api`

2. **Tạo Routes**
   - GET `/demo/products`
   - GET `/demo/products/{id}`
   - POST `/demo/request`

3. **Cấu hình CORS**
   - CORS → Configure
   - Allow origin: `*` (hoặc S3 URL của bạn)
   - Allow methods: `GET, POST, OPTIONS`
   - Allow headers: `Content-Type`

4. **Deploy & lấy URL**
   - Stages → $default → Copy **Invoke URL**
   - Ví dụ: `https://abc123.execute-api.us-east-1.amazonaws.com`

### Bước 3: Cấu hình Frontend (5 phút)

1. **Update environment variable**
```bash
cd client
echo "VITE_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com" > .env
```

2. **Build & deploy**
```bash
npm install
npm run build
aws s3 sync dist/ s3://your-bucket-name/ --delete
```

3. **Test**
   - Truy cập: `https://your-s3-website.com/demo`
   - Kiểm tra products có load không

## ✅ Checklist

- [ ] Lambda function deployed và test OK
- [ ] API Gateway có 3 routes
- [ ] CORS đã cấu hình
- [ ] Frontend có API Gateway URL trong .env
- [ ] Build và upload lên S3
- [ ] Test page /demo hoạt động

## 🧪 Test nhanh

```bash
# Test API Gateway
curl https://your-api-gateway-url/demo/products

# Expected: JSON với array products
```

## ⚠️ Lỗi thường gặp

### CORS Error
→ Vào API Gateway → CORS → Add origin của S3 website

### Lambda Timeout
→ Lambda Configuration → Timeout → Tăng lên 30s

### 404 Not Found
→ Kiểm tra routes trong API Gateway có đúng path không

## 📞 Cần kết nối Lambda với EC2?

Xem file `AWS_LAMBDA_DEMO_GUIDE.md` phần "Bước 2: Cấu hình VPC"

---

**Thời gian ước tính:** 15-20 phút
**Chi phí:** ~$0 (trong free tier)
