import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Button } from 'antd';
import dayjs from 'dayjs';
import * as http from '../../../../lib/httpRequest';

interface ExamRanking {
    id: string;
    userId?: string;
    user?: {
        id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    totalScore?: number | null;
    updatedTimestamp?: string;
    createdTimestamp?: string;
    exam?: {
        examId?: string;
        title?: string;
    };
}

const SubmissionsTab = observer(() => {
    const params = useParams();
    const groupId = params.id || params.groupId;
    const examId = params.examId;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [examRankings, setExamRankings] = useState<ExamRanking[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const selectedStudentId = searchParams.get('studentId');

    useEffect(() => {
        if (examId) {
            loadExamRankings();
        }
    }, [examId, selectedStudentId]);

    useEffect(() => {
        if (examId && groupId) {
            // Fetch students list for filter
            const studentsUrl = `/exams/${examId}/groups/${groupId}/students-progress`;
            http.get(studentsUrl)
                .then((res) => {
                    const studentsData = (res.data || []).map((s: any) => ({
                        userId: s.userId,
                        email: s.email,
                        firstName: s.firstName,
                        lastName: s.lastName
                    }));
                    setStudents(studentsData);
                })
                .catch((error) => {
                    console.error('[API] GET', studentsUrl, '- Error:', error);
                });
        }
    }, [examId, groupId]);

    const loadExamRankings = () => {
        if (!examId) return;
        
        setLoading(true);
        const url = `/exam-rankings?examId=${examId}${selectedStudentId ? `&userId=${selectedStudentId}` : ''}`;
        console.log('[API] GET', url, '- Fetching exam rankings for exam:', examId);
        
        http.get(url)
            .then((res) => {
                console.log('[API] GET', url, '- Success:', res.data);
                setExamRankings(res.data || []);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setExamRankings([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const columns = [
        {
            title: 'Sinh viên',
            key: 'student',
            width: 200,
            render: (_: unknown, record: ExamRanking) => {
                const firstName = record.user?.firstName || '';
                const lastName = record.user?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const email = record.user?.email || '-';
                return (
                    <div>
                        <div>{email}</div>
                        {fullName && <div style={{ fontSize: '12px', color: '#888' }}>{fullName}</div>}
                    </div>
                );
            }
        },
        {
            title: 'Thời gian nộp',
            key: 'submittedAt',
            width: 150,
            render: (_: unknown, record: ExamRanking) => {
                const time = record.updatedTimestamp || record.createdTimestamp;
                return time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-';
            }
        },
        {
            title: 'Điểm',
            key: 'score',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, record: ExamRanking) => {
                if (record.totalScore === null || record.totalScore === undefined) {
                    return '-';
                }
                return <strong>{record.totalScore.toFixed(1)}</strong>;
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, record: ExamRanking) => {
                if (record.totalScore === null || record.totalScore === undefined) {
                    return <Tag color="default">Chưa nộp</Tag>;
                }
                const status = record.totalScore > 0 ? 'AC' : 'WA';
                const color = status === 'AC' ? 'green' : 'red';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_: unknown, record: ExamRanking) => {
                const userId = record.userId || record.user?.id;
                if (!userId) return <span>-</span>;
                return (
                    <Button 
                        type="link"
                        onClick={() => {
                            navigate(`/group/${groupId}/exams/${examId}/submissions?studentId=${userId}`);
                        }}
                    >
                        Xem chi tiết
                    </Button>
                );
            }
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>Lọc theo sinh viên:</span>
                <Select
                    style={{ width: 300 }}
                    placeholder="Chọn sinh viên (tùy chọn)"
                    allowClear
                    value={selectedStudentId || undefined}
                    onChange={(value) => {
                        if (value) {
                            setSearchParams({ studentId: value });
                        } else {
                            setSearchParams({});
                        }
                    }}
                    options={students.map(s => ({
                        value: s.userId,
                        label: `${s.email}${s.firstName || s.lastName ? ` (${[s.firstName, s.lastName].filter(Boolean).join(' ')})` : ''}`
                    }))}
                />
            </div>
            <Table
                rowKey="id"
                dataSource={examRankings}
                columns={columns}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
});

export default SubmissionsTab;

