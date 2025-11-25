import { Table, Tag, Space } from 'antd';
import { useEffect, useState } from 'react';
import * as http from '../../../lib/httpRequest';

interface SubmissionExercise {
    exerciseId: string;
    exerciseCode: string;
    exerciseTitle: string;
    order: number;
    score: number;
    hasSubmitted: boolean;
}

interface StudentProgress {
    userId: string;
    rollNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    totalScore: number | null;
    hasJoined: boolean;
    isCompleted: boolean;
    submissionExercises: SubmissionExercise[];
}

interface StudentsProgressTableProps {
    examId: string;
    groupId: string;
}

const StudentsProgressTable = ({ examId, groupId }: StudentsProgressTableProps) => {
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (examId && groupId) {
            const url = `/exams/${examId}/groups/${groupId}/students-progress`;
            console.log('[API] GET', url, '- Fetching students progress for exam:', examId);
            setLoading(true);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setStudents(res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    setStudents([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [examId, groupId]);

    // Tạo columns cho bảng exercises trong expanded row
    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200
        },
        {
            title: 'Họ tên',
            key: 'fullName',
            width: 200,
            render: (_: unknown, record: StudentProgress) => {
                if (record.firstName || record.lastName) {
                    return `${record.firstName || ''} ${record.lastName || ''}`.trim();
                }
                return '-';
            }
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'rollNumber',
            key: 'rollNumber',
            width: 120,
            render: (rollNumber: string | null) => rollNumber || '-'
        },
        {
            title: 'Tổng điểm',
            dataIndex: 'totalScore',
            key: 'totalScore',
            width: 100,
            align: 'center' as const,
            render: (totalScore: number | null) => {
                if (totalScore === null) return '-';
                return <strong>{totalScore.toFixed(1)}</strong>;
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            render: (_: unknown, record: StudentProgress) => (
                <Space direction="vertical" size="small">
                    <Tag color={record.hasJoined ? 'green' : 'default'}>
                        {record.hasJoined ? 'Đã tham gia' : 'Chưa tham gia'}
                    </Tag>
                    {record.hasJoined && (
                        <Tag color={record.isCompleted ? 'blue' : 'orange'}>
                            {record.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                        </Tag>
                    )}
                </Space>
            )
        }
    ];

    return (
        <Table
            rowKey="userId"
            dataSource={students}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 10 }}
            expandable={undefined}
        />
    );
};

export default StudentsProgressTable;

