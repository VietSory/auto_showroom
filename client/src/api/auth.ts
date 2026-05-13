import apiClient from './client';

export const authApi = {
    /**
     * API Login người dùng
     * POST /api/auth/login
     */
    login: async (signInData: any): Promise<any> => {
        // apiClient đã cấu hình sẵn base URL là '/api'
        // nên path chỉ cần là '/auth/login'
        return apiClient.post('/auth/login', signInData);
    },

    /**
     * API Đăng ký người dùng
     * POST /api/auth/signup
     */
    signup: async (signUpData: any): Promise<any> => {
        return apiClient.post('/auth/signup', signUpData);
    },

    /**
     * API Gửi mã xác nhận qua email
     * POST /api/auth/confirm/sendToken
     */
    sendToken: async (email: string): Promise<any> => {
        return apiClient.post('/auth/confirm/sendToken', { email });
    },

    /**
     * API Gửi mã đặt lại mật khẩu qua email
     * POST /api/auth/confirm/sendResetToken
     */
    sendResetToken: async (email: string): Promise<any> => {
        return apiClient.post('/auth/confirm/sendResetToken', { email });
    },

    /**
     * API Đặt lại mật khẩu
     * POST /api/auth/resetPassword
     */
    resetPassword: async (changePassData: any): Promise<any> => {
        return apiClient.post('/auth/resetPassword', changePassData);
    }
};
