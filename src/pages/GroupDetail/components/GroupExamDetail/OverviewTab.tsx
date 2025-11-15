import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Table, Button, Statistic, Row, Col, Modal, Tag, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import * as http from '../../../../lib/httpRequest';
import globalStore from '../../../../components/GlobalComponent/globalStore';

interface Exercise {
    id: string;
    code: string;
    title: string;
    order?: number;
}

interface ExamData {
    exercises: Exercise[];
}

interface StudentProgress {
    userId: string;
    hasJoined: boolean;
    isCompleted: boolean;
}

interface ExerciseDetail {
    id: string;
    code: string;
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    memory: number;
    testCasesCount: number;
}

const OverviewTab = observer(() => {
    const params = useParams();
    const groupId = params.id || params.groupId;
    const examId = params.examId;
    const location = useLocation();
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetail | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    const isStatisticsPage = location.pathname.includes('/statistics');

    useEffect(() => {
        if (examId) {
            setLoading(true);
            const url = `/exams/${examId}`;
            http.get(url)
                .then((res) => {
                    setExamData(res.data || null);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [examId]);

    useEffect(() => {
        if (examId && groupId) {
            const url = `/exams/${examId}/groups/${groupId}/students-progress`;
            http.get(url)
                .then((res) => {
                    setStudentsProgress(res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                });
        }
    }, [examId, groupId]);

    const joinedCount = studentsProgress.filter(s => s.hasJoined).length;
    const notJoinedCount = studentsProgress.length - joinedCount;
    const completedCount = studentsProgress.filter(s => s.isCompleted).length;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY':
                return 'green';
            case 'MEDIUM':
                return 'orange';
            case 'HARD':
                return 'red';
            default:
                return 'default';
        }
    };

    const handleViewExerciseDetail = (exerciseId: string) => {
        setModalOpen(true);
        setLoadingDetail(true);
        const url = `/exercises/${exerciseId}`;
        http.get(url)
            .then((res) => {
                setExerciseDetail(res.data || null);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                globalStore.triggerNotification('error', 'Không thể tải thông tin bài tập', '');
                setModalOpen(false);
            })
            .finally(() => {
                setLoadingDetail(false);
            });
    };

    const exerciseColumns = [
        {
            title: 'STT',
            dataIndex: 'order',
            key: 'order',
            width: 80,
            align: 'center' as const,
            render: (_: unknown, __: unknown, index: number) => index + 1
        },
        {
            title: 'Mã bài tập',
            dataIndex: 'code',
            key: 'code',
            width: 120
        },
        {
            title: 'Tên bài tập',
            dataIndex: 'title',
            key: 'title'
        },
        ...(isStatisticsPage ? [] : [{
            title: 'Hành động',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, record: Exercise) => (
                <Button 
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewExerciseDetail(record.id);
                    }}
                    title="Xem chi tiết"
                />
            )
        }])
    ];

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số bài tập"
                            value={examData?.exercises?.length || 0}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đã tham gia"
                            value={joinedCount}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Chưa tham gia"
                            value={notJoinedCount}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đã hoàn thành"
                            value={completedCount}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Danh sách câu hỏi / bài tập trong bài kiểm tra">
                <Table
                    dataSource={examData?.exercises || []}
                    columns={exerciseColumns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    onRow={() => ({
                        style: { cursor: 'default' }
                    })}
                />
            </Card>

            <Modal
                title="Thông tin bài tập"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setExerciseDetail(null);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setModalOpen(false);
                        setExerciseDetail(null);
                    }}>
                        Đóng
                    </Button>
                ]}
                width={600}
            >
                <Spin spinning={loadingDetail}>
                    {exerciseDetail && (
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', rowGap: '12px' }}>
                            <div style={{ fontWeight: 'bold' }}>Mã bài tập:</div>
                            <div>{exerciseDetail.code}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Tên bài tập:</div>
                            <div>{exerciseDetail.title}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Mô tả:</div>
                            <div>{exerciseDetail.description}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Độ khó:</div>
                            <div>
                                <Tag color={getDifficultyColor(exerciseDetail.difficulty)}>
                                    {exerciseDetail.difficulty}
                                </Tag>
                            </div>
                            
                            <div style={{ fontWeight: 'bold' }}>Thời gian:</div>
                            <div>{exerciseDetail.timeLimit} giây</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Bộ nhớ:</div>
                            <div>{exerciseDetail.memory} MB</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Số test case:</div>
                            <div>{exerciseDetail.testCasesCount}</div>
                        </div>
                    )}
                </Spin>
            </Modal>
        </div>
    );
});

export default OverviewTab;

