# 📦 AWS Lambda + API Gateway Demo - Tóm tắt

## ✅ Đã hoàn thành

### 1. Lambda Function
- **File:** `lambda/demo-products-handler.js`
- **Chức năng:** Xử lý 3 API endpoints (GET products, GET product detail, POST demo request)
- **Runtime:** Node.js 20.x
- **Features:** Mock data, CORS support, error handling, optional EC2 integration

### 2. Backend Routes (Optional)
- **File:** `server/routes/demo.route.js`
- **Chức năng:** Endpoints cho Lambda gọi về EC2 để lấy real data
- **Endpoints:** Health check, products, demo requests

### 3. Frontend Demo Page
- **File:** `client/src/_demo/DemoPage.tsx`
- **Chức năng:** 
  - Hiển thị danh sách products từ API Gateway
  - View chi tiết product
  - Form gửi demo request
  - Responsive design với Tailwind CSS
  - Animations với Framer Motion

### 4. Documentation
- **AWS_LAMBDA_DEMO_GUIDE.md** - Hướng dẫn chi tiết đầy đủ (80+ pages)
- **QUICK_START_VI.md** - Hướng dẫn nhanh 15 phút
- **DEPLOYMENT_CHECKLIST.md** - Checklist từng bước
- **AWS_LAMBDA_DEMO_README.md** - Tài liệu tổng hợp
- **lambda/README.md** - Chi tiết Lambda function
- **postman-collection.json** - API testing collection

### 5. Scripts & Tools
- **lambda/deploy.sh** - Script tự động deploy Lambda
- **lambda/test-local.js** - Test Lambda function locally
- **client/.env.example** - Template environment variables

## 📂 Files đã tạo/sửa

### Files mới (11 files):
```
lambda/
├── demo-products-handler.js    ✅ Lambda function code
├── package.json                ✅ Dependencies
├── deploy.sh                   ✅ Deployment script
├── test-local.js               ✅ Local testing
└── README.md                   ✅ Lambda docs

server/routes/
└── demo.route.js               ✅ Backend routes

client/src/_demo/
├── DemoPage.tsx                ✅ Frontend page
└── index.ts                    ✅ Exports

client/
└── .env.example                ✅ Environment template

docs/
├── AWS_LAMBDA_DEMO_GUIDE.md    ✅ Chi tiết đầy đủ
├── QUICK_START_VI.md           ✅ Hướng dẫn nhanh
├── DEPLOYMENT_CHECKLIST.md     ✅ Checklist
├── AWS_LAMBDA_DEMO_README.md   ✅ Tổng hợp
└── postman-collection.json     ✅ API tests
```

### Files đã sửa (2 files):
```
server/index.js                 ✅ Thêm demo routes
client/src/App.tsx              ✅ Thêm /demo route
```

## 🚀 Các bước deploy

### Bước 1: Deploy Lambda (10 phút)
1. Tạo Lambda function trên AWS Console
2. Upload code từ `lambda/demo-products-handler.js`
3. Cấu hình: Timeout 30s, Memory 256MB
4. Test với sample event

### Bước 2: Tạo API Gateway (10 phút)
1. Tạo HTTP API
2. Add Lambda integration
3. Tạo 3 routes: GET /demo/products, GET /demo/products/{id}, POST /demo/request
4. Configure CORS
5. Deploy và lấy URL

### Bước 3: Deploy Frontend (10 phút)
1. Update `client/.env` với API Gateway URL
2. Build: `npm run build`
3. Upload to S3: `aws s3 sync dist/ s3://bucket/`
4. Test: Truy cập `/demo` page

### Bước 4 (Optional): Cấu hình VPC (15 phút)
Chỉ cần nếu Lambda phải gọi về EC2 private:
1. Add Lambda to VPC
2. Configure Security Groups
3. Update EC2 Security Group
4. Test connection

## 📊 API Endpoints

### GET /demo/products
```bash
curl "https://api-gateway-url/demo/products?limit=10"
```

### GET /demo/products/{id}
```bash
curl "https://api-gateway-url/demo/products/demo-1"
```

### POST /demo/request
```bash
curl -X POST "https://api-gateway-url/demo/request" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","productId":"demo-1"}'
```

## 🧪 Testing

### Test Lambda locally:
```bash
cd lambda
node test-local.js
```

### Test API Gateway:
```bash
curl https://your-api-gateway-url/demo/products
```

### Test Frontend:
```bash
cd client
npm run dev
# Visit: http://localhost:5173/demo
```

### Import Postman:
- File: `docs/postman-collection.json`
- Update variable: `api_gateway_url`

## 📚 Documentation

### Cho người mới:
- **[QUICK_START_VI.md](docs/QUICK_START_VI.md)** - Bắt đầu nhanh
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Checklist

### Cho developer:
- **[AWS_LAMBDA_DEMO_GUIDE.md](docs/AWS_LAMBDA_DEMO_GUIDE.md)** - Hướng dẫn đầy đủ
- **[lambda/README.md](lambda/README.md)** - Lambda docs

### Cho DevOps:
- **[lambda/deploy.sh](lambda/deploy.sh)** - Auto deployment
- **[AWS_LAMBDA_DEMO_GUIDE.md#monitoring](docs/AWS_LAMBDA_DEMO_GUIDE.md#-monitoring--logs)** - Monitoring

## ⚠️ Lưu ý quan trọng

### 1. Environment Variables
```bash
# client/.env
VITE_API_GATEWAY_URL=https://your-actual-api-id.execute-api.region.amazonaws.com
```

### 2. CORS Configuration
- Development: Allow origin `*`
- Production: Restrict to S3 website URL

### 3. Lambda Timeout
- Mặc định: 3 seconds (không đủ)
- Recommended: 30 seconds

### 4. VPC Configuration (Optional)
- Chỉ cần nếu Lambda gọi EC2
- Cần NAT Gateway cho internet access
- Configure Security Groups đúng

### 5. Cost
- Free tier: 1M Lambda requests/month
- Estimated: ~$0 cho demo này (trong free tier)

## 🔧 Troubleshooting nhanh

### CORS Error
→ Configure CORS trong API Gateway

### Lambda Timeout
→ Tăng timeout lên 30 seconds

### Cannot connect to EC2
→ Check VPC, Security Groups, NAT Gateway

### 404 Not Found
→ Check API Gateway routes

### Environment variable không load
→ Đảm bảo prefix `VITE_` và restart dev server

## 📞 Next Steps

### Sau khi deploy thành công:

1. **Test production:**
   - Truy cập `https://your-s3-website.com/demo`
   - Test tất cả features
   - Check browser console

2. **Setup monitoring:**
   - CloudWatch Logs
   - CloudWatch Metrics
   - Set up alarms

3. **Documentation:**
   - Update README với API Gateway URL
   - Share Postman collection với team
   - Document any custom configurations

4. **Optimization:**
   - Monitor Lambda cold starts
   - Consider Provisioned Concurrency
   - Add caching if needed

## 🎯 Success Criteria

- [ ] Lambda function deployed và test OK
- [ ] API Gateway có 3 routes hoạt động
- [ ] CORS configured correctly
- [ ] Frontend load products từ API Gateway
- [ ] Demo request form hoạt động
- [ ] No errors trong browser console
- [ ] Response time < 2 seconds
- [ ] Documentation complete

## 📈 Metrics to Track

- Lambda invocations
- API Gateway requests
- Error rates
- Response times
- Cost per month

## 🔐 Security Checklist

- [ ] Lambda có minimal IAM permissions
- [ ] API Gateway throttling enabled
- [ ] CORS restricted (production)
- [ ] No secrets in code
- [ ] Security groups configured (if VPC)
- [ ] CloudWatch logging enabled

## 💡 Tips

1. **Test locally first** với `test-local.js`
2. **Use Postman collection** để test API
3. **Check CloudWatch Logs** khi có lỗi
4. **Monitor costs** trong AWS Cost Explorer
5. **Set up alarms** cho errors và high latency

## 📖 Đọc thêm

- **Chi tiết đầy đủ:** [docs/AWS_LAMBDA_DEMO_GUIDE.md](docs/AWS_LAMBDA_DEMO_GUIDE.md)
- **Hướng dẫn nhanh:** [docs/QUICK_START_VI.md](docs/QUICK_START_VI.md)
- **Checklist:** [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

**Thời gian ước tính:** 30-60 phút (không bao gồm VPC)
**Chi phí:** ~$0 (trong AWS free tier)
**Độ khó:** Trung bình

**Chúc bạn deploy thành công! 🎉**
