import { FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import * as http from '../../lib/httpRequest';
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
    const { groupExamId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [isTimeExpired, setIsTimeExpired] = useState(false);
    const [submissionsMap, setSubmissionsMap] = useState<Map<string, SubmissionData>>(new Map());
    const timeCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoSubmittedRef = useRef<boolean>(false);
    const [examId, setExamId] = useState<string | null>(null);

    const getExamDetail = () => {
        if (!examId) return;
        setLoading(true);
        http.get(`/exams/${examId}`)
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
        if (!groupExamId) {
            setExamId(null);
            return;
        }

        http.get(`/group-exams?groupExamId=${groupExamId}`)
            .then((res) => {
                const payload = res?.data;
                console.log(res);
                console.log('payload', payload);
                const groupExam = Array.isArray(payload) ? payload[0] : payload;
                const derivedExamId = groupExam?.exam?.id || null;

                if (!derivedExamId) {
                    globalStore.triggerNotification('error', 'Không tìm thấy thông tin bài thi!', '');
                    setExamId(null);
                    return;
                }

                setExamId(derivedExamId);
            })
            .catch((error) => {
                console.error('Error fetching group exam detail:', error);
                globalStore.triggerNotification('error', 'Không thể tải thông tin group exam!', '');
                setExamId(null);
            });
    }, [groupExamId]);

    useEffect(() => {
        getExamDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    // Lấy danh sách bài tập đã làm
    useEffect(() => {
        if (!groupExamId || authentication.isInstructor) return;

        const getExamResults = async () => {
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) return;

                const response = await http.get(
                    `/exams/submissions/results?userId=${userId}&groupExamId=${groupExamId}`
                );
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
    }, [groupExamId]);

    useEffect(() => {
        if (examData && examData.exercises.length > 0 && !selectedExercise) {
            setSelectedExercise(examData.exercises[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examData]);

    // Check thời gian làm bài (chỉ check một lần khi mount, sau đó dùng local timer)
    useEffect(() => {
        if (!groupExamId || authentication.isInstructor) return;

        const loadTimeRemaining = async () => {
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) return;

                const response = await http.get(`/exam-rankings?userId=${userId}&groupExamId=${groupExamId}`);
                const data = response.data || [];

                if (data.length === 0) {
                    // Chưa bắt đầu làm bài, không disable
                    setIsTimeExpired(false);
                    return;
                }

                const examRanking = data[0];
                const timeLimit = examRanking.exam?.timeLimit ?? 90; // Mặc định 90 phút nếu null hoặc undefined
                const startTimeDate = new Date(examRanking.createdTimestamp);
                const startTimeMs = startTimeDate.getTime();
                const timeLimitMs = timeLimit * 60 * 1000;
                const endTimeMs = startTimeMs + timeLimitMs;
                const now = Date.now();

                // Nếu hết thời gian thì disable nút
                setIsTimeExpired(now >= endTimeMs);

                // Nếu chưa hết thời gian, set interval để check lại mỗi phút (thay vì mỗi giây)
                // Không gọi API nữa, chỉ check local time
                if (now < endTimeMs) {
                    timeCheckIntervalRef.current = setInterval(() => {
                        const currentTime = Date.now();
                        if (currentTime >= endTimeMs) {
                            setIsTimeExpired(true);
                            if (timeCheckIntervalRef.current) {
                                clearInterval(timeCheckIntervalRef.current);
                                timeCheckIntervalRef.current = null;
                            }
                        }
                    }, 60000); // Check mỗi phút thay vì mỗi giây
                }
            } catch (error) {
                console.error('Error checking exam time:', error);
            }
        };

        loadTimeRemaining();

        return () => {
            if (timeCheckIntervalRef.current) {
                clearInterval(timeCheckIntervalRef.current);
                timeCheckIntervalRef.current = null;
            }
        };
    }, [groupExamId]);

    // Tự động nộp bài khi hết thời gian
    useEffect(() => {
        if (
            !groupExamId ||
            !examId ||
            authentication.isInstructor ||
            !examData ||
            !isTimeExpired ||
            autoSubmittedRef.current
        )
            return;

        const autoSubmitUncompletedExercises = async () => {
            // Đảm bảo chỉ nộp một lần
            autoSubmittedRef.current = true;

            // Hàm retry với số lần tối đa
            const submitWithRetry = async (
                payload: { groupExamId: string; exerciseId: string; sourceCode: string; languageCode: number },
                maxRetries: number = 10,
                delay: number = 2000
            ): Promise<boolean> => {
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        await http.post('/exams/submissions', payload);
                        return true; // Thành công
                    } catch (error: unknown) {
                        const statusCode =
                            typeof error === 'object' && error !== null && 'response' in error
                                ? (error as { response?: { status?: number } }).response?.status ?? undefined
                                : undefined;
                        const isServerError =
                            typeof statusCode === 'number' &&
                            (statusCode === 500 || (statusCode >= 502 && statusCode <= 504));

                        if (isServerError && attempt < maxRetries) {
                            // Nếu là lỗi 500 và chưa hết số lần retry, đợi rồi thử lại
                            console.log(
                                `Retry ${attempt}/${maxRetries} for exercise ${payload.exerciseId} after ${delay}ms`
                            );
                            await new Promise((resolve) => setTimeout(resolve, delay));
                        } else {
                            // Nếu không phải lỗi 500 hoặc đã hết số lần retry
                            console.error(
                                `Error auto-submitting exercise ${payload.exerciseId} (attempt ${attempt}/${maxRetries}):`,
                                error
                            );
                            return false; // Thất bại
                        }
                    }
                }
                return false; // Thất bại sau tất cả các lần retry
            };

            try {
                // Lấy danh sách bài tập chưa làm (chưa có trong submissionsMap)
                const uncompletedExercises = examData.exercises.filter((exercise) => !submissionsMap.has(exercise.id));

                if (uncompletedExercises.length === 0) {
                    return; // Đã làm hết bài
                }

                // Nộp từng bài chưa làm với retry
                const submitPromises = uncompletedExercises.map((exercise) => {
                    const payload = {
                        groupExamId: groupExamId,
                        exerciseId: exercise.id,
                        sourceCode: '// Start coding here',
                        languageCode: 45
                    };

                    return submitWithRetry(payload);
                });

                await Promise.all(submitPromises);

                // Refresh danh sách bài đã làm sau khi nộp
                const userId = authentication.account?.data?.id;
                if (userId) {
                    try {
                        const response = await http.get(
                            `/exams/submissions/results?userId=${userId}&groupExamId=${groupExamId}`
                        );
                        const data: ExamResultData = response.data;
                        if (data && data.submissions) {
                            const map = new Map<string, SubmissionData>();
                            data.submissions.forEach((submission) => {
                                map.set(submission.exerciseId, submission);
                            });
                            setSubmissionsMap(map);
                        }
                    } catch (error) {
                        console.error('Error refreshing submissions:', error);
                    }
                }

                globalStore.triggerNotification('info', 'Đã tự động nộp các bài chưa làm!', '');
            } catch (error) {
                console.error('Error auto-submitting exercises:', error);
            }
        };

        autoSubmitUncompletedExercises();
    }, [isTimeExpired, examData, groupExamId, examId, submissionsMap]);

    const handleExerciseClick = (exercise: Exercise) => {
        setSelectedExercise(exercise);
    };

    const handleStartExercise = () => {
        if (isTimeExpired) {
            globalStore.triggerNotification('warning', 'Đã hết thời gian làm bài, không thể làm bài nữa!', '');
            return;
        }

        // LINK TO EXAM EXERCISE PAGE
        if (selectedExercise && examId && groupExamId) {
            navigate(
                `/${routesConfig.examExercise}`
                    .replace(':examId', examId)
                    .replace(':exerciseId', selectedExercise.id)
                    .replace(':groupExamId', groupExamId)
            );
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

    const [timeIsUp, setTimeIsUp] = useState(false);

    return (
        <div className={classnames('exam-detail', { 'p-24': globalStore.isBelow1300, 'disabled-5': timeIsUp })}>
            <LoadingOverlay loading={loading}>
                {examData && (
                    <div className="exam-detail-wrapper">
                        <div className="sidebar">
                            <div className="sidebar-header">
                                {/* CHỖ NÀY SAI LÒI LE */}
                                {/* <Button
                                    icon={<LeftOutlined />}
                                    onClick={() =>
                                        navigate(`/${routesConfig.groupExams.replace(':id', groupExamId || '')}`)
                                    }
                                    type="text"
                                    style={{ color: '#1890ff' }}
                                >
                                    Bài thi
                                </Button> */}
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
                                            style={
                                                isCompleted
                                                    ? {
                                                          color: '#999',
                                                          opacity: 0.7,
                                                          cursor: 'default'
                                                      }
                                                    : {}
                                            }
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
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: 16
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div className="breadcrumb">
                                                    Bài thi &gt; {examData.title} &gt; {selectedExercise.title}
                                                </div>
                                                <h1 className="exercise-title">{selectedExercise.title}</h1>
                                            </div>
                                        </div>
                                    </div>
                                    <Card className="exercise-info-card event-none-cell" style={{ padding: 16 }}>
                                        <div className="exercise-description flex gap flex-space-beetween align-flex-start">
                                            <div className="flex-1">
                                                <h3>Mô tả</h3>
                                                <p>{selectedExercise.description}</p>
                                            </div>
                                            {!authentication.isInstructor && groupExamId && (
                                                <ExamCountdownTimer examId={groupExamId} setTimeIsUp={setTimeIsUp} />
                                            )}
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
                                                            <Button
                                                                className="good-btn disabled-8 mt-8"
                                                                type="primary"
                                                                size="large"
                                                                onClick={handleStartExercise}
                                                                disabled={isTimeExpired}
                                                            >
                                                                Đã hoàn thành
                                                            </Button>
                                                        );
                                                    }

                                                    return (
                                                        <Button
                                                            className="good-btn mt-8"
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
        </div>
    );
});

export default ExamDetail;
