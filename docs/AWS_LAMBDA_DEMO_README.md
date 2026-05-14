# AWS Lambda + API Gateway Demo Feature

## 📖 Tổng quan

Đây là tài liệu tổng hợp cho chức năng demo sử dụng AWS Lambda và API Gateway. Chức năng này cho phép người dùng xem và tương tác với sản phẩm demo **không cần đăng nhập**, hoàn toàn tách biệt với hệ thống CRUD admin hiện tại.

## 🎯 Mục tiêu

1. **Demo AWS Serverless Architecture**
   - Sử dụng AWS Lambda (serverless compute)
   - Sử dụng AWS API Gateway (managed API)
   - Tích hợp với S3 static hosting

2. **Public API cho người dùng**
   - Không cần authentication
   - Xem danh sách sản phẩm demo
   - Xem chi tiết sản phẩm
   - Gửi yêu cầu demo/test drive

3. **Tách biệt với Admin API**
   - Không cho phép CRUD operations
   - Chỉ read-only và create demo requests
   - Bảo vệ admin endpoints

## 🏗️ Kiến trúc

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│  S3 Static   │ Frontend (React)
│   Website    │ /demo page
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│ API Gateway  │ Public REST API
│  /demo/*     │ CORS enabled
└──────┬───────┘
       │ Invoke
       ▼
┌──────────────┐
│ AWS Lambda   │ Serverless function
│ demo-handler │ Node.js 20.x
└──────┬───────┘
       │ HTTP (Optional)
       ▼
┌──────────────┐
│ EC2 Backend  │ Private subnet
│  /api/demo/* │ MongoDB
└──────────────┘
```

## 📁 Cấu trúc thư mục

```
project/
├── lambda/                              # Lambda function code
│   ├── demo-products-handler.js         # Main handler
│   ├── package.json                     # Dependencies
│   ├── deploy.sh                        # Deployment script
│   ├── test-local.js                    # Local testing
│   └── README.md                        # Lambda docs
│
├── server/
│   ├── routes/
│   │   └── demo.route.js                # Backend routes (optional)
│   └── index.js                         # Updated with demo routes
│
├── client/
│   ├── src/
│   │   ├── _demo/
│   │   │   ├── DemoPage.tsx             # Demo page component
│   │   │   └── index.ts                 # Exports
│   │   └── App.tsx                      # Updated with /demo route
│   ├── .env.example                     # Environment template
│   └── .env                             # API Gateway URL
│
└── docs/                                # Documentation
    ├── AWS_LAMBDA_DEMO_GUIDE.md         # Chi tiết đầy đủ
    ├── QUICK_START_VI.md                # Hướng dẫn nhanh
    ├── DEPLOYMENT_CHECKLIST.md          # Checklist deploy
    ├── postman-collection.json          # Postman tests
    └── AWS_LAMBDA_DEMO_README.md        # File này
```

## 🚀 Quick Start

### 1. Deploy Lambda (5 phút)

```bash
cd lambda
zip -r function.zip demo-products-handler.js package.json
# Upload to AWS Lambda console
```

### 2. Create API Gateway (5 phút)

- AWS Console → API Gateway → Create HTTP API
- Add Lambda integration
- Create routes: GET /demo/products, GET /demo/products/{id}, POST /demo/request
- Configure CORS
- Deploy and get URL

### 3. Deploy Frontend (5 phút)

```bash
cd client
echo "VITE_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com" > .env
npm run build
aws s3 sync dist/ s3://your-bucket/
```

### 4. Test

```bash
curl https://your-api-gateway-url/demo/products
```

Truy cập: `https://your-s3-website.com/demo`

## 📚 Tài liệu chi tiết

### Cho người mới bắt đầu
- **[Quick Start Guide](QUICK_START_VI.md)** - Triển khai trong 15 phút
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Checklist từng bước

### Cho developer
- **[AWS Lambda Demo Guide](AWS_LAMBDA_DEMO_GUIDE.md)** - Hướng dẫn đầy đủ
- **[Lambda README](../lambda/README.md)** - Chi tiết Lambda function
- **[Postman Collection](postman-collection.json)** - API testing

### Cho DevOps
- **[Deployment Script](../lambda/deploy.sh)** - Auto deployment
- **[Monitoring Guide](AWS_LAMBDA_DEMO_GUIDE.md#-monitoring--logs)** - CloudWatch setup

## 🔌 API Endpoints

### Base URL
```
https://{api-id}.execute-api.{region}.amazonaws.com
```

### Endpoints

#### 1. GET /demo/products
Lấy danh sách sản phẩm demo

**Query Parameters:**
- `limit` (optional): Số lượng products (default: 10)
- `brand` (optional): Filter theo brand

**Example:**
```bash
curl "https://api-gateway-url/demo/products?limit=5&brand=Mercedes"
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
      "price": "1,200,000",
      "images": ["https://..."],
      "horsepower": "429 HP",
      "rated": "4.8"
    }
  ],
  "source": "AWS Lambda Mock Data"
}
```

#### 2. GET /demo/products/{id}
Lấy chi tiết sản phẩm

**Example:**
```bash
curl "https://api-gateway-url/demo/products/demo-1"
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
    "features": ["Adaptive Cruise Control", "..."]
  }
}
```

#### 3. POST /demo/request
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

## 🧪 Testing

### Local Testing

```bash
# Test Lambda function locally
cd lambda
node test-local.js
```

### API Testing

```bash
# Test with curl
curl https://api-gateway-url/demo/products

# Import Postman collection
# File: docs/postman-collection.json
```

### Frontend Testing

```bash
cd client
npm run dev
# Visit: http://localhost:5173/demo
```

## 🔧 Configuration

### Lambda Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `USE_EC2_BACKEND` | `false` | Set `true` to call EC2 backend |
| `EC2_BACKEND_URL` | `http://10.0.x.x:5000` | EC2 private IP |

### Frontend Environment Variables

```bash
# client/.env
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com
```

### API Gateway CORS

```
Access-Control-Allow-Origin: * (dev) or https://your-s3-website.com (prod)
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key
```

## 🔒 Security

### Lambda
- ✅ Minimal IAM permissions
- ✅ No hardcoded secrets
- ✅ Input validation
- ✅ Error handling

### API Gateway
- ✅ Throttling enabled (10,000 req/s)
- ✅ CORS configured
- ✅ Request validation
- ✅ CloudWatch logging

### EC2 Backend (if used)
- ✅ Private subnet
- ✅ Security group restrictions
- ✅ Only accessible from Lambda

## 📊 Monitoring

### CloudWatch Logs
- Lambda: `/aws/lambda/demo-products-handler`
- API Gateway: `/aws/apigateway/demo-products-api`

### Metrics to Monitor
- Lambda Invocations
- Lambda Errors
- Lambda Duration
- API Gateway 4XX/5XX errors
- API Gateway Latency

### Alarms
- Lambda Errors > 5 in 5 minutes
- API Gateway 5XX > 10 in 5 minutes
- Lambda Duration > 10 seconds

## 💰 Cost Estimate

### Free Tier (Monthly)
- Lambda: 1M requests, 400,000 GB-seconds
- API Gateway: 1M requests
- S3: 5GB storage, 20,000 GET requests

### After Free Tier
- Lambda: $0.20 per 1M requests
- API Gateway: $1.00 per 1M requests (HTTP API)
- S3: $0.023 per GB storage

**Example:** 100K requests/month = ~$0 (within free tier)

## ⚠️ Troubleshooting

### CORS Error
```
Access to fetch has been blocked by CORS policy
```
**Fix:** Configure CORS in API Gateway

### Lambda Timeout
```
Task timed out after 3.00 seconds
```
**Fix:** Increase timeout to 30 seconds

### Cannot Connect to EC2
```
Error: connect ETIMEDOUT
```
**Fix:** Check VPC, Security Groups, NAT Gateway

### 404 Not Found
```
{"message":"Not Found"}
```
**Fix:** Check API Gateway routes

Xem thêm: [AWS_LAMBDA_DEMO_GUIDE.md - Troubleshooting](AWS_LAMBDA_DEMO_GUIDE.md#-các-lỗi-thường-gặp-và-cách-sửa)

## 🎓 Learning Resources

### AWS Documentation
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [S3 Static Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

### Tutorials
- [Serverless Framework](https://www.serverless.com/)
- [AWS SAM](https://aws.amazon.com/serverless/sam/)

## 🔄 CI/CD

### GitHub Actions Example

```yaml
name: Deploy Lambda
on:
  push:
    branches: [main]
    paths: ['lambda/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        run: |
          cd lambda
          ./deploy.sh demo-products-handler us-east-1
```

## 📈 Future Enhancements

### Phase 2
- [ ] Add DynamoDB for demo requests storage
- [ ] Add SNS notifications for new requests
- [ ] Add SES email confirmations
- [ ] Add Cognito authentication (optional)

### Phase 3
- [ ] Add CloudWatch Insights queries
- [ ] Add X-Ray tracing
- [ ] Add API Gateway caching
- [ ] Add Lambda@Edge for global distribution

### Phase 4
- [ ] Add GraphQL API
- [ ] Add WebSocket support
- [ ] Add real-time notifications
- [ ] Add analytics dashboard

## 🤝 Contributing

### Code Style
- ESLint for JavaScript
- Prettier for formatting
- TypeScript for frontend

### Testing
- Unit tests for Lambda
- Integration tests for API
- E2E tests for frontend

### Documentation
- Update README for new features
- Add JSDoc comments
- Update API documentation

## 📞 Support

### Issues
- Check [Troubleshooting Guide](AWS_LAMBDA_DEMO_GUIDE.md#-các-lỗi-thường-gặp-và-cách-sửa)
- Check CloudWatch Logs
- Check AWS Service Health Dashboard

### Contact
- **Email:** support@aapvietnam.online
- **Slack:** #aws-lambda-demo
- **AWS Support:** https://console.aws.amazon.com/support/

## 📝 Changelog

### Version 1.0.0 (2024-01-15)
- ✅ Initial release
- ✅ Lambda function with 3 endpoints
- ✅ API Gateway integration
- ✅ Frontend demo page
- ✅ Complete documentation
- ✅ Deployment scripts
- ✅ Testing tools

## 📄 License

MIT License - See LICENSE file for details

---

**Project:** AAP Vietnam Auto Showroom
**Feature:** AWS Lambda Demo
**Version:** 1.0.0
**Last Updated:** 2024
**Maintainer:** AAP Vietnam Development Team
