/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AppstoreAddOutlined,
    DeleteOutlined,
    FilterOutlined,
    LineOutlined,
    RobotOutlined,
    SearchOutlined,
    SettingOutlined,
    CheckOutlined,
    ReloadOutlined,
    WarningFilled
} from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Popover, Select, Steps, Table, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import type { StepOptions } from 'shepherd.js';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import httpRequest from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import CourseSlider, { type CourseSliderItem } from './components/CourseSlider';
import './exercises.scss';
import { visbilities, VISIBILITY } from '../../constants/visibility';
import { difficulties } from '../../constants/difficulty';

const Exercises = observer(() => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [updateId, setUpdateId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState([]);
    const [topics, setTopics] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');
    const [testCases, setTestCases]: any = useState([]);
    const [isFilterOpen, setFilterOpen]: any = useState(false);
    const [filters, setFilters] = useState({
        difficulty: null,
        topicIds: [],
        visibility: null
    });

    const [courses, setCourses] = useState<CourseSliderItem[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [form] = Form.useForm();
    const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isUpdateVisibilityModalOpen, setIsUpdateVisibilityModalOpen] = useState(false);
    const [updateVisibilityForm] = Form.useForm();

    const columns = [
        {
            title: 'Mã bài tập',
            width: 200,
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string, record: any) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={code}
                        />
                        {record?.testCases && record?.testCases?.length <= 0 ? (
                            <div className="ml-8">
                                <TooltipWrapper tooltipText={'Chưa có test case'} position="right">
                                    <div className="unsolved">{<WarningFilled className="color-gold" />}</div>
                                </TooltipWrapper>
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Tiêu đề',
            width: 200,
            dataIndex: 'title',
            key: 'title',
            sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string) => {
                return (
                    <div className="cell">
                        <TooltipWrapper position="right" tooltipText={title}>
                            <Highlighter
                                className="highlight-container"
                                highlightClassName="highlight"
                                searchWords={[search]}
                                autoEscape={true}
                                textToHighlight={title}
                            />
                        </TooltipWrapper>
                    </div>
                );
            }
        },
        {
            title: 'Độ khó',
            width: 100,
            dataIndex: 'difficulty',
            key: 'difficulty',
            sorter: (a: any, b: any) => {
                const order: any = { EASY: 1, MEDIUM: 2, HARD: 3 };
                return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
            },
            render: (difficulty: string) => {
                return <div className="cell">{utils.getDifficultyClass(difficulty)}</div>;
            }
        },
        {
            title: VISIBILITY,
            width: 100,
            dataIndex: 'visibility',
            key: 'visibility',
            sorter: (a: any, b: any) => a.visibility.localeCompare(b.visibility),
            render: (visibility: string) => {
                return <div className="cell">{utils.getVisibilityClass(visibility)}</div>;
            }
        },
        {
            title: 'Chủ đề',
            width: 180,
            dataIndex: 'topics',
            key: 'topics',
            sorter: (a: any, b: any) => {
                const lenA = a.topics ? a.topics.length : 0;
                const lenB = b.topics ? b.topics.length : 0;
                return lenA - lenB;
            },
            render: (topics: any[]) => {
                if (!topics) return null;

                return (
                    <div className="cell gap">
                        {topics.map((topic, index) => {
                            const text = topic.name.trim().toUpperCase();
                            const colors = [
                                'cyan',
                                'magenta',
                                'red',
                                'volcano',
                                'orange',
                                'gold',
                                'lime',
                                'green',
                                'blue',
                                'geekblue',
                                'purple'
                            ];
                            const color = colors[index];

                            if (index > 2) {
                                return <></>;
                            }

                            const temp = topics.map((t) => t.name.trim().toUpperCase());

                            return index == 2 ? (
                                <Tag key={text}>
                                    <TooltipWrapper tooltipText={temp.slice(2).join(', ')} position="left">
                                        ...
                                    </TooltipWrapper>
                                </Tag>
                            ) : (
                                <Tag color={color} key={text} style={{ marginBottom: 8 }}>
                                    {text}
                                </Tag>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            title: <div className="text-align-right">Hành động</div>,
            dataIndex: 'actions',
            key: 'actions',
            width: 100,
            render: (_: any, record: any) => {
                return (
                    <div className="actions-row cell" onClick={(e) => e.stopPropagation()} data-tourid="table-actions">
                        {/* <TooltipWrapper tooltipText="Thêm vào yêu thích" position="left">
                            <HeartOutlined className="action-row-btn" />
                        </TooltipWrapper> */}

                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
                                <SettingOutlined
                                    className="action-row-btn"
                                    onClick={() => {
                                        setUpdateId(record.id);
                                        globalStore.setOpenDetailPopup(true);
                                        form.setFieldsValue({
                                            ...record,
                                            topicIds: record.topics.map((topic: any) => topic.id)
                                        });
                                    }}
                                />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    // title="Are you sure you want to delete this exercise?"
                                    title="Bạn có chắc chắn muốn xóa bài tập này?"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        http.deleteById('/exercises', record.id).then((res) => {
                                            globalStore.triggerNotification(
                                                'success',
                                                res.message || 'Delete successfully!',
                                                ''
                                            );
                                            getExercises();
                                        });
                                    }}
                                >
                                    <DeleteOutlined className="action-row-btn" />
                                </Popconfirm>
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    const studentCols = [
        {
            title: 'Mã bài tập',
            width: 160,
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string, record: any) => {
                return (
                    <div className="cell">
                        <TooltipWrapper
                            tooltipText={record.solved ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                            position="right"
                        >
                            <div className={classnames({ solved: record.solved, unsolved: !record.solved })}>
                                {record.solved ? <CheckOutlined /> : <LineOutlined />}
                            </div>
                        </TooltipWrapper>
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={code}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Tiêu đề',
            width: 200,
            dataIndex: 'title',
            key: 'title',
            sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string) => {
                return (
                    <div className="cell">
                        <TooltipWrapper position="right" tooltipText={title}>
                            <Highlighter
                                className="highlight-container"
                                highlightClassName="highlight"
                                searchWords={[search]}
                                autoEscape={true}
                                textToHighlight={title}
                            />
                        </TooltipWrapper>
                    </div>
                );
            }
        },
        {
            title: 'Độ khó',
            width: 100,
            dataIndex: 'difficulty',
            key: 'difficulty',
            sorter: (a: any, b: any) => {
                const order: any = { EASY: 1, MEDIUM: 2, HARD: 3 };
                return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
            },
            render: (difficulty: string) => {
                return <div className="cell">{utils.getDifficultyClass(difficulty)}</div>;
            }
        },
        {
            title: 'Chủ đề',
            width: 180,
            dataIndex: 'topics',
            key: 'topics',
            sorter: (a: any, b: any) => {
                const lenA = a.topics ? a.topics.length : 0;
                const lenB = b.topics ? b.topics.length : 0;
                return lenA - lenB;
            },
            render: (topics: any[]) => {
                if (!topics) return null;

                return (
                    <div className="cell gap">
                        {topics.map((topic, index) => {
                            const text = topic.name.trim().toUpperCase();
                            const colors = [
                                'cyan',
                                'magenta',
                                'red',
                                'volcano',
                                'orange',
                                'gold',
                                'lime',
                                'green',
                                'blue',
                                'geekblue',
                                'purple'
                            ];
                            const color = colors[index];

                            if (index > 2) {
                                return <></>;
                            }

                            const temp = topics.map((t) => t.name.trim().toUpperCase());

                            return index == 2 ? (
                                <Tag key={text}>
                                    <TooltipWrapper tooltipText={temp.slice(2).join(', ')} position="left">
                                        ...
                                    </TooltipWrapper>
                                </Tag>
                            ) : (
                                <Tag color={color} key={text} style={{ marginBottom: 8 }}>
                                    {text}
                                </Tag>
                            );
                        })}
                    </div>
                );
            }
        }
    ];

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilter = (isReset?: boolean) => {
        if (isReset) {
            setDisplayDatas(datas);
            setFilterOpen(false);
            return;
        }

        const filtered = datas.filter((item: any) => {
            // 1. Lọc độ khó
            if (filters.difficulty && item.difficulty !== filters.difficulty) {
                return false;
            }

            // 2. Lọc khả năng hiển thị
            if (filters.visibility && item.visibility !== filters.visibility) {
                return false;
            }

            // 3. Lọc chủ đề (topicIds là mảng id)
            if (filters.topicIds.length > 0) {
                const itemTopicIds = item.topics?.map((t: any) => t.id) || [];
                // Kiểm tra ít nhất một topic match
                const hasMatch = filters.topicIds.some((id: any) => itemTopicIds.includes(id));
                if (!hasMatch) return false;
            }

            return true;
        });

        console.log('log:', filtered);

        setDisplayDatas(filtered);
        setFilterOpen(false);
    };

    const selectRandom = () => {
        // Đoạn này lấy từ kết quả lọc ra
        if (displayDatas.length == 0) {
            globalStore.triggerNotification('error', 'Không tìm thấy bài tập', '');
        } else {
            const includeTestCaseDatas = displayDatas.filter((d: any) => d.testCases.length > 0);
            const randomInt = utils.getRandomInt(includeTestCaseDatas.length);
            const randomSelect: any = includeTestCaseDatas[randomInt];
            navigate(`/${routesConfig.exercise}`.replace(':id?', randomSelect?.id));
        }
    };

    const onFinish: FormProps['onFinish'] = (values) => {
        console.log('Success:', values);

        if (updateId) {
            http.putaaa(updateId, '/exercises', { ...values, testCases: [], maxSubmissions: 99999 })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    getExercises();
                    globalStore.setOpenDetailPopup(false);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                });
        } else {
            http.post('/exercises', {
                ...values,
                code: `EX_${new Date().getTime()}`,
                testCases: [],
                maxSubmissions: 99999
            })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    getExercises();
                    setStep(1);
                    setUpdateId(res.data.id);
                    // globalStore.setOpenDetailPopup(false);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                });
        }
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const getExercises = () => {
        setLoading(true);
        http.get('/exercises?pageSize=9999999').then((res) => {
            const userId = authentication?.account?.data?.id;
            const filteredData = res.data.filter((d: any) =>
                authentication.isInstructor ? d.createdBy == userId : true
            );

            setDatas(filteredData);
            setDisplayDatas(filteredData);
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        });
    };

    const handleUpdateVisibility = () => {
        if (selectedRowKeys.length === 0) {
            globalStore.triggerNotification('warning', 'Vui lòng chọn ít nhất một bài tập!', '');
            return;
        }
        setIsUpdateVisibilityModalOpen(true);
    };

    const onUpdateVisibilityFinish = (values: any) => {
        const payload = {
            exerciseIds: selectedRowKeys,
            visibility: values.visibility
        };

        httpRequest
            .patch('/exercises/visibility', payload)
            .then((res: any) => {
                globalStore.triggerNotification('success', res.data?.message || 'Cập nhật thành công!', '');
                setIsUpdateVisibilityModalOpen(false);
                setSelectedRowKeys([]);
                updateVisibilityForm.resetFields();
                getExercises();
            })
            .catch((error: any) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Cập nhật thất bại!', '');
            });
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys);
        },
        getCheckboxProps: () => ({
            disabled: !authentication.isInstructor
        })
    };

    const getCourses = async () => {
        setCoursesLoading(true);
        try {
            const response = await http.get('/courses', {
                params: { page: 1, size: 10 }
            });
            const data: CourseSliderItem[] = (response?.data ?? []).map((course: any) => ({
                id: course.id,
                title: course.title,
                description: course.description
            }));
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses for slider', error);
            globalStore.triggerNotification('error', 'Không thể tải danh sách khóa học!', '');
            setCourses([]);
        } finally {
            setCoursesLoading(false);
        }
    };

    useEffect(() => {
        const searchLowerCase = search.toLowerCase();

        const filtered = datas.filter(
            (d: any) =>
                d.code.toLowerCase().includes(searchLowerCase) || d.title.toLowerCase().includes(searchLowerCase)
        );
        setDisplayDatas(filtered);
    }, [search, datas]);

    useEffect(() => {
        getExercises();
        getCourses();

        http.get('/topics').then((res) => {
            setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
        });
    }, []);

    const isDetailPopupOpen = globalStore.isDetailPopupOpen;

    useEffect(() => {
        if (!isDetailPopupOpen) {
            setStep(0);
            form.resetFields();
            setUpdateId(null);
        }
    }, [isDetailPopupOpen, form]);

    // Create tour guide
    const createTour = useCallback(() => {
        const isInstructor = authentication.isInstructor;

        const studentSteps: StepOptions[] = [
            {
                id: 'course-slider',
                text: 'Đây là phần khóa học nổi bật. Bạn có thể chọn khóa học phù hợp để luyện tập theo lộ trình, tương tự như LeetCode study plan.',
                attachTo: {
                    element: '[data-tourid="course-slider"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'search-input',
                text: 'Bạn có thể tìm kiếm bài tập theo mã bài tập hoặc tiêu đề ở đây.',
                attachTo: {
                    element: '[data-tourid="search-input"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'filter-btn',
                text: 'Nút bộ lọc cho phép bạn lọc bài tập theo độ khó, chủ đề và khả năng hiển thị.',
                attachTo: {
                    element: '[data-tourid="filter-btn"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'random-btn',
                text: 'Nút "Làm ngẫu nhiên" sẽ chọn ngẫu nhiên một bài tập từ danh sách để bạn luyện tập.',
                attachTo: {
                    element: '[data-tourid="random-btn"]',
                    on: 'left' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'exercises-table',
                text: 'Đây là danh sách tất cả các bài tập. Bạn có thể click vào một bài tập để bắt đầu làm. Bảng hiển thị mã bài tập, tiêu đề, độ khó và chủ đề.',
                attachTo: {
                    element: '[data-tourid="exercises-table"]',
                    on: 'top' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Hoàn thành',
                        action: () => {
                            const tourKey = 'exercises-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.complete();
                        }
                    }
                ]
            }
        ];

        const instructorSteps: StepOptions[] = [
            {
                id: 'ai-create-btn',
                text: 'Nút "Tạo câu hỏi với AI" cho phép bạn tạo bài tập mới một cách nhanh chóng với sự hỗ trợ của AI.',
                attachTo: {
                    element: '[data-tourid="ai-create-btn"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'create-btn',
                text: 'Nút "Tạo mới" để tạo bài tập thủ công. Bạn sẽ điền thông tin bài tập và test cases trong modal.',
                attachTo: {
                    element: '[data-tourid="create-btn"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'search-input',
                text: 'Bạn có thể tìm kiếm bài tập theo mã bài tập hoặc tiêu đề ở đây.',
                attachTo: {
                    element: '[data-tourid="search-input"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'filter-btn',
                text: 'Nút bộ lọc cho phép bạn lọc bài tập theo độ khó, chủ đề và khả năng hiển thị.',
                attachTo: {
                    element: '[data-tourid="filter-btn"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'exercises-table',
                text: 'Đây là danh sách tất cả các bài tập bạn đã tạo. Bảng hiển thị mã bài tập, tiêu đề, độ khó và chủ đề.',
                attachTo: {
                    element: '[data-tourid="exercises-table"]',
                    on: 'top' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'table-actions',
                text: 'Trong mỗi hàng bài tập, bạn có thể sử dụng nút chỉnh sửa (biểu tượng bánh răng) để cập nhật thông tin hoặc nút xóa (biểu tượng thùng rác) để xóa bài tập.',
                attachTo: {
                    element: '[data-tourid="table-actions"]',
                    on: 'left' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Hoàn thành',
                        action: () => {
                            const tourKey = 'exercises-instructor-tour-completed';
                            localStorage.setItem(tourKey, 'true');
                            tourRef.current?.complete();
                        }
                    }
                ]
            }
        ];

        const steps = isInstructor ? instructorSteps : studentSteps;

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: {
                    enabled: false
                },
                scrollTo: { behavior: 'smooth', block: 'center' }
            }
        });

        steps.forEach((step) => {
            tour.addStep(step);
        });

        tour.on('complete', () => {
            const tourKey = isInstructor ? 'exercises-instructor-tour-completed' : 'exercises-tour-completed';
            localStorage.setItem(tourKey, 'true');
        });

        tour.on('cancel', () => {
            const tourKey = isInstructor ? 'exercises-instructor-tour-completed' : 'exercises-tour-completed';
            localStorage.setItem(tourKey, 'true');
        });

        return tour;
    }, []);

    const resetTour = () => {
        const isInstructor = authentication.isInstructor;
        const tourKey = isInstructor ? 'exercises-instructor-tour-completed' : 'exercises-tour-completed';
        localStorage.removeItem(tourKey);

        // Cancel current tour if running
        if (tourRef.current) {
            tourRef.current.cancel();
            tourRef.current = null;
        }

        // Start tour again
        if (!loading && datas.length > 0) {
            setTimeout(() => {
                if (!tourRef.current) {
                    tourRef.current = createTour();
                    tourRef.current.start();
                }
            }, 500);
        } else {
            globalStore.triggerNotification('info', 'Tour sẽ hiển thị khi dữ liệu đã tải xong', '');
        }
    };

    // Check if tour should run (for STUDENT or INSTRUCTOR, first time only)
    useEffect(() => {
        const isInstructor = authentication.isInstructor;
        const isStudent = authentication.isStudent;
        const tourKey = isInstructor ? 'exercises-instructor-tour-completed' : 'exercises-tour-completed';
        const hasCompletedTour = localStorage.getItem(tourKey);

        if ((isStudent || isInstructor) && !hasCompletedTour && !loading && datas.length > 0) {
            // Delay to ensure DOM is ready
            let retryCount = 0;
            const maxRetries = 10;

            const checkElements = () => {
                if (isInstructor) {
                    const aiCreateBtn = document.querySelector('[data-tourid="ai-create-btn"]');
                    const createBtn = document.querySelector('[data-tourid="create-btn"]');
                    const searchInput = document.querySelector('[data-tourid="search-input"]');
                    const filterBtn = document.querySelector('[data-tourid="filter-btn"]');
                    const exercisesTable = document.querySelector('[data-tourid="exercises-table"]');
                    const tableActions = document.querySelector('[data-tourid="table-actions"]');

                    if (aiCreateBtn && createBtn && searchInput && filterBtn && exercisesTable && tableActions) {
                        if (!tourRef.current) {
                            tourRef.current = createTour();
                            tourRef.current.start();
                        }
                    } else if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(checkElements, 500);
                    }
                } else {
                    const courseSlider = document.querySelector('[data-tourid="course-slider"]');
                    const searchInput = document.querySelector('[data-tourid="search-input"]');
                    const filterBtn = document.querySelector('[data-tourid="filter-btn"]');
                    const randomBtn = document.querySelector('[data-tourid="random-btn"]');
                    const exercisesTable = document.querySelector('[data-tourid="exercises-table"]');

                    if (courseSlider || searchInput || filterBtn || randomBtn || exercisesTable) {
                        if (!tourRef.current) {
                            tourRef.current = createTour();
                            tourRef.current.start();
                        }
                    } else if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(checkElements, 500);
                    }
                }
            };

            setTimeout(checkElements, 1500);
        }

        return () => {
            if (tourRef.current) {
                tourRef.current.cancel();
                tourRef.current = null;
            }
        };
    }, [loading, datas.length, createTour]);

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('exercises left', { 'p-24': globalStore.isBelow1300 })}>
                <Modal
                    title={`${updateId ? 'Chỉnh sửa' : 'Tạo mới'} bài tập`}
                    className="detail-modal"
                    open={globalStore.isDetailPopupOpen}
                    onCancel={() => globalStore.setOpenDetailPopup(false)}
                    // width={420}
                    width={800}
                >
                    <div className="exercise-form">
                        <Steps
                            className="ex-step mb-px"
                            size="small"
                            current={step}
                            items={[
                                {
                                    title: 'Thông tin bài tập'
                                },
                                {
                                    title: 'Test cases'
                                }
                            ]}
                            onChange={(value: number) => {
                                if (!updateId) {
                                    globalStore.triggerNotification('error', 'Bạn phải tạo mới bài tập trước', '');
                                    setStep(0);
                                    return;
                                }

                                setStep(value);
                            }}
                        />
                        <Form
                            form={form}
                            name="basic"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                            labelAlign="left"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <div className={classnames({ hide: step != 0 })}>
                                <div className="flex gap">
                                    <Form.Item
                                        className="flex-1"
                                        label="Mã bài tập"
                                        name="code"
                                        // rules={[{ required: true, message: 'Vui lòng nhập mã bài tập!' }]}
                                    >
                                        <Input
                                            className="disabled-5"
                                            disabled
                                            defaultValue={`EX_${new Date().getTime()}`}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Tiêu đề"
                                        name="title"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập tiêu đề!' },
                                            { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự!' },
                                            { max: 50, message: 'Tiêu đề tối đa 50 ký tự!' }
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </div>

                                {/* <Form.Item
                                label="Max Submissions"
                                name="maxSubmissions"
                                rules={[{ required: true, message: 'Please input your max submissions!' }]}
                                style={{ display: 'none' }}
                            >
                                <Input type="number" value={0} />
                            </Form.Item> */}

                                <div className="flex gap">
                                    <Form.Item
                                        className="flex-1"
                                        label="Giới hạn thời gian"
                                        name="timeLimit"
                                        rules={[{ required: true, message: 'Vui lòng nhập giới hạn thời gian!' }]}
                                    >
                                        <InputNumber className="max-width" addonAfter="s" />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Giới hạn bộ nhớ"
                                        name="memory"
                                        rules={[{ required: true, message: 'Vui lòng nhập giới hạn bộ nhớ!' }]}
                                    >
                                        <InputNumber className="max-width" addonAfter="bytes" />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Độ khó"
                                        name="difficulty"
                                        rules={[{ required: true, message: 'Vui lòng chọn một!' }]}
                                    >
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Chọn độ khó"
                                            onChange={handleChange}
                                            options={Object.entries(difficulties).map(([value, { text: label }]) => ({
                                                value,
                                                label
                                            }))}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Hiển thị"
                                        name="visibility"
                                        rules={[{ required: true, message: 'Vui lòng chọn một chế độ hiển thị!' }]}
                                    >
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Chọn chế độ hiển thị"
                                            onChange={handleChange}
                                            options={Object.entries(visbilities).map(([value, { text: label }]) => ({
                                                value,
                                                label
                                            }))}
                                        />
                                    </Form.Item>
                                </div>

                                <Form.Item
                                    className="flex-1"
                                    label="Chủ đề"
                                    name="topicIds"
                                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 chủ đề!' }]}
                                >
                                    <Select
                                        mode="multiple"
                                        style={{ width: '100%' }}
                                        placeholder="Chọn một hoặc nhiều chủ đề"
                                        defaultValue={[]}
                                        onChange={handleChange}
                                        options={topics}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Mô tả"
                                    name="description"
                                    rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                                >
                                    <Input.TextArea rows={4} style={{ resize: 'none' }} />
                                </Form.Item>

                                <Form.Item
                                    label="Lời giải mẫu"
                                    name="solution"
                                    // rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>
                            </div>

                            <div className={classnames({ hide: step != 1 })}>
                                <TestCases updateId={updateId} testCases={testCases} setTestCases={setTestCases} />
                            </div>

                            <Form.Item label={null}>
                                <Button className={classnames({ hide: step != 0 })} type="primary" htmlType="submit">
                                    {updateId ? 'Cập nhật' : 'Tạo mới'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Modal>
                <Modal
                    title="Cập nhật trạng thái bài tập"
                    open={isUpdateVisibilityModalOpen}
                    onCancel={() => {
                        setIsUpdateVisibilityModalOpen(false);
                        updateVisibilityForm.resetFields();
                    }}
                    footer={null}
                    width={400}
                >
                    <Form
                        form={updateVisibilityForm}
                        name="updateVisibilityForm"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        labelAlign="left"
                        onFinish={onUpdateVisibilityFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label={VISIBILITY}
                            name="visibility"
                            rules={[{ required: true, message: 'Vui lòng chọn chế độ hiển thị!' }]}
                        >
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn chế độ hiển thị"
                                options={Object.entries(visbilities).map(([value, { text: label }]) => ({
                                    value,
                                    label
                                }))}
                            />
                        </Form.Item>
                        <Form.Item>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <Button
                                    onClick={() => {
                                        setIsUpdateVisibilityModalOpen(false);
                                        updateVisibilityForm.resetFields();
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Cập nhật
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
                <div className="header">
                    <div className="title">
                        {authentication.isStudent ? 'Danh sách bài tập' : 'Quản lý danh sách bài tập'}
                    </div>
                    <div className="description">
                        Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị
                        trí "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                    </div>
                </div>

                <ProtectedElement acceptRoles={['STUDENT']}>
                    <div data-tourid="course-slider">
                        <CourseSlider
                            courses={courses}
                            loading={coursesLoading}
                            onManageClick={() => navigate('/courses')}
                            onExploreCourse={(courseId) => navigate(`/courses/${courseId}`)}
                        />
                    </div>
                </ProtectedElement>

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

                        {/* <TooltipWrapper tooltipText="Sắp xếp" position="top">
                            <Popover
                                content={<div className="custom-pop-content">ab</div>}
                                title="Sắp xếp"
                                trigger="click"
                                open={isSortOpen}
                                onOpenChange={(open) => setSortOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico">
                                    <img className="" src="/sources/icons/sort-ico.svg" />
                                </div>
                            </Popover>
                        </TooltipWrapper> */}

                        <TooltipWrapper tooltipText="Bộ lọc" position="top">
                            <Popover
                                content={
                                    <div className="custom-pop-content">
                                        <div className="filter-container">
                                            <div className="filter-name">Độ khó</div>
                                            <Select
                                                allowClear
                                                value={filters.difficulty}
                                                style={{ width: '100%' }}
                                                placeholder="Chọn độ khó"
                                                onChange={(value) => handleFilterChange('difficulty', value)}
                                                options={Object.entries(difficulties).map(
                                                    ([value, { text: label }]) => ({
                                                        value,
                                                        label
                                                    })
                                                )}
                                            />
                                        </div>
                                        <div className="filter-container">
                                            <div className="filter-name">Chủ đề</div>
                                            <Select
                                                allowClear
                                                value={filters.topicIds}
                                                mode="multiple"
                                                style={{ width: '100%' }}
                                                placeholder="Chọn chủ đề"
                                                defaultValue={[]}
                                                onChange={(value) => handleFilterChange('topicIds', value)}
                                                options={topics}
                                            />
                                        </div>
                                        <div className="filter-container">
                                            <div className="filter-name">Hiển thị</div>
                                            <Select
                                                allowClear
                                                value={filters.visibility}
                                                style={{ width: '100%' }}
                                                placeholder="Chọn chế độ hiển thị"
                                                onChange={(value) => handleFilterChange('visibility', value)}
                                                options={Object.entries(visbilities).map(
                                                    ([value, { text: label }]) => ({
                                                        value,
                                                        label
                                                    })
                                                )}
                                            />
                                        </div>
                                        <div className="actions">
                                            <div
                                                className="clear-all"
                                                onClick={() => {
                                                    setFilters({
                                                        difficulty: null,
                                                        topicIds: [],
                                                        visibility: null
                                                    });
                                                    applyFilter(true);
                                                }}
                                            >
                                                Xóa hết
                                            </div>
                                            <Button
                                                type="primary"
                                                className="apply-filter"
                                                onClick={() => applyFilter()}
                                            >
                                                Áp dụng
                                            </Button>
                                        </div>
                                    </div>
                                }
                                title="Bộ lọc"
                                trigger="click"
                                open={isFilterOpen}
                                onOpenChange={(open) => setFilterOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico" data-tourid="filter-btn">
                                    <FilterOutlined className="custom-ant-ico" />
                                </div>
                            </Popover>
                        </TooltipWrapper>

                        {/* <ProtectedElement acceptRoles={['STUDENT']}>
                            <TooltipWrapper tooltipText="Danh sách bài tập đã hoàn thành" position="top">
                                <div
                                    className="custom-circle-ico"
                                    onClick={() => navigate(`/${routesConfig.submissionsOfAStudent}`)}
                                >
                                    <UnorderedListOutlined className="custom-ant-ico color-gold" />
                                </div>
                            </TooltipWrapper>
                        </ProtectedElement> */}

                        <div className="group-create">
                            <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                {selectedRowKeys.length > 0 && (
                                    <div className="custom-btn-ico" onClick={handleUpdateVisibility}>
                                        <SettingOutlined className="custom-ant-ico" />
                                        Cập nhật trạng thái ({selectedRowKeys.length})
                                    </div>
                                )}
                                <div
                                    className="custom-btn-ico custom-btn-ico-hot"
                                    onClick={() => navigate(`/${routesConfig.aiExercises}`)}
                                    data-tourid="ai-create-btn"
                                >
                                    <RobotOutlined className="custom-ant-ico color-purple" />
                                    Tạo câu hỏi với AI
                                </div>
                                <div
                                    className="custom-btn-ico"
                                    onClick={() => globalStore.setOpenDetailPopup(true)}
                                    data-tourid="create-btn"
                                >
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                    Tạo mới
                                </div>
                            </ProtectedElement>
                        </div>

                        <div className="random">
                            <ProtectedElement acceptRoles={['STUDENT']}>
                                <div className="custom-btn-ico" onClick={selectRandom} data-tourid="random-btn">
                                    <img className="" src="/sources/icons/random-ico.svg" />
                                    Làm ngẫu nhiên
                                </div>
                            </ProtectedElement>
                        </div>
                    </div>
                    <div className="body" data-tourid="exercises-table">
                        <LoadingOverlay loading={loading}>
                            <Table
                                rowKey="id"
                                scroll={{ x: 800 }}
                                pagination={{
                                    pageSize: 20,
                                    showSizeChanger: false,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} bài tập`
                                }}
                                dataSource={displayDatas}
                                columns={authentication?.account?.data?.role == 'INSTRUCTOR' ? columns : studentCols}
                                rowSelection={
                                    authentication?.account?.data?.role == 'INSTRUCTOR' ? rowSelection : undefined
                                }
                                rowClassName={(_record, index) =>
                                    index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd'
                                }
                                onRow={(record) => {
                                    return {
                                        onClick: () => {
                                            if (!authentication.isStudent) return;
                                            navigate(`/${routesConfig.exercise}`.replace(':id?', record.id));
                                        }
                                    };
                                }}
                            />
                        </LoadingOverlay>
                    </div>
                </div>
            </div>
            <div className="right">
                <CustomCalendar dateArr={utils.getDates()} />

                <Button type="primary" icon={<ReloadOutlined />} onClick={resetTour} className="tour-guide-button">
                    Xem lại hướng dẫn
                </Button>
            </div>
        </div>
    );
});

export const TestCases = ({ updateId, testCases, setTestCases }: any) => {
    const [form] = Form.useForm();
    const [error, setError] = useState('');

    const columns = [
        {
            title: 'Đầu vào',
            dataIndex: 'input',
            key: 'input'
        },
        {
            title: 'Đầu ra',
            dataIndex: 'output',
            key: 'output'
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note'
        },
        {
            title: 'Hiển thị',
            dataIndex: 'isPublic',
            key: 'isPublic',
            render: (isPublic: string) => {
                console.log('log:', isPublic);
                return isPublic ? <Tag color="green">Công khai</Tag> : <Tag color="red">Ẩn</Tag>;
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (_: any, record: any) => {
                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn xóa test case này?"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        console.log('log:', record.id);
                                        http.deleteById(`/exercises/${updateId}/test-cases`, record.id).then((res) => {
                                            globalStore.triggerNotification(
                                                'success',
                                                res.message || 'Delete successfully!',
                                                ''
                                            );
                                            getTestCasesById();
                                        });
                                    }}
                                >
                                    <DeleteOutlined className="action-row-btn" />
                                </Popconfirm>
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    const add = () => {
        const payload = form.getFieldsValue();

        if (!payload.input) {
            setError('Vui lòng nhập đầu vào!');
            return;
        }

        if (!payload.output) {
            setError('Vui lòng nhập đầu ra!');
            return;
        }

        if (payload.isPublic == undefined) {
            setError('Vui lòng chọn chế độ hiển thị!');
            return;
        }

        http.post(`/exercises/${updateId}/test-cases`, payload)
            .then((res) => {
                globalStore.triggerNotification('success', res.message, '');
                form.resetFields();
                setError('');
                getTestCasesById();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message, '');
            });
    };

    const getTestCasesById = useCallback(() => {
        if (!updateId) return;
        http.get(`exercises/${updateId}`).then((res) => {
            setTestCases(res.data.testCases);
        });
    }, [updateId, setTestCases]);

    useEffect(() => {
        setTestCases([]);

        if (updateId) {
            // Get exercise by updateId
            getTestCasesById();
        }
    }, [updateId, getTestCasesById, setTestCases]);

    return (
        <div className="test-cases-component">
            <div className="add-new">
                <div className="header">
                    <div className="left">
                        <img src="/sources/icons/code-ico.svg" alt="" />
                        Tạo mới Test Case
                    </div>

                    <div className="right">
                        <Button type="primary" onClick={add}>
                            Thêm
                        </Button>
                    </div>
                </div>
                {error && <div className="error">{error}</div>}
                <div className="content">
                    <Form
                        form={form}
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        labelAlign="left"
                        initialValues={{ remember: true }}
                        autoComplete="off"
                    >
                        <div className="flex gap">
                            <Form.Item
                                className="flex-1"
                                label="Đầu vào"
                                name="input"
                                rules={[{ required: true, message: 'Vui lòng nhập đầu vào!' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                className="flex-1"
                                label="Đầu ra"
                                name="output"
                                rules={[{ required: true, message: 'Vui lòng nhập đầu ra!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </div>

                        <Form.Item
                            className="flex-1"
                            label="Hiển thị"
                            name="isPublic"
                            rules={[{ required: true, message: 'Vui lòng chọn chế độ hiển thị!' }]}
                        >
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn chế độ hiển thị"
                                options={[
                                    { value: true, label: 'Công khai' },
                                    { value: false, label: 'Ẩn' }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item className="flex-1" label="Ghi chú" name="note">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Form>
                </div>
            </div>

            <div className="header">
                <div className="left">
                    <img src="/sources/icons/code-ico.svg" alt="" />
                    Danh sách test case
                </div>
            </div>
            <Table dataSource={testCases} columns={columns} />
        </div>
    );
};

export default Exercises;
