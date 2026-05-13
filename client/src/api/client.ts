import axios from 'axios';

const apiClient = axios.create({
    // Sử dụng biến môi trường nếu có, nếu không thì mặc định là '/api'
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true // Nếu có dùng cookie
});

// Interceptor để xử lý response từ server gửi về
apiClient.interceptors.response.use(
    (response) => {
        // Trả về trực tiếp data từ response để dễ sử dụng
        return response.data;
    },
    (error) => {
        // Bắt lỗi: Ví dụ API lỗi trả về nội dung HTML từ S3 thay vì JSON (khi Behavior ko ăn)
        if (
            error.response &&
            error.response.data &&
            typeof error.response.data === 'string' &&
            error.response.data.includes('<!doctype html>') // hoặc <html
        ) {
            console.error('API Error: Nhận về HTML thay vì JSON. Vui lòng kiểm tra lại cấu hình Route `/api/*` trên CloudFront hoặc API Gateway.');
            return Promise.reject(new Error('Lỗi kết nối đến máy chủ API (Nhận HTML).'));
        }

        // Xử lý lỗi trả về JSON từ BE
        const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Lỗi không xác định';
        console.error('API Error:', message);

        return Promise.reject(new Error(message));
    }
);

export default apiClient;
