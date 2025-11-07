import { action, makeObservable, observable } from 'mobx';
import authentication from '../../shared/auth/authentication';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type WindowSizeType = {
    width: number;
    height: number;
};

class GlobalStore {
    windowSize: WindowSizeType = { width: 0, height: 0 };
    isLROpen: boolean = true;
    drawerKey: string = '';
    openNotificationWithIcon: ((type: NotificationType, message?: string, description?: string) => void) | null = null;
    theme: 'theme-dark' | 'theme-light' = 'theme-light';
    isDetailPopupOpen: boolean = false;

    constructor() {
        makeObservable(this, {
            windowSize: observable,
            isLROpen: observable,
            drawerKey: observable,
            openNotificationWithIcon: observable,
            isDetailPopupOpen: observable,

            setWindowSize: action,
            setLROpen: action,
            setDrawerKey: action,
            setTheme: action,
            setOpenDetailPopup: action
        });
    }

    setWindowSize = (windowSize: WindowSizeType) => {
        this.windowSize = windowSize;
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
        this.theme = theme;
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
}

const globalStore = new GlobalStore();
export default globalStore;
