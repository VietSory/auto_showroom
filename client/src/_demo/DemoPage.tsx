import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// API Gateway endpoint - Sẽ được cập nhật sau khi deploy Lambda
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://your-api-id.execute-api.region.amazonaws.com/prod';

interface DemoProduct {
    id: string;
    brand: string;
    car_model: string;
    production_year: string;
    body_style: string;
    price: string;
    images: string[];
    bio: string;
    horsepower: string;
    top_speed: string;
    acceleration: string;
    fuel_type: string;
    rated: string;
    isDemo?: boolean;
}

interface DemoRequest {
    name: string;
    email: string;
    phone: string;
    productId: string;
    message: string;
}

const DemoPage = () => {
    const [products, setProducts] = useState<DemoProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [formData, setFormData] = useState<DemoRequest>({
        name: '',
        email: '',
        phone: '',
        productId: '',
        message: ''
    });

    // Fetch products từ API Gateway
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_GATEWAY_URL}/demo/products?limit=10`);
            const data = await response.json();
            
            if (data.success) {
                setProducts(data.data);
                toast.success(`Loaded ${data.count} demo products from ${data.source}`);
            } else {
                toast.error('Failed to load products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error connecting to API Gateway');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductDetails = async (productId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_GATEWAY_URL}/demo/products/${productId}`);
            const data = await response.json();
            
            if (data.success) {
                setSelectedProduct(data.data);
                toast.success('Product details loaded');
            } else {
                toast.error('Failed to load product details');
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            toast.error('Error connecting to API Gateway');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestDemo = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_GATEWAY_URL}/demo/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Demo request submitted successfully!');
                setShowRequestForm(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    productId: '',
                    message: ''
                });
            } else {
                toast.error(data.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error('Error connecting to API Gateway');
        } finally {
            setLoading(false);
        }
    };

    const openRequestForm = (productId: string) => {
        setFormData({ ...formData, productId });
        setShowRequestForm(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            {/* Header */}
            <div className="bg-black/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                AWS Lambda Demo
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Powered by API Gateway + Lambda + EC2
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/lambda-tester"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm"
                            >
                                🧪 Lambda Tester
                            </Link>
                            <div className="px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                                <span className="text-green-400 text-sm font-semibold">🟢 Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-12"
                >
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">ℹ️</span>
                        Về chức năng Demo này
                    </h2>
                    <ul className="space-y-2 text-gray-300">
                        <li>✅ API được xử lý bởi <strong>AWS Lambda</strong> (serverless)</li>
                        <li>✅ Request đi qua <strong>AWS API Gateway</strong></li>
                        <li>✅ Frontend (S3) → API Gateway → Lambda → (Optional) EC2 Backend</li>
                        <li>✅ Không cần authentication - Public API</li>
                        <li>✅ CORS đã được cấu hình</li>
                    </ul>
                </motion.div>

                {/* Products Grid */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Demo Products</h2>
                        <button
                            onClick={fetchProducts}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {loading && products.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-400">Loading products from Lambda...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={product.images[0]}
                                            alt={product.car_model}
                                            className="w-full h-full object-cover"
                                        />
                                        {product.isDemo && (
                                            <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                                                DEMO
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2">
                                            {product.brand} {product.car_model}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                            {product.bio}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Year:</span>
                                                <span className="ml-2 font-semibold">{product.production_year}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Power:</span>
                                                <span className="ml-2 font-semibold">{product.horsepower}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Speed:</span>
                                                <span className="ml-2 font-semibold">{product.top_speed}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Rating:</span>
                                                <span className="ml-2 font-semibold">⭐ {product.rated}</span>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400 mb-4">
                                            ${product.price}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fetchProductDetails(product.id)}
                                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => openRequestForm(product.id)}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                            >
                                                Request Demo
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details Modal */}
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold">
                                        {selectedProduct.brand} {selectedProduct.car_model}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="text-gray-400 hover:text-white text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                <img
                                    src={selectedProduct.images[0]}
                                    alt={selectedProduct.car_model}
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                                <p className="text-gray-300 mb-4">{selectedProduct.bio}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-500">Horsepower</span>
                                        <p className="font-semibold">{selectedProduct.horsepower}</p>
                                    </div>
                                    <div className="bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-500">Top Speed</span>
                                        <p className="font-semibold">{selectedProduct.top_speed}</p>
                                    </div>
                                    <div className="bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-500">Acceleration</span>
                                        <p className="font-semibold">{selectedProduct.acceleration}</p>
                                    </div>
                                    <div className="bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-500">Fuel Type</span>
                                        <p className="font-semibold">{selectedProduct.fuel_type}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Request Form Modal */}
                {showRequestForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowRequestForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-4">Request Demo</h2>
                                <form onSubmit={handleRequestDemo} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="+84 xxx xxx xxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Message</label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                            rows={3}
                                            placeholder="Tell us about your interest..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowRequestForm(false)}
                                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default DemoPage;
