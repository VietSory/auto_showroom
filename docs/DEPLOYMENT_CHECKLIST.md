# Deployment Checklist - AWS Lambda Demo

## 📋 Checklist tổng hợp

Sử dụng checklist này để đảm bảo deploy đầy đủ và đúng thứ tự.

---

## Phase 1: Chuẩn bị (5 phút)

### 1.1 Kiểm tra code đã có

- [ ] File `lambda/demo-products-handler.js` tồn tại
- [ ] File `lambda/package.json` tồn tại
- [ ] File `server/routes/demo.route.js` tồn tại
- [ ] File `client/src/_demo/DemoPage.tsx` tồn tại
- [ ] Route `/demo` đã được thêm vào `client/src/App.tsx`

### 1.2 Kiểm tra AWS credentials

```bash
# Test AWS CLI
aws sts get-caller-identity

# Expected: Hiển thị Account ID, User ARN
```

- [ ] AWS CLI đã cài đặt
- [ ] AWS credentials đã cấu hình
- [ ] Có quyền tạo Lambda, API Gateway

---

## Phase 2: Deploy Lambda Function (10 phút)

### 2.1 Tạo Lambda Function

**AWS Console:**
1. [ ] Vào AWS Console → Lambda → Create function
2. [ ] Function name: `demo-products-handler`
3. [ ] Runtime: Node.js 20.x
4. [ ] Architecture: x86_64
5. [ ] Click "Create function"

### 2.2 Upload code

**Option A: Manual upload**
```bash
cd lambda
zip -r function.zip demo-products-handler.js package.json
```
- [ ] Upload ZIP qua Console

**Option B: Script**
```bash
cd lambda
./deploy.sh demo-products-handler us-east-1
```
- [ ] Script chạy thành công

### 2.3 Cấu hình Lambda

**Configuration → General configuration:**
- [ ] Timeout: 30 seconds
- [ ] Memory: 256 MB

**Configuration → Environment variables:**
- [ ] `USE_EC2_BACKEND`: `false` (hoặc `true` nếu muốn gọi EC2)
- [ ] `EC2_BACKEND_URL`: `http://10.0.x.x:5000` (nếu dùng EC2)

### 2.4 Test Lambda

**Test event:**
```json
{
  "httpMethod": "GET",
  "path": "/demo/products"
}
```

- [ ] Test thành công
- [ ] Response có statusCode 200
- [ ] Response có data array

**Expected response:**
```json
{
  "statusCode": 200,
  "headers": {...},
  "body": "{\"success\":true,\"count\":3,\"data\":[...]}"
}
```

---

## Phase 3: Cấu hình VPC (Optional - 15 phút)

⚠️ **Chỉ cần nếu Lambda phải gọi về EC2 private**

### 3.1 Lambda VPC Configuration

**Configuration → VPC:**
- [ ] VPC: Chọn cùng VPC với EC2
- [ ] Subnets: Chọn private subnets (có NAT Gateway)
- [ ] Security Group: Tạo mới `lambda-demo-sg`

### 3.2 Lambda Security Group Rules

**Outbound rules:**
- [ ] Type: HTTP, Port: 80, Destination: 0.0.0.0/0
- [ ] Type: HTTPS, Port: 443, Destination: 0.0.0.0/0
- [ ] Type: Custom TCP, Port: 5000, Destination: EC2 SG

### 3.3 EC2 Security Group Rules

**Inbound rules:**
- [ ] Type: Custom TCP, Port: 5000, Source: Lambda SG
- [ ] Description: "Allow Lambda to call backend"

### 3.4 Test Lambda → EC2 connection

```bash
# Set environment variable
USE_EC2_BACKEND=true

# Test Lambda
# Check CloudWatch Logs for connection success/failure
```

- [ ] Lambda có thể connect đến EC2
- [ ] CloudWatch Logs không có timeout errors

---

## Phase 4: Tạo API Gateway (10 phút)

### 4.1 Create API

**AWS Console → API Gateway:**
- [ ] Click "Create API"
- [ ] Chọn "HTTP API" → Build
- [ ] API name: `demo-products-api`

### 4.2 Add Integration

- [ ] Integration type: Lambda
- [ ] Lambda function: `demo-products-handler`
- [ ] Integration name: `demo-products-integration`

### 4.3 Create Routes

**Route 1:**
- [ ] Method: GET
- [ ] Path: `/demo/products`
- [ ] Integration: demo-products-handler

**Route 2:**
- [ ] Method: GET
- [ ] Path: `/demo/products/{id}`
- [ ] Integration: demo-products-handler

**Route 3:**
- [ ] Method: POST
- [ ] Path: `/demo/request`
- [ ] Integration: demo-products-handler

### 4.4 Configure CORS

**CORS settings:**
- [ ] Access-Control-Allow-Origin: `*` (dev) hoặc S3 URL (prod)
- [ ] Access-Control-Allow-Methods: `GET,POST,OPTIONS`
- [ ] Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key`

### 4.5 Deploy API

**Stages:**
- [ ] Stage name: `prod` (hoặc dùng `$default`)
- [ ] Click "Deploy"

### 4.6 Get API Endpoint

- [ ] Copy Invoke URL
- [ ] Format: `https://abc123.execute-api.us-east-1.amazonaws.com`
- [ ] Lưu URL này để dùng cho frontend

---

## Phase 5: Test API Gateway (5 phút)

### 5.1 Test với curl

```bash
# Test GET products
curl https://your-api-id.execute-api.region.amazonaws.com/demo/products

# Test GET product detail
curl https://your-api-id.execute-api.region.amazonaws.com/demo/products/demo-1

# Test POST request
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/demo/request \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","productId":"demo-1"}'
```

**Checklist:**
- [ ] GET /demo/products → 200 OK
- [ ] GET /demo/products/demo-1 → 200 OK
- [ ] POST /demo/request → 201 Created
- [ ] Response có CORS headers

### 5.2 Test CORS

```bash
curl -X OPTIONS https://your-api-id.execute-api.region.amazonaws.com/demo/products \
  -H "Origin: https://your-s3-website.com" \
  -H "Access-Control-Request-Method: GET" \
  -i
```

- [ ] Response có `access-control-allow-origin` header
- [ ] Response có `access-control-allow-methods` header

### 5.3 Import Postman Collection

- [ ] Import file `docs/postman-collection.json`
- [ ] Update variable `api_gateway_url`
- [ ] Run all requests
- [ ] All requests return expected responses

---

## Phase 6: Deploy Backend (Optional - 5 phút)

⚠️ **Chỉ cần nếu Lambda gọi về EC2**

### 6.1 Update EC2 Backend

```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Pull latest code
cd /path/to/app
git pull origin main

# Restart server
pm2 restart server
# hoặc
sudo systemctl restart your-app
```

- [ ] Code đã được pull
- [ ] Server đã restart
- [ ] Server đang chạy

### 6.2 Test Backend Endpoints

```bash
# Test health check
curl http://localhost:5000/api/demo/health

# Test products endpoint
curl http://localhost:5000/api/demo/products
```

- [ ] Health check → 200 OK
- [ ] Products endpoint → 200 OK

---

## Phase 7: Deploy Frontend (10 phút)

### 7.1 Update Environment Variables

**File: `client/.env`**
```bash
VITE_API_GATEWAY_URL=https://your-actual-api-id.execute-api.region.amazonaws.com
```

- [ ] File `.env` đã tạo
- [ ] API Gateway URL đã update
- [ ] URL không có trailing slash

### 7.2 Build Frontend

```bash
cd client
npm install
npm run build
```

- [ ] Build thành công
- [ ] Folder `client/dist` đã tạo
- [ ] File `dist/index.html` tồn tại

### 7.3 Test Local

```bash
npm run dev
```

- [ ] Dev server chạy
- [ ] Truy cập `http://localhost:5173/demo`
- [ ] Products load thành công
- [ ] Không có CORS errors trong console

### 7.4 Upload to S3

**Option A: AWS CLI**
```bash
cd client/dist
aws s3 sync . s3://your-bucket-name/ --delete
```

**Option B: AWS Console**
- [ ] Vào S3 bucket
- [ ] Upload tất cả files trong `dist/`
- [ ] Đảm bảo `index.html` ở root

**Checklist:**
- [ ] Files đã upload
- [ ] Bucket có public read access (nếu cần)
- [ ] Static website hosting enabled

### 7.5 Invalidate CloudFront (nếu dùng)

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

- [ ] Invalidation created
- [ ] Status: Completed

---

## Phase 8: Test Production (10 phút)

### 8.1 Test Frontend

**Truy cập:**
- [ ] `https://your-s3-website.com/demo`
- [ ] Page load thành công
- [ ] Products hiển thị

### 8.2 Test Features

**Products List:**
- [ ] Products load từ API Gateway
- [ ] Images hiển thị
- [ ] Ratings hiển thị
- [ ] Click "Refresh" hoạt động

**Product Details:**
- [ ] Click "View Details" mở modal
- [ ] Chi tiết product hiển thị đầy đủ
- [ ] Close modal hoạt động

**Demo Request:**
- [ ] Click "Request Demo" mở form
- [ ] Fill form và submit
- [ ] Success message hiển thị
- [ ] Form reset sau submit

### 8.3 Test Browser Console

**Chrome DevTools → Console:**
- [ ] Không có errors
- [ ] Không có CORS errors
- [ ] Không có 404 errors

**Chrome DevTools → Network:**
- [ ] Requests đến API Gateway (không phải localhost)
- [ ] Status codes: 200, 201
- [ ] Response times < 2 seconds

### 8.4 Test Different Browsers

- [ ] Chrome: OK
- [ ] Firefox: OK
- [ ] Safari: OK
- [ ] Mobile browser: OK

---

## Phase 9: Monitoring Setup (5 phút)

### 9.1 CloudWatch Logs

**Lambda logs:**
- [ ] Vào CloudWatch → Log groups
- [ ] Tìm `/aws/lambda/demo-products-handler`
- [ ] Có logs mới
- [ ] Không có ERROR logs

### 9.2 CloudWatch Metrics

**Lambda metrics:**
- [ ] Invocations > 0
- [ ] Errors = 0
- [ ] Duration < 1000ms
- [ ] Throttles = 0

**API Gateway metrics:**
- [ ] Count > 0
- [ ] 4XXError = 0 (hoặc chỉ có từ test)
- [ ] 5XXError = 0
- [ ] Latency < 2000ms

### 9.3 Set up Alarms (Optional)

**Lambda alarm:**
- [ ] Metric: Errors
- [ ] Threshold: > 5 in 5 minutes
- [ ] Action: SNS notification

**API Gateway alarm:**
- [ ] Metric: 5XXError
- [ ] Threshold: > 10 in 5 minutes
- [ ] Action: SNS notification

---

## Phase 10: Documentation (5 phút)

### 10.1 Update README

- [ ] Thêm section về demo feature
- [ ] Thêm link đến `/demo` page
- [ ] Thêm API Gateway URL

### 10.2 Document API Endpoints

- [ ] API Gateway URL
- [ ] Available endpoints
- [ ] Request/response examples

### 10.3 Share with Team

- [ ] Share API Gateway URL
- [ ] Share Postman collection
- [ ] Share deployment guide

---

## 🎉 Completion Checklist

### Functional Requirements

- [ ] ✅ User có thể xem products không cần login
- [ ] ✅ API tách biệt với admin CRUD
- [ ] ✅ Lambda xử lý requests thành công
- [ ] ✅ API Gateway routing đúng
- [ ] ✅ CORS hoạt động
- [ ] ✅ Frontend hiển thị data từ Lambda
- [ ] ✅ Demo request form hoạt động

### Technical Requirements

- [ ] ✅ Lambda function deployed
- [ ] ✅ API Gateway configured
- [ ] ✅ VPC configured (nếu cần)
- [ ] ✅ Security groups configured (nếu cần)
- [ ] ✅ Frontend deployed to S3
- [ ] ✅ Environment variables configured
- [ ] ✅ CORS configured correctly

### Testing

- [ ] ✅ Lambda test passed
- [ ] ✅ API Gateway test passed
- [ ] ✅ Frontend test passed
- [ ] ✅ Integration test passed
- [ ] ✅ CORS test passed
- [ ] ✅ Production test passed

### Documentation

- [ ] ✅ Code documented
- [ ] ✅ Deployment guide created
- [ ] ✅ API documentation created
- [ ] ✅ Troubleshooting guide created

---

## 📊 Final Verification

### Performance

- [ ] Lambda cold start < 3s
- [ ] Lambda warm execution < 500ms
- [ ] API Gateway latency < 2s
- [ ] Frontend load time < 3s

### Security

- [ ] Lambda has minimal IAM permissions
- [ ] API Gateway has throttling enabled
- [ ] CORS restricted to specific origins (prod)
- [ ] No secrets in code
- [ ] Security groups properly configured

### Cost

- [ ] Lambda within free tier (1M requests/month)
- [ ] API Gateway within free tier (1M requests/month)
- [ ] S3 within free tier (5GB storage)
- [ ] No unexpected charges

---

## 🚨 Rollback Plan

Nếu có vấn đề nghiêm trọng:

### Rollback Lambda
```bash
# List versions
aws lambda list-versions-by-function --function-name demo-products-handler

# Rollback to previous version
aws lambda update-alias \
  --function-name demo-products-handler \
  --name prod \
  --function-version <previous-version>
```

### Rollback Frontend
```bash
# Restore previous S3 version
aws s3 sync s3://your-bucket-name-backup/ s3://your-bucket-name/ --delete
```

### Disable API Gateway
- [ ] API Gateway → Stages → Disable stage

---

## 📞 Support Contacts

- **AWS Support:** https://console.aws.amazon.com/support/
- **CloudWatch Logs:** `/aws/lambda/demo-products-handler`
- **Documentation:** `docs/AWS_LAMBDA_DEMO_GUIDE.md`

---

**Checklist Version:** 1.0
**Last Updated:** 2024
**Estimated Total Time:** 60-90 minutes
