import { Button, Dropdown, Modal, Table, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
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
    getRoleLabel: (role: string) => string;
    onChangeRole: (accountId: string, newRole: 'STUDENT' | 'INSTRUCTOR') => void;
}

const AccountTable = observer(({ accounts, onRefresh, getRoleLabel, search, onChangeRole }: AccountTableProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);

    const handleToggleActivated = async (account: AccountData) => {
        try {
            const isCurrentlyActivated = account.deletedTimestamp === null;
            const action = !isCurrentlyActivated;
            await http.put('/account/active', {}, { params: { action, id: account.id } });
            globalStore.triggerNotification(
                'success',
                `${action ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công!`,
                ''
            );
            setModalVisible(false);
            setSelectedAccount(null);
            onRefresh();
        } catch (error: any) {
            globalStore.triggerNotification(
                'error',
                error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản!',
                ''
            );
        }
    };

    const handleConfirmToggle = (account: AccountData) => {
        setSelectedAccount(account);
        setModalVisible(true);
    };

    const handleModalOk = () => {
        if (selectedAccount) {
            handleToggleActivated(selectedAccount);
        }
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        setSelectedAccount(null);
    };

    const handleRoleChange = (accountId: string, newRole: 'STUDENT' | 'INSTRUCTOR') => {
        onChangeRole(accountId, newRole);
    };

    const buildRoleMenuItems = (record: AccountData): MenuProps['items'] => {
        const roleItems: { key: 'STUDENT' | 'INSTRUCTOR'; label: string }[] = [
            { key: 'STUDENT', label: 'Sinh viên' },
            { key: 'INSTRUCTOR', label: 'Giảng viên' }
        ];

        return roleItems
            .filter((item) => item.key !== record.role)
            .map((item) => ({
                key: item.key,
                label: (
                    <span className="role-dropdown-item" data-role={item.key}>
                        {item.label}
                    </span>
                )
            }));
    };

    const renderRolePill = (role: string) => (
        <span className={`role-pill role-pill--${role.toLowerCase()}`}>{getRoleLabel(role)}</span>
    );

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
            render: (role: string, record: AccountData) => (
                <div className="cell role-cell">
                    {record.role === 'ADMIN' ? (
                        renderRolePill(role)
                    ) : (
                        <Dropdown
                            trigger={['click']}
                            menu={{
                                items: buildRoleMenuItems(record),
                                onClick: ({ key }) => handleRoleChange(record.id, key as 'STUDENT' | 'INSTRUCTOR')
                            }}
                        >
                            <button
                                className="role-pill-button"
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {renderRolePill(role)}
                                <span className="role-pill-caret" />
                            </button>
                        </Dropdown>
                    )}
                </div>
            ),
            filters: [
                { text: 'Sinh viên', value: 'STUDENT' },
                { text: 'Giảng viên', value: 'INSTRUCTOR' }
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
            render: (_: unknown, record: AccountData) => {
                const handleActionClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleConfirmToggle(record);
                };

                return (
                    <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['ADMIN']}>
                            <TooltipWrapper
                                tooltipText={record.deletedTimestamp === null ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                position="left"
                            >
                                {record.deletedTimestamp === null ? (
                                    <CloseCircleOutlined
                                        className="action-row-btn"
                                        onClick={handleActionClick}
                                    />
                                ) : (
                                    <CheckCircleOutlined
                                        className="action-row-btn"
                                        onClick={handleActionClick}
                                    />
                                )}
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    const isActivated = selectedAccount?.deletedTimestamp === null;

    return (
        <>
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
            <Modal
                title={`${isActivated ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản?`}
                open={modalVisible}
                onCancel={handleModalCancel}
                centered
                footer={null}
            >
                <p>
                    Bạn có chắc chắn muốn {isActivated ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản{' '}
                    <strong>{selectedAccount?.email}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                    <Button onClick={handleModalCancel}>Hủy</Button>
                    <Button type="primary" danger={isActivated} onClick={handleModalOk}>
                        {isActivated ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
                </div>
            </Modal>
        </>
    );
});

export default AccountTable;
