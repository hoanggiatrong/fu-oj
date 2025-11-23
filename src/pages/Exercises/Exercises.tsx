/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AppstoreAddOutlined,
    DeleteOutlined,
    FilterOutlined,
    RobotOutlined,
    SettingOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Popover, Select, Steps, Table, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import CourseSlider, { type CourseSliderItem } from './components/CourseSlider';

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

    const columns = [
        {
            title: 'Mã bài tập',
            width: 150,
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string) => {
                return (
                    <div className="cell">
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
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={title}
                        />
                    </div>
                );
            }
        },
        // {
        //     title: 'Mô tả',
        //     dataIndex: 'description',
        //     key: 'description',
        //     render: (description: string) => {
        //         return <div className="cell">{description}</div>;
        //     }
        // },
        {
            title: 'Độ khó',
            width: 100,
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (difficulty: string) => {
                return <div className="cell">{utils.getDifficultyClass(difficulty)}</div>;
            }
        },
        {
            title: 'Chủ đề',
            width: 100,
            dataIndex: 'topics',
            key: 'topics',
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

                            if (index > 3) {
                                return <></>;
                            }

                            const temp = topics.map((t) => t.name.trim().toUpperCase());

                            return index == 3 ? (
                                <Tag>
                                    <TooltipWrapper tooltipText={temp.slice(3).join(', ')} position="left">
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
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            width: 100,
            render: (_: any, record: any) => {
                return (
                    <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
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
            width: 150,
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string) => {
                return (
                    <div className="cell">
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
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={title}
                        />
                    </div>
                );
            }
        },
        // {
        //     title: 'Mô tả',
        //     dataIndex: 'description',
        //     key: 'description',
        //     render: (description: string) => {
        //         return <div className="cell">{description}</div>;
        //     }
        // },
        {
            title: 'Độ khó',
            width: 100,
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (difficulty: string) => {
                return <div className="cell">{utils.getDifficultyClass(difficulty)}</div>;
            }
        },
        {
            title: 'Chủ đề',
            width: 100,
            dataIndex: 'topics',
            key: 'topics',
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

                            if (index > 3) {
                                return <></>;
                            }

                            const temp = topics.map((t) => t.name.trim().toUpperCase());

                            return index == 3 ? (
                                <Tag>
                                    <TooltipWrapper tooltipText={temp.slice(3).join(', ')} position="left">
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

    const applyFilter = () => {
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
            http.post('/exercises', { ...values, testCases: [], maxSubmissions: 99999 })
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
                                        rules={[{ required: true, message: 'Vui lòng nhập mã bài tập!' }]}
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Tiêu đề"
                                        name="title"
                                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
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
                                        rules={[{ required: true, message: 'Vui lòng nhập giới hạn!' }]}
                                    >
                                        <InputNumber className="max-width" />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Bộ nhớ"
                                        name="memory"
                                        rules={[{ required: true, message: 'Vui lòng nhập bộ nhớ!' }]}
                                    >
                                        <InputNumber className="max-width" />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Độ khó"
                                        name="difficulty"
                                        rules={[{ required: true, message: 'Vui lòng chọn một!' }]}
                                    >
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Select difficulty"
                                            // defaultValue={['EASY']}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'EASY', label: 'EASY' },
                                                { value: 'MEDIUM', label: 'MEDIUM' },
                                                { value: 'HARD', label: 'HARD' }
                                            ]}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        className="flex-1"
                                        label="Khả năng hiển thị"
                                        name="visibility"
                                        rules={[{ required: true, message: 'Vui lòng chọn một!' }]}
                                    >
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Select visibility"
                                            onChange={handleChange}
                                            options={[
                                                { value: 'DRAFT', label: 'DRAFT' },
                                                { value: 'PUBLIC', label: 'PUBLIC' },
                                                { value: 'PRIVATE', label: 'PRIVATE' }
                                            ]}
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
                                        placeholder="Select topics"
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
                <div className="header">
                    <div className="title">Danh sách bài tập</div>
                    <div className="description">
                        Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị
                        trí "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                    </div>
                </div>

                <CourseSlider
                    courses={courses}
                    loading={coursesLoading}
                    onManageClick={() => navigate('/courses')}
                    onExploreCourse={(courseId) => navigate(`/courses/${courseId}`)}
                />

                <div
                    className={classnames('wrapper flex', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filters">
                        <Input placeholder="Tìm kiếm bài tập" onChange={(e) => setSearch(e.target.value)} />

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
                                                style={{ width: '100%' }}
                                                placeholder="Chọn độ khó"
                                                onChange={(value) => handleFilterChange('difficulty', value)}
                                                options={[
                                                    { value: 'EASY', label: 'EASY' },
                                                    { value: 'MEDIUM', label: 'MEDIUM' },
                                                    { value: 'HARD', label: 'HARD' }
                                                ]}
                                            />
                                        </div>
                                        <div className="filter-container">
                                            <div className="filter-name">Chủ đề</div>
                                            <Select
                                                allowClear
                                                mode="multiple"
                                                style={{ width: '100%' }}
                                                placeholder="Chọn chủ đề"
                                                defaultValue={[]}
                                                onChange={(value) => handleFilterChange('topicIds', value)}
                                                options={topics}
                                            />
                                        </div>
                                        <div className="filter-container">
                                            <div className="filter-name">Khả năng hiển thị</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn khả năng hiển thị"
                                                onChange={(value) => handleFilterChange('visibility', value)}
                                                options={[
                                                    { value: 'DRAFT', label: 'DRAFT' },
                                                    { value: 'PUBLIC', label: 'PUBLIC' },
                                                    { value: 'PRIVATE', label: 'PRIVATE' }
                                                ]}
                                            />
                                        </div>
                                        <Button type="primary" className="apply-filter" onClick={applyFilter}>
                                            Áp dụng
                                        </Button>
                                    </div>
                                }
                                title="Bộ lọc"
                                trigger="click"
                                open={isFilterOpen}
                                onOpenChange={(open) => setFilterOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico">
                                    <FilterOutlined className="custom-ant-ico" />
                                </div>
                            </Popover>
                        </TooltipWrapper>

                        <ProtectedElement acceptRoles={['STUDENT']}>
                            <TooltipWrapper tooltipText="Danh sách bài tập đã hoàn thành" position="top">
                                <div
                                    className="custom-circle-ico"
                                    onClick={() => (window.location.href = '/submissions')}
                                >
                                    <UnorderedListOutlined className="custom-ant-ico color-gold" />
                                </div>
                            </TooltipWrapper>
                        </ProtectedElement>

                        <div className="group-create">
                            <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                <div
                                    className="custom-btn-ico"
                                    onClick={() => navigate(`/${routesConfig.aiExercises}`)}
                                >
                                    <RobotOutlined className="custom-ant-ico color-purple" />
                                    Tạo câu hỏi với AI
                                </div>
                                <div className="custom-btn-ico" onClick={() => globalStore.setOpenDetailPopup(true)}>
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                    Tạo mới
                                </div>
                            </ProtectedElement>
                        </div>

                        <div className="random">
                            <ProtectedElement acceptRoles={['STUDENT']}>
                                <TooltipWrapper tooltipText="Làm ngẫu nhiên" position="left">
                                    <div className="custom-circle-ico" onClick={selectRandom}>
                                        <img className="" src="/sources/icons/random-ico.svg" />
                                    </div>
                                </TooltipWrapper>
                            </ProtectedElement>
                        </div>
                    </div>
                    <div className="body">
                        <LoadingOverlay loading={loading}>
                            <Table
                                rowKey="id"
                                scroll={{ x: 800 }}
                                pagination={{
                                    pageSize: 1000,
                                    showSizeChanger: false,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} bài tập`
                                }}
                                dataSource={displayDatas}
                                columns={authentication?.account?.data?.role == 'INSTRUCTOR' ? columns : studentCols}
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
                <CustomCalendar />
            </div>
            <ProtectedElement acceptRoles={['STUDENT']}>
                <AIAssistant />
            </ProtectedElement>
        </div>
    );
});

const TestCases = ({ updateId, testCases, setTestCases }: any) => {
    const [form] = Form.useForm();
    const [error, setError] = useState('');

    const columns = [
        {
            title: 'Input',
            dataIndex: 'input',
            key: 'input'
        },
        {
            title: 'Output',
            dataIndex: 'output',
            key: 'output'
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note'
        },
        {
            title: 'State',
            dataIndex: 'isPublic',
            key: 'isPublic',
            render: (isPublic: string) => {
                console.log('log:', isPublic);
                return isPublic ? <Tag color="green">Public</Tag> : <Tag color="red">Hidden</Tag>;
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
                            {/* <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
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
                            </TooltipWrapper> */}
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    // title="Are you sure you want to delete this exercise?"
                                    title="Bạn có chắc chắn muốn xóa bài tập này?"
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
            setError('Input là bắt buộc');
            return;
        }

        if (!payload.output) {
            setError('Output là bắt buộc');
            return;
        }

        if (payload.isPublic == undefined) {
            setError('Độ khó là bắt buộc');
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
                                label="Input"
                                name="input"
                                rules={[{ required: true, message: 'Please input input!' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                className="flex-1"
                                label="Output"
                                name="output"
                                rules={[{ required: true, message: 'Please input output!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </div>

                        <Form.Item
                            className="flex-1"
                            label="State"
                            name="isPublic"
                            rules={[{ required: true, message: 'Please select state!' }]}
                        >
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Select state"
                                options={[
                                    { value: true, label: 'Public' },
                                    { value: false, label: 'Hide' }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item className="flex-1" label="Note" name="note">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Form>
                </div>
            </div>

            <div className="header">
                <div className="left">
                    <img src="/sources/icons/code-ico.svg" alt="" />
                    Test Cases
                </div>
            </div>
            <Table dataSource={testCases} columns={columns} />
        </div>
    );
};

export default Exercises;
