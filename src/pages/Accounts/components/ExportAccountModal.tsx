import { Modal, Button, Alert } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import globalStore from '../../../components/GlobalComponent/globalStore';

interface AccountFilter {
    search?: string;
    role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | '';
    activated?: boolean | null;
}

interface ExportAccountModalProps {
    open: boolean;
    filter: AccountFilter;
    onCancel: () => void;
}

const ExportAccountModal = observer(({ open, filter, onCancel }: ExportAccountModalProps) => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            // Sử dụng axios trực tiếp để có responseType blob
            const axios = (await import('axios')).default;
            const token = localStorage.getItem('authenticationToken') || sessionStorage.getItem('authenticationToken');
            const baseURL = import.meta.env.VITE_REACT_APP_BASE_URL;

            // API export accounts: /excels/export/accounts
            const response = await axios.get(`${baseURL}/excels/export/accounts`, {
                responseType: 'blob',
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            // Tạo blob và download
            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Tạo tên file với timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `accounts_export_${timestamp}.xlsx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            globalStore.triggerNotification('success', 'Export tài khoản thành công!', '');
            onCancel();
        } catch (error: any) {
            console.error('Error exporting accounts:', error);
            globalStore.triggerNotification(
                'error',
                error?.response?.data?.message || 'Có lỗi xảy ra khi export tài khoản!',
                ''
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal
            title="Export tài khoản"
            open={open}
            onCancel={onCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="export" type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                    Export
                </Button>
            ]}
        >
            <div className="export-account-modal">
                <Alert
                    message="Xuất dữ liệu tài khoản"
                    description="Tất cả tài khoản trong hệ thống sẽ được export"
                    type="info"
                    style={{ marginBottom: 16 }}
                />
                <div className="export-info">
                    <p>• File sẽ được tải về định dạng Excel (.xlsx)</p>
                    <p>• Export tất cả tài khoản trong hệ thống</p>
                    <p>• Bao gồm các cột: Create At, Email, Role, Create By</p>
                </div>
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<DownloadOutlined />}
                        loading={exporting}
                        onClick={handleExport}
                        style={{ minWidth: 150 }}
                    >
                        Export tài khoản
                    </Button>
                </div>
            </div>
        </Modal>
    );
});

export default ExportAccountModal;

