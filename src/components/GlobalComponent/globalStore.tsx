import { action, makeObservable, observable } from 'mobx';
import authentication from '../../shared/auth/authentication';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type WindowSizeType = {
    width: number;
    height: number;
};

class GlobalStore {
    windowSize: WindowSizeType = { width: 0, height: 0 };
    windowLoading: boolean = false;
    isLROpen: boolean = true;
    drawerKey: string = '';
    openNotificationWithIcon: ((type: NotificationType, message?: string, description?: string) => void) | null = null;
    theme: 'theme-dark' | 'theme-light' = 'theme-light';
    isDetailPopupOpen: boolean = false;

    constructor() {
        makeObservable(this, {
            windowSize: observable,
            windowLoading: observable,
            isLROpen: observable,
            drawerKey: observable,
            openNotificationWithIcon: observable,
            theme: observable,
            isDetailPopupOpen: observable,

            setWindowSize: action,
            setWindowLoading: action,
            setLROpen: action,
            setDrawerKey: action,
            setTheme: action,
            setOpenDetailPopup: action
        });

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'theme-dark' || savedTheme === 'theme-light') {
            this.theme = savedTheme;

            const body = document.body;
            body.classList.remove('theme-dark', 'theme-light'); // xóa cả 2 class cũ
            body.classList.add(savedTheme); // thêm class đúng
        } else {
            localStorage.setItem('theme', this.theme);
            document.body.classList.add(this.theme); // thêm class mặc định
        }
    }

    setWindowSize = (windowSize: WindowSizeType) => {
        this.windowSize = windowSize;
    };

    setWindowLoading = (status: boolean) => {
        this.windowLoading = status;
    };

    setLROpen(status: boolean) {
        if (!authentication.isAuthenticated) {
            this.isLROpen = true;
            return;
        }
        this.isLROpen = status;
    }

    setDrawerKey(key: string) {
        this.drawerKey = key;
    }

    triggerNotification(type: NotificationType, title: string, content: string) {
        if (this.openNotificationWithIcon) this.openNotificationWithIcon(type, title, content);
    }

    setTheme = (theme: 'theme-dark' | 'theme-light') => {
        this.setWindowLoading(true);
        localStorage.setItem('theme', theme);

        setTimeout(() => {
            this.theme = theme;
            window.location.reload();
        }, 1000);
    };

    setOpenDetailPopup = (status: boolean) => {
        this.isDetailPopupOpen = status;
    };

    checkPermission = (allowedRoles: string[], allowedPermissions: string[]) => {
        const userRoles = authentication.account?.authorities ?? [];

        const userPermissions = authentication.account?.permissions ?? [];

        const hasAccess =
            allowedRoles.some((role) => userRoles.includes(role)) ||
            allowedPermissions.some((permission) => userPermissions.includes(permission));

        if (!hasAccess) {
            this.triggerNotification('error', 'You do not have permission to access this feature!', '');
            return false;
        }

        return true;
    };

    get isBelow1000() {
        return this.windowSize.width < 1000;
    }

    get isBelow1300() {
        return this.windowSize.width < 1300;
    }

    uploadImageToCloudinary = async (file: any) => {
        const cloudName = 'djxrxldo6';
        const uploadPreset = 'pool-management'; // preset tự tạo

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            return data.secure_url;
        } catch (err) {
            console.error('Upload failed:', err);
            return null;
        }
    };
}

const globalStore = new GlobalStore();
export default globalStore;
