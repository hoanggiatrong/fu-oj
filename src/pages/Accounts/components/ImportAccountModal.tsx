import { Modal, Upload, Button, Table, Progress, Alert, Steps, message } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import globalStore from '../../../components/GlobalComponent/globalStore';
import './import-account-modal.scss';

type ImportedAccount = {
    StudentID?: string;
    Name?: string;
    Mail?: string;
};

interface ImportAccountResult {
    success: number;
    failed: number;
    importedAccounts: ImportedAccount[];
    errors: Array<{
        row: number;
        email: string;
        error: string;
    }>;
}

interface ImportAccountModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const ImportAccountModal = observer(({ open, onCancel, onSuccess }: ImportAccountModalProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importResult, setImportResult] = useState<ImportAccountResult | null>(null);

    const validateFile = (file?: File) => {
        if (!file) return false;
        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        const isCSV = fileName.endsWith('.csv');
        if (!isExcel && !isCSV) {
            globalStore.triggerNotification('error', 'Chỉ chấp nhận file .xlsx, .xls hoặc .csv!', '');
            return false;
        }
        return true;
    };

    const handleFileChange: UploadProps['onChange'] = (info) => {
        const newFileList = info.fileList.slice(-1);
        const latestFile = newFileList[0]?.originFileObj as File | undefined;
        if (latestFile && !validateFile(latestFile)) {
            setFileList([]);
            return;
        }
        setFileList(newFileList);
        setCurrentStep(0);
        setImportResult(null);
        setUploadProgress(0);
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Vui lòng chọn file!');
            return;
        }

        const file = fileList[0].originFileObj as File | undefined;
        if (!validateFile(file)) {
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file!);

            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const axios = (await import('axios')).default;
            const token = localStorage.getItem('authenticationToken') || sessionStorage.getItem('authenticationToken');
            const baseURL = import.meta.env.VITE_REACT_APP_BASE_URL;

            const res = await axios.post(`${baseURL}/excels/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                }
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Parse response từ API
            // Format: { status: 201, message: "import successful", data: [{ email, password }] }
            const responseData = res.data || {};
            const rawData = responseData.data || [];

            // Map dữ liệu từ response (format: { email, password })
            // API chỉ trả về email và password trong RegisterRequestDTO
            const mappedSuccess: ImportedAccount[] = Array.isArray(rawData)
                ? rawData.map((item: any) => ({
                    Mail: item.email || item.Mail || item.mail || '-'
                }))
                : [];

            // API không trả về errors trong response, chỉ trả về danh sách thành công
            const mappedErrors: Array<{ row: number; email: string; error: string }> = [];

            const successCount = mappedSuccess.length;
            const failedCount = 0;

            // Hiển thị thông báo
            if (successCount > 0) {
                globalStore.triggerNotification('success', `Import thành công ${successCount} tài khoản!`, '');
            } else {
                globalStore.triggerNotification('warning', 'Không có tài khoản nào được import thành công!', '');
            }

            setImportResult({
                success: successCount,
                failed: failedCount,
                importedAccounts: mappedSuccess,
                errors: mappedErrors
            });
            setCurrentStep(1);

            // Reload trang ngay sau khi import thành công (nếu có tài khoản import thành công)
            if (successCount > 0) {
                setTimeout(() => {
                    window.location.reload();
                }, 2000); // Đợi 2 giây để user xem kết quả trước khi reload
            }
        } catch (error: any) {
            console.error('Error uploading file:', error);
            globalStore.triggerNotification(
                'error',
                error?.response?.data?.message || 'Có lỗi xảy ra khi import tài khoản!',
                ''
            );
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setFileList([]);
        setCurrentStep(0);
        setUploadProgress(0);
        setImportResult(null);
    };

    const handleClose = () => {
        handleReset();
        onCancel();
    };

    const handleFinish = () => {
        handleReset();
        onSuccess();
        // Reload trang (nếu chưa reload tự động)
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const errorColumns = [
        { title: 'Dòng', dataIndex: 'row', key: 'row', width: 80 },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Lỗi', dataIndex: 'error', key: 'error' }
    ];

    const successColumns = [
        { title: 'Email', dataIndex: 'Mail', key: 'Mail', width: 300, render: (value: string) => value || '-' }
    ];

    return (
        <Modal
            title="Import tài khoản"
            open={open}
            onCancel={handleClose}
            width={900}
            footer={
                currentStep === 1 && importResult
                    ? [
                        <Button key="close" onClick={handleClose}>
                            Đóng
                        </Button>,
                        <Button key="finish" type="primary" onClick={handleFinish}>
                            Hoàn thành
                        </Button>
                    ]
                    : null
            }
        >
            <div className="import-account-modal">
                <Steps current={currentStep} style={{ marginBottom: 24 }} items={[{ title: 'Chọn file' }, { title: 'Kết quả' }]} />

                {currentStep === 0 && (
                    <div className="step-content">
                        <Upload
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false}
                            accept=".xlsx,.xls,.csv"
                            maxCount={1}
                            showUploadList={{ showRemoveIcon: true }}
                        >
                            <Button icon={<UploadOutlined />}>Chọn file Excel/CSV</Button>
                        </Upload>
                        <div className="upload-hint">
                            <p>• Chấp nhận file: .xlsx, .xls, .csv</p>
                            <p>
                                • File phải có các cột: <strong>StudentID</strong>, <strong>Name</strong>, <strong>Mail</strong>
                            </p>
                            <p>• <strong>StudentID</strong>: Mã số sinh viên (ví dụ: HE123456)</p>
                            <p>• <strong>Name</strong>: Họ và tên (ví dụ: Pham Van A)</p>
                            <p>• <strong>Mail</strong>: Email đăng nhập (ví dụ: abc@gmail.com)</p>
                        </div>

                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <Button onClick={handleClose}>Hủy</Button>
                            <Button type="primary" onClick={handleUpload} disabled={fileList.length === 0} loading={uploading}>
                                Xác nhận import
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && importResult && (
                    <div className="step-content">
                        <Alert
                            message="Import hoàn tất!"
                            description={
                                <div>
                                    <p>
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Thành công: {importResult.success} dòng
                                    </p>
                                    {importResult.failed > 0 && (
                                        <p>
                                            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} /> Thất bại: {importResult.failed} dòng
                                        </p>
                                    )}
                                </div>
                            }
                            type={importResult.failed > 0 ? 'warning' : 'success'}
                            style={{ marginBottom: 16 }}
                        />

                        {importResult.importedAccounts.length > 0 ? (
                            <div className="success-summary" style={{ marginBottom: 16 }}>
                                <h4>Danh sách tài khoản import thành công:</h4>
                                <Table
                                    dataSource={importResult.importedAccounts}
                                    columns={successColumns}
                                    pagination={{ pageSize: 5 }}
                                    scroll={{ y: 240 }}
                                    size="small"
                                    rowKey={(_, index) => `success-${index}`}
                                />
                            </div>
                        ) : (
                            <Alert
                                type="info"
                                message="Không có tài khoản nào được import thành công."
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {importResult.errors.length > 0 && (
                            <div className="error-summary">
                                <h4>Chi tiết lỗi:</h4>
                                <Table
                                    dataSource={importResult.errors}
                                    columns={errorColumns}
                                    pagination={{ pageSize: 5 }}
                                    scroll={{ y: 240 }}
                                    size="small"
                                    rowKey={(_, index) => `error-${index}`}
                                />
                            </div>
                        )}
                    </div>
                )}

                {uploading && currentStep === 0 && (
                    <div className="upload-progress" style={{ marginTop: 24 }}>
                        <Progress percent={uploadProgress} status="active" />
                        <p>Đang import tài khoản...</p>
                    </div>
                )}
            </div>
        </Modal>
    );
});

export default ImportAccountModal;

