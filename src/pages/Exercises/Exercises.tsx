import { DeleteOutlined, HeartOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import Line from '../../components/Line/Line';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import { Steps } from 'antd';
import authentication from '../../shared/auth/authentication';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';

const Exercises = observer(() => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [updateId, setUpdateId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState([]);
    datas;
    const [topics, setTopics] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');
    const [testCases, setTestCases]: any = useState([]);

    const [form] = Form.useForm();

    const columns = [
        {
            title: 'Mã bài tập',
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={code}
                    />
                );
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={title}
                    />
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description'
        },
        {
            title: 'Chủ đề',
            dataIndex: 'topics',
            key: 'topics',
            render: (topics: any[]) => {
                if (!topics) return null;

                return topics.map((topic, index) => {
                    const text = topic.name.trim().toUpperCase();
                    const colors = [
                        'magenta',
                        'red',
                        'volcano',
                        'orange',
                        'gold',
                        'lime',
                        'green',
                        'cyan',
                        'blue',
                        'geekblue',
                        'purple'
                    ];
                    const color = colors[index];

                    return (
                        <Tag color={color} key={text} style={{ marginBottom: 8 }}>
                            {text}
                        </Tag>
                    );
                });
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (actions: any, record: any) => {
                actions;
                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <TooltipWrapper tooltipText="Thêm vào yêu thích" position="left">
                            <HeartOutlined className="action-row-btn" />
                        </TooltipWrapper>

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

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
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
        http.get('/exercises').then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        });
    };

    useEffect(() => {
        getExercises();

        http.get('/topics').then((res) => {
            setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
        });
    }, []);

    useEffect(() => {
        if (!globalStore.isDetailPopupOpen) {
            setStep(0);
            form.resetFields();
            setUpdateId(null);
        }
    }, [globalStore.isDetailPopupOpen]);

    return (
        <div className={classnames('exercises', { 'p-24': globalStore.isBelow1300 })}>
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
                                    <Input type="number" />
                                </Form.Item>

                                <Form.Item
                                    className="flex-1"
                                    label="Bộ nhớ"
                                    name="memory"
                                    rules={[{ required: true, message: 'Vui lòng nhập bộ nhớ!' }]}
                                >
                                    <Input type="number" />
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
                                        // defaultValue={['DRAFT']}
                                        onChange={handleChange}
                                        options={[{ value: 'DRAFT', label: 'DRAFT' }]}
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
                    Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                </div>
            </div>
            <div
                className={classnames('wrapper flex', {
                    'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                })}
            >
                <div className="search">
                    <div className="title">
                        <SearchOutlined />
                        Bộ lọc
                    </div>
                    <Input
                        value={search}
                        placeholder="Tìm kiếm theo Mã, Tên, Mô tả, Chủ đề"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Line width={0} height={0} text="Chủ đề" center />
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select topics"
                        defaultValue={[]}
                        onChange={handleChange}
                        options={topics}
                    />
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Line width={0} height={0} text="Quản lý" center />
                        <Button onClick={() => globalStore.setOpenDetailPopup(true)}>Tạo mới</Button>
                    </ProtectedElement>
                </div>
                <div className="body">
                    <LoadingOverlay loading={loading}>
                        <Table
                            rowKey="id"
                            scroll={{ x: 800 }}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            dataSource={displayDatas}
                            columns={columns}
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
            render: (actions: any, record: any) => {
                actions;
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

    const getTestCasesById = () => {
        http.get(`exercises/${updateId}`).then((res) => {
            setTestCases(res.data.testCases);
        });
    };

    useEffect(() => {
        setTestCases([]);

        if (updateId) {
            // Get exercise by updateId
            getTestCasesById();
        }
    }, [updateId]);

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
