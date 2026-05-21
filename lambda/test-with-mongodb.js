/**
 * Test Lambda handler locally with MongoDB
 * Usage: node test-with-mongodb.js
 */

import { handler } from './demo-products-handler-db.js';

// Set environment variables for testing
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
process.env.DB_NAME = process.env.DB_NAME || 'auto_showroom';
process.env.USE_MOCK_DATA = process.env.USE_MOCK_DATA || 'true'; // Use mock by default for local testing

console.log('🧪 Testing Lambda Handler with MongoDB\n');
console.log('Configuration:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
console.log('\n' + '='.repeat(60) + '\n');

// Test cases
const tests = [
    {
        name: 'GET All Products',
        event: {
            httpMethod: 'GET',
            path: '/demo/products',
            queryStringParameters: { limit: '10' }
        }
    },
    {
        name: 'GET Products - Filter by Brand',
        event: {
            httpMethod: 'GET',
            path: '/demo/products',
            queryStringParameters: { limit: '5', brand: 'Mercedes' }
        }
    },
    {
        name: 'GET Product by ID',
        event: {
            httpMethod: 'GET',
            path: '/demo/products/demo-1',
            pathParameters: { id: 'demo-1' }
        }
    },
    {
        name: 'POST Demo Request',
        event: {
            httpMethod: 'POST',
            path: '/demo/request',
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                phone: '+84 123 456 789',
                productId: 'demo-1',
                message: 'I want to test drive this car'
            })
        }
    },
    {
        name: 'OPTIONS - CORS Preflight',
        event: {
            httpMethod: 'OPTIONS',
            path: '/demo/products'
        }
    }
];

// Run tests
async function runTests() {
    for (const test of tests) {
        console.log(`\n📝 Test: ${test.name}`);
        console.log('─'.repeat(60));
        
        try {
            const startTime = Date.now();
            const response = await handler(test.event);
            const duration = Date.now() - startTime;
            
            console.log(`✅ Status: ${response.statusCode}`);
            console.log(`⏱️  Duration: ${duration}ms`);
            
            const body = JSON.parse(response.body);
            console.log('📦 Response:');
            console.log(JSON.stringify(body, null, 2));
            
            if (body.source) {
                console.log(`\n🔍 Data Source: ${body.source}`);
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            console.error(error.stack);
        }
        
        console.log('─'.repeat(60));
    }
    
    console.log('\n✅ All tests completed!\n');
    process.exit(0);
}

// Run
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
