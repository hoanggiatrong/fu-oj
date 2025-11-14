import { AppstoreAddOutlined, FilterOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, Popover, Table, Tabs, Tag, Select, DatePicker } from 'antd';
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
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import ConfirmStartExamModal from './components/ConfirmStartExamModal';
import ExamFormModal from './components/ExamFormModal';
import ExamTable from './components/ExamTable';
import type { ExamData, SelectOption } from './types';
import { filterDataByTab, getExamStatus } from './utils';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';

interface CompletedExamData {
    id: string;
    createdBy: string;
    createdTimestamp: string;
    updatedBy: string;
    updatedTimestamp: string;
    deletedTimestamp: string | null;
    user: {
        id: string;
        email: string;
        role: string;
    };
    exam: {
        examId: string;
        examCode: string;
        examTitle: string;
        startTime: number;
        endTime: number;
        userId: string;
        userName: string | null;
        submissions: unknown;
        totalScore: number | null;
        totalExercises: number | null;
        completedExercises: number | null;
        timeLimit: number | null;
    };
    totalScore: number | null;
    completed: boolean;
}

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
    const [selectedExamRecord, setSelectedExamRecord] = useState<ExamData | null>(null);
    const [completedExams, setCompletedExams] = useState<CompletedExamData[]>([]);
    const [loadingCompletedExams, setLoadingCompletedExams] = useState(false);
    const [ongoingExams, setOngoingExams] = useState<CompletedExamData[]>([]);
    const [loadingOngoingExams, setLoadingOngoingExams] = useState(false);
    const [examRankingsMap, setExamRankingsMap] = useState<Map<string, CompletedExamData>>(new Map());
    const [isFilterOpen, setFilterOpen]: any = useState(false);
    const [filters, setFilters] = useState({
        status: null,
        startTime: null,
        endTime: null
    });

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

    const handleConfirmStartExam = async () => {
        if (!selectedExamId) return;

        try {
            const userId = authentication.account?.data?.id;
            if (!userId) {
                globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
                setConfirmModalOpen(false);
                setSelectedExamId(null);
                setSelectedExamRecord(null);
                return;
            }

            // Lấy số lượng bài tập từ selectedExamRecord hoặc fetch lại nếu không có
            let numberOfExercises = 0;
            if (selectedExamRecord?.exercises) {
                numberOfExercises = selectedExamRecord.exercises.length;
            } else {
                // Nếu không có record, fetch lại exam detail
                try {
                    const examRes = await http.get(`/exams/${selectedExamId}`);
                    numberOfExercises = examRes.data?.exercises?.length || 0;
                } catch (err) {
                    console.error('Error fetching exam detail:', err);
                }
            }

            await http.post('/exam-rankings', {
                examId: selectedExamId,
                userId: userId,
                numberOfExercises: numberOfExercises
            });

            // Refresh exam rankings để cập nhật trạng thái làm bài
            if (!authentication.isInstructor) {
                http.get(`/exam-rankings?userId=${userId}`)
                    .then((res) => {
                        const map = new Map<string, CompletedExamData>();
                        (res.data || []).forEach((exam: CompletedExamData) => {
                            map.set(exam.exam.examId, exam);
                        });
                        setExamRankingsMap(map);
                    })
                    .catch((error) => {
                        console.error('Error refreshing exam rankings:', error);
                    });
            }

            setConfirmModalOpen(false);
            setSelectedExamId(null);
            setSelectedExamRecord(null);
            navigate(`/${routesConfig.exam}`.replace(':id', selectedExamId));
        } catch (error) {
            const errorMessage =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Có lỗi xảy ra khi bắt đầu làm bài!';
            globalStore.triggerNotification('error', errorMessage, '');
            setConfirmModalOpen(false);
            setSelectedExamId(null);
            setSelectedExamRecord(null);
        }
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
        const baseColumns = [
            {
                title: 'Tiêu đề',
                dataIndex: 'title',
                key: 'title',
                sorter: (a: ExamData, b: ExamData) => (a.title || '').localeCompare(b.title || ''),
                render: (title: string) => {
                    return (
                        <div className="cell">
                            <Highlighter
                                highlightClassName="highlight"
                                searchWords={[search]}
                                autoEscape={true}
                                textToHighlight={title || ''}
                            />
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

        // Chỉ hiển thị cột "Số nhóm" cho instructor
        if (authentication.isInstructor) {
            baseColumns.push({
                title: 'Số nhóm',
                dataIndex: 'groups',
                key: 'groups',
                render: (_: unknown, record: ExamData) => {
                    return <div className="cell">{record.groups ? record.groups.length : 0}</div>;
                }
            });
        }

        baseColumns.push({
            title: 'Số bài tập',
            dataIndex: 'exercises',
            key: 'exercises',
            render: (_: unknown, record: ExamData) => {
                return <div className="cell">{record.exercises ? record.exercises.length : 0}</div>;
            }
        });

        // Thêm cột "Trạng thái làm bài của sinh viên" chỉ cho sinh viên
        if (!authentication.isInstructor) {
            baseColumns.push({
                title: 'Trạng thái làm bài',
                dataIndex: 'studentStatus',
                key: 'studentStatus',
                render: (_: unknown, record: ExamData) => {
                    const examRanking = examRankingsMap.get(record.id);
                    if (!examRanking) {
                        return (
                            <div className="cell">
                                <Tag color="default">Chưa bắt đầu</Tag>
                            </div>
                        );
                    }
                    if (examRanking.completed) {
                        return (
                            <div className="cell">
                                <Tag color="green">Đã hoàn thành</Tag>
                            </div>
                        );
                    }
                    return (
                        <div className="cell">
                            <Tag color="orange">Đang làm</Tag>
                        </div>
                    );
                }
            });
        }

        return baseColumns;
    }, [search, examRankingsMap]);

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

        // Lấy exam rankings cho sinh viên để hiển thị trạng thái làm bài
        if (!authentication.isInstructor) {
            const userId = authentication.account?.data?.id;
            if (userId) {
                http.get(`/exam-rankings?userId=${userId}`)
                    .then((res) => {
                        const map = new Map<string, CompletedExamData>();
                        (res.data || []).forEach((exam: CompletedExamData) => {
                            map.set(exam.exam.examId, exam);
                        });
                        setExamRankingsMap(map);
                    })
                    .catch((error) => {
                        console.error('Error fetching exam rankings:', error);
                    });
            }
        }
    }, []);

    useEffect(() => {
        const filtered = filterDataByTab(datas, activeTab, search);
        setDisplayDatas(filtered);
    }, [search, datas, activeTab]);

    // Tự động load dữ liệu khi chuyển sang tab "Bài đã làm"
    useEffect(() => {
        if (activeTab === 'completed-exams' && !authentication.isInstructor) {
            const loadCompletedExams = async () => {
                setLoadingCompletedExams(true);

                try {
                    const userId = authentication.account?.data?.id;
                    if (!userId) {
                        setLoadingCompletedExams(false);
                        return;
                    }

                    const response = await http.get(`/exam-rankings?userId=${userId}`);
                    // Lọc những bài đã hoàn thành (completed = true)
                    const completed = (response.data || []).filter((exam: CompletedExamData) => {
                        return exam.completed === true;
                    });
                    setCompletedExams(completed);
                } catch (error) {
                    console.error('Error fetching completed exams:', error);
                    globalStore.triggerNotification('error', 'Không thể tải danh sách bài đã làm!', '');
                    setCompletedExams([]);
                } finally {
                    setLoadingCompletedExams(false);
                }
            };

            loadCompletedExams();
        }
    }, [activeTab]);

    // Tự động load dữ liệu khi chuyển sang tab "Bài đang làm"
    useEffect(() => {
        if (activeTab === 'ongoing-exams' && !authentication.isInstructor) {
            const loadOngoingExams = async () => {
                setLoadingOngoingExams(true);

                try {
                    const userId = authentication.account?.data?.id;
                    if (!userId) {
                        setLoadingOngoingExams(false);
                        return;
                    }

                    const response = await http.get(`/exam-rankings?userId=${userId}`);
                    // Lọc những bài đang làm (completed = false)
                    const ongoing = (response.data || []).filter((exam: CompletedExamData) => {
                        return exam.completed === false;
                    });
                    setOngoingExams(ongoing);
                } catch (error) {
                    console.error('Error fetching ongoing exams:', error);
                    globalStore.triggerNotification('error', 'Không thể tải danh sách bài đang làm!', '');
                    setOngoingExams([]);
                } finally {
                    setLoadingOngoingExams(false);
                }
            };

            loadOngoingExams();
        }
    }, [activeTab]);

    const handleRowClick = async (record: ExamData) => {
        // Instructor: navigate trực tiếp
        if (authentication.isInstructor) {
            navigate(`/${routesConfig.exam}`.replace(':id', record.id));
            return;
        }

        // Student hoặc user khác: check xem đã làm bài chưa
        const userId = authentication.account?.data?.id;
        if (!userId) {
            globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
            return;
        }

        // Kiểm tra trạng thái bài thi
        const examStatus = getExamStatus(record.startTime, record.endTime);
        
        // Nếu bài thi đã kết thúc, chỉ cho phép xem kết quả (nếu đã làm)
        if (examStatus.status === 'completed') {
            try {
                const res = await http.get(`/exam-rankings?userId=${userId}&examId=${record.id}`);
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    // Đã làm bài, chuyển sang trang kết quả
                    navigate(`/${routesConfig.examResult}`.replace(':examId', record.id));
                } else {
                    globalStore.triggerNotification('info', 'Bài thi đã kết thúc và bạn chưa tham gia!', '');
                }
            } catch (error) {
                console.error('Error checking exam ranking:', error);
                globalStore.triggerNotification('info', 'Bài thi đã kết thúc và bạn chưa tham gia!', '');
            }
            return;
        }

        try {
            // Check xem user đã làm bài thi này chưa
            const res = await http.get(`/exam-rankings?userId=${userId}&examId=${record.id}`);

            // Nếu đã có data (đã join/làm bài), navigate thẳng
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                navigate(`/${routesConfig.exam}`.replace(':id', record.id));
                return;
            }

            // Nếu chưa có data, mở popup xác nhận (cho cả bài "sắp tới" và "đang diễn ra")
            setSelectedExamId(record.id);
            setSelectedExamRecord(record);
            setConfirmModalOpen(true);
        } catch (error) {
            // Nếu có lỗi, vẫn mở popup để user có thể thử lại
            console.error('Error checking exam ranking:', error);
            setSelectedExamId(record.id);
            setSelectedExamRecord(record);
            setConfirmModalOpen(true);
        }
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
            timeLimit: (record as ExamData & { timeLimit?: number | null }).timeLimit || null,
            groupIds: record.groups?.map((g) => g.id) || [],
            exerciseIds: record.exercises?.map((e) => e.id) || []
        });
        globalStore.setOpenDetailPopup(true);
    };

    // const handleViewCompletedExams = () => {
    //     setActiveTab('completed-exams');
    // };

    const handleViewExamDetail = (examId: string, isCompleted: boolean = false) => {
        if (isCompleted) {
            navigate(`/${routesConfig.examResult}`.replace(':examId', examId));
            return;
        }

        navigate(`/${routesConfig.exam}`.replace(':id', examId));
    };

    const completedExamsColumns = [
        {
            title: 'Mã bài thi',
            dataIndex: ['exam', 'examCode'],
            key: 'examCode',
            render: (examCode: string) => {
                return <div className="cell">{examCode}</div>;
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: ['exam', 'examTitle'],
            key: 'examTitle',
            render: (examTitle: string) => {
                return <div className="cell">{examTitle}</div>;
            }
        },
        {
            title: 'Điểm số',
            dataIndex: 'totalScore',
            key: 'totalScore',
            render: (score: number | null) => {
                return <div className="cell">{score !== null ? score.toFixed(1) : '-'}</div>;
            }
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: ['exam', 'startTime'],
            key: 'startTime',
            render: (startTime: number) => {
                return <div className="cell">{startTime ? dayjs.unix(startTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
            }
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: ['exam', 'endTime'],
            key: 'endTime',
            render: (endTime: number) => {
                return <div className="cell">{endTime ? dayjs.unix(endTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: unknown, record: CompletedExamData) => {
                return (
                    <div className="cell">
                        <Button type="link" onClick={() => handleViewExamDetail(record.exam.examId, true)}>
                            Xem kết quả
                        </Button>
                    </div>
                );
            }
        }
    ];

    const ongoingExamsColumns = [
        {
            title: 'Mã bài thi',
            dataIndex: ['exam', 'examCode'],
            key: 'examCode',
            render: (examCode: string) => {
                return <div className="cell">{examCode}</div>;
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: ['exam', 'examTitle'],
            key: 'examTitle',
            render: (examTitle: string) => {
                return <div className="cell">{examTitle}</div>;
            }
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: ['exam', 'startTime'],
            key: 'startTime',
            render: (startTime: number) => {
                return <div className="cell">{startTime ? dayjs.unix(startTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
            }
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: ['exam', 'endTime'],
            key: 'endTime',
            render: (endTime: number) => {
                return <div className="cell">{endTime ? dayjs.unix(endTime).format('DD/MM/YYYY HH:mm') : '-'}</div>;
            }
        },
        {
            title: 'Thời gian làm bài',
            dataIndex: ['exam', 'timeLimit'],
            key: 'timeLimit',
            render: (timeLimit: number | null) => {
                return <div className="cell">{timeLimit !== null ? `${timeLimit} phút` : '-'}</div>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: unknown, record: CompletedExamData) => {
                return (
                    <div className="cell">
                        <Button type="link" onClick={() => handleViewExamDetail(record.exam.examId)}>
                            Tiếp tục làm bài
                        </Button>
                    </div>
                );
            }
        }
    ];

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

                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Tạo bài thi" position="top">
                                <div className="custom-circle-ico" onClick={() => globalStore.setOpenDetailPopup(true)}>
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                </div>
                            </TooltipWrapper>
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
                                },
                                ...(!authentication.isInstructor
                                    ? [
                                          {
                                              key: 'ongoing-exams',
                                              label: 'Bài đang làm'
                                          },
                                          {
                                              key: 'completed-exams',
                                              label: 'Bài đã làm'
                                          }
                                      ]
                                    : [])
                            ]}
                            style={{ marginBottom: 16 }}
                        />
                        <LoadingOverlay loading={loading}>
                            {activeTab === 'ongoing-exams' ? (
                                <Table
                                    columns={ongoingExamsColumns}
                                    dataSource={ongoingExams}
                                    rowKey="id"
                                    loading={loadingOngoingExams}
                                    pagination={{ pageSize: 10 }}
                                    rowClassName={(record, index) => {
                                        record;
                                        return index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
                                    }}
                                />
                            ) : activeTab === 'completed-exams' ? (
                                <Table
                                    columns={completedExamsColumns}
                                    dataSource={completedExams}
                                    rowKey="id"
                                    loading={loadingCompletedExams}
                                    pagination={{ pageSize: 10 }}
                                    rowClassName={(record, index) => {
                                        record;
                                        return index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
                                    }}
                                />
                            ) : (
                                <ExamTable
                                    columns={columns}
                                    displayDatas={displayDatas}
                                    loading={loading}
                                    onRowClick={handleRowClick}
                                    onEdit={handleEdit}
                                    onCopy={handleCopy}
                                    onRefresh={getExams}
                                />
                            )}
                        </LoadingOverlay>
                    </div>
                </div>
                <ConfirmStartExamModal
                    open={confirmModalOpen}
                    onCancel={() => {
                        setConfirmModalOpen(false);
                        setSelectedExamId(null);
                        setSelectedExamRecord(null);
                    }}
                    onConfirm={handleConfirmStartExam}
                    examRecord={selectedExamRecord}
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
            <div className="right">
                <CustomCalendar />
            </div>
            <ProtectedElement acceptRoles={['STUDENT']}>
                <AIAssistant />
            </ProtectedElement>
        </div>
    );
});

export default Exams;
