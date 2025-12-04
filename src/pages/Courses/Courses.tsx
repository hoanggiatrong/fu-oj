import { AppstoreAddOutlined, DeleteOutlined, EditOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { Form, Input, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import globalStore from '../../components/GlobalComponent/globalStore';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import utils from '../../utils/utils';
import AssignExercisesModal from './components/AssignExercisesModal';
import CoursesHeader from './components/CoursesHeader';
import CoursesTableSection from './components/CoursesTableSection';
import CreateCourseModal from './components/CreateCourseModal';
import UpdateCourseModal from './components/UpdateCourseModal';
import './courses.scss';

export interface Course {
    id: string;
    title: string;
    description: string;
    image?: {
        url?: string;
        fileName?: string;
    } | null;
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

const Courses = observer(() => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [displayCourses, setDisplayCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [updateSubmitting, setUpdateSubmitting] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [courseExercises, setCourseExercises] = useState<CourseExercise[]>([]);
    const [allExercises, setAllExercises] = useState<any[]>([]);
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
            const apiData: Course[] = response?.data?.filter((d: any) => !d.deletedTimestamp) ?? [];
            const paginationMeta = response?.metadata?.pagination;

            setCourses(apiData);
            setDisplayCourses(apiData);
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

        // Lấy danh sách exercises (dùng cho tạo khóa học)
        http.get('/exercises?pageSize=9999999')
            .then((res) => {
                let exercises = res.data || [];

                exercises = exercises.filter((e: any) => !(e.visibility === 'DRAFT'));

                setAllExercises(
                    exercises.map((exercise: any) => ({
                        value: exercise.id,
                        label: exercise.title || exercise.code || '',
                        ...exercise
                    }))
                );
            })
            .catch((error) => {
                console.error('Error fetching exercises for courses:', error);
            });
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
            const formData = new FormData();

            const payload: any = {
                title: values.title.trim(),
                description: values.description?.trim() ?? '',
                exerciseIds: values.exerciseIds || []
            };

            formData.append('course', JSON.stringify(payload));

            const fileList = (values.file as any[]) || [];
            const file = fileList[0]?.originFileObj;
            if (file) {
                formData.append('file', file);
            }

            await http.post('/courses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
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

    // const openAssignModal = (course: Course) => {
    //     setSelectedCourse(course);
    //     assignForm.resetFields();
    //     setAssignModalOpen(true);
    // };

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

    // const formatDateTime = (value?: string) => {
    //     if (!value) return '-';
    //     try {
    //         return new Date(value).toLocaleString('vi-VN');
    //     } catch {
    //         return value;
    //     }
    // };

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

    const deleteCourse = (record: any) => {
        http.deleteById('/courses', record.id)
            .then()
            .then((res) => {
                fetchCourses();
                globalStore.triggerNotification('success', res.message || 'Delete successfully!', '');
            });
    };

    // const stats: CourseStat[] = useMemo(() => {
    //     return [
    //         {
    //             label: 'Tổng khóa học',
    //             value: pagination.total
    //         }
    //     ];
    // }, [pagination]);

    // const tablePagination: TablePaginationConfig = {
    //     current: pagination.current,
    //     pageSize: pagination.pageSize,
    //     total: pagination.total
    // };

    const columns: ColumnsType<Course> = [
        {
            title: 'Tên khóa học',
            width: 200,
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => (
                <div className="cell">
                    <TooltipWrapper tooltipText={text} position="right">
                        <Highlighter
                            className="highlight-container"
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={text}
                        />
                    </TooltipWrapper>
                </div>
            )
        },
        {
            title: 'Mô tả',
            width: 250,
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => (
                <div className="cell">
                    <TooltipWrapper tooltipText={text} position="right">
                        <Highlighter
                            className="highlight-container"
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={text}
                        />
                    </TooltipWrapper>
                </div>
            )
        },
        {
            title: 'Ngày tạo',
            width: 150,
            dataIndex: 'createdTimestamp',
            key: 'createdTimestamp',
            render: (value: string) => <div className="cell">{utils.formatDate(value, 'DD/MM/YYYY HH:mm')}</div>
        },
        {
            title: 'Cập nhật cuối',
            width: 150,
            dataIndex: 'updatedTimestamp',
            key: 'updatedTimestamp',
            render: (value: string) => <div className="cell">{utils.formatDate(value, 'DD/MM/YYYY HH:mm')}</div>
        },
        {
            title: <div className="text-align-right">Hành động</div>,
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <div className="actions-row cell" onClick={(e) => e.stopPropagation()} data-tourid="table-actions">
                    {/* <TooltipWrapper tooltipText="Thêm vào yêu thích" position="left">
                            <HeartOutlined className="action-row-btn" />
                        </TooltipWrapper> */}

                    <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
                        <EditOutlined
                            className="action-row-btn"
                            onClick={() => {
                                openUpdateModal(record);
                            }}
                        />
                    </TooltipWrapper>
                    <TooltipWrapper tooltipText="Thêm bài tập cho khóa" position="left">
                        <LinkOutlined
                            className="action-row-btn"
                            onClick={() => {
                                openUpdateModal(record);
                            }}
                        />
                    </TooltipWrapper>
                    <TooltipWrapper tooltipText="Xóa" position="left">
                        <Popconfirm
                            // title="Are you sure you want to delete this exercise?"
                            title="Bạn có chắc chắn muốn xóa lộ trình học tập này?"
                            okText="Có"
                            cancelText="Không"
                            onConfirm={() => {
                                deleteCourse(record);
                            }}
                        >
                            <DeleteOutlined className="action-row-btn" />
                        </Popconfirm>
                    </TooltipWrapper>
                </div>
            )
        }
    ];

    useEffect(() => {
        const searchLowerCase = search.toLowerCase();

        const filtered = courses.filter(
            (d: any) =>
                d.title.toLowerCase().includes(searchLowerCase) || d.description.toLowerCase().includes(searchLowerCase)
        );
        setDisplayCourses(filtered);
    }, [search]);

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('exercises courses left', { 'p-24': globalStore.isBelow1300 })}>
                <CoursesHeader
                    title="Quản lý khóa học"
                    description="Theo dõi danh sách khóa học và quản lý bài tập thuộc từng khóa dành cho quản trị viên."
                />

                {/* <CoursesStats stats={stats} /> */}

                <div
                    className={classnames('wrapper flex', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filters">
                        <Input
                            placeholder="Tìm kiếm bài tập"
                            onChange={(e) => setSearch(e.target.value)}
                            data-tourid="search-input"
                            prefix={<SearchOutlined />}
                        />

                        <div className="group-create">
                            <div className="custom-btn-ico" onClick={openCreateModal} data-tourid="create-btn">
                                <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                Tạo mới
                            </div>
                        </div>
                    </div>

                    <CoursesTableSection
                        data={displayCourses}
                        columns={columns}
                        loading={loading}
                        onChange={handleTableChange}
                    />
                </div>
            </div>

            {/* <div className="right">
                <CustomCalendar />
            </div> */}

            <CreateCourseModal
                open={createModalOpen}
                form={createForm}
                confirmLoading={createSubmitting}
                onOk={handleCreateCourse}
                onCancel={() => setCreateModalOpen(false)}
                exercises={allExercises}
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
                courseId={selectedCourse?.id}
                courseImageUrl={(selectedCourse as any)?.image?.url}
                exercises={courseExercises}
                exercisesLoading={courseExercisesLoading}
                removingExerciseId={removingExerciseId}
                onRemoveExercise={handleRemoveExercise}
            />
        </div>
    );
});

export default Courses;
