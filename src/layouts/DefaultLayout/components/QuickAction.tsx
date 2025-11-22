import { observer } from 'mobx-react-lite';
import { LogoutOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const QuickAction = observer(() => {
    const [selected, select] = useState(0);

    return (
        <div className="quick-action">
            <ul>
                <li className="selected">
                    <div className="action-item">
                        <UserOutlined className="ico" />
                        Quản lý người dùng
                    </div>
                </li>
                <li>
                    <div className="action-item">
                        <UnorderedListOutlined className="ico" />
                        Bài thi
                    </div>
                </li>
                <li>
                    <div className="action-item">
                        <LogoutOutlined className="ico" />
                        Đăng xuất
                    </div>
                </li>
            </ul>
        </div>
    );
});

export default QuickAction;
