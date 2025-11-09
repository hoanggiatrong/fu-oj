import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import { Button, Input, Select, Table, Popconfirm, Form, Modal, DatePicker, Tabs, Tag } from 'antd';
import type { FormProps } from 'antd';
import Line from '../../components/Line/Line';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { DeleteOutlined, SearchOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import Highlighter from 'react-highlight-words';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import routesConfig from '../../routes/routesConfig';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ExamData {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    status: string;
    groups?: Array<{ id: string; name: string }>;
    exercises?: Array<{ id: string; title: string }>;
}

const Exams = observer(() => {
    const navigate = useNavigate();
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState<ExamData[]>([]);
    const [displayDatas, setDisplayDatas] = useState<ExamData[]>([]);
    const [groups, setGroups] = useState<Array<{ value: string; label: string }>>([]);
    const [exercises, setExercises] = useState<Array<{ value: string; label: string }>>([]);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<ExamData | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');

    const [form] = Form.useForm();

    const getExamStatus = (startTime: string | null, endTime: string | null) => {
        const now = dayjs();
        if (!startTime || !endTime) {
            return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
        }
        
        const start = dayjs(startTime);
        const end = dayjs(endTime);
        
        if (start.isAfter(now)) {
            return { status: 'upcoming', label: 'Sắp tới', color: 'blue' };
        } else if (start.isBefore(now) || start.isSame(now)) {
            if (end.isAfter(now)) {
                return { status: 'ongoing', label: 'Đang diễn ra', color: 'green' };
            } else {
                return { status: 'completed', label: 'Đã kết thúc', color: 'default' };
            }
        }
        
        return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
    };

    const onFinish: FormProps['onFinish'] = (values) => {
        const payload = {
            title: values.title,
            description: values.description,
            startTime: values.startTime ? dayjs(values.startTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
            endTime: values.endTime ? dayjs(values.endTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
            status: values.status || 'DRAFT',
            groupIds: values.groupIds || [],
            exerciseIds: values.exerciseIds || []
        };

        if (updateId) {
            http.putaaa(updateId, '/exams', payload)
                .then((res) => {
                    globalStore.triggerNotification('success', res.message || 'Cập nhật bài thi thành công!', '');
                    getExams();
                    globalStore.setOpenDetailPopup(false);
                    form.resetFields();
                    setUpdateId(null);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
                });
        } else {
            http.post('/exams', payload)
                .then((res) => {
                    globalStore.triggerNotification('success', res.message || 'Tạo bài thi thành công!', '');
                    getExams();
                    globalStore.setOpenDetailPopup(false);
                    form.resetFields();
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
                });
        }
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            sorter: (a: ExamData, b: ExamData) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={title || ''}
                    />
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={description || ''}
                    />
                );
            }
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (startTime: string) => {
                return startTime ? dayjs(startTime).format('DD/MM/YYYY HH:mm') : '-';
            }
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (endTime: string) => {
                return endTime ? dayjs(endTime).format('DD/MM/YYYY HH:mm') : '-';
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record: ExamData) => {
                const statusInfo = getExamStatus(record.startTime, record.endTime);
                return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
            }
        },
        {
            title: 'Số nhóm',
            dataIndex: 'groups',
            key: 'groups',
            render: (groups: Array<{ id: string; name: string }> | undefined) => {
                return groups ? groups.length : 0;
            }
        },
        {
            title: 'Số bài tập',
            dataIndex: 'exercises',
            key: 'exercises',
            render: (exercises: Array<{ id: string; title: string }> | undefined) => {
                return exercises ? exercises.length : 0;
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (_: unknown, record: ExamData) => {
                const now = dayjs();
                const startTime = record.startTime ? dayjs(record.startTime) : null;
                const isDisabled = startTime && (startTime.isAfter(now) || startTime.isSame(now));
                const disabledStyle = isDisabled ? { opacity: 0.7, cursor: 'not-allowed' } : {};

                const handleEdit = () => {
                    if (isDisabled) return;
                    setUpdateId(record.id);
                    setEditingRecord(record);
                    globalStore.setOpenDetailPopup(true);
                };

                const handleCopy = () => {
                    form.setFieldsValue({
                        title: `${record.title} (Copy)`,
                        description: record.description,
                        startTime: null,
                        endTime: null,
                        groupIds: record.groups?.map((g) => g.id) || [],
                        exerciseIds: record.exercises?.map((e) => e.id) || []
                    });
                    globalStore.setOpenDetailPopup(true);
                };

                const handleDelete = () => {
                    if (isDisabled) return;
                    http.deleteById('/exams', record.id as unknown as number).then((res) => {
                        globalStore.triggerNotification('success', res.message || 'Xóa thành công!', '');
                        getExams();
                    });
                };

                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
                                <EditOutlined
                                    className="action-row-btn"
                                    style={disabledStyle}
                                    onClick={handleEdit}
                                />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Sao chép" position="left">
                                <CopyOutlined className="action-row-btn" onClick={handleCopy} />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                {isDisabled ? (
                                    <DeleteOutlined className="action-row-btn" style={disabledStyle} />
                                ) : (
                                    <Popconfirm
                                        title="Bạn có chắc chắn muốn xóa bài thi này?"
                                        okText="Có"
                                        cancelText="Không"
                                        onConfirm={handleDelete}
                                    >
                                        <DeleteOutlined className="action-row-btn" />
                                    </Popconfirm>
                                )}
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    const getExams = () => {
        setLoading(true);
        http.get('/exams')
            .then((res) => {
                setDatas(res.data || []);
                setDisplayDatas(res.data || []);
            })
            .catch((error) => {
                console.error('Error fetching exams:', error);
                setDatas([]);
                setDisplayDatas([]);
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
            });
    };

    useEffect(() => {
        getExams();

        // Lấy danh sách groups
        http.get('/groups')
            .then((res) => {
                setGroups(
                    res.data.map((group: { id: string; name: string }) => ({
                        value: group.id,
                        label: group.name
                    }))
                );
            })
            .catch((error) => {
                console.error('Error fetching groups:', error);
            });

        // Lấy danh sách exercises
        http.get('/exercises')
            .then((res) => {
                setExercises(
                    res.data.map((exercise: { id: string; title?: string; code?: string }) => ({
                        value: exercise.id,
                        label: exercise.title || exercise.code || ''
                    }))
                );
            })
            .catch((error) => {
                console.error('Error fetching exercises:', error);
            });
    }, []);

    useEffect(() => {
        if (!globalStore.isDetailPopupOpen) {
            form.resetFields();
            setUpdateId(null);
            setEditingRecord(null);
        } else if (editingRecord && updateId) {
            // Set giá trị form khi modal mở và có record cần edit
            setTimeout(() => {
                form.setFieldsValue({
                    title: editingRecord.title,
                    description: editingRecord.description,
                    startTime: editingRecord.startTime ? dayjs(editingRecord.startTime) : null,
                    endTime: editingRecord.endTime ? dayjs(editingRecord.endTime) : null,
                    groupIds: editingRecord.groups?.map((g) => g.id) || [],
                    exerciseIds: editingRecord.exercises?.map((e) => e.id) || []
                });
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalStore.isDetailPopupOpen, editingRecord, updateId]);

    // Filter data based on active tab
    const filterDataByTab = (dataList: ExamData[]) => {
        const now = dayjs();
        let filtered = dataList;

        switch (activeTab) {
            case 'upcoming':
                filtered = dataList.filter((data) => {
                    const startTime = data.startTime ? dayjs(data.startTime) : null;
                    return startTime && startTime.isAfter(now);
                });
                break;
            case 'ongoing':
                filtered = dataList.filter((data) => {
                    const startTime = data.startTime ? dayjs(data.startTime) : null;
                    const endTime = data.endTime ? dayjs(data.endTime) : null;
                    return (
                        startTime &&
                        endTime &&
                        (startTime.isBefore(now) || startTime.isSame(now)) &&
                        endTime.isAfter(now)
                    );
                });
                break;
            case 'completed':
                filtered = dataList.filter((data) => {
                    const endTime = data.endTime ? dayjs(data.endTime) : null;
                    return endTime && endTime.isBefore(now);
                });
                break;
            case 'all':
            default:
                filtered = dataList;
                break;
        }

        // Apply search filter
        if (search) {
            filtered = filtered.filter(
                (data: ExamData) =>
                    (data?.title || '').toLowerCase().includes(search.toLowerCase()) ||
                    (data?.description || '').toLowerCase().includes(search.toLowerCase())
            );
        }

        return filtered;
    };

    useEffect(() => {
        const filtered = filterDataByTab(datas);
        setDisplayDatas(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, datas, activeTab]);

    return (
        <div className={classnames('exams', { 'p-24': globalStore.isBelow1300 })}>
            <div className="header">
                <div className="title">
                    Bài thi
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Button type="primary" onClick={() => globalStore.setOpenDetailPopup(true)}>
                            Tạo bài thi
                        </Button>
                    </ProtectedElement>
                </div>
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
                        placeholder="Tìm kiếm theo Tiêu đề, Mô tả"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Line width={0} height={0} text="Quản lý" center />
                        <Button onClick={() => globalStore.setOpenDetailPopup(true)}>Tạo mới</Button>
                    </ProtectedElement>
                </div>
                <div className="body">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'all',
                                label: 'Tất cả'
                            },
                            {
                                key: 'upcoming',
                                label: 'Sắp tới'
                            },
                            {
                                key: 'ongoing',
                                label: 'Đang diễn ra'
                            },
                            {
                                key: 'completed',
                                label: 'Đã kết thúc'
                            }
                        ]}
                        style={{ marginBottom: 16 }}
                    />
                    <LoadingOverlay loading={loading}>
                        <Table
                            rowKey="id"
                            scroll={{ x: 800 }}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            dataSource={displayDatas}
                            columns={columns}
                            onRow={(record) => {
                                const now = dayjs();
                                const endTime = record.endTime ? dayjs(record.endTime) : null;
                                const isExpired = endTime && endTime.isBefore(now);
                                
                                return {
                                    onClick: () => {
                                        if (isExpired) {
                                            globalStore.triggerNotification('warning', 'Bài thi đã kết thúc, không thể làm bài!', '');
                                            return;
                                        }
                                        navigate(`/${routesConfig.exam}`.replace(':id', record.id));
                                    },
                                    className: isExpired ? 'expired-row' : '',
                                    style: isExpired ? { cursor: 'not-allowed' } : {}
                                };
                            }}
                        />
                    </LoadingOverlay>
                </div>
            </div>
            <Modal
                title={updateId ? 'Chỉnh sửa bài thi' : 'Tạo bài thi mới'}
                className="detail-modal"
                open={globalStore.isDetailPopupOpen}
                onCancel={() => globalStore.setOpenDetailPopup(false)}
                width={600}
                footer={null}
            >
                <div className="groups-form-content">
                    <Form
                        form={form}
                        name="exam-form"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        labelAlign="left"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Tiêu đề"
                            name="title"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <div className="flex gap">
                            <Form.Item
                                className="flex-1"
                                label="Thời gian bắt đầu"
                                name="startTime"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm"
                                    style={{ width: '100%' }}
                                    placeholder="Chọn thời gian bắt đầu"
                                />
                            </Form.Item>

                            <Form.Item
                                className="flex-1"
                                label="Thời gian kết thúc"
                                name="endTime"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc!' }]}
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm"
                                    style={{ width: '100%' }}
                                    placeholder="Chọn thời gian kết thúc"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="Nhóm"
                            name="groupIds"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 nhóm!' }]}
                        >
                            <Select
                                mode="multiple"
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="Chọn nhóm"
                                options={groups}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label="Bài tập"
                            name="exerciseIds"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 bài tập!' }]}
                        >
                            <Select
                                mode="multiple"
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="Chọn bài tập"
                                options={exercises}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>

                        <Form.Item label={null}>
                            <Button type="primary" htmlType="submit">
                                Tạo mới
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
});

export default Exams;
