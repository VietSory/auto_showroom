# Lambda Function - Demo Products Handler

## 📝 Mô tả

AWS Lambda function xử lý API requests cho demo products. Function này:
- Trả về mock data sản phẩm (không cần database)
- Có thể gọi về EC2 backend để lấy dữ liệu thực (optional)
- Xử lý CORS tự động
- Support 3 endpoints: GET products, GET product detail, POST demo request

## 🏗️ Cấu trúc

```
lambda/
├── demo-products-handler.js    # Main Lambda function
├── package.json                # Dependencies (hiện tại không cần external deps)
└── README.md                   # File này
```

## 📦 Deployment

### Option 1: Upload trực tiếp (Code nhỏ)

1. Copy code từ `demo-products-handler.js`
2. Paste vào Lambda console Code editor
3. Click Deploy

### Option 2: Upload ZIP (Recommended)

```bash
# Tạo ZIP file
cd lambda
zip -r function.zip demo-products-handler.js package.json

# Upload qua AWS CLI
aws lambda update-function-code \
  --function-name demo-products-handler \
  --zip-file fileb://function.zip

# Hoặc upload qua Console
# Lambda → Upload from → .zip file
```

## ⚙️ Configuration

### Runtime Settings
- **Handler:** `demo-products-handler.handler`
- **Runtime:** Node.js 20.x (hoặc 18.x)
- **Architecture:** x86_64
- **Timeout:** 30 seconds
- **Memory:** 256 MB

### Environment Variables

| Key | Value | Mô tả |
|-----|-------|-------|
| `EC2_BACKEND_URL` | `http://10.0.1.100:5000` | URL của EC2 backend (private IP) |
| `USE_EC2_BACKEND` | `false` | Set `true` để gọi EC2 thay vì dùng mock data |

### VPC Configuration (Optional)

Chỉ cần nếu `USE_EC2_BACKEND=true`:
- **VPC:** Cùng VPC với EC2
- **Subnets:** Private subnets (có NAT Gateway)
- **Security Group:** Allow outbound port 5000 to EC2

## 🧪 Testing

### Test Event 1: GET Products

```json
{
  "httpMethod": "GET",
  "path": "/demo/products",
  "queryStringParameters": {
    "limit": "10",
    "brand": "Mercedes"
  }
}
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\":true,\"count\":3,\"data\":[...]}"
}
```

### Test Event 2: GET Product Detail

```json
{
  "httpMethod": "GET",
  "path": "/demo/products/demo-1",
  "pathParameters": {
    "id": "demo-1"
  }
}
```

### Test Event 3: POST Demo Request

```json
{
  "httpMethod": "POST",
  "path": "/demo/request",
  "body": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"productId\":\"demo-1\",\"message\":\"Test message\"}"
}
```

### Test Event 4: OPTIONS (CORS Preflight)

```json
{
  "httpMethod": "OPTIONS",
  "path": "/demo/products"
}
```

## 📊 Monitoring

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/demo-products-handler --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/demo-products-handler \
  --filter-pattern "ERROR"
```

### Metrics

- **Invocations:** Số lần function được gọi
- **Duration:** Thời gian xử lý (ms)
- **Errors:** Số lỗi
- **Throttles:** Số lần bị throttle

## 🔧 Troubleshooting

### Lambda timeout

**Triệu chứng:** `Task timed out after 3.00 seconds`

**Giải pháp:**
1. Tăng timeout: Configuration → General → Timeout → 30s
2. Nếu gọi EC2: Kiểm tra VPC/NAT Gateway

### Cannot connect to EC2

**Triệu chứng:** `Error: connect ETIMEDOUT`

**Giải pháp:**
1. Kiểm tra Lambda trong VPC
2. Kiểm tra Security Groups
3. Kiểm tra EC2 backend đang chạy:
```bash
ssh ec2-instance
curl http://localhost:5000/api/demo/health
```

### CORS errors

**Triệu chứng:** Browser console shows CORS error

**Giải pháp:**
1. Kiểm tra Lambda response có CORS headers
2. Kiểm tra API Gateway CORS configuration
3. Test với curl:
```bash
curl -i https://api-gateway-url/demo/products
# Phải có header: access-control-allow-origin
```

## 🚀 Performance

### Cold Start

- **First invocation:** 1-3 seconds (khởi động container)
- **Warm invocations:** 50-200ms

**Giảm cold start:**
1. Provisioned Concurrency (có phí)
2. Giảm dependencies
3. Tối ưu code

### Concurrency

- **Default:** 1000 concurrent executions
- **Reserved:** Có thể set reserved concurrency
- **Provisioned:** Có thể set provisioned concurrency

## 💰 Cost Estimate

### Free Tier
- 1M requests/month
- 400,000 GB-seconds compute time

### Pricing (sau free tier)
- **Requests:** $0.20 per 1M requests
- **Compute:** $0.0000166667 per GB-second
- **Example:** 1M requests × 256MB × 200ms = ~$0.83/month

## 📚 API Documentation

### GET /demo/products

Lấy danh sách sản phẩm demo

**Query Parameters:**
- `limit` (optional): Số lượng products (default: 10)
- `brand` (optional): Filter theo brand

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
      "price": "1,200,000",
      "images": ["https://..."],
      "horsepower": "429 HP",
      "rated": "4.8"
    }
  ],
  "source": "AWS Lambda Mock Data"
}
```

### GET /demo/products/{id}

Lấy chi tiết sản phẩm

**Path Parameters:**
- `id`: Product ID

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
    "features": ["Adaptive Cruise Control", "..."]
  }
}
```

### POST /demo/request

Tạo yêu cầu demo/test drive

**Request Body:**
```json
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
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔐 Security

### IAM Role Permissions

Lambda execution role cần:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

Nếu dùng VPC, thêm:

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

### Best Practices

- ✅ Không hardcode secrets
- ✅ Validate input data
- ✅ Set timeout hợp lý
- ✅ Enable X-Ray tracing
- ✅ Use environment variables cho config

## 📈 Scaling

Lambda tự động scale:
- **0 → 1000** concurrent executions
- **Burst:** 500-3000 (tùy region)

Nếu cần hơn:
- Request limit increase từ AWS Support
- Hoặc dùng SQS queue để buffer requests

## 🔄 CI/CD

### GitHub Actions Example

```yaml
name: Deploy Lambda

on:
  push:
    branches: [main]
    paths:
      - 'lambda/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Create ZIP
        run: |
          cd lambda
          zip -r function.zip demo-products-handler.js package.json
      
      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name demo-products-handler \
            --zip-file fileb://lambda/function.zip
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

## 📞 Support

- **CloudWatch Logs:** `/aws/lambda/demo-products-handler`
- **AWS Support:** https://console.aws.amazon.com/support/
- **Documentation:** See `docs/AWS_LAMBDA_DEMO_GUIDE.md`

---

**Version:** 1.0
**Last Updated:** 2024
