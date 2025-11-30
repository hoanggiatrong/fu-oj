import type { WindowSizeType } from './globalStore';

import { LockOutlined, LogoutOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { Drawer, notification } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useWindowSize } from '../../hooks';
import authentication from '../../shared/auth/authentication';
import globalStore from './globalStore';
import ProtectedElement from '../ProtectedElement/ProtectedElement';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

const GlobalComponent = observer(() => {
    const windowSize: WindowSizeType = useWindowSize();

    const [api, contextHolder] = notification.useNotification();

    const openNotificationWithIcon = (type: NotificationType, message?: string, description?: string) => {
        api[type]({
            message: message,
            description: description
        });
    };

    useEffect(() => {
        globalStore.openNotificationWithIcon = openNotificationWithIcon;
    }, []);

    useEffect(() => {
        globalStore.setWindowSize(windowSize);
    }, [useWindowSize()]);

    // useEffect(() => {
    //     const { width } = windowSize;

    //     let fontSize = '16px'; // default

    //     if (width >= 3840) {
    //         fontSize = '49px'; // 4K
    //     } else if (width >= 2560) {
    //         fontSize = '31px'; // QHD
    //     } else if (width >= 1920) {
    //         fontSize = '22.5px'; // Full HD
    //     } else if (width >= 1600) {
    //         fontSize = '17.8px'; // HD+
    //     } else if (width >= 1366) {
    //         fontSize = '14px'; // HD
    //     } else if (width >= 1280) {
    //         fontSize = '12.8px'; // Laptop nhỏ
    //     } else if (width >= 1024) {
    //         fontSize = '9.6px'; // Tablet
    //     } else {
    //         fontSize = '6.8px'; // Mobile
    //     }

    //     console.log(`Setting html font-size to ${fontSize} for width ${width}`);
    //     document.documentElement.style.fontSize = fontSize;
    // }, [windowSize]);

    return (
        <>
            {contextHolder}
            <Drawer
                title="Software Engineering"
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => globalStore.setDrawerKey('')}
                open={!!globalStore.drawerKey}
            >
                <UserDrawer />
            </Drawer>
        </>
    );
});

const UserDrawer = observer(() => {
    return (
        <div className="user-drawer">
            <div className="avatar">
                <img src={authentication.account?.data?.avatar?.url || '/sources/thaydat.jpg'} alt="" />
                <div className="rank-user">
                    <img src="/sources/rank-user.png" alt="" />
                </div>
            </div>
            <div className="name">
                {authentication.account?.data?.firstName && authentication.account?.data?.lastName
                    ? authentication.account?.data?.firstName + ' ' + authentication.account?.data?.lastName
                    : 'Đạt Đẹp Đẽ'}
            </div>
            <div className="roll-number">Mã số sinh viên: {authentication.account?.data?.rollNumber || 'HE123456'}</div>
            <div className="point">
                <img src="/sources/point.png" />
                1050
            </div>
            <div className="rank">
                <div className="container">
                    <div className="level">
                        Xếp hạng: <div className="data">Thách đấu</div>
                    </div>
                    <div className="created-date">Ngày tạo: 25/10/2025</div>
                    <div className="updated-date">Ngày cập nhật: 25/10/2025</div>
                </div>
            </div>
            <div className="actions">
                <div className="info action" onClick={() => (window.location.href = '/profile')}>
                    <UserOutlined />
                    Thông tin cá nhân
                </div>
                <ProtectedElement acceptRoles={['STUDENT']}>
                    <div className="info action" onClick={() => (window.location.href = '/submissions')}>
                        <UnorderedListOutlined />
                        Danh sách bài tập đã hoàn thành
                    </div>
                </ProtectedElement>
                <div className="info action" onClick={() => (window.location.href = '/change-password')}>
                    <LockOutlined />
                    Đổi mật khẩu
                </div>
                <div className="logout action" onClick={() => authentication.logout()}>
                    <LogoutOutlined />
                    Đăng xuất
                </div>
            </div>
        </div>
    );
});

export default GlobalComponent;
