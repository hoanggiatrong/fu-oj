import { observer } from 'mobx-react-lite';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Tag, Button } from 'antd';
import * as http from '../../../../lib/httpRequest';
import globalStore from '../../../../components/GlobalComponent/globalStore';
import SubmissionDetailModal, { type SubmissionResult } from './SubmissionDetailModal';
import stompClientLib from '../../../../lib/stomp-client.lib';

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

const StudentsProgressTab = observer(() => {
    const params = useParams();
    const groupId = params.id || params.groupId;
    const examId = params.examId;
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [groupExamId, setGroupExamId] = useState<string | null>(null);
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const modalOpenRef = useRef(false);

    const fetchStudentsProgress = useCallback(() => {
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

    useEffect(() => {
        fetchStudentsProgress();
    }, [fetchStudentsProgress]);

    useEffect(() => {
        if (!groupId || !examId) {
            setGroupExamId(null);
            return;
        }

        const url = `/group-exams?groupId=${groupId}`;
        http.get(url)
            .then((res) => {
                const groupExams = res.data || [];
                const matchedExam = groupExams.find(
                    (item: { groupExamId: string; id: string; exam?: { id?: string } }) =>
                        item.groupExamId === examId || item.id === examId || item.exam?.id === examId
                );
                setGroupExamId(matchedExam?.groupExamId || null);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setGroupExamId(null);
            });
    }, [groupId, examId]);

    // Subscribe to socket for real-time updates
    useEffect(() => {
        // Cleanup previous subscription
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }

        // Subscribe to socket if groupExamId is available
        if (groupExamId) {
            subscriptionRef.current = stompClientLib.subscribe({
                destination: `/topic/exam/groupExam/${groupExamId}`,
                onMessage: () => {
                    console.log('[Socket] Received update for groupExam:', groupExamId);
                    // Only refresh data when modal is not open to avoid interrupting user
                    if (!modalOpenRef.current) {
                        fetchStudentsProgress();
                    }
                }
            });
        }

        // Cleanup on unmount or when groupExamId changes
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [groupExamId, fetchStudentsProgress]);

    // Update ref when modalOpen changes
    useEffect(() => {
        modalOpenRef.current = modalOpen;
    }, [modalOpen]);

    const handleViewSubmissions = (userId: string) => {
        setModalOpen(true);
        setLoadingSubmission(true);
        const url = `/exams/submissions/results?userId=${userId}&groupExamId=${groupExamId}`;
        http.get(url)
            .then((res) => {
                setSubmissionResult(res.data || null);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                globalStore.triggerNotification('error', 'Không thể tải thông tin bài nộp', '');
                setModalOpen(false);
            })
            .finally(() => {
                setLoadingSubmission(false);
            });
    };

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
            width: 150,
            render: (_: unknown, record: StudentProgress) => {
                if (record.firstName || record.lastName) {
                    return `${record.firstName || ''} ${record.lastName || ''}`.trim();
                }
                return '-';
            }
        },
        {
            title: 'Điểm',
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
            render: (_: unknown, record: StudentProgress) => {
                if (!record.hasJoined) {
                    return <Tag color="default">Chưa tham gia</Tag>;
                }
                if (record.isCompleted) {
                    return <Tag color="green">Đã hoàn thành</Tag>;
                }
                return <Tag color="orange">Chưa hoàn thành</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_: unknown, record: StudentProgress) => {
                if (!record.hasJoined) {
                    return <span>-</span>;
                }
                return (
                    <Button type="link" onClick={() => handleViewSubmissions(record.userId)}>
                        Xem bài nộp
                    </Button>
                );
            }
        }
    ];

    return (
        <>
            <Table
                rowKey="userId"
                dataSource={students}
                columns={columns}
                loading={loading}
                pagination={{ pageSize: 10 }}
                expandable={{
                    expandedRowRender: (record: StudentProgress) => {
                        if (!record.hasJoined || record.submissionExercises.length === 0) {
                            return <div style={{ padding: '16px' }}>Chưa có bài tập nào được nộp</div>;
                        }
                        const exerciseColumns = [
                            {
                                title: 'STT',
                                dataIndex: 'order',
                                key: 'order',
                                width: 60,
                                align: 'center' as const
                            },
                            {
                                title: 'Mã bài tập',
                                dataIndex: 'exerciseCode',
                                key: 'exerciseCode',
                                width: 100
                            },
                            {
                                title: 'Tên bài tập',
                                dataIndex: 'exerciseTitle',
                                key: 'exerciseTitle'
                            },
                            {
                                title: 'Điểm',
                                dataIndex: 'score',
                                key: 'score',
                                width: 100,
                                align: 'center' as const,
                                render: (score: number) => score.toFixed(1)
                            },
                            {
                                title: 'Trạng thái',
                                key: 'hasSubmitted',
                                width: 120,
                                align: 'center' as const,
                                render: (_: unknown, record: SubmissionExercise) => (
                                    <Tag color={record.hasSubmitted ? 'green' : 'default'}>
                                        {record.hasSubmitted ? 'Đã nộp' : 'Chưa nộp'}
                                    </Tag>
                                )
                            }
                        ];
                        return (
                            <Table
                                className="exercise-expanded-table"
                                dataSource={record.submissionExercises}
                                columns={exerciseColumns}
                                pagination={false}
                                size="small"
                                rowKey="exerciseId"
                            />
                        );
                    },
                    rowExpandable: (record: StudentProgress) =>
                        record.hasJoined && record.submissionExercises.length > 0
                }}
            />

            <SubmissionDetailModal
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setSubmissionResult(null);
                }}
                submissionResult={submissionResult}
                loading={loadingSubmission}
            />
        </>
    );
});

export default StudentsProgressTab;
