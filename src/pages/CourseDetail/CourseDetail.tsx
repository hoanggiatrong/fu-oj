import {
    ArrowLeftOutlined,
    BookOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { Button, Card, Empty, Progress, Radio, Switch, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import routesConfig from '../../routes/routesConfig';
import utils from '../../utils/utils';
import * as http from '../../lib/httpRequest';
import './course-detail.scss';

interface CourseProgress {
    solvedCount: number;
    totalCount: number;
    percentage: number;
    isCompleted: boolean;
}

interface CourseDetailData {
    id: string;
    title: string;
    description?: string;
    createdTimestamp?: string;
    updatedTimestamp?: string;
    createdBy?: string;
    progress?: CourseProgress | null;
}

interface CourseExercise {
    id: string;
    code: string;
    title: string;
    description?: string;
    difficulty: string;
    topics?: { name: string; id: string }[];
}

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [courseLoading, setCourseLoading] = useState(false);
    const [exercises, setExercises] = useState<CourseExercise[]>([]);
    const [exerciseLoading, setExerciseLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [showTags, setShowTags] = useState(false);

    const fetchCourseDetail = async (id: string) => {
        setCourseLoading(true);
        try {
            const response = await http.get(`/courses/${id}`);
            setCourse(response?.data ?? null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const message = err?.response?.data?.message ?? 'Không thể tải thông tin khóa học.';
            globalStore.triggerNotification('error', message, '');
        } finally {
            setCourseLoading(false);
        }
    };

    const fetchCourseExercises = async (id: string) => {
        setExerciseLoading(true);
        try {
            const response = await http.get(`/courses/${id}/exercises`);
            setExercises(response?.data ?? []);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const message = err?.response?.data?.message ?? 'Không thể tải danh sách bài tập của khóa.';
            globalStore.triggerNotification('error', message, '');
        } finally {
            setExerciseLoading(false);
        }
    };

    useEffect(() => {
        if (!courseId) return;
        fetchCourseDetail(courseId);
        fetchCourseExercises(courseId);
    }, [courseId]);

    const groupedExercises = useMemo(() => {
        const groups: Record<string, CourseExercise[]> = {};
        exercises.forEach((exercise) => {
            const topicName = exercise.topics?.[0]?.name || 'Khác';
            if (!groups[topicName]) {
                groups[topicName] = [];
            }
            groups[topicName].push(exercise);
        });
        return groups;
    }, [exercises]);

    const handleEnroll = async () => {
        if (!courseId) return;
        setEnrolling(true);
        try {
            const response = await http.post(`/courses/${courseId}/enroll`, {});
            if (response?.data) {
                setCourse(response.data);
            }
            globalStore.triggerNotification('success', 'Đã ghi danh vào khóa học!', '');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const message = err?.response?.data?.message ?? 'Không thể ghi danh vào khóa học.';
            globalStore.triggerNotification('error', message, '');
        } finally {
            setEnrolling(false);
        }
    };

    return (
        <div className="course-detail-page">
            <div className="course-detail-content">
                <div className="course-main">
                    <Button
                        className="back-button"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        type="text"
                    >
                        Trở lại
                    </Button>

                    <div className="course-header">
                        <div className="header-left">
                            <div className="course-logo">
                                <BookOutlined />
                                <span className="course-count">{exercises.length}</span>
                            </div>
                            <div className="header-info">
                                <div className="course-subtitle">Học với {exercises.length} bài tập</div>
                                <Typography.Title level={1} className="course-title">
                                    {course?.title || 'Khóa học'}
                                </Typography.Title>
                            </div>
                        </div>
                        <div className="header-right">
                            {course?.progress ? (
                                <div className="header-progress">
                                    <div className="header-progress-text">
                                        <span className="progress-solved">{course.progress.solvedCount}</span>
                                        <span className="progress-separator">/</span>
                                        <span className="progress-total">{course.progress.totalCount}</span>
                                    </div>
                                    <Progress
                                        percent={Math.round(course.progress.percentage)}
                                        status={course.progress.isCompleted ? 'success' : 'active'}
                                        strokeColor={course.progress.isCompleted ? '#52c41a' : undefined}
                                        size="small"
                                        style={{ width: 120 }}
                                    />
                                    {course.progress.isCompleted && (
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                                    )}
                                </div>
                            ) : (
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleEnroll}
                                    loading={enrolling}
                                    disabled={exercises.length === 0}
                                >
                                    Tham gia
                                </Button>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    if (courseId) {
                                        fetchCourseDetail(courseId);
                                        fetchCourseExercises(courseId);
                                    }
                                }}
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="course-controls">
                        <Switch
                            checked={showTags}
                            onChange={setShowTags}
                            checkedChildren="Hiển thị tags"
                            unCheckedChildren="Hiển thị tags"
                        />
                    </div>

                    <div className="course-layout">
                        <div className="course-problems">
                            <LoadingOverlay loading={exerciseLoading || courseLoading}>
                                {exercises.length === 0 ? (
                                    <Empty
                                        description="Khóa học chưa có bài tập nào."
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                ) : (
                                    Object.entries(groupedExercises).map(([topicName, topicExercises]) => (
                                        <div key={topicName} className="problem-section">
                                            <Typography.Title level={4} className="section-title">
                                                {topicName}
                                            </Typography.Title>
                                            <div className="problem-list">
                                                {topicExercises.map((exercise) => (
                                                    <div key={exercise.id} className="problem-item">
                                                        <Radio value={exercise.id} />
                                                        <div className="problem-content">
                                                            <div className="problem-title">{exercise.title}</div>
                                                            {showTags &&
                                                                exercise.topics &&
                                                                exercise.topics.length > 0 && (
                                                                    <div className="problem-tags">
                                                                        {exercise.topics.map((topic) => (
                                                                            <Tag key={topic.id}>
                                                                                {topic.name}
                                                                            </Tag>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                        </div>
                                                        <div className="problem-actions">
                                                            <Button
                                                                type="link"
                                                                icon={<FileTextOutlined />}
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/${routesConfig.exercise.replace(
                                                                            ':id?',
                                                                            exercise.id
                                                                        )}`
                                                                    )
                                                                }
                                                            >
                                                                Làm bài
                                                            </Button>
                                                            <div className="problem-difficulty">
                                                                {utils.getDifficultyClass(exercise.difficulty)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </LoadingOverlay>
                        </div>

                        <div className="course-sidebar">

                            <Card className="sidebar-card" title="Tóm tắt">
                                {course?.description ? <p>{course?.description}</p> : <Empty description="Không có tóm tắt" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            </Card>

                            <Card className="sidebar-card" title="Phần thưởng">
                                <div className="award-content">
                                    <div className="award-badge">
                                        <BookOutlined />
                                    </div>
                                    <div className="award-text">
                                        <div className="award-title">{course?.title || 'Khóa học'}</div>
                                        <div className="award-desc">Hoàn thành lộ trình học để nhận huy hiệu!</div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="sidebar-card" title="Liên quan">
                                <div className="related-list">
                                    <div className="related-item">
                                        <div className="related-icon">📚</div>
                                        <div className="related-info">
                                            <div className="related-title">LeetCode 75</div>
                                            <div className="related-subtitle">Vượt qua phỏng vấn với 75 câu hỏi</div>
                                        </div>
                                    </div>
                                    <div className="related-item">
                                        <div className="related-icon">⭐</div>
                                        <div className="related-info">
                                            <div className="related-title">Top 100 Liked</div>
                                            <div className="related-subtitle">100 bài tập được đánh giá cao nhất</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <CustomCalendar />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
