import { Table, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../../components/TooltipWrapper/TooltipWrapperComponent';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import globalStore from '../../../components/GlobalComponent/globalStore';
import * as http from '../../../lib/httpRequest';

interface AccountData {
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  createdBy?: string | null;
  createdTimestamp?: string;
  updatedBy?: string | null;
  updatedTimestamp?: string;
  deletedTimestamp?: string | null;
}

interface AccountTableProps {
  accounts: AccountData[];
  onRefresh: () => void;
  getRoleTagColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
}

const AccountTable = observer(({ accounts, onRefresh, getRoleTagColor, getRoleLabel }: AccountTableProps) => {
  const handleToggleActivated = async (account: AccountData) => {
    try {
      const isActivated = account.deletedTimestamp === null;
      // Nếu đã kích hoạt (deletedTimestamp = null) thì vô hiệu hóa (set deletedTimestamp)
      // Nếu chưa kích hoạt (deletedTimestamp != null) thì kích hoạt (set deletedTimestamp = null)
      await http.put(`/accounts/${account.email}`, {
        deletedTimestamp: isActivated ? new Date().toISOString() : null
      });
      globalStore.triggerNotification(
        'success',
        `${isActivated ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản thành công!`,
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
      render: (email: string) => <span>{email}</span>,
      width: 200
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={getRoleTagColor(role)}>{getRoleLabel(role)}</Tag>,
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
          <Tag color={isActivated ? 'success' : 'default'}>
            {isActivated ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
          </Tag>
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
      render: (createdTimestamp: string) => (createdTimestamp ? dayjs(createdTimestamp).format('DD/MM/YYYY HH:mm') : '-'),
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
        <div className="actions-row" onClick={(e) => e.stopPropagation()}>
          <ProtectedElement acceptRoles={['ADMIN']}>
            <TooltipWrapper tooltipText={record.deletedTimestamp === null ? 'Vô hiệu hóa' : 'Kích hoạt'} position="left">
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
      scroll={{ x: 1000 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} tài khoản`,
        pageSizeOptions: ['10', '20', '50', '100']
      }}
      dataSource={accounts}
      columns={columns}
    />
  );
});

export default AccountTable;

