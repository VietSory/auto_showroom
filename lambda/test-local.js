/**
 * Local test script cho Lambda function
 * Usage: node test-local.js
 */

import { handler } from './demo-products-handler.js';

// Test cases
const testCases = [
    {
        name: 'GET /demo/products',
        event: {
            httpMethod: 'GET',
            path: '/demo/products',
            queryStringParameters: { limit: '5' }
        }
    },
    {
        name: 'GET /demo/products with brand filter',
        event: {
            httpMethod: 'GET',
            path: '/demo/products',
            queryStringParameters: { limit: '10', brand: 'Mercedes' }
        }
    },
    {
        name: 'GET /demo/products/{id}',
        event: {
            httpMethod: 'GET',
            path: '/demo/products/demo-1',
            pathParameters: { id: 'demo-1' }
        }
    },
    {
        name: 'POST /demo/request',
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
        name: 'POST /demo/request - Missing required fields',
        event: {
            httpMethod: 'POST',
            path: '/demo/request',
            body: JSON.stringify({
                name: 'Test User'
                // Missing email and productId
            })
        }
    },
    {
        name: 'OPTIONS /demo/products (CORS preflight)',
        event: {
            httpMethod: 'OPTIONS',
            path: '/demo/products'
        }
    },
    {
        name: 'GET /invalid-route',
        event: {
            httpMethod: 'GET',
            path: '/invalid-route'
        }
    }
];

// Run tests
async function runTests() {
    console.log('🧪 Running Lambda Function Tests\n');
    console.log('='.repeat(80));
    
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log('-'.repeat(80));
        
        try {
            const result = await handler(testCase.event);
            
            console.log(`Status: ${result.statusCode}`);
            console.log(`Headers:`, JSON.stringify(result.headers, null, 2));
            
            const body = JSON.parse(result.body);
            console.log(`Body:`, JSON.stringify(body, null, 2));
            
            // Basic validation
            if (result.statusCode >= 200 && result.statusCode < 300) {
                console.log('✅ PASSED');
                passed++;
            } else if (result.statusCode >= 400 && result.statusCode < 500) {
                console.log('⚠️  Expected error (client error)');
                passed++;
            } else {
                console.log('❌ FAILED');
                failed++;
            }
        } catch (error) {
            console.log('❌ FAILED with exception:', error.message);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
    console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
}

// Run
runTests().catch(console.error);
