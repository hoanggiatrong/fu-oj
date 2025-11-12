import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Button, Input, Select, Avatar } from 'antd';
import { SearchOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import * as http from '../../lib/httpRequest';
import AccountTable from './components/AccountTable';
import ImportAccountModal from './components/ImportAccountModal';
import ExportAccountModal from './components/ExportAccountModal';
import './accounts.scss';

const { Option } = Select;

interface AccountData {
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  createdBy?: string | null;
  createdTimestamp?: string;
  updatedBy?: string | null;
  updatedTimestamp?: string;
  deletedTimestamp?: string | null;
}

interface AccountFilter {
  search?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | '';
  activated?: boolean | null;
}

const Accounts = observer(() => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [displayAccounts, setDisplayAccounts] = useState<AccountData[]>([]);
  const [filter, setFilter] = useState<AccountFilter>({
    search: '',
    role: '',
    activated: null
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const getAccounts = (page: number = 1, pageSize: number = 10, email: string = '') => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      email: email,
      order: ''
    });
    http.get(`/account?${params.toString()}`)
      .then((res) => {
        const data = res.data || [];
        setAccounts(data);
        setDisplayAccounts(data);
      })
      .catch((error) => {
        console.error('Error fetching accounts:', error);
        globalStore.triggerNotification('error', 'Không thể tải danh sách tài khoản!', '');
        setAccounts([]);
        setDisplayAccounts([]);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  useEffect(() => {
    getAccounts(1, 10, filter.search || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...accounts];

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter((account) => account.email?.toLowerCase().includes(searchLower));
    }

    // Filter by role
    if (filter.role) {
      filtered = filtered.filter((account) => account.role === filter.role);
    }

    // Filter by activated (deletedTimestamp === null means activated)
    if (filter.activated !== null) {
      filtered = filtered.filter((account) => {
        const isActivated = account.deletedTimestamp === null;
        return isActivated === filter.activated;
      });
    }

    setDisplayAccounts(filtered);
  }, [filter, accounts]);

  const handleFilterChange = (key: keyof AccountFilter, value: any) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilter = () => {
    setFilter({
      search: '',
      role: '',
      activated: null
    });
  };

  const getRoleTagColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'INSTRUCTOR':
        return 'blue';
      case 'STUDENT':
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'INSTRUCTOR':
        return 'Giảng viên';
      case 'STUDENT':
        return 'Sinh viên';
      default:
        return role;
    }
  };

  return (
    <div className={classnames('accounts', { 'p-24': globalStore.isBelow1300 })}>
      <div className="header">
        <div className="title">
          <Avatar src={'/sources/rank-user.png'} />
          Quản lý tài khoản
          <ProtectedElement acceptRoles={['ADMIN']}>
            <div className="header-actions">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setImportModalOpen(true)}
              >
                Import tài khoản
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={() => setExportModalOpen(true)}
              >
                Export tài khoản
              </Button>
            </div>
          </ProtectedElement>
        </div>
        <div className="description">
          Quản lý và theo dõi tất cả tài khoản trong hệ thống. Bạn có thể tìm kiếm, lọc, import và export dữ
          liệu tài khoản.
        </div>
      </div>

      <div
        className={classnames('wrapper flex', {
          'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
        })}
      >
        <div className="search">
          <div className="title">
            <SearchOutlined />
            Bộ lọc
          </div>
          <Input
            placeholder="Tìm kiếm theo Email"
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            allowClear
          />
          <Select
            placeholder="Chọn vai trò"
            value={filter.role || undefined}
            onChange={(value) => handleFilterChange('role', value || '')}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value="STUDENT">Sinh viên</Option>
            <Option value="INSTRUCTOR">Giảng viên</Option>
          </Select>
          <Select
            placeholder="Trạng thái kích hoạt"
            value={filter.activated === null ? undefined : filter.activated}
            onChange={(value) => handleFilterChange('activated', value)}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={true}>Đã kích hoạt</Option>
            <Option value={false}>Chưa kích hoạt</Option>
          </Select>
          <Button onClick={handleResetFilter} style={{ width: '100%' }}>
            Xóa bộ lọc
          </Button>
        </div>

        <div className="body">
          <div className="stats">
            <div className="stat-item">
              <div className="stat-label">Tổng số tài khoản</div>
              <div className="stat-value">{accounts.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Đã lọc</div>
              <div className="stat-value">{displayAccounts.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Sinh viên</div>
              <div className="stat-value">
                {accounts.filter((a) => a.role === 'STUDENT').length}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Giảng viên</div>
              <div className="stat-value">
                {accounts.filter((a) => a.role === 'INSTRUCTOR').length}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Quản trị viên</div>
              <div className="stat-value">{accounts.filter((a) => a.role === 'ADMIN').length}</div>
            </div>
          </div>

          <LoadingOverlay loading={loading}>
            <AccountTable
              accounts={displayAccounts}
              onRefresh={getAccounts}
              getRoleTagColor={getRoleTagColor}
              getRoleLabel={getRoleLabel}
            />
          </LoadingOverlay>
        </div>
      </div>

      <ImportAccountModal
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          getAccounts();
        }}
      />

      <ExportAccountModal
        open={exportModalOpen}
        filter={filter}
        onCancel={() => setExportModalOpen(false)}
      />
    </div>
  );
});

export default Accounts;

