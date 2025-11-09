import { Table, Popconfirm } from 'antd';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../../components/TooltipWrapper/TooltipWrapperComponent';
import { DeleteOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import globalStore from '../../../components/GlobalComponent/globalStore';
import * as http from '../../../lib/httpRequest';
import type { ExamData } from '../types';

interface ExamTableProps {
    columns: any[];
    displayDatas: ExamData[];
    loading: boolean;
    onRowClick: (record: ExamData) => void;
    onEdit: (record: ExamData) => void;
    onCopy: (record: ExamData) => void;
    onRefresh: () => void;
}

const ExamTable = observer(({
    columns,
    displayDatas,
    loading,
    onRowClick,
    onEdit,
    onCopy,
    onRefresh
}: ExamTableProps) => {

    const tableColumns = [
        ...columns,
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (_: unknown, record: ExamData) => {
                const now = dayjs();
                const startTime = record.startTime ? dayjs(record.startTime) : null;
                const isDisabled = startTime && (startTime.isAfter(now) || startTime.isSame(now));
                const disabledStyle = isDisabled ? { opacity: 0.7, cursor: 'not-allowed' } : {};

                const handleEdit = () => {
                    if (isDisabled) return;
                    onEdit(record);
                };

                const handleCopy = () => {
                    onCopy(record);
                };

                const handleDelete = () => {
                    if (isDisabled) return;
                    http.deleteById('/exams', record.id as unknown as number).then((res) => {
                        globalStore.triggerNotification('success', res.message || 'Xóa thành công!', '');
                        onRefresh();
                    });
                };

                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
                                <EditOutlined
                                    className="action-row-btn"
                                    style={disabledStyle}
                                    onClick={handleEdit}
                                />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Sao chép" position="left">
                                <CopyOutlined className="action-row-btn" onClick={handleCopy} />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                {isDisabled ? (
                                    <DeleteOutlined className="action-row-btn" style={disabledStyle} />
                                ) : (
                                    <Popconfirm
                                        title="Bạn có chắc chắn muốn xóa bài thi này?"
                                        okText="Có"
                                        cancelText="Không"
                                        onConfirm={handleDelete}
                                    >
                                        <DeleteOutlined className="action-row-btn" />
                                    </Popconfirm>
                                )}
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    return (
        <LoadingOverlay loading={loading}>
            <Table
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                dataSource={displayDatas}
                columns={tableColumns}
                onRow={(record) => {
                    const now = dayjs();
                    const endTime = record.endTime ? dayjs(record.endTime) : null;
                    const isExpired = endTime && endTime.isBefore(now);
                    
                    return {
                        onClick: (e) => {
                            // Ngăn chặn event nếu click vào các action buttons hoặc các phần tử con của chúng
                            const target = e.target as HTMLElement;
                            if (
                                target.closest('.actions-row') ||
                                target.closest('.action-row-btn') ||
                                target.classList.contains('anticon') ||
                                target.closest('.ant-popconfirm')
                            ) {
                                return;
                            }
                            
                            if (isExpired) {
                                globalStore.triggerNotification('warning', 'Bài thi đã kết thúc, không thể làm bài!', '');
                                return;
                            }
                            
                            onRowClick(record);
                        },
                        className: isExpired ? 'expired-row' : '',
                        style: isExpired ? { cursor: 'not-allowed' } : {}
                    };
                }}
            />
        </LoadingOverlay>
    );
});

export default ExamTable;

