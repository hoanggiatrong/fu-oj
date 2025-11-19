import { EditOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Form, Tag } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import classnames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import AssignExercisesModal from './components/AssignExercisesModal';
import CoursesActions from './components/CoursesActions';
import CoursesHeader from './components/CoursesHeader';
import CoursesStats, { type CourseStat } from './components/CoursesStats';
import CoursesTableSection from './components/CoursesTableSection';
import CreateCourseModal from './components/CreateCourseModal';
import UpdateCourseModal from './components/UpdateCourseModal';
import './courses.scss';

export interface Course {
    id: string;
    title: string;
    description: string;
    createdBy?: string | null;
    createdTimestamp?: string;
    updatedBy?: string | null;
    updatedTimestamp?: string;
}

export interface CourseExercise {
    id: string;
    title: string;
    code: string;
    difficulty: string;
    topicName?: string;
}

interface ApiCourseExercise {
    id: string;
    title: string;
    code: string;
    difficulty: string;
    topics?: { name?: string }[];
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const getApiErrorMessage = (error: unknown, fallback: string) => {
    const err = error as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message ?? fallback;
};

const parseExerciseIds = (value: string): string[] => {
    return value
        .split(/[\s,;\n]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
};

const Courses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [updateSubmitting, setUpdateSubmitting] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [courseExercises, setCourseExercises] = useState<CourseExercise[]>([]);
    const [courseExercisesLoading, setCourseExercisesLoading] = useState(false);
    const [removingExerciseId, setRemovingExerciseId] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        current: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [createForm] = Form.useForm();
    const [assignForm] = Form.useForm();
    const [updateForm] = Form.useForm();

    const fetchCourses = async (page: number = DEFAULT_PAGE, size: number = DEFAULT_PAGE_SIZE) => {
        setLoading(true);
        try {
            const params = {
                page,
                size
            };
            const response = await http.get('/courses', { params });
            const apiData: Course[] = response?.data ?? [];
            const paginationMeta = response?.metadata?.pagination;

            setCourses(apiData);
            setPagination({
                current: paginationMeta?.currentPage ?? page,
                pageSize: paginationMeta?.pageSize ?? size,
                total: paginationMeta?.total ?? apiData.length,
                hasNextPage: paginationMeta?.hasNextPage ?? false,
                hasPreviousPage: paginationMeta?.hasPreviousPage ?? false
            });
        } catch (error) {
            console.error('Failed to fetch courses', error);
            const message = getApiErrorMessage(error, 'Không thể tải danh sách khóa học.');
            globalStore.triggerNotification('error', message, '');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleTableChange = (pager: TablePaginationConfig) => {
        const nextPage = pager.current ?? DEFAULT_PAGE;
        const nextSize = pager.pageSize ?? DEFAULT_PAGE_SIZE;
        fetchCourses(nextPage, nextSize);
    };

    const handleCreateCourse = async () => {
        try {
            const values = await createForm.validateFields();
            setCreateSubmitting(true);
            await http.post('/courses', {
                title: values.title.trim(),
                description: values.description?.trim() ?? ''
            });
            globalStore.triggerNotification('success', 'Tạo khóa học thành công!', '');
            setCreateModalOpen(false);
            createForm.resetFields();
            fetchCourses(pagination.current, pagination.pageSize);
        } catch (error) {
            const hasValidationError = (error as { errorFields?: unknown })?.errorFields;
            if (hasValidationError) return; // validation error
            const message = getApiErrorMessage(error, 'Không thể tạo khóa học.');
            globalStore.triggerNotification('error', message, '');
        } finally {
            setCreateSubmitting(false);
        }
    };

    const handleAssignExercises = async () => {
        if (!selectedCourse) return;
        try {
            const values = await assignForm.validateFields();
            const exerciseIds = parseExerciseIds(values.exerciseIds || '');
            if (exerciseIds.length === 0) {
                assignForm.setFields([
                    {
                        name: 'exerciseIds',
                        errors: ['Vui lòng nhập ít nhất 1 ID bài tập.']
                    }
                ]);
                return;
            }

            setAssignSubmitting(true);
            await http.post(`/courses/${selectedCourse.id}/exercises`, {
                exerciseIds
            });
            globalStore.triggerNotification('success', 'Đã gán bài tập cho khóa học!', '');
            setAssignModalOpen(false);
            assignForm.resetFields();
        } catch (error) {
            const hasValidationError = (error as { errorFields?: unknown })?.errorFields;
            if (hasValidationError) return;
            const message = getApiErrorMessage(error, 'Không thể gán bài tập.');
            globalStore.triggerNotification('error', message, '');
        } finally {
            setAssignSubmitting(false);
        }
    };

    const handleUpdateCourse = async () => {
        if (!selectedCourse) return;
        try {
            const values = await updateForm.validateFields();
            setUpdateSubmitting(true);
            await http.patch(selectedCourse.id, '/courses', {
                title: values.title.trim(),
                description: values.description?.trim() ?? ''
            });
            globalStore.triggerNotification('success', 'Cập nhật khóa học thành công!', '');
            setUpdateModalOpen(false);
            updateForm.resetFields();
            fetchCourses(pagination.current, pagination.pageSize);
        } catch (error) {
            const hasValidationError = (error as { errorFields?: unknown })?.errorFields;
            if (hasValidationError) return;
            const message = getApiErrorMessage(error, 'Không thể cập nhật khóa học.');
            globalStore.triggerNotification('error', message, '');
        } finally {
            setUpdateSubmitting(false);
        }
    };

    const openCreateModal = () => {
        createForm.resetFields();
        setCreateModalOpen(true);
    };

    const openAssignModal = (course: Course) => {
        setSelectedCourse(course);
        assignForm.resetFields();
        setAssignModalOpen(true);
    };

    const fetchCourseExercises = async (courseId: string) => {
        setCourseExercisesLoading(true);
        try {
            const response = await http.get(`/courses/${courseId}/exercises`);
            const data: ApiCourseExercise[] = response?.data ?? [];
            const mapped: CourseExercise[] = data.map((item) => ({
                id: item.id,
                title: item.title,
                code: item.code,
                difficulty: item.difficulty,
                topicName: item.topics?.[0]?.name
            }));
            setCourseExercises(mapped);
        } catch (error) {
            const message = getApiErrorMessage(error, 'Không thể tải danh sách bài tập của khóa.');
            globalStore.triggerNotification('error', message, '');
            setCourseExercises([]);
        } finally {
            setCourseExercisesLoading(false);
        }
    };

    const openUpdateModal = (course: Course) => {
        setSelectedCourse(course);
        updateForm.setFieldsValue({
            title: course.title,
            description: course.description
        });
        setCourseExercises([]);
        fetchCourseExercises(course.id);
        setUpdateModalOpen(true);
    };

    const formatDateTime = (value?: string) => {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleString('vi-VN');
        } catch {
            return value;
        }
    };

    const handleRemoveExercise = async (exerciseId: string) => {
        if (!selectedCourse) return;
        try {
            setRemovingExerciseId(exerciseId);
            await http.del(`/courses/${selectedCourse.id}/exercises`, {
                data: { exerciseIds: [exerciseId] }
            });
            setCourseExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
            globalStore.triggerNotification('success', 'Đã gỡ bài tập khỏi khóa.', '');
        } catch (error) {
            const message = getApiErrorMessage(error, 'Không thể gỡ bài tập khỏi khóa.');
            globalStore.triggerNotification('error', message, '');
        } finally {
            setRemovingExerciseId(null);
        }
    };

    const stats: CourseStat[] = useMemo(() => {
        return [
            {
                label: 'Tổng khóa học',
                value: pagination.total
            }
        ];
    }, [pagination]);

    const tablePagination: TablePaginationConfig = {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total
    };

    const columns: ColumnsType<Course> = [
        {
            title: 'Tên khóa học',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record) => (
                <div className="course-title-cell">
                    <div className="title">{text}</div>
                    <Tag color="gold">{record.id.slice(0, 8)}</Tag>
                </div>
            )
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string) => <div className="course-description">{text || '-'}</div>
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdTimestamp',
            key: 'createdTimestamp',
            render: (value: string) => formatDateTime(value)
        },
        {
            title: 'Cập nhật cuối',
            dataIndex: 'updatedTimestamp',
            key: 'updatedTimestamp',
            render: (value: string) => formatDateTime(value)
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            render: (_, record) => (
                <div className="course-actions">
                    <Button type="link" icon={<EditOutlined />} onClick={() => openUpdateModal(record)}>
                        Cập nhật
                    </Button>
                    <Button type="link" icon={<LinkOutlined />} onClick={() => openAssignModal(record)}>
                        Gán bài tập
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('courses left', { 'p-24': globalStore.isBelow1300 })}>
                <CoursesHeader
                    title="Quản lý khóa học"
                    description="Theo dõi danh sách khóa học và quản lý bài tập thuộc từng khóa dành cho quản trị viên."
                />

                <CoursesActions
                    onRefresh={() => fetchCourses(pagination.current, pagination.pageSize)}
                    onOpenCreate={openCreateModal}
                />

                <CoursesStats stats={stats} />

                <CoursesTableSection
                    data={courses}
                    columns={columns}
                    pagination={tablePagination}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </div>

            <div className="right">
                <CustomCalendar />
            </div>

            <CreateCourseModal
                open={createModalOpen}
                form={createForm}
                confirmLoading={createSubmitting}
                onOk={handleCreateCourse}
                onCancel={() => setCreateModalOpen(false)}
            />

            <AssignExercisesModal
                open={assignModalOpen}
                form={assignForm}
                confirmLoading={assignSubmitting}
                onOk={handleAssignExercises}
                onCancel={() => setAssignModalOpen(false)}
                courseTitle={selectedCourse?.title}
            />

            <UpdateCourseModal
                open={updateModalOpen}
                form={updateForm}
                confirmLoading={updateSubmitting}
                onOk={handleUpdateCourse}
                onCancel={() => setUpdateModalOpen(false)}
                courseTitle={selectedCourse?.title}
                exercises={courseExercises}
                exercisesLoading={courseExercisesLoading}
                removingExerciseId={removingExerciseId}
                onRemoveExercise={handleRemoveExercise}
            />
        </div>
    );
};

export default Courses;

