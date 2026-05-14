import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// API Gateway endpoint
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://your-api-id.execute-api.region.amazonaws.com';

interface TestCase {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'OPTIONS';
    endpoint: string;
    description: string;
    body?: object;
    queryParams?: Record<string, string>;
}

const TEST_CASES: TestCase[] = [
    {
        id: 'test-1',
        name: 'GET All Products',
        method: 'GET',
        endpoint: '/demo/products',
        description: 'Lấy danh sách tất cả sản phẩm demo',
        queryParams: { limit: '10' }
    },
    {
        id: 'test-2',
        name: 'GET Products - Filter by Brand',
        method: 'GET',
        endpoint: '/demo/products',
        description: 'Lấy sản phẩm theo brand Mercedes',
        queryParams: { limit: '5', brand: 'Mercedes' }
    },
    {
        id: 'test-3',
        name: 'GET Product by ID',
        method: 'GET',
        endpoint: '/demo/products/demo-1',
        description: 'Lấy chi tiết sản phẩm demo-1'
    },
    {
        id: 'test-4',
        name: 'POST Demo Request',
        method: 'POST',
        endpoint: '/demo/request',
        description: 'Tạo yêu cầu demo/test drive',
        body: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+84 123 456 789',
            productId: 'demo-1',
            message: 'I want to test drive this car'
        }
    },
    {
        id: 'test-5',
        name: 'POST Request - Missing Fields',
        method: 'POST',
        endpoint: '/demo/request',
        description: 'Test validation - thiếu required fields (expect 400)',
        body: {
            name: 'Test User'
            // Missing email and productId
        }
    },
    {
        id: 'test-6',
        name: 'GET Invalid Product ID',
        method: 'GET',
        endpoint: '/demo/products/invalid-id',
        description: 'Test với product ID không tồn tại (expect 404)'
    },
    {
        id: 'test-7',
        name: 'OPTIONS - CORS Preflight',
        method: 'OPTIONS',
        endpoint: '/demo/products',
        description: 'Test CORS preflight request'
    }
];

interface TestResult {
    testId: string;
    status: 'pending' | 'success' | 'error';
    statusCode?: number;
    responseTime?: number;
    response?: any;
    error?: string;
    headers?: Record<string, string>;
}

const LambdaTesterPage = () => {
    const [results, setResults] = useState<Record<string, TestResult>>({});
    const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
    const [selectedTest, setSelectedTest] = useState<string | null>(null);
    const [customEndpoint, setCustomEndpoint] = useState('');
    const [customMethod, setCustomMethod] = useState<'GET' | 'POST'>('GET');
    const [customBody, setCustomBody] = useState('');

    const runTest = async (testCase: TestCase) => {
        const testId = testCase.id;
        setRunningTests(prev => new Set(prev).add(testId));
        setResults(prev => ({
            ...prev,
            [testId]: { testId, status: 'pending' }
        }));

        const startTime = Date.now();

        try {
            // Build URL with query params
            let url = `${API_GATEWAY_URL}${testCase.endpoint}`;
            if (testCase.queryParams) {
                const params = new URLSearchParams(testCase.queryParams);
                url += `?${params.toString()}`;
            }

            // Prepare request options
            const options: RequestInit = {
                method: testCase.method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (testCase.body) {
                options.body = JSON.stringify(testCase.body);
            }

            // Make request
            const response = await fetch(url, options);
            const responseTime = Date.now() - startTime;

            // Get response headers
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            // Parse response
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Update result
            setResults(prev => ({
                ...prev,
                [testId]: {
                    testId,
                    status: response.ok ? 'success' : 'error',
                    statusCode: response.status,
                    responseTime,
                    response: responseData,
                    headers
                }
            }));

            if (response.ok) {
                toast.success(`Test "${testCase.name}" passed!`);
            } else {
                toast.error(`Test "${testCase.name}" failed with ${response.status}`);
            }

        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            setResults(prev => ({
                ...prev,
                [testId]: {
                    testId,
                    status: 'error',
                    responseTime,
                    error: error.message
                }
            }));
            toast.error(`Test "${testCase.name}" error: ${error.message}`);
        } finally {
            setRunningTests(prev => {
                const newSet = new Set(prev);
                newSet.delete(testId);
                return newSet;
            });
        }
    };

    const runAllTests = async () => {
        toast.loading('Running all tests...');
        for (const testCase of TEST_CASES) {
            await runTest(testCase);
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        toast.dismiss();
        toast.success('All tests completed!');
    };

    const runCustomTest = async () => {
        if (!customEndpoint) {
            toast.error('Please enter an endpoint');
            return;
        }

        const customTest: TestCase = {
            id: 'custom',
            name: 'Custom Test',
            method: customMethod,
            endpoint: customEndpoint,
            description: 'Custom API test',
            body: customBody ? JSON.parse(customBody) : undefined
        };

        await runTest(customTest);
    };

    const getStatusColor = (status?: 'pending' | 'success' | 'error') => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400';
            case 'success': return 'text-green-400 bg-green-400/10 border-green-400';
            case 'error': return 'text-red-400 bg-red-400/10 border-red-400';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400';
        }
    };

    const getStatusIcon = (status?: 'pending' | 'success' | 'error') => {
        switch (status) {
            case 'pending': return '⏳';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '⚪';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            {/* Header */}
            <div className="bg-black/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                Lambda Function Tester
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Test AWS Lambda + API Gateway endpoints trực tiếp
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/demo"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
                            >
                                ← Back to Demo
                            </Link>
                            <button
                                onClick={runAllTests}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
                            >
                                🚀 Run All Tests
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* API Gateway Info */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8"
                >
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">🔗</span>
                        API Gateway Endpoint
                    </h2>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm break-all">
                        {API_GATEWAY_URL}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                        Configure trong file <code className="bg-black/30 px-2 py-1 rounded">client/.env</code>
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Test Cases */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Predefined Tests</h2>
                        <div className="space-y-4">
                            {TEST_CASES.map((testCase) => {
                                const result = results[testCase.id];
                                const isRunning = runningTests.has(testCase.id);

                                return (
                                    <motion.div
                                        key={testCase.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-4 hover:border-purple-500 transition cursor-pointer ${
                                            selectedTest === testCase.id ? 'border-purple-500' : 'border-gray-700'
                                        }`}
                                        onClick={() => setSelectedTest(testCase.id)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        testCase.method === 'GET' ? 'bg-blue-500' :
                                                        testCase.method === 'POST' ? 'bg-green-500' :
                                                        'bg-yellow-500'
                                                    }`}>
                                                        {testCase.method}
                                                    </span>
                                                    <h3 className="font-semibold">{testCase.name}</h3>
                                                </div>
                                                <p className="text-gray-400 text-sm">{testCase.description}</p>
                                                <code className="text-xs text-purple-400 mt-1 block">
                                                    {testCase.endpoint}
                                                </code>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {result && (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(result.status)}`}>
                                                        {getStatusIcon(result.status)} {result.statusCode || 'N/A'}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        runTest(testCase);
                                                    }}
                                                    disabled={isRunning}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition disabled:opacity-50"
                                                >
                                                    {isRunning ? '⏳ Running...' : '▶️ Run'}
                                                </button>
                                            </div>
                                        </div>
                                        {result?.responseTime && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Response time: {result.responseTime}ms
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Custom Test */}
                        <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4">Custom Test</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Method</label>
                                    <select
                                        value={customMethod}
                                        onChange={(e) => setCustomMethod(e.target.value as 'GET' | 'POST')}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Endpoint</label>
                                    <input
                                        type="text"
                                        value={customEndpoint}
                                        onChange={(e) => setCustomEndpoint(e.target.value)}
                                        placeholder="/demo/products"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                                {customMethod === 'POST' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Request Body (JSON)</label>
                                        <textarea
                                            value={customBody}
                                            onChange={(e) => setCustomBody(e.target.value)}
                                            placeholder='{"name": "Test", "email": "test@example.com"}'
                                            rows={4}
                                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={runCustomTest}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
                                >
                                    Run Custom Test
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Test Results</h2>
                        {selectedTest && results[selectedTest] ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 sticky top-24"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">
                                        {TEST_CASES.find(t => t.id === selectedTest)?.name}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(results[selectedTest].status)}`}>
                                        {getStatusIcon(results[selectedTest].status)} {results[selectedTest].statusCode || 'N/A'}
                                    </span>
                                </div>

                                {results[selectedTest].responseTime && (
                                    <div className="mb-4 text-sm">
                                        <span className="text-gray-400">Response Time:</span>
                                        <span className="ml-2 font-semibold text-green-400">
                                            {results[selectedTest].responseTime}ms
                                        </span>
                                    </div>
                                )}

                                {results[selectedTest].headers && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Response Headers:</h4>
                                        <div className="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                                            <pre className="text-xs font-mono text-gray-300">
                                                {JSON.stringify(results[selectedTest].headers, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-gray-400">Response Body:</h4>
                                    <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                                        {results[selectedTest].error ? (
                                            <div className="text-red-400 text-sm">
                                                ❌ Error: {results[selectedTest].error}
                                            </div>
                                        ) : (
                                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                                                {JSON.stringify(results[selectedTest].response, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                                <div className="text-6xl mb-4">🧪</div>
                                <p className="text-gray-400">
                                    Chọn một test case để xem kết quả
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary */}
                {Object.keys(results).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6"
                    >
                        <h3 className="text-xl font-bold mb-4">Test Summary</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-green-400">
                                    {Object.values(results).filter(r => r.status === 'success').length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Passed</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-red-400">
                                    {Object.values(results).filter(r => r.status === 'error').length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Failed</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-blue-400">
                                    {Object.values(results).length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Total</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default LambdaTesterPage;
