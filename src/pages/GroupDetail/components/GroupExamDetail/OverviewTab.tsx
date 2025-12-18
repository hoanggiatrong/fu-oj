import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Table, Button, Statistic, Row, Col, Modal, Tag, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import * as http from '../../../../lib/httpRequest';
import globalStore from '../../../../components/GlobalComponent/globalStore';
import TooltipWrapper from '../../../../components/TooltipWrapper/TooltipWrapperComponent';
import { difficulties, type Difficulty } from '../../../../constants/difficulty';

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
    loading;
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

    const joinedCount = studentsProgress.filter((s) => s.hasJoined).length;
    const notJoinedCount = studentsProgress.length - joinedCount;
    const completedCount = studentsProgress.filter((s) => s.isCompleted).length;

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
            title: 'Mã bài tập',
            width: 300,
            dataIndex: 'code',
            key: 'code',
            render: (code: string) => {
                return <div className="cell">{code}</div>;
            }
        },
        {
            title: 'Tên bài tập',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => {
                return <div className="cell">{title}</div>;
            }
        },
        ...(isStatisticsPage
            ? []
            : [
                  {
                      title: '',
                      key: 'action',
                      width: 50,
                      align: 'center' as const,
                      render: (_: unknown, record: Exercise) => (
                          <div
                              className="actions-row cell"
                              onClick={(e) => {
                                  handleViewExerciseDetail(record.id);
                                  e.stopPropagation();
                              }}
                          >
                              <TooltipWrapper tooltipText="Xem chi tiết" position="left">
                                  <EyeOutlined className="action-row-btn" />
                              </TooltipWrapper>
                          </div>
                      )
                  }
              ])
    ];

    return (
        <div>
            <Row gutter={24}>
                <Col className="mb-16" xs={24} sm={24} lg={6} md={6}>
                    <Card className="event-none-cell">
                        <Statistic
                            title="Tổng số bài tập"
                            value={examData?.exercises?.length || 0}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col className="mb-16" xs={24} sm={24} lg={6} md={6}>
                    <Card className="event-none-cell">
                        <Statistic
                            title="Đã tham gia"
                            value={joinedCount}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col className="mb-16" xs={24} sm={24} lg={6} md={6}>
                    <Card className="event-none-cell">
                        <Statistic
                            title="Chưa tham gia"
                            value={notJoinedCount}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col className="mb-16" xs={24} sm={24} lg={6} md={6}>
                    <Card className="event-none-cell">
                        <Statistic
                            title="Đã hoàn thành"
                            value={completedCount}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="max-width leetcode">
                <Table
                    className="max-width"
                    dataSource={examData?.exercises || []}
                    columns={exerciseColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 800 }}
                    rowClassName={(_record, index) => (index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd')}
                    onRow={() => ({
                        style: { cursor: 'default' }
                    })}
                />
            </div>

            <Modal
                title="Thông tin bài tập"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setExerciseDetail(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setModalOpen(false);
                            setExerciseDetail(null);
                        }}
                    >
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
                                    {difficulties[exerciseDetail.difficulty as Difficulty].text}
                                </Tag>
                            </div>

                            <div style={{ fontWeight: 'bold' }}>Giới hạn thời gian:</div>
                            <div>{exerciseDetail.timeLimit} giây</div>

                            <div style={{ fontWeight: 'bold' }}>Giới hạn bộ nhớ:</div>
                            <div>{exerciseDetail.memory} bytes</div>

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
