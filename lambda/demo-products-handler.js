/**
 * AWS Lambda Function - Demo Products API
 * 
 * Chức năng: Xử lý các request từ API Gateway cho demo products
 * - GET /demo/products - Lấy danh sách sản phẩm demo
 * - GET /demo/products/{id} - Lấy chi tiết sản phẩm demo
 * - POST /demo/request - Tạo yêu cầu demo
 * 
 * Lambda này có thể:
 * 1. Trả về dữ liệu mẫu (mock data) - không cần kết nối EC2
 * 2. Gọi về EC2 private qua VPC (nếu cấu hình VPC cho Lambda)
 */

import https from 'https';
import http from 'http';

// Mock data cho demo (không cần kết nối database)
const DEMO_PRODUCTS = [
    {
        id: 'demo-1',
        brand: 'Mercedes-Benz',
        car_model: 'AMG CLS 53',
        production_year: '2024',
        body_style: 'Sedan',
        price: '1,200,000',
        images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
        bio: 'Luxury performance sedan with cutting-edge technology',
        horsepower: '429 HP',
        top_speed: '270 km/h',
        acceleration: '4.5s (0-100km/h)',
        fuel_type: 'Petrol',
        rated: '4.8',
        isDemo: true
    },
    {
        id: 'demo-2',
        brand: 'Audi',
        car_model: 'R8 V10',
        production_year: '2024',
        body_style: 'Coupe',
        price: '2,500,000',
        images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
        bio: 'Iconic supercar with naturally aspirated V10 engine',
        horsepower: '562 HP',
        top_speed: '330 km/h',
        acceleration: '3.2s (0-100km/h)',
        fuel_type: 'Petrol',
        rated: '4.9',
        isDemo: true
    },
    {
        id: 'demo-3',
        brand: 'Rolls-Royce',
        car_model: 'Phantom',
        production_year: '2024',
        body_style: 'Sedan',
        price: '8,500,000',
        images: ['https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800'],
        bio: 'The pinnacle of luxury automotive excellence',
        horsepower: '563 HP',
        top_speed: '250 km/h',
        acceleration: '5.3s (0-100km/h)',
        fuel_type: 'Petrol',
        rated: '5.0',
        isDemo: true
    }
];

// Cấu hình EC2 backend (nếu muốn gọi về EC2)
const EC2_BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://10.0.1.100:5000';
const USE_EC2_BACKEND = process.env.USE_EC2_BACKEND === 'true';

/**
 * Helper: Tạo response với CORS headers
 */
const createResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Cho phép tất cả origins (production nên giới hạn)
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(body)
    };
};

/**
 * Helper: Gọi HTTP request đến EC2 backend
 */
const callEC2Backend = (path, method = 'GET', data = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, EC2_BACKEND_URL);
        const protocol = url.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000 // 5 seconds timeout
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = protocol.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            console.error('EC2 Backend Error:', error);
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
};

/**
 * Handler: GET /demo/products
 * Lấy danh sách sản phẩm demo
 */
const getProducts = async (event) => {
    try {
        // Lấy query parameters
        const queryParams = event.queryStringParameters || {};
        const limit = parseInt(queryParams.limit) || 10;
        const brand = queryParams.brand;

        let products = [...DEMO_PRODUCTS];

        // Filter by brand nếu có
        if (brand) {
            products = products.filter(p => 
                p.brand.toLowerCase().includes(brand.toLowerCase())
            );
        }

        // Limit results
        products = products.slice(0, limit);

        return createResponse(200, {
            success: true,
            count: products.length,
            data: products,
            message: 'Demo products retrieved successfully',
            source: 'AWS Lambda Mock Data'
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Handler: GET /demo/products/{id}
 * Lấy chi tiết sản phẩm demo
 */
const getProductById = async (event) => {
    try {
        const productId = event.pathParameters?.id;

        if (!productId) {
            return createResponse(400, {
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = DEMO_PRODUCTS.find(p => p.id === productId);

        if (!product) {
            return createResponse(404, {
                success: false,
                message: 'Product not found'
            });
        }

        // Thêm thông tin chi tiết hơn cho single product
        const detailedProduct = {
            ...product,
            engine: '4.0L V8 Twin-Turbo',
            transmission: 'Automatic 9-speed',
            drive_type: 'AWD',
            exterior_color: 'Obsidian Black',
            interior_color: 'Nappa Leather Beige',
            seat_capacity: '4',
            cargo_space: '350L',
            audio_system: 'Burmester 3D Sound',
            warranty: '4 years / 100,000 km',
            features: [
                'Adaptive Cruise Control',
                'Lane Keep Assist',
                'Panoramic Sunroof',
                'Heated & Ventilated Seats',
                '360° Camera System'
            ]
        };

        return createResponse(200, {
            success: true,
            data: detailedProduct,
            message: 'Product details retrieved successfully',
            source: 'AWS Lambda Mock Data'
        });
    } catch (error) {
        console.error('Error in getProductById:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Handler: POST /demo/request
 * Tạo yêu cầu demo / test drive
 */
const createDemoRequest = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        
        // Validate input
        const { name, email, phone, productId, message } = body;
        
        if (!name || !email || !productId) {
            return createResponse(400, {
                success: false,
                message: 'Name, email, and productId are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return createResponse(400, {
                success: false,
                message: 'Invalid email format'
            });
        }

        // Tìm product
        const product = DEMO_PRODUCTS.find(p => p.id === productId);
        if (!product) {
            return createResponse(404, {
                success: false,
                message: 'Product not found'
            });
        }

        // Tạo demo request (trong thực tế có thể lưu vào DynamoDB hoặc gọi về EC2)
        const demoRequest = {
            requestId: `REQ-${Date.now()}`,
            name,
            email,
            phone: phone || 'Not provided',
            productId,
            productName: `${product.brand} ${product.car_model}`,
            message: message || 'No message',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Nếu cấu hình USE_EC2_BACKEND, có thể gọi về EC2 để lưu
        if (USE_EC2_BACKEND) {
            try {
                await callEC2Backend('/api/demo/requests', 'POST', demoRequest);
            } catch (ec2Error) {
                console.error('Failed to save to EC2, continuing with mock:', ec2Error);
            }
        }

        return createResponse(201, {
            success: true,
            data: demoRequest,
            message: 'Demo request created successfully',
            source: 'AWS Lambda'
        });
    } catch (error) {
        console.error('Error in createDemoRequest:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Main Lambda Handler
 */
export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'OK' });
    }

    try {
        const path = event.path || event.rawPath || '';
        const method = event.httpMethod || event.requestContext?.http?.method || 'GET';

        // Route handling
        // Normalize path (remove trailing slash and handle both /prod prefix and without)
        const normalizedPath = path.replace(/^\/prod/, '').replace(/\/$/, '');
        
        if (method === 'GET' && normalizedPath === '/demo/products') {
            return await getProducts(event);
        }
        
        if (method === 'GET' && normalizedPath.match(/^\/demo\/products\/[^/]+$/)) {
            return await getProductById(event);
        }
        
        if (method === 'POST' && normalizedPath === '/demo/request') {
            return await createDemoRequest(event);
        }

        // Route not found
        return createResponse(404, {
            success: false,
            message: 'Route not found',
            path,
            method
        });

    } catch (error) {
        console.error('Lambda Error:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
