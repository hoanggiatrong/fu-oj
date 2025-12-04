import { AppstoreAddOutlined, FilterOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, Popover, Tabs, Tag, Select, DatePicker, Switch } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import ExamFormModal from './components/ExamFormModal';
import ExamTable from './components/ExamTable';
import type { ExamData, SelectOption } from './types';
import { filterDataByTab, getExamStatus } from './utils';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import utils from '../../utils/utils';

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
    const [isFilterOpen, setFilterOpen]: any = useState(false);
    const [filters, setFilters] = useState({
        status: null,
        startTime: null,
        endTime: null
    });

    useEffect(() => {
        if (!authentication.isInstructor) {
            navigate(`/${routesConfig.groups}`);
        }
    }, [navigate]);

    if (!authentication.isInstructor) {
        return null;
    }

    const [form] = Form.useForm();

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilter = () => {
        const filtered = datas.filter((item: any) => {
            // const now = dayjs();
            const start = item.startTime ? dayjs(item.startTime) : null;
            const end = item.endTime ? dayjs(item.endTime) : null;

            if (filters.status) {
                const statusInfo = getExamStatus(item.startTime, item.endTime).status;
                if (statusInfo !== filters.status) return false;
            }

            if (filters.startTime) {
                if (!start || start.isBefore(dayjs(filters.startTime).startOf('day'))) return false;
            }

            // --- 3️⃣ Lọc theo ngày kết thúc (lọc <= ngày chọn) ---
            if (filters.endTime) {
                if (!end || end.isAfter(dayjs(filters.endTime).endOf('day'))) return false;
            }

            return true;
        });

        setDisplayDatas(filtered);
        setFilterOpen(false);
    };

    const onFinish: FormProps['onFinish'] = (values) => {
        const payload = {
            title: values.title,
            description: values.description,
            startTime: values.startTime ? dayjs(values.startTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
            endTime: values.endTime ? dayjs(values.endTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
            timeLimit: values.timeLimit || null,
            status: values.status || 'DRAFT',
            groupIds: values.groupIds || [],
            exerciseIds: values.exerciseIds || []
        };

        if (updateId) {
            http.patch(updateId, '/exams', payload)
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

    const columns = useMemo(() => {
        const baseColumns: any = [
            {
                title: 'Tiêu đề',
                dataIndex: 'title',
                key: 'title',
                sorter: (a: ExamData, b: ExamData) => (a.title || '').localeCompare(b.title || ''),
                render: (title: string) => {
                    return (
                        <div className="cell">
                            <TooltipWrapper tooltipText={title} position="right">
                                <Highlighter
                                    highlightClassName="highlight"
                                    searchWords={[search]}
                                    autoEscape={true}
                                    textToHighlight={title || ''}
                                />
                            </TooltipWrapper>
                        </div>
                    );
                }
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                key: 'description',
                render: (description: string) => {
                    return (
                        <div className="cell">
                            <Highlighter
                                highlightClassName="highlight"
                                searchWords={[search]}
                                autoEscape={true}
                                textToHighlight={description || ''}
                            />
                        </div>
                    );
                }
            },
            {
                title: 'Thời gian bắt đầu',
                dataIndex: 'startTime',
                key: 'startTime',
                sorter: (a: any, b: any) => {
                    const timeA = a.startTime ? dayjs(a.startTime).valueOf() : 0;
                    const timeB = b.startTime ? dayjs(b.startTime).valueOf() : 0;
                    return timeA - timeB;
                },
                render: (startTime: string) => {
                    return <div className="cell">{startTime ? dayjs(startTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
                }
            },
            {
                title: 'Thời gian kết thúc',
                dataIndex: 'endTime',
                key: 'endTime',
                sorter: (a: any, b: any) => {
                    const timeA = a.endTime ? dayjs(a.endTime).valueOf() : 0;
                    const timeB = b.endTime ? dayjs(b.endTime).valueOf() : 0;
                    return timeA - timeB;
                },
                render: (endTime: string) => {
                    return <div className="cell">{endTime ? dayjs(endTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
                }
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (_: unknown, record: ExamData) => {
                    const statusInfo = getExamStatus(record.startTime, record.endTime);
                    return (
                        <div className="cell">
                            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                        </div>
                    );
                }
            }
        ];

        // // Chỉ hiển thị cột "Số nhóm" cho instructor
        // if (authentication.isInstructor) {
        //     baseColumns.push({
        //         title: 'Số nhóm',
        //         dataIndex: 'groups',
        //         key: 'groups',
        //         render: (_: unknown, record: ExamData) => {
        //             return <div className="cell">{record.groups ? record.groups.length : 0}</div>;
        //         }
        //     });
        // }

        baseColumns.push({
            title: <div className="flex flex-end">Số bài tập</div>,
            dataIndex: 'exercises',
            key: 'exercises',
            render: (_: unknown, record: ExamData) => {
                return (
                    <div className="cell flex flex-center pr-16">{record.exercises ? record.exercises.length : 0}</div>
                );
            }
        });

        if (authentication.isInstructor) {
            baseColumns.push({
                title: 'Cho phép làm',
                dataIndex: 'isExamined',
                key: 'isExamined',
                render: (isExamined: boolean, record: ExamData) => {
                    const statusInfo = getExamStatus(record.startTime, record.endTime);

                    return (
                        <div className="cell flex flex-end pr-16">
                            <Switch
                                disabled={statusInfo.status == 'completed'}
                                defaultChecked={isExamined}
                                onChange={(value) => {
                                    http.patchV2(record.id, `/exams/${record.id}/toggle-examined`, {}).then(() => {
                                        globalStore.triggerNotification(
                                            !value ? 'warning' : 'success',
                                            `Bài thi "${record?.title?.toUpperCase()}" đang ${
                                                !value ? 'không diễn ra' : 'diễn ra'
                                            }`,
                                            ''
                                        );
                                    });
                                }}
                            />
                        </div>
                    );
                }
            });
        }

        return baseColumns;
    }, [search]);

    const getExams = () => {
        setLoading(true);
        http.get('/exams?pageSize=9999999')
            .then((res) => {
                setDatas(res.data?.filter((d: any) => !d.deletedTimestamp) || []);
                setDisplayDatas(res.data?.filter((d: any) => !d.deletedTimestamp) || []);
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
        http.get('/exercises?pageSize=9999999')
            .then((res) => {
                let exercises = res.data;

                exercises = exercises.filter((e: any) => !(e.visibility == 'DRAFT'));

                setExercises(
                    exercises.map((exercise: any) => ({
                        value: exercise.id,
                        label: exercise.title || exercise.code || '',
                        ...exercise
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
        navigate(`/${routesConfig.exam}`.replace(':id', record.id));
    };

    const handleEdit = (record: ExamData) => {
        setUpdateId(record.id);
        setEditingRecord(record);
        globalStore.setOpenDetailPopup(true);
    };

    const handleCopy = (record: ExamData) => {
        form.setFieldsValue({
            title: `${record.title}`,
            description: record.description,
            startTime: null,
            endTime: null,
            timeLimit: (record as ExamData & { timeLimit?: number | null }).timeLimit || null,
            groupIds: record.groups?.map((g) => g.id) || [],
            exerciseIds: record.exercises?.map((e) => e.id) || []
        });
        globalStore.setOpenDetailPopup(true);
    };

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('exams left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">Bài thi</div>
                    <div className="description">
                        Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị
                        trí "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                    </div>
                </div>
                <div
                    className={classnames('wrapper flex', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filters">
                        <Input
                            value={search}
                            placeholder="Tìm kiếm theo Tiêu đề, Mô tả"
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <TooltipWrapper tooltipText="Bộ lọc" position="top">
                            <Popover
                                content={
                                    <div className="custom-pop-content">
                                        <div className="filter-container">
                                            <div className="filter-name">Trạng thái</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn độ khó"
                                                onChange={(value) => handleFilterChange('status', value)}
                                                options={[
                                                    { value: 'upcoming', label: 'Sắp diễn ra' },
                                                    { value: 'ongoing', label: 'Đang diễn ra' },
                                                    { value: 'completed', label: 'Đã kết thúc' }
                                                ]}
                                            />
                                        </div>

                                        <div className="filter-container">
                                            <div className="filter-name">Thời gian bắt đầu</div>
                                            <DatePicker
                                                className="max-width"
                                                onChange={(value) => handleFilterChange('startTime', value)}
                                            />
                                        </div>

                                        <div className="filter-container">
                                            <div className="filter-name">Thời gian kết thúc</div>
                                            <DatePicker
                                                className="max-width"
                                                onChange={(value) => handleFilterChange('endTime', value)}
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

                        <div className="group-create">
                            <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                <div className="custom-btn-ico" onClick={() => globalStore.setOpenDetailPopup(true)}>
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                    Tạo bài thi
                                </div>
                            </ProtectedElement>
                        </div>
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
                            <ExamTable
                                columns={columns}
                                displayDatas={displayDatas}
                                loading={loading}
                                onRowClick={handleRowClick}
                                onEdit={handleEdit}
                                onCopy={handleCopy}
                                onRefresh={getExams}
                            />
                        </LoadingOverlay>
                    </div>
                </div>
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
            <div className="right">
                <CustomCalendar dateArr={utils.getDates()} />
            </div>
        </div>
    );
});

export default Exams;
