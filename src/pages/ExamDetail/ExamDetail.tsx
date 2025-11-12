import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as http from '../../lib/httpRequest';
import { Card, Tag, Button } from 'antd';
import { LeftOutlined, FileTextOutlined } from '@ant-design/icons';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import ExamCountdownTimer from './components/ExamCountdownTimer';

interface Group {
    id: string;
    code: string;
    name: string;
    description: string;
    isPublic: boolean;
}

interface Topic {
    id: string;
    name: string;
    description: string;
}

interface TestCase {
    id: string;
    input: string;
    output: string;
    note: string | null;
    isPublic: boolean;
}

interface Exercise {
    id: string;
    code: string;
    title: string;
    description: string;
    timeLimit: number;
    memory: number;
    visibility: string;
    difficulty: string;
    maxSubmissions: number;
    topics: Topic[];
    testCases: TestCase[];
    testCasesCount: number;
}

interface ExamData {
    id: string;
    code: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    groups: Group[];
    exercises: Exercise[];
}

interface SubmissionData {
    exerciseId: string;
    exerciseTitle: string;
    exerciseCode: string;
    submissionId: string;
    score: number | null;
    isAccepted: boolean;
    passedTestCases: number;
    totalTestCases: number;
    submittedAt: number;
}

interface ExamResultData {
    examId: string;
    examCode: string;
    examTitle: string;
    startTime: number;
    endTime: number;
    userId: string;
    userName: string;
    submissions: SubmissionData[];
    totalScore: number;
    totalExercises: number;
    completedExercises: number;
    timeLimit: number | null;
}

const ExamDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [isTimeExpired, setIsTimeExpired] = useState(false);
    const [submissionsMap, setSubmissionsMap] = useState<Map<string, SubmissionData>>(new Map());

    const getExamDetail = () => {
        if (!id) return;
        setLoading(true);
        http.get(`/exams/${id}`)
            .then((res) => {
                setExamData(res.data);
            })
            .catch((error) => {
                console.error('Error fetching exam detail:', error);
                globalStore.triggerNotification('error', 'Không thể tải thông tin exam!', '');
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    useEffect(() => {
        getExamDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Lấy danh sách bài tập đã làm
    useEffect(() => {
        if (!id || authentication.isInstructor) return;

        const getExamResults = async () => {
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) return;

                const response = await http.get(`/exams/submissions/results?userId=${userId}&examId=${id}`);
                const data: ExamResultData = response.data;

                if (data && data.submissions) {
                    // Tạo map để dễ dàng lookup
                    const map = new Map<string, SubmissionData>();
                    data.submissions.forEach((submission) => {
                        map.set(submission.exerciseId, submission);
                    });
                    setSubmissionsMap(map);
                }
            } catch (error) {
                console.error('Error fetching exam results:', error);
            }
        };

        getExamResults();
    }, [id]);

    useEffect(() => {
        if (examData && examData.exercises.length > 0 && !selectedExercise) {
            setSelectedExercise(examData.exercises[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examData]);

    // Check thời gian làm bài
    useEffect(() => {
        if (!id || authentication.isInstructor) return;

        const checkTimeRemaining = async () => {
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) return;

                const response = await http.get(`/exam-rankings?userId=${userId}&examId=${id}`);
                const data = response.data || [];

                if (data.length === 0) {
                    // Chưa bắt đầu làm bài, không disable
                    setIsTimeExpired(false);
                    return;
                }

                const examRanking = data[0];
                const timeLimit = examRanking.exam?.timeLimit || 90; // Mặc định 90 phút
                const startTimeDate = new Date(examRanking.createdTimestamp);
                const startTimeMs = startTimeDate.getTime();
                const timeLimitMs = timeLimit * 60 * 1000;
                const endTimeMs = startTimeMs + timeLimitMs;
                const now = Date.now();

                // Nếu hết thời gian thì disable nút
                setIsTimeExpired(now >= endTimeMs);
            } catch (error) {
                console.error('Error checking exam time:', error);
            }
        };

        checkTimeRemaining();

        // Check lại mỗi giây
        const interval = setInterval(checkTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [id]);

    const handleExerciseClick = (exercise: Exercise) => {
        setSelectedExercise(exercise);
    };

    const handleStartExercise = () => {
        if (isTimeExpired) {
            globalStore.triggerNotification('warning', 'Đã hết thời gian làm bài, không thể làm bài nữa!', '');
            return;
        }
        if (selectedExercise && id) {
            navigate(`/${routesConfig.examExercise}`.replace(':examId', id).replace(':exerciseId', selectedExercise.id));
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        const colorMap: { [key: string]: string } = {
            EASY: 'green',
            MEDIUM: 'orange',
            HARD: 'red'
        };
        return colorMap[difficulty] || 'default';
    };

    return (
        <div className={classnames('exam-detail', { 'p-24': globalStore.isBelow1300 })}>
            <LoadingOverlay loading={loading}>
                {examData && (
                    <div className="exam-detail-wrapper">
                        <div className="sidebar">
                            <div className="sidebar-header">
                                <Button
                                    icon={<LeftOutlined />}
                                    onClick={() => navigate(`/${routesConfig.exams}`)}
                                    type="text"
                                    style={{ color: '#1890ff' }}
                                >
                                    Bài thi
                                </Button>
                            </div>
                            <div className="sidebar-title">
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                Danh sách bài tập
                            </div>
                            <div className="exercise-list">
                                {examData.exercises.map((exercise) => {
                                    const submission = submissionsMap.get(exercise.id);
                                    const isCompleted = !!submission;
                                    
                                    return (
                                        <div
                                            key={exercise.id}
                                            className={classnames('exercise-item', {
                                                active: selectedExercise?.id === exercise.id,
                                                completed: isCompleted
                                            })}
                                            onClick={() => handleExerciseClick(exercise)}
                                            style={isCompleted ? { 
                                                color: '#999', 
                                                opacity: 0.7,
                                                cursor: 'default'
                                            } : {}}
                                        >
                                            <FileTextOutlined style={{ marginRight: 8 }} />
                                            <span>
                                                {exercise.code} - {exercise.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="main-content">
                            {selectedExercise ? (
                                <>
                                    <div className="content-header">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{ flex: 1 }}>
                                                <div className="breadcrumb">
                                                    Bài thi &gt; {examData.title} &gt; {selectedExercise.title}
                                                </div>
                                                <h1 className="exercise-title">{selectedExercise.title}</h1>
                                            </div>
                                            {!authentication.isInstructor && id && (
                                                <div style={{ marginLeft: 16, minWidth: '200px' }}>
                                                    <ExamCountdownTimer examId={id} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Card className="exercise-info-card">
                                        <div className="exercise-description">
                                            <h3>Mô tả</h3>
                                            <p>{selectedExercise.description}</p>
                                        </div>
                                        <div className="exercise-details">
                                            <div className="detail-item">
                                                <strong>Mã bài tập:</strong> {selectedExercise.code}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Độ khó:</strong>{' '}
                                                <Tag color={getDifficultyColor(selectedExercise.difficulty)}>
                                                    {selectedExercise.difficulty}
                                                </Tag>
                                            </div>
                                            <div className="detail-item">
                                                <strong>Thời gian:</strong> {selectedExercise.timeLimit} giây
                                            </div>
                                            <div className="detail-item">
                                                <strong>Bộ nhớ:</strong> {selectedExercise.memory} MB
                                            </div>
                                            <div className="detail-item">
                                                <strong>Số test case:</strong> {selectedExercise.testCasesCount}
                                            </div>
                                            {selectedExercise.topics.length > 0 && (
                                                <div className="detail-item">
                                                    <strong>Topics:</strong>
                                                    <div style={{ marginTop: 8 }}>
                                                        {selectedExercise.topics.map((topic) => (
                                                            <Tag key={topic.id} style={{ marginRight: 4 }}>
                                                                {topic.name}
                                                            </Tag>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {!authentication.isInstructor && (
                                            <div className="exercise-action">
                                                {(() => {
                                                    const submission = submissionsMap.get(selectedExercise.id);
                                                    const isCompleted = !!submission;
                                                    
                                                    if (isCompleted) {
                                                        return (
                                                            <Tag color="blue">
                                                                Đã làm
                                                            </Tag>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <Button 
                                                            type="primary" 
                                                            size="large" 
                                                            onClick={handleStartExercise}
                                                            disabled={isTimeExpired}
                                                        >
                                                            {isTimeExpired ? 'Đã hết thời gian' : 'Làm bài'}
                                                        </Button>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </Card>
                                </>
                            ) : (
                                <div className="no-selection">Chọn một bài tập để xem chi tiết</div>
                            )}
                        </div>
                    </div>
                )}
            </LoadingOverlay>
            <ProtectedElement acceptRoles={['STUDENT']}>
                <AIAssistant />
            </ProtectedElement>
        </div>
    );
});

export default ExamDetail;

