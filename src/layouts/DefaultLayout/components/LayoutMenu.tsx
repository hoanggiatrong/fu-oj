import {
    BarChartOutlined,
    BookFilled,
    ContainerFilled,
    FundFilled,
    HomeFilled,
    ReadFilled,
    SafetyCertificateOutlined,
    TrophyOutlined,
    UserOutlined,
    UsergroupAddOutlined
} from '@ant-design/icons';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import authentication from '../../../shared/auth/authentication';

const menuItems = [
    {
        id: 'home',
        name: 'Trang chủ',
        icon: <HomeFilled />,
        to: '/home',
        allowedRoles: ['STUDENT', 'INSTRUCTOR', 'ADMIN']
    },
    {
        id: 'groups',
        name: 'Nhóm',
        icon: <UsergroupAddOutlined />,
        to: '/groups',
        allowedRoles: ['STUDENT', 'INSTRUCTOR']
    },
    {
        id: 'exercises',
        name: 'Bài tập',
        icon: <ReadFilled />,
        to: '/exercises',
        allowedRoles: ['STUDENT', 'INSTRUCTOR']
    },
    {
        id: 'exams',
        name: 'Bài thi',
        icon: <ContainerFilled />,
        to: '/exams',
        allowedRoles: ['STUDENT', 'INSTRUCTOR']
    },
    {
        id: 'ranking',
        name: 'Xếp hạng',
        icon: <TrophyOutlined />,
        to: '/ranking',
        allowedRoles: ['STUDENT', 'INSTRUCTOR']
    },
    {
        id: 'certificates',
        name: 'Chứng chỉ',
        icon: <SafetyCertificateOutlined />,
        to: '/certificates',
        allowedRoles: ['STUDENT', 'ADMIN']
    },
    {
        id: 'dashboard',
        name: 'Thống kê',
        icon: <BarChartOutlined />,
        to: '/dashboard',
        allowedRoles: ['INSTRUCTOR']
    },
    {
        id: 'topics',
        name: 'Topics',
        icon: <FundFilled />,
        to: '/topics',
        allowedRoles: ['ADMIN']
    },
    {
        id: 'courses',
        name: 'Khóa học',
        icon: <BookFilled />,
        to: '/courses',
        allowedRoles: ['ADMIN']
    },
    {
        id: 'accounts',
        name: 'Accounts',
        icon: <UserOutlined />,
        to: '/accounts',
        allowedRoles: ['ADMIN']
    }
];

const LayoutMenu = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();

    const [selected, setSelected] = useState('home');

    useEffect(() => {
        const path = location.pathname.replace('/', '');
        if (path != '') {
            // Extract the base path (e.g., 'ranking' from '/ranking', 'exams' from '/exams/123')
            const basePath = path.split('/')[0];
            setSelected(basePath);
        }
    }, [location.pathname]);

    // Filter menu items based on user role
    const filteredMenuItems = useMemo(() => {
        if (!authentication.account) return [];

        let userRoles: string[] = authentication.account?.authorities ?? [];
        const userRole = authentication.account?.data?.role;
        if (userRole && !userRoles.includes(userRole)) {
            userRoles = [...userRoles, userRole];
        }

        return menuItems.filter((item) => {
            return item.allowedRoles.some((role) => userRoles.includes(role));
        });
    }, [authentication.account]);

    return (
        <div className="layout-menu">
            <div
                className={classnames('wrapper', {
                    'wrapper-responsive': globalStore.windowSize.width < 1300,
                    'wrapper-min': globalStore.windowSize.width < 675
                })}
            >
                {filteredMenuItems.map((item) => (
                    <div
                        key={item.id}
                        className={classnames('menu-item', { selected: selected == item.id })}
                        onClick={() => {
                            navigate(item.to);
                            setSelected(item.id);
                        }}
                    >
                        <div className="icon">{item.icon}</div>
                        <div className="name">{item.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default LayoutMenu;
