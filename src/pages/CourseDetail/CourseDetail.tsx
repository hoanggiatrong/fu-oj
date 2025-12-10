import { BookOutlined, CheckOutlined, FileTextOutlined, FireOutlined, ShareAltOutlined } from '@ant-design/icons';
import type { ProgressProps } from 'antd';
import { Button, Card, Empty, Progress, Typography } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import utils from '../../utils/utils';
import './course-detail.scss';

const conicColors: ProgressProps['strokeColor'] = {
    '0%': '#87d068',
    '50%': '#ffe58f',
    '100%': '#ffccc7'
};

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
    image?: {
        fileName?: string;
        url?: string;
    } | null;
}

interface CourseExercise {
    id: string;
    code: string;
    title: string;
    description?: string;
    difficulty: string;
    topics?: { name: string; id: string }[];
}

const CourseDetail = observer(() => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [courseLoading, setCourseLoading] = useState(false);
    const [exercises, setExercises] = useState<CourseExercise[]>([]);
    const [exerciseLoading, setExerciseLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    enrolling;

    const handleShareCourse = () => {
        try {
            const url = window.location.href;
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url);
                globalStore.triggerNotification('success', 'Đã sao chép liên kết khóa học!', '');
            } else {
                void Promise.reject();
            }
        } catch {
            globalStore.triggerNotification('error', 'Không thể sao chép liên kết. Vui lòng thử lại.', '');
        }
    };

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

    const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

    const fetchCourseExercises = async (id: string) => {
        setExerciseLoading(true);
        try {
            const response = await http.get(`/courses/${id}/exercises`);
            const data: CourseExercise[] = response?.data ?? [];
            setExercises(data);

            // Kiểm tra bài đã AC
            const results = await Promise.all(
                data.map(async (exercise) => {
                    try {
                        const submissionsResponse = await http.get(
                            `/submissions?exercise=${exercise.id}&pageSize=99999`
                        );
                        const submissions = (submissionsResponse?.data ?? []) as { isAccepted?: boolean }[];
                        const hasAccepted = Array.isArray(submissions)
                            ? submissions.some((s) => s.isAccepted === true)
                            : false;
                        return { id: exercise.id, completed: hasAccepted };
                    } catch {
                        return { id: exercise.id, completed: false };
                    }
                })
            );

            const completedIds = results.filter((r) => r.completed).map((r) => r.id);
            setCompletedExerciseIds(new Set(completedIds));
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
        <div className={classnames('course-detail-page', { 'p-24': globalStore.isBelow1300 })}>
            <LoadingOverlay loading={exerciseLoading || courseLoading}>
                <div className="course-detail-content">
                    <div className="course-main">
                        <div
                            className="course-header good-bg"
                            // style={
                            //     course?.image?.url
                            //         ? {
                            //               backgroundImage: `url(${course.image.url})`
                            //           }
                            //         : undefined
                            // }
                        >
                            {/* <Button className="header-icon-button header-icon-button--back" onClick={() => navigate(-1)}>
                            <LeftOutlined />
                        </Button>
                        <Button className="header-icon-button header-icon-button--share" onClick={handleShareCourse}>
                            <ShareAltOutlined />
                        </Button> */}
                            <div className="left">
                                <div className="course-info">
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
                                <div className="description">
                                    <b>Bạn sẽ học được gì?</b>
                                    <div className="desc-text">
                                        <CheckOutlined className="ico" />
                                        <div className="text max-2-lines">
                                            {course?.description || 'Khóa học tự do'}
                                        </div>
                                    </div>
                                </div>
                                <div className="actions">
                                    {!course?.progress && (
                                        <div className="ico-btn btn-join" onClick={handleEnroll}>
                                            <FireOutlined className="ico" />
                                            Tham gia khóa học
                                        </div>
                                    )}
                                    <div className="ico-btn" onClick={handleShareCourse}>
                                        <ShareAltOutlined className="ico" />
                                        Sao chép liên kết
                                    </div>
                                </div>
                            </div>
                            <div className={classnames('right', { hide: globalStore.isBelow1000 })}>
                                <div className="progress">
                                    <Progress
                                        type="dashboard"
                                        percent={
                                            !course?.progress
                                                ? 0
                                                : (course?.progress?.solvedCount / course?.progress?.totalCount) * 100
                                        }
                                        strokeColor={conicColors}
                                    />
                                    <img
                                        className="course-img"
                                        src={!!course?.progress ? '/sources/student-1.png' : '/sources/dev.png'}
                                        alt=""
                                    />
                                </div>
                                {!course?.progress ? (
                                    <>
                                        <div className="progress-note">Chưa tham gia</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="progress-note">
                                            Đã hoàn thành:&nbsp;{' '}
                                            <b className="color-cyan">{course?.progress?.solvedCount}</b> /{' '}
                                            {course?.progress?.totalCount}{' '}
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* <div className="header-left">
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
                            <div className="progress">
                                <Progress type="dashboard" percent={100} strokeColor={conicColors} />
                                <img className="course-img" src="/sources/student-1.png" alt="" />
                            </div>
                        </div> */}
                            {/* <div className="header-right">
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
                        </div> */}
                        </div>

                        <div className="course-layout">
                            <div className="course-problems max-width">
                                {/* <LoadingOverlay loading={exerciseLoading || courseLoading}> */}
                                {exercises.length === 0 ? (
                                    <Empty
                                        className="flex flex-center"
                                        description="Khóa học chưa có bài tập nào."
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        style={{ minHeight: 200 }}
                                    />
                                ) : (
                                    Object.entries(groupedExercises).map(([topicName, topicExercises]) => (
                                        <div key={topicName} className="problem-section">
                                            <Typography.Title level={4} className="section-title">
                                                {topicName}
                                            </Typography.Title>
                                            <div className="problem-list">
                                                {topicExercises.map((exercise) => {
                                                    const isCompleted = completedExerciseIds.has(exercise.id);
                                                    const goToExercise = () =>
                                                        navigate(
                                                            `/${routesConfig.exercise.replace(':id?', exercise.id)}`
                                                        );

                                                    return (
                                                        <div
                                                            key={exercise.id}
                                                            className={`problem-item${
                                                                isCompleted ? ' problem-item--completed' : ''
                                                            }`}
                                                            onClick={() => {
                                                                if (!isCompleted) {
                                                                    goToExercise();
                                                                }
                                                            }}
                                                        >
                                                            <div className="problem-content">
                                                                <div className="problem-title">{exercise.title}</div>
                                                                {exercise.description && (
                                                                    <div className="problem-description">
                                                                        {exercise.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="problem-actions">
                                                                <Button
                                                                    type="link"
                                                                    icon={<FileTextOutlined />}
                                                                    disabled={isCompleted}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isCompleted) {
                                                                            goToExercise();
                                                                        }
                                                                    }}
                                                                >
                                                                    Làm bài
                                                                </Button>
                                                                <div className="problem-difficulty">
                                                                    {utils.getDifficultyClass(exercise.difficulty)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* </LoadingOverlay> */}
                            </div>

                            <div className="course-sidebar">
                                {/* <Card className="sidebar-card" title="Tóm tắt">
                                {course?.description ? (
                                    <p>{course?.description}</p>
                                ) : (
                                    <Empty description="Không có tóm tắt" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </Card> */}

                                <Card
                                    className={classnames('sidebar-card', {
                                        achieved:
                                            course?.progress?.totalCount &&
                                            course?.progress?.solvedCount &&
                                            course?.progress?.totalCount == course?.progress?.solvedCount
                                    })}
                                    title="Phần thưởng"
                                >
                                    <>
                                        {course?.progress?.totalCount &&
                                        course?.progress?.solvedCount &&
                                        course?.progress?.totalCount == course?.progress?.solvedCount ? (
                                            <div className="achieved-mark">
                                                <img src="/sources/achieved.png" alt="" />
                                                <div className="text">Đã hoàn thành</div>
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                        <div
                                            className={classnames('award-content', {
                                                'achieved-content':
                                                    course?.progress?.totalCount &&
                                                    course?.progress?.solvedCount &&
                                                    course?.progress?.totalCount == course?.progress?.solvedCount
                                            })}
                                        >
                                            <div className="award-badge">
                                                <BookOutlined />
                                            </div>
                                            <div className="award-text">
                                                <div className="award-title">{course?.title || 'Khóa học'}</div>
                                                <div className="award-desc">
                                                    Khi bạn hoàn thành, bạn sẽ có được một <strong>chứng chỉ</strong>.
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingOverlay>
        </div>
    );
});

export default CourseDetail;
