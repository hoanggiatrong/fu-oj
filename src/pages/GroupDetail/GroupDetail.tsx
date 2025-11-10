import { DeleteOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Form, Input, Modal, Popconfirm, Table, Select, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import { useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';

const GroupDetail = observer(() => {
    const { id } = useParams();

    const [form] = Form.useForm();
    const [formAddExercise] = Form.useForm();
    const [searchName, setSearchName]: any = useState();
    const [datas, setDatas]: any = useState([]);
    datas;
    const [displayDatas, setDisplayDatas]: any = useState([]);
    const [search, setSearch]: any = useState('');
    setSearch;
    const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [exams, setExams] = useState<any[]>([]);
    const [groupExams, setGroupExams] = useState<any[]>([]);
    const [exercises, setExercises] = useState<any[]>([]);
    const [allExercises, setAllExercises] = useState<any[]>([]);
    const [tabs, setTabs] = useState<Array<{ key: string; label: string; type: string }>>([]);
    const [activeTabKey, setActiveTabKey] = useState<string>('members');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [examRankings, setExamRankings] = useState<any[]>([]);
    const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
    const [loadingGroupExams, setLoadingGroupExams] = useState(false);

    const columns = [
        {
            title: 'ID',
            key: 'index',
            render: (_: any, __: any, index: any) => index + 1,
            width: 50
        },
        {
            title: 'ID Photo',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (avatar: string) => {
                return <Avatar src={avatar || '/sources/thaydat.jpg'} />;
            },
            width: 100
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'rollNumber',
            key: 'rollNumber',
            sorter: (a: any, b: any) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
            render: (rollNumber: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={rollNumber || 'HE123456'}
                    />
                );
            }
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: any, b: any) => (a.email || '').localeCompare(b.email || ''),
            render: (email: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={email}
                    />
                );
            }
        },
        {
            title: 'Họ và tên',
            dataIndex: 'firstName',
            key: 'firstName',
            // sorter: (a: any, b: any) => (a.email || '').localeCompare(b.email || ''),
            render: (firstName: any, record: any) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={firstName + ' ' + record.lastName}
                    />
                );
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (actions: any) => {
                actions;
                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    // title="Are you sure you want to delete this exercise?"
                                    title="Bạn có chắc chắn muốn xóa sinh viên này khỏi nhóm?"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        // http.deleteById('/exercises', record.id).then((res) => {
                                        //     globalStore.triggerNotification(
                                        //         'success',
                                        //         res.message || 'Delete successfully!',
                                        //         ''
                                        //     );
                                        //     getExercises();
                                        // });
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

    const getStudentByGroupId = () => {
        http.get(`/groups/${id}/students`).then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    const getExamsByGroupId = () => {
        if (!id) return;
        http.get(`/exams?page=1&size=10&sort=createdTimestamp,desc&groupId=${id}`)
            .then((res) => {
                setExams(res.data?.content || res.data || []);
            })
            .catch((error) => {
                console.error('Error fetching exams:', error);
                setExams([]);
            });
    };

    const getExercisesByGroupId = () => {
        if (!id) return;
        http.get(`/groups/${id}/exercises`)
            .then((res) => {
                setExercises(res.data || []);
            })
            .catch((error) => {
                console.error('Error fetching exercises:', error);
                setExercises([]);
            });
    };

    const getAllExercises = () => {
        http.get('/exercises')
            .then((res) => {
                setAllExercises(res.data || []);
            })
            .catch((error) => {
                console.error('Error fetching all exercises:', error);
                setAllExercises([]);
            });
    };

    const getExamRankings = (examId: string) => {
        http.get(`/exam-rankings?examId=${examId}`)
            .then((res) => {
                setExamRankings(res.data || []);
            })
            .catch((error) => {
                console.error('Error fetching exam rankings:', error);
                setExamRankings([]);
            });
    };

    const getExamsForGroup = () => {
        if (!id) return;
        
        // Check if tab already exists, if yes just switch to it and refresh data
        const existingTab = tabs.find((tab) => tab.type === 'groupExams');
        if (existingTab) {
            setActiveTabKey(existingTab.key);
        }
        
        setLoadingGroupExams(true);
        http.get(`/exams?page=1&size=10&sort=createdTimestamp,desc&groupId=${id}`)
            .then((res) => {
                const examData = res.data?.content || res.data || [];
                setGroupExams(examData);
                setLoadingGroupExams(false);
                // Mở tab sau khi fetch xong (chỉ nếu chưa tồn tại)
                if (!existingTab) {
                    openTab('groupExams', 'Exam cho nhóm');
                }
            })
            .catch((error) => {
                console.error('Error fetching exams for group:', error);
                setGroupExams([]);
                setLoadingGroupExams(false);
                globalStore.triggerNotification('error', 'Không thể tải danh sách exam!', '');
            });
    };

    const onAdd: FormProps['onFinish'] = (values) => {
        console.log('Success:', values);

        const code = values.joinCode;

        if (code) {
            http.post(`/groups/join`, { code: code })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                })
                .finally(() => {
                    getStudentByGroupId(); // Always update enroll state
                    setAddMemberDialogOpen(false);
                });
        }
    };

    const onAddFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const onAddExercise: FormProps['onFinish'] = (values) => {
        if (!id) return;
        const exerciseIds = values.exerciseIds || [];
        http.post(`/groups/${id}/exercises`, { exerciseIds })
            .then((res) => {
                globalStore.triggerNotification('success', res.message || 'Thêm bài tập thành công!', '');
                getExercisesByGroupId();
                setIsAddExerciseOpen(false);
                formAddExercise.resetFields();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
            });
    };

    // Initialize with members tab
    useEffect(() => {
        setTabs([{ key: 'members', label: 'Thành viên', type: 'members' }]);
        setActiveTabKey('members');
    }, []);

    useEffect(() => {
        if (id) {
            getStudentByGroupId();
            getExamsByGroupId();
            getExercisesByGroupId();
            getAllExercises();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const openTab = (type: string, label: string) => {
        // Check if tab with this type already exists
        const existingTab = tabs.find((tab) => tab.type === type);
        if (existingTab) {
            // Tab already exists, just switch to it
            setActiveTabKey(existingTab.key);
            return;
        }
        // Create new tab
        const tabKey = `${type}-${Date.now()}`;
        const newTab = { key: tabKey, label, type };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabKey(tabKey);
    };

    const closeTab = (targetKey: string) => {
        const newTabs = tabs.filter((tab) => tab.key !== targetKey);
        setTabs(newTabs);
        if (targetKey === activeTabKey) {
            if (newTabs.length > 0) {
                setActiveTabKey(newTabs[newTabs.length - 1].key);
            } else {
                // If all tabs closed, open members tab
                setTabs([{ key: 'members', label: 'Thành viên', type: 'members' }]);
                setActiveTabKey('members');
            }
        }
    };

    const onEdit = (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
        if (action === 'remove' && typeof targetKey === 'string') {
            closeTab(targetKey);
        }
    };

    const renderTabContent = (tab: { key: string; label: string; type: string }) => {
        switch (tab.type) {
            case 'members':
                return (
                    <Table
                        rowKey="id"
                        scroll={{ x: 800 }}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        dataSource={displayDatas}
                        columns={columns}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    record;
                                }
                            };
                        }}
                    />
                );
            case 'exams':
                return (
                    <Table
                        rowKey="id"
                        dataSource={exams}
                        pagination={{ pageSize: 10 }}
                        columns={[
                            { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                            { title: 'Mô tả', dataIndex: 'description', key: 'description' },
                            {
                                title: 'Thời gian bắt đầu',
                                dataIndex: 'startTime',
                                key: 'startTime',
                                render: (time: string) => (time ? new Date(time).toLocaleString('vi-VN') : '-')
                            },
                            {
                                title: 'Thời gian kết thúc',
                                dataIndex: 'endTime',
                                key: 'endTime',
                                render: (time: string) => (time ? new Date(time).toLocaleString('vi-VN') : '-')
                            },
                            { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
                        ]}
                    />
                );
            case 'submissions':
                return (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Select
                                placeholder="Chọn bài kiểm tra"
                                style={{ width: '100%' }}
                                onChange={(value) => {
                                    setSelectedExamId(value);
                                    getExamRankings(value);
                                }}
                                value={selectedExamId}
                            >
                                {exams.map((exam) => (
                                    <Select.Option key={exam.id} value={exam.id}>
                                        {exam.title}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        {selectedExamId && (
                            <Table
                                rowKey="id"
                                dataSource={examRankings}
                                pagination={{ pageSize: 10 }}
                                columns={[
                                    {
                                        title: 'Tên sinh viên',
                                        key: 'studentName',
                                        render: (_: any, record: any) => {
                                            const firstName = record.user?.firstName || '';
                                            const lastName = record.user?.lastName || '';
                                            const fullName = `${firstName} ${lastName}`.trim();
                                            return fullName || record.user?.email || '-';
                                        }
                                    },
                                    {
                                        title: 'Điểm',
                                        key: 'score',
                                        render: (_: any, record: any) => {
                                            return record.totalScore !== null && record.totalScore !== undefined
                                                ? record.totalScore.toFixed(1)
                                                : '-';
                                        }
                                    },
                                    {
                                        title: 'Thời gian nộp',
                                        key: 'submittedAt',
                                        render: (_: any, record: any) => {
                                            const time = record.updatedTimestamp || record.createdTimestamp;
                                            return time ? new Date(time).toLocaleString('vi-VN') : '-';
                                        }
                                    }
                                ]}
                            />
                        )}
                    </div>
                );
            case 'exercises':
                return (
                    <Table
                        rowKey="id"
                        dataSource={exercises}
                        pagination={{ pageSize: 10 }}
                        columns={[
                            { title: 'Mã bài tập', dataIndex: 'code', key: 'code' },
                            { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                            { title: 'Mô tả', dataIndex: 'description', key: 'description' }
                        ]}
                    />
                );
            case 'groupExams':
                return (
                    <Table
                        rowKey="id"
                        loading={loadingGroupExams}
                        dataSource={groupExams}
                        pagination={{ pageSize: 10 }}
                        columns={[
                            { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                            { title: 'Mô tả', dataIndex: 'description', key: 'description' },
                            {
                                title: 'Thời gian bắt đầu',
                                dataIndex: 'startTime',
                                key: 'startTime',
                                render: (time: string) => (time ? new Date(time).toLocaleString('vi-VN') : '-')
                            },
                            {
                                title: 'Thời gian kết thúc',
                                dataIndex: 'endTime',
                                key: 'endTime',
                                render: (time: string) => (time ? new Date(time).toLocaleString('vi-VN') : '-')
                            },
                            { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
                        ]}
                    />
                );
            default:
                return null;
        }
    };

    const tabItems: TabsProps['items'] = useMemo(() => {
        return tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: renderTabContent(tab),
            closable: tab.key !== 'members' // Members tab cannot be closed
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabs, displayDatas, exams, groupExams, exercises, examRankings, selectedExamId, loadingGroupExams]);

    return (
        <div className="group-detail">
            <div className="header">
                <div className="title">
                    Nhóm
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Button type="primary" onClick={() => globalStore.setOpenDetailPopup(true)}>
                            Thêm thành viên
                        </Button>
                    </ProtectedElement>
                </div>
                <div className="description">
                    <div className="owner">
                        <Avatar src={'/sources/thaydat.jpg'} />
                        Nhóm thầy Đạt
                    </div>
                    {/* Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end". */}
                </div>
            </div>
            <div className="actions">
                <div className="search">
                    <Input
                        placeholder="Tìm thành viên"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="action-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Button type="primary" onClick={() => openTab('exams', 'Bài kiểm tra')}>
                            Xem bài kiểm tra
                        </Button>
                    </ProtectedElement>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Button type="primary" onClick={() => openTab('submissions', 'Bài nộp')}>
                            Xem bài nộp
                        </Button>
                    </ProtectedElement>
                    <Button type="primary" onClick={getExamsForGroup} loading={loadingGroupExams}>
                        Get exam cho group
                    </Button>
                    <Button type="primary" onClick={() => openTab('exercises', 'Bài tập')}>
                        Xem bài tập
                    </Button>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Button type="primary" onClick={() => setIsAddExerciseOpen(true)}>
                            Thêm bài tập cho nhóm
                        </Button>
                    </ProtectedElement>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Button type="primary" onClick={() => setAddMemberDialogOpen(true)}>
                            Thêm thành viên
                        </Button>
                    </ProtectedElement>
                </div>
            </div>
            <div className="body">
                <Tabs
                    activeKey={activeTabKey}
                    onChange={setActiveTabKey}
                    type="editable-card"
                    onEdit={onEdit}
                    items={tabItems}
                    hideAdd
                />
            </div>
            <Modal
                title={`Tham gia nhóm`}
                className="detail-modal"
                open={isAddMemberDialogOpen}
                onCancel={() => setAddMemberDialogOpen(false)}
                width={420}
            >
                <div className="groups-form-content">
                    <Form
                        form={form}
                        name="basic"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        labelAlign="left"
                        initialValues={{ remember: true }}
                        onFinish={onAdd}
                        onFinishFailed={onAddFailed}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Mã tham gia"
                            name="joinCode"
                            rules={[{ required: true, message: 'Vui lòng nhập mã tham gia!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item label={null}>
                            <Button type="primary" htmlType="submit">
                                Tham gia
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>

            {/* Modal Thêm bài tập cho nhóm */}
            <Modal
                title="Thêm bài tập cho nhóm"
                open={isAddExerciseOpen}
                onCancel={() => {
                    setIsAddExerciseOpen(false);
                    formAddExercise.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={formAddExercise}
                    name="addExercise"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                    onFinish={onAddExercise}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Chọn bài tập"
                        name="exerciseIds"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một bài tập!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn bài tập"
                            style={{ width: '100%' }}
                            options={allExercises.map((exercise) => ({
                                value: exercise.id,
                                label: `${exercise.code} - ${exercise.title}`
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label={null}>
                        <Button type="primary" htmlType="submit">
                            Thêm bài tập
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
});

export default GroupDetail;
