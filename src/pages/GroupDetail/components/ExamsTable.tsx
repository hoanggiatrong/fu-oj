import { Table, Tag, Button } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

interface Exam {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
}

interface ExamsTableProps {
    dataSource: Exam[];
    loading?: boolean;
    groupId?: string;
}

interface ExamStatusInfo {
    status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
    label: string;
    color: string;
}

const getExamStatus = (startTime: string | null | undefined, endTime: string | null | undefined): ExamStatusInfo => {
    const now = dayjs();
    if (!startTime || !endTime) {
        return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
    }
    
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    if (start.isAfter(now)) {
        return { status: 'upcoming', label: 'Sắp tới', color: 'blue' };
    } else if (start.isBefore(now) || start.isSame(now)) {
        if (end.isAfter(now)) {
            return { status: 'ongoing', label: 'Đang diễn ra', color: 'green' };
        } else {
            return { status: 'completed', label: 'Đã kết thúc', color: 'default' };
        }
    }
    
    return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
};

const ExamsTable = ({ dataSource, loading, groupId }: ExamsTableProps) => {
    const navigate = useNavigate();
    const params = useParams();
    // Lấy groupId từ params hoặc từ prop
    const currentGroupId = groupId || params.id || params.groupId;
    
    const columns = [
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time: string) => (time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-')
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (time: string) => (time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record: Exam) => {
                const statusInfo = getExamStatus(record.startTime, record.endTime);
                return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, record: Exam) => (
                <Button
                    type="text"
                    icon={<BarChartOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (currentGroupId) {
                            navigate(`/group/${currentGroupId}/exams/${record.id}/students-progress`);
                        }
                    }}
                    title="Xem tiến độ"
                />
            )
        }
    ];

    return (
        <Table
            rowKey="id"
            dataSource={dataSource}
            pagination={{ pageSize: 10 }}
            columns={columns}
            loading={loading}
            onRow={(record: Exam) => {
                return {
                    onClick: (e) => {
                        // Ngăn chặn navigate nếu click vào các phần tử con
                        const target = e.target as HTMLElement;
                        if (target.closest('a') || target.closest('button') || target.closest('.ant-tag') || target.closest('.anticon')) {
                            return;
                        }
                        if (currentGroupId) {
                            navigate(`/group/${currentGroupId}/exams/${record.id}`);
                        }
                    },
                    style: { cursor: 'pointer' }
                };
            }}
        />
    );
};

export default ExamsTable;

