import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as http from '../../lib/httpRequest';
import { Card, Descriptions, Tag, Button } from 'antd';
import { LeftOutlined, FileTextOutlined } from '@ant-design/icons';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import dayjs from 'dayjs';
import routesConfig from '../../routes/routesConfig';

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

const ExamDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

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

    useEffect(() => {
        if (examData && examData.exercises.length > 0 && !selectedExercise) {
            setSelectedExercise(examData.exercises[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examData]);

    const handleExerciseClick = (exercise: Exercise) => {
        setSelectedExercise(exercise);
    };

    const handleStartExercise = () => {
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
                                {examData.exercises.map((exercise, index) => (
                                    <div
                                        key={exercise.id}
                                        className={classnames('exercise-item', {
                                            active: selectedExercise?.id === exercise.id
                                        })}
                                        onClick={() => handleExerciseClick(exercise)}
                                    >
                                        <FileTextOutlined style={{ marginRight: 8 }} />
                                        <span>
                                            {exercise.code} - {exercise.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="main-content">
                            {selectedExercise ? (
                                <>
                                    <div className="content-header">
                                        <div className="breadcrumb">
                                            Bài thi &gt; {examData.title} &gt; {selectedExercise.title}
                                        </div>
                                        <h1 className="exercise-title">{selectedExercise.title}</h1>
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
                                        <div className="exercise-action">
                                            <Button type="primary" size="large" onClick={handleStartExercise}>
                                                Làm bài
                                            </Button>
                                        </div>
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

