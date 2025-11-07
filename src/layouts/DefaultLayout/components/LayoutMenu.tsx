import { ContainerFilled, FundFilled, HomeFilled, ReadFilled, UsergroupAddOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';

const menuItems = [
    {
        id: 'home',
        name: 'Trang chủ',
        icon: <HomeFilled />,
        to: '/home'
    },
    {
        id: 'groups',
        name: 'Nhóm',
        icon: <UsergroupAddOutlined />,
        to: '/groups'
    },
    {
        id: 'exercises',
        name: 'Bài tập',
        icon: <ReadFilled />,
        to: '/exercises'
    },
    {
        id: 'exams',
        name: 'Bài thi',
        icon: <ContainerFilled />,
        to: '/exams'
    },
    {
        id: 'topics',
        name: 'Topics',
        icon: <FundFilled />,
        to: '/topics'
    }
];

const LayoutMenu = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();

    const [selected, setSelected] = useState('home');

    useEffect(() => {
        if (location.pathname.replace('/', '') != '') {
            setSelected(location.pathname.replace('/', ''));
        }
    }, []);

    return (
        <div className="layout-menu">
            <div
                className={classnames('wrapper', {
                    'wrapper-responsive': globalStore.windowSize.width < 1300,
                    'wrapper-min': globalStore.windowSize.width < 675
                })}
            >
                {menuItems.map((item) => (
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
