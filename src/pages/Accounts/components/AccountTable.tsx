import { Table, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../../components/TooltipWrapper/TooltipWrapperComponent';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import globalStore from '../../../components/GlobalComponent/globalStore';
import * as http from '../../../lib/httpRequest';
import Highlighter from 'react-highlight-words';

interface AccountData {
    id: string;
    email: string;

    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    createdBy?: string | null;
    createdTimestamp?: string;
    updatedBy?: string | null;
    updatedTimestamp?: string;
    deletedTimestamp?: string | null;
}

interface AccountTableProps {
    search: string;
    accounts: AccountData[];
    onRefresh: () => void;
    getRoleTagColor: (role: string) => string;
    getRoleLabel: (role: string) => string;
}

const AccountTable = observer(({ accounts, onRefresh, getRoleTagColor, getRoleLabel, search }: AccountTableProps) => {
    const handleToggleActivated = async (account: AccountData) => {
        try {
            const isCurrentlyActivated = account.deletedTimestamp === null;
            const action = !isCurrentlyActivated;
            console.log('Account toggle request', { id: account.id, action });
            await http.put('/account/active', {}, { params: { action, id: account.id } });
            globalStore.triggerNotification(
                'success',
                `${action ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công!`,
                ''
            );
            onRefresh();
        } catch (error: any) {
            globalStore.triggerNotification(
                'error',
                error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản!',
                ''
            );
        }
    };

    const columns: ColumnsType<AccountData> = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
            render: (email: string) => (
                <div className="cell">
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={email}
                    />
                </div>
            ),
            width: 200
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <div className="cell">
                    <Tag color={getRoleTagColor(role)}>{getRoleLabel(role)}</Tag>
                </div>
            ),
            filters: [
                { text: 'Sinh viên', value: 'STUDENT' },
                { text: 'Giảng viên', value: 'INSTRUCTOR' },
                { text: 'Quản trị viên', value: 'ADMIN' }
            ],
            onFilter: (value, record) => record.role === value
        },
        {
            title: 'Trạng thái',
            key: 'activated',
            render: (_: unknown, record: AccountData) => {
                const isActivated = record.deletedTimestamp === null;
                return (
                    <div className="cell">
                        <Tag color={isActivated ? 'success' : 'default'}>
                            {isActivated ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                        </Tag>
                    </div>
                );
            },
            filters: [
                { text: 'Đã kích hoạt', value: true },
                { text: 'Chưa kích hoạt', value: false }
            ],
            onFilter: (value, record) => {
                const isActivated = record.deletedTimestamp === null;
                return isActivated === value;
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdTimestamp',
            key: 'createdTimestamp',
            render: (createdTimestamp: string) => (
                <div className="cell">
                    {createdTimestamp ? dayjs(createdTimestamp).format('DD/MM/YYYY HH:mm') : '-'}
                </div>
            ),
            sorter: (a, b) => {
                if (!a.createdTimestamp && !b.createdTimestamp) return 0;
                if (!a.createdTimestamp) return 1;
                if (!b.createdTimestamp) return -1;
                return dayjs(a.createdTimestamp).unix() - dayjs(b.createdTimestamp).unix();
            }
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 100,
            align: 'center',
            render: (_: unknown, record: AccountData) => (
                <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
                    <ProtectedElement acceptRoles={['ADMIN']}>
                        <TooltipWrapper
                            tooltipText={record.deletedTimestamp === null ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            position="left"
                        >
                            {record.deletedTimestamp === null ? (
                                <CloseCircleOutlined
                                    className="action-row-btn"
                                    onClick={() => handleToggleActivated(record)}
                                />
                            ) : (
                                <CheckCircleOutlined
                                    className="action-row-btn"
                                    onClick={() => handleToggleActivated(record)}
                                />
                            )}
                        </TooltipWrapper>
                    </ProtectedElement>
                </div>
            )
        }
    ];

    return (
        <Table
            rowKey="email"
            scroll={{ x: 800 }}
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} tài khoản`,
                pageSizeOptions: ['10', '20', '50', '100']
            }}
            dataSource={accounts}
            columns={columns}
            rowClassName={(record, index) => {
                record;
                return index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
            }}
        />
    );
});

export default AccountTable;
