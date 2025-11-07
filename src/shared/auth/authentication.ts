import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';
import globalStore from '../../components/GlobalComponent/globalStore';

const AUTH_TOKEN_KEY = 'authenticationToken';

class Authentication {
    loading = false;
    isAuthenticated = false;
    loginSuccess = false;
    loginError = false;
    account: any = null;
    errorMessage: string | null = null;
    sessionHasBeenFetched = false;

    constructor() {
        makeAutoObservable(this);

        // Chỉ định backend
        axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_BASE_URL;

        // Lấy token từ localStorage/sessionStorage nếu có
        const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
        console.log('log:', token);
        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            this.isAuthenticated = true;
        }
    }

    /**
     * Đăng nhập và lưu token
     */
    async login(username: string, password: string, rememberMe = false) {
        this.loading = true;
        this.loginError = false;
        try {
            const res: AxiosResponse = await axios.post('/auth/login', { email: username, password, rememberMe });

            const jwt = res.data?.data?.accessToken;
            if (jwt) {
                if (rememberMe) {
                    localStorage.setItem(AUTH_TOKEN_KEY, jwt);
                } else {
                    sessionStorage.setItem(AUTH_TOKEN_KEY, jwt);
                }
                axios.defaults.headers.common.Authorization = `Bearer ${jwt}`;
            }

            await this.getAccount(); // lấy thông tin người dùng
            globalStore.triggerNotification('success', res.data.message, '');
            runInAction(() => {
                this.loginSuccess = true;
                this.isAuthenticated = true;
            });
        } catch (error: any) {
            globalStore.triggerNotification('error', error?.response?.data?.message, '');

            runInAction(() => {
                this.loginError = true;
                this.errorMessage = error.message;
                this.isAuthenticated = false;
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    /**
     * Lấy thông tin tài khoản hiện tại
     */
    async getAccount() {
        this.loading = true;
        try {
            const res = await axios.get('/me/profile');
            runInAction(() => {
                this.account = res.data;
                // this.isAuthenticated = !!res.data?.activated;
                this.sessionHasBeenFetched = true;
            });
        } catch (error: any) {
            runInAction(() => {
                this.errorMessage = error.message;
                this.isAuthenticated = false;
                this.sessionHasBeenFetched = true;
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    /**
     * Đăng xuất: xóa token + state
     */
    logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        delete axios.defaults.headers.common.Authorization;
        runInAction(() => {
            this.isAuthenticated = false;
            this.account = null;
            this.loginSuccess = false;

            globalStore.setDrawerKey('');
        });
    }

    get isStudent() {
        return this.account?.data?.role == 'STUDENT';
    }

    get isInstructor() {
        return this.account?.data?.role == 'INSTRUCTOR';
    }

    get isAdmin() {
        return this.account?.data?.role == 'ADMIN';
    }
}

export default new Authentication();
