// import { SearchOutlined } from '@ant-design/icons';
import {
    Avatar
    //  Input
} from 'antd';
import { observer } from 'mobx-react-lite';
import globalStore from '../../../components/GlobalComponent/globalStore';
import Switch from '../../../components/Switch/Switch';
import authentication from '../../../shared/auth/authentication';
import QuickAction from './QuickAction';
import { roles, type Role } from '../../../constants/role';

const LayoutHeader = observer(() => {
    return (
        <div className="layout-header">
            <div className="left">
                <div className="brand-name">
                    <img src="/sources/logo-fullname.png" alt="Everything" />
                </div>
                {authentication.isAuthenticated && !globalStore.isBelow1000 && <QuickAction />}
            </div>
            <div className="right">
                <Switch
                    isOn={globalStore.theme == 'theme-dark'}
                    onToggle={(theme) => {
                        document.querySelector('body')?.classList.remove(!theme ? 'theme-dark' : 'theme-light');
                        document.querySelector('body')?.classList.add(theme ? 'theme-dark' : 'theme-light');

                        globalStore.setTheme(theme ? 'theme-dark' : 'theme-light');
                    }}
                    iconOn={<img src="/sources/icons/moon-ico.svg" />}
                    iconOff={<img src="/sources/icons/sun-ico.svg" />}
                    tooltipTextOn="Chuyển sang chế độ tối"
                    tooltipTextOff="Chuyển sang chế độ sáng"
                />

                <div className="profile" onClick={() => globalStore.setDrawerKey('user')}>
                    <Avatar src={authentication.account?.data?.avatar?.url} style={{ height: 25, width: 25 }} />
                    {(authentication.account?.data?.lastName || '') +
                        ' - ' +
                        (authentication.account?.data?.role
                            ? roles[authentication.account?.data?.role as Role].toLocaleUpperCase()
                            : '') ||
                        authentication.account?.data?.role ||
                        'Bạn cần đăng nhập để tiếp tục'}
                </div>
            </div>
        </div>
    );
});

export default LayoutHeader;
