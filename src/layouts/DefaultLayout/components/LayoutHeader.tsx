import { MoonOutlined, SlackOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { observer } from 'mobx-react-lite';
import globalStore from '../../../components/GlobalComponent/globalStore';
import Switch from '../../../components/Switch/Switch';
import authentication from '../../../shared/auth/authentication';

const LayoutHeader = observer(() => {
    return (
        <div className="layout-header">
            <div className="left">
                <div className="brand-name">
                    <img src="/sources/logo-fullname.png" alt="Everything" />
                </div>
            </div>
            <div className="right">
                <Switch
                    isOn={globalStore.theme == 'theme-dark'}
                    onToggle={(theme) => {
                        document.querySelector('body')?.classList.remove(!theme ? 'theme-dark' : 'theme-light');
                        document.querySelector('body')?.classList.add(theme ? 'theme-dark' : 'theme-light');

                        globalStore.setTheme(theme ? 'theme-dark' : 'theme-light');
                    }}
                    iconOn={<MoonOutlined />}
                    iconOff={<SlackOutlined />}
                />

                {/* {globalStore.windowSize.width < 1000 ? (
                    <SearchOutlined className="global-search-icon" />
                ) : (
                    <Input className="global-search" placeholder={'Tìm kiếm bất cứ thông tin gì'} />
                )} */}

                <div className="profile" onClick={() => globalStore.setDrawerKey('user')}>
                    <Avatar src={authentication.account?.data?.avatar?.url} style={{ height: 25, width: 25 }} />
                    {authentication.account?.data?.lastName ||
                        authentication.account?.data?.role ||
                        'Bạn cần đăng nhập để tiếp tục'}
                </div>
            </div>
        </div>
    );
});

export default LayoutHeader;
