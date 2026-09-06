import axios from 'axios';

// 建立 Axios 实例，统一配置 baseURL 与超时时间
const api = axios.create({
    baseURL: '/api/v1/support',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器：读取本地 token 并附加在请求头中
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：提取 response.data，统一处理全局异常
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const customError = {
            message: error.response?.data?.message || '请求服务发生异常',
            status: error.response?.status,
            data: error.response?.data,
        };
        return Promise.reject(customError);
    }
);

/**
 * 1. 提交前台联系表单
 * @param {Object} data - { name, email, subject, message }
 */
export const submitContactForm = async (data) => {
    return await api.post('/contact', data);
};

/**
 * 2. 获取后台留言列表（管理员）
 * @param {Object} params - { page, limit, status, search }
 */
export const getAdminMessages = async (params = {}) => {
    return await api.get('/admin/messages', { params });
};

/**
 * 3. 更新留言状态（管理员）
 * @param {string|number} id - 留言工单 ID
 * @param {string} status - 状态 ('pending' | 'in_progress' | 'resolved' | 'archived')
 */
export const updateMessageStatus = async (id, status) => {
    return await api.patch(`/admin/messages/${id}/status`, { status });
};

/**
 * 4. 查询 FAQ 列表与分类搜索
 * @param {Object} params - { category, query }
 */
export const getFaqList = async (params = {}) => {
    return await api.get('/faqs', { params });
};

/**
 * 5. 获取公开电子说明书与下载资源列表
 */
export const getDownloadList = async () => {
    return await api.get('/downloads');
};

export default {
    submitContactForm,
    getAdminMessages,
    updateMessageStatus,
    getFaqList,
    getDownloadList,
};