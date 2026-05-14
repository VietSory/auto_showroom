# AWS Lambda Demo - Architecture Diagrams

## 🏗️ System Architecture

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CloudFront (Optional)                       │
│                    CDN + SSL Certificate                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Amazon S3 Static Website                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend (React)                                         │  │
│  │  - index.html                                             │  │
│  │  - /demo page (DemoPage.tsx)                             │  │
│  │  - Static assets (JS, CSS, images)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (CORS enabled)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTTP API                                                 │  │
│  │  - GET  /demo/products                                    │  │
│  │  - GET  /demo/products/{id}                               │  │
│  │  - POST /demo/request                                     │  │
│  │                                                            │  │
│  │  Features:                                                │  │
│  │  - CORS configuration                                     │  │
│  │  - Throttling (10K req/s)                                │  │
│  │  - CloudWatch logging                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Invoke
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Lambda                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  demo-products-handler                                    │  │
│  │  - Runtime: Node.js 20.x                                  │  │
│  │  - Memory: 256 MB                                         │  │
│  │  - Timeout: 30 seconds                                    │  │
│  │                                                            │  │
│  │  Functions:                                               │  │
│  │  - getProducts()                                          │  │
│  │  - getProductById()                                       │  │
│  │  - createDemoRequest()                                    │  │
│  │                                                            │  │
│  │  Data Source:                                             │  │
│  │  - Mock data (default)                                    │  │
│  │  - EC2 Backend (optional)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (Optional, if USE_EC2_BACKEND=true)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VPC                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Private Subnet                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  EC2 Instance (Backend)                            │  │  │
│  │  │  - Node.js + Express                               │  │  │
│  │  │  - /api/demo/products                              │  │  │
│  │  │  - /api/demo/requests                              │  │  │
│  │  │  - MongoDB connection                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### Flow 1: Get Products (Mock Data)

```
User Browser
    │
    │ 1. User visits /demo page
    ▼
S3 Static Website
    │
    │ 2. Load React app
    ▼
React App (DemoPage.tsx)
    │
    │ 3. Fetch products
    │    GET https://api-gateway-url/demo/products
    ▼
API Gateway
    │
    │ 4. Route to Lambda
    │    Invoke demo-products-handler
    ▼
Lambda Function
    │
    │ 5. Execute getProducts()
    │    - Read mock data
    │    - Filter by query params
    │    - Return JSON
    ▼
API Gateway
    │
    │ 6. Add CORS headers
    │    Return response
    ▼
React App
    │
    │ 7. Display products
    │    - Render cards
    │    - Show images
    ▼
User sees products
```

### Flow 2: Get Products (From EC2)

```
User Browser
    │
    │ 1. User visits /demo page
    ▼
S3 Static Website
    │
    │ 2. Load React app
    ▼
React App (DemoPage.tsx)
    │
    │ 3. Fetch products
    │    GET https://api-gateway-url/demo/products
    ▼
API Gateway
    │
    │ 4. Route to Lambda
    ▼
Lambda Function (in VPC)
    │
    │ 5. Check USE_EC2_BACKEND=true
    │    Call EC2 backend
    │    GET http://10.0.1.100:5000/api/demo/products
    ▼
EC2 Backend
    │
    │ 6. Query MongoDB
    │    - Find products
    │    - Apply filters
    │    - Return JSON
    ▼
Lambda Function
    │
    │ 7. Process response
    │    - Add metadata
    │    - Return to API Gateway
    ▼
API Gateway
    │
    │ 8. Add CORS headers
    ▼
React App
    │
    │ 9. Display products
    ▼
User sees products
```

### Flow 3: Create Demo Request

```
User Browser
    │
    │ 1. User fills form
    │    - Name, Email, Phone
    │    - Product ID
    │    - Message
    ▼
React App (DemoPage.tsx)
    │
    │ 2. Submit form
    │    POST https://api-gateway-url/demo/request
    │    Body: { name, email, productId, ... }
    ▼
API Gateway
    │
    │ 3. Route to Lambda
    ▼
Lambda Function
    │
    │ 4. Execute createDemoRequest()
    │    - Validate input
    │    - Check email format
    │    - Generate request ID
    │
    ├─────────────────────────────────────┐
    │                                     │
    │ Option A: Save to memory           │ Option B: Save to EC2
    │ (default)                           │ (if USE_EC2_BACKEND=true)
    │                                     │
    │                                     ▼
    │                                  EC2 Backend
    │                                     │
    │                                     │ Save to MongoDB
    │                                     │ Send email notification
    │                                     │
    └─────────────────────────────────────┘
    │
    │ 5. Return success response
    ▼
API Gateway
    │
    │ 6. Add CORS headers
    ▼
React App
    │
    │ 7. Show success message
    │    - Toast notification
    │    - Reset form
    ▼
User sees confirmation
```

## 🔐 Security Architecture

### Network Security

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
│                      (Public Access)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS only (443)
                             │ SSL/TLS encryption
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFront / S3                               │
│                    - Public read access                          │
│                    - No authentication required                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (CORS validated)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Features:                                       │  │
│  │  - Throttling: 10,000 req/s                              │  │
│  │  - Burst limit: 5,000 req                                │  │
│  │  - CORS: Restrict origins                                │  │
│  │  - Request validation                                     │  │
│  │  - CloudWatch logging                                     │  │
│  │  - AWS WAF (optional)                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ IAM role-based invocation
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Lambda                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Execution Role (IAM):                                    │  │
│  │  - CloudWatch Logs write                                  │  │
│  │  - VPC network interface (if needed)                      │  │
│  │  - No database access                                     │  │
│  │  - No S3 access                                           │  │
│  │                                                            │  │
│  │  Security:                                                │  │
│  │  - Input validation                                       │  │
│  │  - No secrets in code                                     │  │
│  │  - Environment variables for config                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Private network (if VPC enabled)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VPC                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Lambda Security Group                                    │  │
│  │  Outbound:                                                │  │
│  │  - Port 5000 → EC2 Security Group                        │  │
│  │  - Port 443 → 0.0.0.0/0 (for internet via NAT)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  EC2 Security Group                                       │  │
│  │  Inbound:                                                 │  │
│  │  - Port 5000 ← Lambda Security Group only                │  │
│  │  - No public access                                       │  │
│  │                                                            │  │
│  │  Outbound:                                                │  │
│  │  - Port 27017 → MongoDB (DocumentDB)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Mock Data Flow (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Function                               │
│                                                                   │
│  const DEMO_PRODUCTS = [                                         │
│    {                                                              │
│      id: 'demo-1',                                               │
│      brand: 'Mercedes-Benz',                                     │
│      car_model: 'AMG CLS 53',                                    │
│      price: '1,200,000',                                         │
│      ...                                                          │
│    },                                                             │
│    ...                                                            │
│  ];                                                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  getProducts()                                           │   │
│  │  1. Read DEMO_PRODUCTS array                            │   │
│  │  2. Filter by query params (brand, limit)               │   │
│  │  3. Return JSON response                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  getProductById()                                        │   │
│  │  1. Find product by ID in array                         │   │
│  │  2. Add detailed info                                    │   │
│  │  3. Return JSON response                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  createDemoRequest()                                     │   │
│  │  1. Validate input                                       │   │
│  │  2. Generate request ID                                  │   │
│  │  3. Store in memory (temporary)                          │   │
│  │  4. Return success response                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Real Data Flow (EC2 Backend)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Function                               │
│                                                                   │
│  Environment Variables:                                          │
│  - USE_EC2_BACKEND = true                                        │
│  - EC2_BACKEND_URL = http://10.0.1.100:5000                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  getProducts()                                           │   │
│  │  1. Check USE_EC2_BACKEND                                │   │
│  │  2. Call EC2: GET /api/demo/products                     │   │
│  │  3. Receive response from EC2                            │   │
│  │  4. Add metadata (source: 'EC2 Backend')                │   │
│  │  5. Return JSON response                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Backend                                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/demo/products                                  │   │
│  │  1. Receive request from Lambda                          │   │
│  │  2. Query MongoDB                                        │   │
│  │  3. Apply filters (brand, limit)                         │   │
│  │  4. Format response                                      │   │
│  │  5. Return JSON                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MongoDB query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB / DocumentDB                          │
│                                                                   │
│  Collection: cars                                                │
│  {                                                                │
│    _id: ObjectId("..."),                                         │
│    brand: "Mercedes-Benz",                                       │
│    car_model: "AMG CLS 53",                                      │
│    price: "1,200,000",                                           │
│    images: [...],                                                │
│    ...                                                            │
│  }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Machine                             │
│                                                                   │
│  1. Write code                                                   │
│     - lambda/demo-products-handler.js                           │
│     - client/src/_demo/DemoPage.tsx                             │
│                                                                   │
│  2. Test locally                                                 │
│     - node lambda/test-local.js                                 │
│     - npm run dev (frontend)                                     │
│                                                                   │
│  3. Create deployment package                                    │
│     - cd lambda && zip -r function.zip *                        │
│     - cd client && npm run build                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Upload
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Console / CLI                             │
│                                                                   │
│  Lambda Deployment:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Create/Update Lambda function                       │   │
│  │  2. Upload function.zip                                  │   │
│  │  3. Configure runtime settings                           │   │
│  │  4. Set environment variables                            │   │
│  │  5. Configure VPC (optional)                             │   │
│  │  6. Test function                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  API Gateway Deployment:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Create HTTP API                                      │   │
│  │  2. Add Lambda integration                               │   │
│  │  3. Create routes                                        │   │
│  │  4. Configure CORS                                       │   │
│  │  5. Deploy to stage                                      │   │
│  │  6. Get invoke URL                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Frontend Deployment:                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Update .env with API Gateway URL                     │   │
│  │  2. Build: npm run build                                 │   │
│  │  3. Upload to S3: aws s3 sync dist/ s3://bucket/        │   │
│  │  4. Invalidate CloudFront cache (if used)                │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Deployed
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Environment                        │
│                                                                   │
│  ✅ Lambda function running                                      │
│  ✅ API Gateway endpoints active                                 │
│  ✅ Frontend accessible via S3/CloudFront                        │
│  ✅ Monitoring enabled (CloudWatch)                              │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Scaling Architecture

```
                    ┌─────────────────────┐
                    │   CloudFront CDN    │
                    │   (Global Edge)     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │  Edge 1  │   │  Edge 2  │   │  Edge 3  │
         │  US-East │   │  EU-West │   │  AP-SE   │
         └──────────┘   └──────────┘   └──────────┘
                │              │              │
                └──────────────┼──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    API Gateway      │
                    │  Auto-scaling       │
                    │  10K req/s default  │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │ Lambda 1 │   │ Lambda 2 │   │ Lambda N │
         │ Instance │   │ Instance │   │ Instance │
         └──────────┘   └──────────┘   └──────────┘
                │              │              │
                └──────────────┼──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   EC2 Backend       │
                    │   (if needed)       │
                    └─────────────────────┘

Scaling Characteristics:
- Lambda: 0 → 1000 concurrent executions (auto)
- API Gateway: 10,000 req/s (can increase)
- CloudFront: Unlimited (global CDN)
- S3: Unlimited storage and requests
```

---

**Note:** Các diagrams này được tạo bằng ASCII art để dễ đọc trong terminal và text editors. Bạn có thể convert sang diagrams tools như draw.io, Lucidchart, hoặc PlantUML nếu cần.
