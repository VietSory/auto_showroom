# Hướng dẫn Deploy AWS Lambda + API Gateway Demo

## 📋 Mục tiêu chức năng

Xây dựng một hệ thống demo riêng biệt sử dụng AWS Lambda và API Gateway để:
- Cho phép người dùng xem danh sách sản phẩm demo **không cần đăng nhập**
- Tách biệt hoàn toàn với API CRUD admin hiện tại
- Demo kiến trúc serverless với AWS Lambda
- Tích hợp API Gateway với frontend S3 static hosting
- (Optional) Lambda có thể gọi về EC2 backend private để lấy dữ liệu thực

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  S3 Static Web  │ (Frontend React)
│  (Client)       │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  API Gateway    │ (Public endpoint)
│  /demo/*        │
└────────┬────────┘
         │ Invoke
         ▼
┌─────────────────┐
│  AWS Lambda     │ (Serverless function)
│  demo-products  │
└────────┬────────┘
         │ HTTP (Optional)
         ▼
┌─────────────────┐
│  EC2 Backend    │ (Private subnet)
│  /api/demo/*    │
└─────────────────┘
```

### Luồng request:

1. **User** truy cập `https://your-s3-website.com/demo`
2. **Frontend** gọi API Gateway: `GET https://api-gateway-url/demo/products`
3. **API Gateway** trigger Lambda function
4. **Lambda** xử lý request:
   - Option 1: Trả về mock data (không cần EC2)
   - Option 2: Gọi về EC2 backend qua VPC
5. **Response** trả về cho user

## 📁 Danh sách file đã thêm/sửa

### Files mới:

```
lambda/
├── demo-products-handler.js    # Lambda function code
└── package.json                # Lambda dependencies

server/routes/
└── demo.route.js               # Backend routes cho Lambda (optional)

client/src/_demo/
├── DemoPage.tsx                # Frontend demo page
└── index.ts                    # Export

client/
└── .env.example                # Environment variables template

docs/
└── AWS_LAMBDA_DEMO_GUIDE.md    # Tài liệu này
```

### Files đã sửa:

```
server/index.js                 # Thêm demo routes
client/src/App.tsx              # Thêm /demo route
```

## 💻 Code chi tiết

### 1. Lambda Function (`lambda/demo-products-handler.js`)

Lambda function xử lý 3 endpoints:

#### GET /demo/products
Lấy danh sách sản phẩm demo

**Request:**
```bash
GET /demo/products?limit=10&brand=Mercedes
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "demo-1",
      "brand": "Mercedes-Benz",
      "car_model": "AMG CLS 53",
      "production_year": "2024",
      "price": "1,200,000",
      "images": ["https://..."],
      "bio": "Luxury performance sedan...",
      "horsepower": "429 HP",
      "rated": "4.8",
      "isDemo": true
    }
  ],
  "source": "AWS Lambda Mock Data"
}
```

#### GET /demo/products/{id}
Lấy chi tiết sản phẩm

**Request:**
```bash
GET /demo/products/demo-1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "demo-1",
    "brand": "Mercedes-Benz",
    "car_model": "AMG CLS 53",
    "engine": "4.0L V8 Twin-Turbo",
    "transmission": "Automatic 9-speed",
    "features": ["Adaptive Cruise Control", "..."],
    ...
  },
  "source": "AWS Lambda Mock Data"
}
```

#### POST /demo/request
Tạo yêu cầu demo/test drive

**Request:**
```bash
POST /demo/request
Content-Type: application/json

{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "phone": "+84 123 456 789",
  "productId": "demo-1",
  "message": "I'm interested in test drive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "REQ-1234567890",
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Demo request created successfully"
}
```

### 2. Backend Routes (`server/routes/demo.route.js`)

Optional routes cho Lambda gọi về EC2:

- `GET /api/demo/health` - Health check
- `GET /api/demo/products` - Lấy products từ MongoDB
- `GET /api/demo/products/:id` - Lấy chi tiết product
- `POST /api/demo/requests` - Lưu demo request vào database

### 3. Frontend Demo Page (`client/src/_demo/DemoPage.tsx`)

React component với features:
- Hiển thị danh sách products từ API Gateway
- View chi tiết product
- Form gửi demo request
- Loading states & error handling
- Responsive design với Tailwind CSS
- Animations với Framer Motion

## 🚀 Các bước cấu hình AWS

### Bước 1: Tạo Lambda Function

1. **Đăng nhập AWS Console** → Tìm "Lambda"

2. **Create function**
   - Chọn: **Author from scratch**
   - Function name: `demo-products-handler`
   - Runtime: **Node.js 20.x** (hoặc 18.x)
   - Architecture: **x86_64**
   - Click **Create function**

3. **Upload code**
   
   **Option A: Upload trực tiếp (file nhỏ)**
   - Copy toàn bộ code từ `lambda/demo-products-handler.js`
   - Paste vào Code source editor
   - Click **Deploy**

   **Option B: Upload ZIP (recommended)**
   ```bash
   cd lambda
   zip -r function.zip demo-products-handler.js package.json
   ```
   - Trong Lambda console, chọn **Upload from** → **.zip file**
   - Upload file `function.zip`

4. **Cấu hình Runtime settings**
   - Handler: `demo-products-handler.handler`
   - Timeout: **30 seconds** (mặc định 3s có thể không đủ)
   - Memory: **256 MB** (đủ cho demo này)

5. **Environment variables** (Optional)
   - Key: `EC2_BACKEND_URL`, Value: `http://10.0.1.100:5000`
   - Key: `USE_EC2_BACKEND`, Value: `false` (set `true` nếu muốn gọi EC2)

6. **Test Lambda**
   - Click **Test** tab
   - Create new test event:
   ```json
   {
     "httpMethod": "GET",
     "path": "/demo/products",
     "queryStringParameters": {
       "limit": "10"
     }
   }
   ```
   - Click **Test** → Kiểm tra response

### Bước 2: Cấu hình VPC (Nếu Lambda cần gọi EC2 private)

⚠️ **Chỉ cần nếu `USE_EC2_BACKEND=true`**

1. **Trong Lambda Configuration** → **VPC**
   - Click **Edit**
   - VPC: Chọn **cùng VPC với EC2**
   - Subnets: Chọn **private subnets** (nơi EC2 đang chạy)
   - Security groups: Tạo mới hoặc chọn SG có rules:
     - **Outbound**: Allow HTTP (80) và HTTPS (443) to 0.0.0.0/0
     - **Outbound**: Allow port 5000 to EC2 security group

2. **Cập nhật EC2 Security Group**
   - Vào EC2 instance → Security → Security groups
   - **Inbound rules** → Add rule:
     - Type: **Custom TCP**
     - Port: **5000**
     - Source: **Lambda security group ID**
     - Description: "Allow Lambda to call backend"

3. **Attach VPC Execution Role**
   - Lambda sẽ tự động tạo ENI (Elastic Network Interface)
   - Đảm bảo Lambda execution role có policy:
     ```json
     {
       "Effect": "Allow",
       "Action": [
         "ec2:CreateNetworkInterface",
         "ec2:DescribeNetworkInterfaces",
         "ec2:DeleteNetworkInterface"
       ],
       "Resource": "*"
     }
     ```

⚠️ **Lưu ý**: Lambda trong VPC không có internet access mặc định. Nếu cần:
- Đặt Lambda trong **private subnet có NAT Gateway**
- Hoặc dùng **VPC Endpoints** cho AWS services

### Bước 3: Tạo API Gateway

1. **Tìm "API Gateway"** trong AWS Console

2. **Create API**
   - Chọn: **HTTP API** (đơn giản hơn, rẻ hơn REST API)
   - Click **Build**

3. **Add integration**
   - Integration type: **Lambda**
   - Lambda function: `demo-products-handler`
   - API name: `demo-products-api`
   - Click **Next**

4. **Configure routes**
   
   Tạo 3 routes sau:
   
   | Method | Route | Integration |
   |--------|-------|-------------|
   | GET | /demo/products | demo-products-handler |
   | GET | /demo/products/{id} | demo-products-handler |
   | POST | /demo/request | demo-products-handler |

   **Cách tạo:**
   - Click **Create** route
   - Method: Chọn GET/POST
   - Path: Nhập path (vd: `/demo/products`)
   - Integration: Chọn Lambda function
   - Click **Create**

5. **Configure CORS**
   - Trong API Gateway console → **CORS**
   - Click **Configure**
   - **Access-Control-Allow-Origin**: 
     - Development: `*`
     - Production: `https://your-s3-bucket.s3-website-region.amazonaws.com`
   - **Access-Control-Allow-Headers**: `Content-Type,X-Amz-Date,Authorization,X-Api-Key`
   - **Access-Control-Allow-Methods**: `GET,POST,OPTIONS`
   - Click **Save**

6. **Deploy API**
   - Stages → **$default** (auto-created)
   - Hoặc tạo stage mới: **prod**
   - Click **Deploy**

7. **Lấy API endpoint**
   - Trong Stages → **$default** hoặc **prod**
   - Copy **Invoke URL**
   - Format: `https://abc123xyz.execute-api.us-east-1.amazonaws.com`

### Bước 4: Test API Gateway

**Test bằng curl:**

```bash
# Test GET products
curl https://your-api-id.execute-api.region.amazonaws.com/demo/products

# Test GET product by ID
curl https://your-api-id.execute-api.region.amazonaws.com/demo/products/demo-1

# Test POST request
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/demo/request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "productId": "demo-1",
    "message": "Test message"
  }'
```

**Test bằng Postman:**
1. Import collection với 3 requests trên
2. Thay `your-api-id` và `region` bằng giá trị thực
3. Send requests và kiểm tra responses

### Bước 5: Cấu hình Frontend

1. **Update environment variable**
   
   Tạo file `client/.env` (hoặc `.env.production`):
   ```bash
   VITE_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com
   ```

2. **Build frontend**
   ```bash
   cd client
   npm install
   npm run build
   ```

3. **Test local**
   ```bash
   npm run dev
   ```
   - Truy cập: `http://localhost:5173/demo`
   - Kiểm tra console nếu có lỗi CORS

### Bước 6: Deploy Frontend lên S3

1. **Upload build files**
   ```bash
   cd client/dist
   aws s3 sync . s3://your-bucket-name/ --delete
   ```

   Hoặc dùng AWS Console:
   - Vào S3 bucket
   - Upload toàn bộ files trong `client/dist`
   - Đảm bảo `index.html` ở root level

2. **Invalidate CloudFront cache** (nếu dùng CloudFront)
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

3. **Test production**
   - Truy cập: `https://your-s3-website.com/demo`
   - Kiểm tra Network tab để xem requests đến API Gateway

### Bước 7: (Optional) Deploy Backend Routes lên EC2

Nếu muốn Lambda gọi về EC2:

1. **SSH vào EC2**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

2. **Pull code mới**
   ```bash
   cd /path/to/your/app
   git pull origin main
   ```

3. **Restart server**
   ```bash
   pm2 restart server
   # hoặc
   sudo systemctl restart your-app
   ```

4. **Test endpoint**
   ```bash
   curl http://localhost:5000/api/demo/health
   ```

## 🧪 Cách test

### Test 1: Lambda function trực tiếp

1. Vào Lambda console → **Test** tab
2. Test event cho GET products:
```json
{
  "httpMethod": "GET",
  "path": "/demo/products",
  "queryStringParameters": { "limit": "5" }
}
```
3. Expected: Status 200, có data array

### Test 2: API Gateway endpoint

```bash
# Test GET
curl -i https://your-api-gateway-url/demo/products

# Expected response:
# HTTP/2 200
# content-type: application/json
# access-control-allow-origin: *
# 
# {"success":true,"count":3,"data":[...]}
```

### Test 3: Frontend integration

1. Mở browser → DevTools → Network tab
2. Truy cập `/demo` page
3. Kiểm tra:
   - ✅ Request đến API Gateway (status 200)
   - ✅ Response có CORS headers
   - ✅ Products hiển thị trên UI
   - ✅ Click "View Details" hoạt động
   - ✅ Submit "Request Demo" form thành công

### Test 4: CORS

```bash
# Test preflight request
curl -X OPTIONS https://your-api-gateway-url/demo/products \
  -H "Origin: https://your-s3-website.com" \
  -H "Access-Control-Request-Method: GET" \
  -i

# Expected headers:
# access-control-allow-origin: *
# access-control-allow-methods: GET,POST,OPTIONS
```

### Test 5: Lambda → EC2 connection (nếu dùng VPC)

1. Set `USE_EC2_BACKEND=true` trong Lambda environment variables
2. Test Lambda với event:
```json
{
  "httpMethod": "GET",
  "path": "/demo/products"
}
```
3. Check CloudWatch Logs:
   - Vào Lambda → Monitor → View logs in CloudWatch
   - Tìm log "Calling EC2 backend..."
   - Kiểm tra có lỗi timeout/connection không

## ⚠️ Các lỗi thường gặp và cách sửa

### Lỗi 1: CORS Error

**Triệu chứng:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Nguyên nhân:**
- API Gateway chưa cấu hình CORS
- Lambda response thiếu CORS headers

**Cách sửa:**
1. Vào API Gateway → CORS → Configure
2. Add origin của S3 website vào `Access-Control-Allow-Origin`
3. Đảm bảo Lambda response có headers:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}
```

### Lỗi 2: Lambda Timeout

**Triệu chứng:**
```
Task timed out after 3.00 seconds
```

**Nguyên nhân:**
- Lambda timeout mặc định chỉ 3 giây
- Lambda trong VPC không có internet/NAT

**Cách sửa:**
1. Tăng timeout: Configuration → General → Timeout → 30 seconds
2. Nếu Lambda trong VPC:
   - Đảm bảo private subnet có **NAT Gateway**
   - Hoặc dùng **VPC Endpoints** cho AWS services

### Lỗi 3: Lambda không kết nối được EC2

**Triệu chứng:**
```
Error: connect ETIMEDOUT
```

**Nguyên nhân:**
- Lambda không trong cùng VPC với EC2
- Security Group chặn traffic
- EC2 backend không chạy

**Cách sửa:**
1. Kiểm tra Lambda VPC configuration:
   - Lambda phải trong **cùng VPC** với EC2
   - Lambda trong **private subnet**
2. Kiểm tra Security Groups:
   - EC2 SG: Allow inbound port 5000 từ Lambda SG
   - Lambda SG: Allow outbound port 5000 to EC2 SG
3. Test EC2 backend:
```bash
ssh ec2-instance
curl http://localhost:5000/api/demo/health
```

### Lỗi 4: API Gateway 403 Forbidden

**Triệu chứng:**
```
{"message":"Forbidden"}
```

**Nguyên nhân:**
- Lambda execution role thiếu permissions
- API Gateway resource policy chặn

**Cách sửa:**
1. Kiểm tra Lambda execution role có policy:
```json
{
  "Effect": "Allow",
  "Action": "lambda:InvokeFunction",
  "Resource": "arn:aws:lambda:region:account:function:demo-products-handler"
}
```
2. Kiểm tra API Gateway resource policy (nếu có)

### Lỗi 5: Environment variable không load

**Triệu chứng:**
- Frontend gọi `https://your-api-id...` thay vì API Gateway URL thực

**Nguyên nhân:**
- File `.env` không được load
- Vite cần prefix `VITE_`

**Cách sửa:**
1. Đảm bảo file `.env` có:
```bash
VITE_API_GATEWAY_URL=https://real-api-id.execute-api.region.amazonaws.com
```
2. Restart dev server:
```bash
npm run dev
```
3. Rebuild production:
```bash
npm run build
```

### Lỗi 6: Lambda cold start chậm

**Triệu chứng:**
- Request đầu tiên mất 5-10 giây
- Requests sau nhanh hơn

**Nguyên nhân:**
- Lambda cold start (khởi động container mới)

**Cách sửa:**
1. **Provisioned Concurrency** (có phí):
   - Configuration → Provisioned concurrency → Set 1-2 instances
2. **Tối ưu code**:
   - Giảm dependencies
   - Lazy load modules
3. **Keep-alive**:
   - Dùng CloudWatch Events để ping Lambda mỗi 5 phút

### Lỗi 7: S3 website không load page /demo

**Triệu chứng:**
- Direct access `https://s3-website.com/demo` → 404
- Navigate từ homepage → OK

**Nguyên nhân:**
- S3 static hosting không support client-side routing

**Cách sửa:**
1. **Option A: Dùng CloudFront**
   - Tạo CloudFront distribution
   - Error pages → 404 → Response page: `/index.html`, Code: 200
   
2. **Option B: Hash routing**
   - Đổi React Router sang `HashRouter`
   - URL sẽ là `/#/demo` thay vì `/demo`

## 📊 Monitoring & Logs

### CloudWatch Logs

1. **Lambda logs**
   - Lambda console → Monitor → View logs in CloudWatch
   - Log group: `/aws/lambda/demo-products-handler`
   - Xem errors, execution time, memory usage

2. **API Gateway logs** (Optional, có phí)
   - API Gateway → Stages → Logs/Tracing
   - Enable CloudWatch Logs
   - Log level: INFO hoặc ERROR

### CloudWatch Metrics

1. **Lambda metrics**
   - Invocations: Số lần Lambda được gọi
   - Duration: Thời gian xử lý
   - Errors: Số lỗi
   - Throttles: Số lần bị throttle

2. **API Gateway metrics**
   - Count: Số requests
   - 4XXError: Client errors
   - 5XXError: Server errors
   - Latency: Response time

### Cost Monitoring

1. **Lambda pricing**
   - Free tier: 1M requests/month, 400,000 GB-seconds
   - Sau đó: $0.20 per 1M requests
   - Memory: $0.0000166667 per GB-second

2. **API Gateway pricing**
   - HTTP API: $1.00 per million requests
   - REST API: $3.50 per million requests

3. **Data transfer**
   - Out to internet: $0.09 per GB (sau 1GB free tier)

## 🔒 Security Best Practices

### 1. API Gateway

- ✅ Enable **throttling**: 10,000 requests/second
- ✅ Enable **API keys** cho production (optional)
- ✅ Restrict CORS origins (không dùng `*` trong production)
- ✅ Enable **AWS WAF** để chống DDoS

### 2. Lambda

- ✅ Principle of least privilege cho IAM role
- ✅ Không hardcode secrets (dùng AWS Secrets Manager)
- ✅ Enable **X-Ray tracing** để debug
- ✅ Set **reserved concurrency** để tránh bill shock

### 3. EC2 Backend

- ✅ Đặt trong **private subnet**
- ✅ Chỉ allow traffic từ Lambda security group
- ✅ Enable **VPC Flow Logs** để audit
- ✅ Regularly update packages

## 📈 Scaling & Performance

### Lambda Auto-scaling

- Lambda tự động scale từ 0 → 1000 concurrent executions
- Nếu cần hơn 1000: Request limit increase từ AWS Support

### API Gateway Throttling

- Default: 10,000 requests/second
- Burst: 5,000 requests
- Có thể tăng bằng cách request quota increase

### Caching

1. **API Gateway caching** (có phí):
   - Stages → Cache Settings
   - TTL: 300 seconds (5 minutes)
   - Cache capacity: 0.5GB - 237GB

2. **Lambda caching**:
   - Cache data trong global scope (giữa invocations)
   - Dùng ElastiCache Redis (nếu cần)

## 🎯 Next Steps

### Enhancements có thể thêm:

1. **Authentication**
   - Thêm AWS Cognito cho user authentication
   - API Gateway authorizer

2. **Database**
   - Lưu demo requests vào DynamoDB
   - Hoặc RDS PostgreSQL

3. **Notifications**
   - SNS topic để notify admin khi có demo request
   - SES để gửi email confirmation

4. **Analytics**
   - CloudWatch Insights queries
   - Kinesis Data Firehose → S3 → Athena

5. **CI/CD**
   - AWS SAM hoặc Serverless Framework
   - GitHub Actions để auto-deploy

## 📞 Support

Nếu gặp vấn đề:
1. Check CloudWatch Logs
2. Test từng component riêng (Lambda → API Gateway → Frontend)
3. Verify Security Groups và VPC configuration
4. Check AWS Service Health Dashboard

---

**Tài liệu được tạo:** 2024
**Version:** 1.0
**Author:** AAP Vietnam Development Team
