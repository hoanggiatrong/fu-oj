import { BarChartOutlined, HighlightOutlined } from '@ant-design/icons';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Highlighter from 'react-highlight-words';
import { useNavigate, useParams } from 'react-router-dom';
import TooltipWrapper from '../../../components/TooltipWrapper/TooltipWrapperComponent';
import authentication from '../../../shared/auth/authentication';

interface Exam {
    id: string;
    title: string;
    description?: string;
    startTime?: string | null;
    endTime?: string | null;
    status?: string;
}

type StudentStatusKey = 'not-started' | 'in-progress' | 'completed';

interface ExamsTableProps {
    dataSource: Exam[];
    loading?: boolean;
    groupId?: string;
    showStatisticsAction?: boolean;
    onExamClick?: (record: Exam) => void;
    studentStatusMap?: Map<string, StudentStatusKey>;
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

const getStudentStatusTag = (status: StudentStatusKey | undefined) => {
    switch (status) {
        case 'completed':
            return <Tag color="green">Đã hoàn thành</Tag>;
        case 'in-progress':
            return <Tag color="orange">Đang làm</Tag>;
        default:
            return <Tag color="default">Chưa bắt đầu</Tag>;
    }
};

const ExamsTable = ({
    dataSource,
    loading,
    groupId,
    showStatisticsAction = true,
    onExamClick,
    studentStatusMap
}: ExamsTableProps) => {
    const navigate = useNavigate();
    const params = useParams();
    // Lấy groupId từ params hoặc từ prop
    const currentGroupId = groupId || params.id || params.groupId;

    const columns: ColumnsType<Exam> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[]}
                            autoEscape={true}
                            textToHighlight={title}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[]}
                            autoEscape={true}
                            textToHighlight={description}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time: string | null | undefined) => (
                <div className="cell">{time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-'}</div>
            )
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (time: string | null | undefined) => (
                <div className="cell">{time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-'}</div>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record: Exam) => {
                const statusInfo = getExamStatus(record.startTime, record.endTime);
                return (
                    <div className="cell">
                        <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                    </div>
                );
            }
        }
    ];

    const tableColumns: ColumnsType<Exam> = [...columns];

    if (studentStatusMap) {
        tableColumns.push({
            title: 'Trạng thái làm bài',
            key: 'studentStatus',
            width: 160,
            render: (_: unknown, record: Exam) => (
                <div className="cell">{getStudentStatusTag(studentStatusMap.get(record.id))}</div>
            )
        });
    }

    if (studentStatusMap && onExamClick && !showStatisticsAction) {
        tableColumns.push({
            title: 'Hành động',
            key: 'studentAction',
            width: 110,
            align: 'right',
            render: (_: unknown, record: Exam) => (
                <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
                    <TooltipWrapper
                        tooltipText={studentStatusMap.get(record.id) === 'completed' ? 'Xem kết quả' : 'Tham gia'}
                        position="left"
                    >
                        {studentStatusMap.get(record.id) === 'completed' ? (
                            <BarChartOutlined className="action-row-btn" onClick={() => onExamClick(record)} />
                        ) : (
                            <HighlightOutlined className="action-row-btn" onClick={() => onExamClick(record)} />
                        )}
                    </TooltipWrapper>
                </div>
            )
        });
    } else if (showStatisticsAction) {
        tableColumns.push({
            title: 'Hành động',
            key: 'action',
            width: 110,
            align: 'right',
            render: (_: unknown, record: Exam) => (
                <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
                    <TooltipWrapper tooltipText={'Xem tiến độ'} position="left">
                        <BarChartOutlined
                            className="action-row-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (currentGroupId) {
                                    navigate(`/group/${currentGroupId}/exams/${record.id}/students-progress`);
                                }
                            }}
                        />
                    </TooltipWrapper>
                </div>
            )
        });
    }

    return (
        <Table
            rowKey="id"
            key={`exams-table-${authentication.isInstructor ? 'instructor' : 'student'}`}
            rowClassName={(_record, index) => (index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd')}
            dataSource={dataSource}
            pagination={{ pageSize: 10 }}
            columns={tableColumns}
            loading={loading}
            onRow={(record: Exam) => {
                return {
                    onClick: (e) => {
                        // Ngăn chặn navigate nếu click vào các phần tử con
                        const target = e.target as HTMLElement;
                        if (
                            target.closest('a') ||
                            target.closest('button') ||
                            target.closest('.ant-tag') ||
                            target.closest('.anticon')
                        ) {
                            return;
                        }
                        if (onExamClick) {
                            onExamClick(record);
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
