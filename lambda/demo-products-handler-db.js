/**
 * AWS Lambda Function - Demo Products API with MongoDB/DocumentDB
 * 
 * Kết nối trực tiếp với MongoDB/DocumentDB để lấy dữ liệu thật
 * Lambda phải được deploy trong VPC để kết nối DocumentDB
 */

import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB/DocumentDB connection config
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'; // Fallback to mock if DB fails

// Connection pooling - reuse across Lambda invocations
let cachedClient = null;
let cachedDb = null;

// Mock data fallback
const DEMO_PRODUCTS = [
    {
        _id: 'demo-1',
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
        _id: 'demo-2',
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
    }
];

/**
 * Connect to MongoDB/DocumentDB with connection pooling
 */
async function connectToDatabase() {
    if (cachedDb) return cachedDb;

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'auto_showroom';

    const client = new MongoClient(uri, {
        tls: true,
        tlsCAFile: path.join(__dirname, 'global-bundle.pem'),
        retryWrites: false,
        serverSelectionTimeoutMS: 5000,
    });

    await client.connect();

    cachedClient = client;
    cachedDb = client.db(dbName);

    return cachedDb;
}

/**
 * Helper: Create response with CORS headers
 */
const createResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(body)
    };
};

/**
 * Handler: GET /demo/products
 */
const getProducts = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const limit = parseInt(queryParams.limit) || 10;
        const brand = queryParams.brand;

        let products;
        let source = 'Mock Data';

        if (!USE_MOCK_DATA) {
            try {
                const db = await connectToDatabase();
                const collection = db.collection('cars');

                // Build query
                const query = {};
                if (brand) {
                    query.brand = new RegExp(brand, 'i');
                }

                // Fetch from database
                products = await collection
                    .find(query)
                    .limit(limit)
                    .toArray();

                // Transform _id to id for consistency
                products = products.map(p => ({
                    ...p,
                    id: p._id.toString(),
                    _id: undefined
                }));

                source = 'MongoDB/DocumentDB';
            } catch (dbError) {
                console.error('Database error, falling back to mock data:', dbError);
                products = [...DEMO_PRODUCTS];
                source = 'Mock Data (DB Error)';
            }
        } else {
            products = [...DEMO_PRODUCTS];
        }

        // Apply filters if using mock data
        if (source.includes('Mock')) {
            if (brand) {
                products = products.filter(p => 
                    p.brand.toLowerCase().includes(brand.toLowerCase())
                );
            }
            products = products.slice(0, limit);
        }

        return createResponse(200, {
            success: true,
            count: products.length,
            data: products,
            message: 'Products retrieved successfully',
            source
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

        let product;
        let source = 'Mock Data';

        if (!USE_MOCK_DATA) {
            try {
                const db = await connectToDatabase();
                const collection = db.collection('cars');

                // Try to find by _id or custom id field
                const queryOptions = [
                    { id: productId },
                    { _id: productId }
                ];

                if (ObjectId.isValid(productId)) {
                    queryOptions.push({ _id: new ObjectId(productId) });
                }

                product = await collection.findOne({
                    $or: queryOptions
                });

                if (product) {
                    product.id = product._id.toString();
                    delete product._id;
                    source = 'MongoDB/DocumentDB';
                }
            } catch (dbError) {
                console.error('Database error, falling back to mock data:', dbError);
                product = DEMO_PRODUCTS.find(p => p._id === productId);
                source = 'Mock Data (DB Error)';
            }
        } else {
            product = DEMO_PRODUCTS.find(p => p._id === productId);
        }

        if (!product) {
            return createResponse(404, {
                success: false,
                message: 'Product not found'
            });
        }

        return createResponse(200, {
            success: true,
            data: product,
            message: 'Product details retrieved successfully',
            source
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
 */
const createDemoRequest = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        
        const { name, email, phone, productId, message } = body;
        
        if (!name || !email || !productId) {
            return createResponse(400, {
                success: false,
                message: 'Name, email, and productId are required'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return createResponse(400, {
                success: false,
                message: 'Invalid email format'
            });
        }

        // Find product to get name
        let productName = 'Unknown Product';
        
        if (!USE_MOCK_DATA) {
            try {
                const db = await connectToDatabase();
                const productsCollection = db.collection('cars');
                
                const product = await productsCollection.findOne({
                    $or: [
                        { _id: productId },
                        { id: productId }
                    ]
                });
                
                if (product) {
                    productName = `${product.brand} ${product.car_model}`;
                }
            } catch (dbError) {
                console.error('Error finding product:', dbError);
            }
        } else {
            const product = DEMO_PRODUCTS.find(p => p._id === productId);
            if (product) {
                productName = `${product.brand} ${product.car_model}`;
            }
        }

        // Create demo request
        const demoRequest = {
            requestId: `REQ-${Date.now()}`,
            name,
            email,
            phone: phone || 'Not provided',
            productId,
            productName,
            message: message || 'No message',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Save to database if available
        let source = 'Mock Data';
        if (!USE_MOCK_DATA) {
            try {
                const db = await connectToDatabase();
                const requestsCollection = db.collection('demo_requests');
                
                await requestsCollection.insertOne(demoRequest);
                source = 'MongoDB/DocumentDB';
            } catch (dbError) {
                console.error('Error saving to database:', dbError);
                source = 'Mock Data (DB Error)';
            }
        }

        return createResponse(201, {
            success: true,
            data: demoRequest,
            message: 'Demo request created successfully',
            source
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

        // Normalize path (remove /prod prefix and trailing slash)
        const normalizedPath = path.replace(/^\/prod/, '').replace(/\/$/, '');

        // Route handling
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
            path: normalizedPath,
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
