import type { InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';

// Đọc baseURL từ .env (giống hiện tại)
const baseUrl = import.meta.env.VITE_REACT_APP_BASE_URL;

const TIMEOUT = 1 * 60 * 1000;

const httpRequest = axios.create({
    baseURL: baseUrl,
    timeout: TIMEOUT
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

export const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
    // Request interceptor: gắn token
    httpRequest.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('authenticationToken') || sessionStorage.getItem('authenticationToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Response interceptor: handle 401 + refresh token
    httpRequest.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
            const status = error.response?.status ?? 0;

            if (status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    // Queue request chờ token mới
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axios(originalRequest);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) throw new Error('No refresh token');

                    // Gọi API refresh token
                    const res = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken });
                    const newToken = res.data.data.accessToken;

                    // Cập nhật token mới
                    localStorage.setItem('authenticationToken', newToken);
                    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                    processQueue(null, newToken);

                    // Retry request gốc
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return axios(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    onUnauthenticated?.(); // redirect login nếu refresh fail
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
};

// export const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
//     httpRequest.interceptors.request.use((config: InternalAxiosRequestConfig) => {
//         const token = localStorage.getItem('authenticationToken') || sessionStorage.getItem('authenticationToken');

//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     });

//     httpRequest.interceptors.response.use(
//         (response) => response,
//         (error: AxiosError) => {
//             const status = error.response?.status ?? 0;
//             if (status === 401) {
//                 onUnauthenticated?.();
//             }
//             return Promise.reject(error);
//         }
//     );
// };

export const get = async (path: string, options: object = {}) => {
    const res = await httpRequest.get(path, options);
    return res.data;
};

export const post = async (path: string, data: object, options: object = {}) => {
    const res = await httpRequest.post(path, data, options);
    return res.data;
};

export const put = async (path: string, data: object, options: object = {}) => {
    const res = await httpRequest.put(path, data, options);
    return res.data;
};

export const putaaa = async (id: any, path: string, data: object, options: object = {}) => {
    const res = await httpRequest.put(`${path}/${id}`, data, options);
    return res.data;
};

export const patch = async (id: any, path: string, data: object, options: object = {}) => {
    const res = await httpRequest.patch(`${path}/${id}`, data, options);
    return res.data;
};

export const patchV2 = async (id: any, path: string, data: object, options: object = {}) => {
    console.log('log:', id);
    const res = await httpRequest.patch(`${path}`, data, options);
    return res.data;
};

export const del = async (path: string, options: object = {}) => {
    const res = await httpRequest.delete(path, options);
    return res.data;
};

export const deleteById = async (path: string, id: number) => {
    const res = await httpRequest.delete(`${path}/${id}`, { data: { id } });
    return res.data;
};

// ??????? :D ???????
export const deleteCc = async (path: string, exerciseIds: string[]) => {
    const res = await httpRequest.delete(`${path}`, { data: { exerciseIds } });
    return res.data;
};

// ?????????????? :D ??????????????
export const deleteCcc = async (path: string, studentIds: string[]) => {
    const res = await httpRequest.delete(`${path}`, { data: { studentIds } });
    return res.data;
};

export default httpRequest;
