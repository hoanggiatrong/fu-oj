import { DownloadOutlined, FilterOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input, Popover, Select } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import './accounts.scss';
import AccountTable from './components/AccountTable';
import ExportAccountModal from './components/ExportAccountModal';
import ImportAccountModal from './components/ImportAccountModal';

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

const Accounts = observer(() => {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [displayAccounts, setDisplayAccounts] = useState<AccountData[]>([]);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [isFilterOpen, setFilterOpen]: any = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        activated: null
    });

    const applyFilter = () => {
        const searchLowerCase = search.toLowerCase();

        const filtered = accounts.filter((item: any) => {
            const matchesSearch = !searchLowerCase || item.email.toLowerCase().includes(searchLowerCase);

            const matchesRole = !filters.role || item.role === filters.role;

            const matchesActivated =
                filters.activated == null
                    ? true
                    : filters.activated
                        ? item.deletedTimestamp === null
                        : item.deletedTimestamp !== null;

            return matchesSearch && matchesRole && matchesActivated;
        });

        setDisplayAccounts(filtered);
        setFilterOpen(false);
    };

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
        getAccounts(1, 10, search || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const searchLowerCase = search.toLowerCase();

        const filtered = accounts.filter((d: any) => d.email.toLowerCase().includes(searchLowerCase));
        setDisplayAccounts(filtered);
    }, [search]);

    const handleFilterChange = (key: keyof any, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
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

    const handleChangeRole = async (accountId: string, newRole: 'STUDENT' | 'INSTRUCTOR') => {
        try {
            await http.put('/account/role', {}, { params: { id: accountId, role: newRole } });

            globalStore.triggerNotification(
                'success',
                `Đổi vai trò thành công sang ${getRoleLabel(newRole)}!`,
                ''
            );

            // Refresh lại dữ liệu từ server
            getAccounts();
        } catch (error: any) {
            globalStore.triggerNotification(
                'error',
                error?.response?.data?.message || 'Có lỗi xảy ra khi đổi vai trò!',
                ''
            );
        }
    };

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('accounts left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">Quản lý tài khoản</div>
                    <div className="description">
                        Quản lý và theo dõi tất cả tài khoản trong hệ thống. Bạn có thể tìm kiếm, lọc, import và export
                        dữ liệu tài khoản.
                    </div>
                </div>

                <div
                    className={classnames('wrapper flex', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filters">
                        <Input placeholder="Tìm kiếm theo Email" onChange={(e) => setSearch(e.target.value)} />

                        <TooltipWrapper tooltipText="Bộ lọc" position="top">
                            <Popover
                                content={
                                    <div className="custom-pop-content">
                                        <div className="filter-container">
                                            <div className="filter-name">Vai trò</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn độ vai trò"
                                                onChange={(value) => handleFilterChange('role', value)}
                                                options={[
                                                    { value: 'STUDENT', label: 'Sinh viên' },
                                                    { value: 'INSTRUCTOR', label: 'Giảng viên' }
                                                ]}
                                            />
                                        </div>
                                        <div className="filter-container">
                                            <div className="filter-name">Trạng thái hoạt động</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn trạng thái hoạt động"
                                                onChange={(value) => handleFilterChange('activated', value ?? null)}
                                                options={[
                                                    { value: true, label: 'Đang hoạt động' },
                                                    { value: false, label: 'Không hoạt động' }
                                                ]}
                                            />
                                        </div>
                                        <Button type="primary" className="apply-filter" onClick={applyFilter}>
                                            Áp dụng
                                        </Button>
                                    </div>
                                }
                                title="Bộ lọc"
                                trigger="click"
                                open={isFilterOpen}
                                onOpenChange={(open) => setFilterOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico">
                                    <FilterOutlined className="custom-ant-ico" />
                                </div>
                            </Popover>
                        </TooltipWrapper>

                        <ProtectedElement acceptRoles={['ADMIN']}>
                            <TooltipWrapper tooltipText="Import tài khoản" position="top">
                                <div className="custom-circle-ico" onClick={() => setImportModalOpen(true)}>
                                    <DownloadOutlined className="custom-ant-ico color-cyan" />
                                </div>
                            </TooltipWrapper>
                        </ProtectedElement>

                        <ProtectedElement acceptRoles={['ADMIN']}>
                            <TooltipWrapper tooltipText="Export tài khoản" position="top">
                                <div className="custom-circle-ico" onClick={() => setExportModalOpen(true)}>
                                    <UploadOutlined className="custom-ant-ico color-gold" />
                                </div>
                            </TooltipWrapper>
                        </ProtectedElement>
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
                                <div className="stat-value">{accounts.filter((a) => a.role === 'STUDENT').length}</div>
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
                                search={search}
                                accounts={displayAccounts}
                                onRefresh={getAccounts}
                                getRoleTagColor={getRoleTagColor}
                                getRoleLabel={getRoleLabel}
                                onChangeRole={handleChangeRole}
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
                    filter={filters}
                    onCancel={() => setExportModalOpen(false)}
                />
            </div>
            <div className="right">
                <CustomCalendar />
            </div>
        </div>
    );
});

export default Accounts;
