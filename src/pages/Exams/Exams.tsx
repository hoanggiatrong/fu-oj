import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import { Button, Input, Form, Tabs, Tag } from 'antd';
import type { FormProps } from 'antd';
import Line from '../../components/Line/Line';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import type { ExamData, SelectOption } from './types';
import { getExamStatus, filterDataByTab } from './utils';
import ExamTable from './components/ExamTable';
import ExamFormModal from './components/ExamFormModal';
import ConfirmStartExamModal from './components/ConfirmStartExamModal';

dayjs.extend(utc);
dayjs.extend(timezone);

const Exams = observer(() => {
    const navigate = useNavigate();
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState<ExamData[]>([]);
    const [displayDatas, setDisplayDatas] = useState<ExamData[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);
    const [exercises, setExercises] = useState<SelectOption[]>([]);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<ExamData | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const [form] = Form.useForm();

    const handleConfirmStartExam = async () => {
        if (!selectedExamId) return;
        
        try {
            const userId = authentication.account?.data?.id;
            if (!userId) {
                globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
                setConfirmModalOpen(false);
                setSelectedExamId(null);
                return;
            }
            
            await http.post('/exam-rankings', {
                examId: selectedExamId,
                userId: userId
            });
            
            setConfirmModalOpen(false);
            setSelectedExamId(null);
            navigate(`/${routesConfig.exam}`.replace(':id', selectedExamId));
        } catch (error) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu làm bài!';
            globalStore.triggerNotification('error', errorMessage, '');
            setConfirmModalOpen(false);
            setSelectedExamId(null);
        }
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
        const filtered = filterDataByTab(datas, activeTab, search);
        setDisplayDatas(filtered);
    }, [search, datas, activeTab]);

    const handleRowClick = (record: ExamData) => {
        // Instructor: navigate trực tiếp
        if (authentication.isInstructor) {
            navigate(`/${routesConfig.exam}`.replace(':id', record.id));
            return;
        }
        
        // Student hoặc user khác: hiện cảnh báo trước khi làm bài
        setSelectedExamId(record.id);
        setConfirmModalOpen(true);
    };

    const handleEdit = (record: ExamData) => {
        setUpdateId(record.id);
        setEditingRecord(record);
        globalStore.setOpenDetailPopup(true);
    };

    const handleCopy = (record: ExamData) => {
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
                    <ExamTable
                        columns={columns}
                        displayDatas={displayDatas}
                        loading={loading}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onCopy={handleCopy}
                        onRefresh={getExams}
                    />
                </div>
            </div>
            <ConfirmStartExamModal
                open={confirmModalOpen}
                onCancel={() => {
                    setConfirmModalOpen(false);
                    setSelectedExamId(null);
                }}
                onConfirm={handleConfirmStartExam}
            />
            <ExamFormModal
                open={globalStore.isDetailPopupOpen}
                updateId={updateId}
                editingRecord={editingRecord}
                groups={groups}
                exercises={exercises}
                onFinish={onFinish}
                form={form}
                setUpdateId={setUpdateId}
                setEditingRecord={setEditingRecord}
            />
        </div>
    );
});

export default Exams;
