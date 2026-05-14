import express from 'express';
const router = express.Router();

// In-memory storage cho demo requests (production nên dùng database)
let demoRequests = [];

/**
 * GET /api/demo/health
 * Health check cho Lambda
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Demo API is healthy',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/demo/requests
 * Nhận demo request từ Lambda và lưu vào database
 */
router.post('/requests', async (req, res) => {
    try {
        const { requestId, name, email, phone, productId, productName, message } = req.body;

        // Validate
        if (!name || !email || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Tạo demo request object
        const demoRequest = {
            requestId: requestId || `REQ-${Date.now()}`,
            name,
            email,
            phone: phone || 'Not provided',
            productId,
            productName,
            message: message || 'No message',
            status: 'pending',
            createdAt: new Date().toISOString(),
            source: 'Lambda'
        };

        // Lưu vào memory (production nên lưu vào MongoDB)
        demoRequests.push(demoRequest);

        // TODO: Có thể gửi email notification cho admin
        // TODO: Có thể lưu vào MongoDB collection 'demo_requests'

        res.status(201).json({
            success: true,
            data: demoRequest,
            message: 'Demo request saved successfully'
        });

    } catch (error) {
        console.error('Error saving demo request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/demo/requests
 * Lấy danh sách demo requests (cho admin)
 */
router.get('/requests', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            count: demoRequests.length,
            data: demoRequests
        });
    } catch (error) {
        console.error('Error fetching demo requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/demo/products
 * Public endpoint để Lambda có thể lấy real products từ database
 * (Alternative: Lambda có thể query trực tiếp MongoDB nếu có VPC peering)
 */
router.get('/products', async (req, res) => {
    try {
        // Import Car model dynamically để tránh circular dependency
        const Car = (await import('../models/car.model.js')).default;
        
        const limit = parseInt(req.query.limit) || 10;
        const brand = req.query.brand;

        let query = {};
        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }

        const products = await Car.find(query)
            .select('brand car_model production_year body_style price images bio horsepower top_speed acceleration fuel_type rated')
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
            source: 'EC2 Backend Database'
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/demo/products/:id
 * Public endpoint để Lambda lấy chi tiết product
 */
router.get('/products/:id', async (req, res) => {
    try {
        const Car = (await import('../models/car.model.js')).default;
        
        const product = await Car.findById(req.params.id).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product,
            source: 'EC2 Backend Database'
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

export default router;
