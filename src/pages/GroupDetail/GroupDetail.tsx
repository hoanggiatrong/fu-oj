import {
    AppstoreAddOutlined,
    BookOutlined,
    CalendarOutlined,
    CopyOutlined,
    SearchOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Col, Form, Input, Popconfirm, Row } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import Tab from '../../components/Tab/Tab';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import ExamFormModal from '../Exams/components/ExamFormModal';
import type { SelectOption } from '../Exams/types';
import AddExerciseModal from './components/AddExerciseModal';
import AddMemberModal from './components/AddMemberModal';

interface DashboardData {
    totalStudents: number;
    totalGroups: number;
    totalExams: number;
    totalExercises: number;
    examsComing: number;
}

interface DashboardResponse {
    data: DashboardData;
}

const GroupDetail = observer(() => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allExercises, setAllExercises] = useState<any[]>([]);
    const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
    const [examExerciseOptions, setExamExerciseOptions] = useState<SelectOption[]>([]);
    const [examGroupOptions, setExamGroupOptions] = useState<SelectOption[]>([]);
    const [isExamModalOpen, setExamModalOpen] = useState(false);
    const [examForm] = Form.useForm();
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        totalStudents: 0,
        totalGroups: 0,
        totalExams: 0,
        totalExercises: 0,
        examsComing: 0
    });
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    loadingDashboard;

    const getAllExercises = () => {
        http.get('/exercises')
            .then((res) => {
                const exercises = res.data || [];
                setAllExercises(exercises);
                setExamExerciseOptions(
                    exercises.map((exercise: any) => ({
                        value: exercise.id,
                        label: exercise.title || exercise.code || '',
                        ...exercise
                    }))
                );
            })
            .catch((error) => {
                error;
                setAllExercises([]);
                setExamExerciseOptions([]);
            });
    };

    const getDashboardData = () => {
        if (!id) return;

        const url = `/dashboard/instructor/?groupId=${id}`;
        setLoadingDashboard(true);
        http.get(url)
            .then((res: DashboardResponse) => {
                setDashboardData(
                    res.data || {
                        totalStudents: 0,
                        totalGroups: 0,
                        totalExams: 0,
                        totalExercises: 0,
                        examsComing: 0
                    }
                );
            })
            .catch((error) => {
                globalStore.triggerNotification(
                    'error',
                    error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard!',
                    ''
                );
            })
            .finally(() => {
                setLoadingDashboard(false);
            });
    };

    useEffect(() => {
        if (id) {
            getAllExercises();
            getDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Get active tab from location
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/members')) return 'members';
        if (path.includes('/exams')) {
            if (path.includes('/group-exams')) return 'group-exams';
            return 'exams';
        }
        if (path.includes('/submissions')) return 'submissions';
        if (path.includes('/exercises')) return 'exercises';
        return 'members';
    };

    const activeTab = getActiveTab();

    // const tabItems = [
    //     {
    //         key: 'members',
    //         label: (
    //             <NavLink to={`/group/${id}/members`} style={{ textDecoration: 'none' }}>
    //                 Thành viên
    //             </NavLink>
    //         )
    //     },
    //     {
    //         key: 'exams',
    //         label: (
    //             <NavLink to={`/group/${id}/exams`} style={{ textDecoration: 'none' }}>
    //                 Bài kiểm tra
    //             </NavLink>
    //         )
    //     },
    //     // {
    //     //     key: 'submissions',
    //     //     label: (
    //     //         <NavLink to={`/group/${id}/submissions`} style={{ textDecoration: 'none' }}>
    //     //             Bài nộp
    //     //         </NavLink>
    //     //     )
    //     // },
    //     {
    //         key: 'exercises',
    //         label: (
    //             <NavLink to={`/group/${id}/exercises`} style={{ textDecoration: 'none' }}>
    //                 Bài tập
    //             </NavLink>
    //         )
    //     }
    // ];

    const [groupInfo, setGroupInfo] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        http.get(`/groups/${id}`).then((res) => {
            console.log('log:', res);
            setGroupInfo(res.data);
            setExamGroupOptions([
                {
                    value: res.data.id,
                    label: res.data.name
                }
            ]);
        });
    }, [id]);

    useEffect(() => {
        if (!id || !isExamModalOpen) return;
        examForm.setFieldsValue({
            groupIds: [id]
        });
    }, [id, isExamModalOpen, examForm]);

    const handleCloseExamModal = () => {
        examForm.resetFields();
        setExamModalOpen(false);
    };

    const handleCreateGroupExam = () => {
        if (!id) return;
        examForm.resetFields();
        examForm.setFieldsValue({
            groupIds: [id]
        });
        setExamModalOpen(true);
    };

    const handleGroupExamSubmit: FormProps['onFinish'] = (values) => {
        const startTime = values.startTime ? dayjs(values.startTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null;
        const endTime = values.endTime ? dayjs(values.endTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null;
        const groupIdsSet = new Set(values.groupIds || []);
        if (id) {
            groupIdsSet.add(id);
        }

        const payload = {
            title: values.title,
            description: values.description,
            startTime,
            endTime,
            timeLimit: values.timeLimit || null,
            status: 'DRAFT',
            groupIds: Array.from(groupIdsSet),
            exerciseIds: values.exerciseIds || []
        };

        http.post('/exams', payload)
            .then((res) => {
                globalStore.triggerNotification('success', res.message || 'Tạo bài thi thành công!', '');
                handleCloseExamModal();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
            });
    };

    return (
        <div className={classnames('group-detail', { 'p-24': globalStore.isBelow1300 })}>
            <div className="header">
                {/* <div className="title">Nhóm</div> */}
                <div className="description">
                    <div className="owner">
                        <Avatar src={groupInfo?.owner?.avatar?.url || '/sources/thaydat.jpg'} />
                        <div className="right">
                            <TooltipWrapper tooltipText={groupInfo?.name} position="right">
                                <div className="group-name max-2-lines">{groupInfo?.name || 'Nhóm thầy Đạt'}</div>
                            </TooltipWrapper>
                            <div className="group-code">
                                Mã nhóm: ******{' '}
                                <TooltipWrapper tooltipText="Sao chép mã nhóm" position="bottom">
                                    <CopyOutlined
                                        className="copy-group-code"
                                        onClick={() => {
                                            utils.copyToClipBoard(groupInfo?.code);
                                            globalStore.triggerNotification(
                                                'success',
                                                'Sao chép mã nhóm thành công!',
                                                ''
                                            );
                                        }}
                                    />
                                </TooltipWrapper>
                            </div>
                        </div>
                    </div>
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <div className="group-infos">
                            <Row gutter={24}>
                                <Col span={6}>
                                    <div
                                        className={classnames('info-cell', { 'r-info-cell': globalStore.isBelow1000 })}
                                    >
                                        <div className="header">
                                            <UserOutlined className="ico" />
                                            <div className={classnames('text', { hide: globalStore.isBelow1300 })}>
                                                Tổng số sinh viên
                                            </div>
                                        </div>
                                        <div className="content">{dashboardData.totalStudents}</div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div
                                        className={classnames('info-cell', { 'r-info-cell': globalStore.isBelow1000 })}
                                    >
                                        <div className="header">
                                            <CalendarOutlined className="ico" />
                                            <div className={classnames('text', { hide: globalStore.isBelow1300 })}>
                                                Tổng số bài kiểm tra
                                            </div>
                                        </div>
                                        <div className="content">{dashboardData.totalExams}</div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div
                                        className={classnames('info-cell', { 'r-info-cell': globalStore.isBelow1000 })}
                                    >
                                        <div className="header">
                                            <BookOutlined className="ico" />
                                            <div className={classnames('text', { hide: globalStore.isBelow1300 })}>
                                                Tổng số bài tập
                                            </div>
                                        </div>
                                        <div className="content">{dashboardData.totalExercises}</div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div
                                        className={classnames('info-cell', { 'r-info-cell': globalStore.isBelow1000 })}
                                    >
                                        <div className="header">
                                            <CalendarOutlined className="ico" />
                                            <div className={classnames('text', { hide: globalStore.isBelow1300 })}>
                                                Bài kiểm tra sắp tới
                                            </div>
                                        </div>
                                        <div className="content">{dashboardData.examsComing}</div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </ProtectedElement>
                </div>
            </div>
            <div className="body">
                <div className="flex flex-space-beetween mb-8 pr-16">
                    <Tab
                        value={activeTab}
                        fontSize={14}
                        options={[
                            { label: 'Thành viên', value: 'members' },
                            { label: 'Bài kiểm tra', value: 'exams' },
                            { label: 'Bài tập', value: 'exercises' }
                        ]}
                        onClick={(value) => {
                            navigate(`/group/${id}/${value}`);
                        }}
                    />
                    <ProtectedElement acceptRoles={['STUDENT']}>
                        <Popconfirm
                            title="Bạn có thực sự muốn nhót ko?"
                            okText="Nhót luôn"
                            placement="left"
                            cancelText="Không"
                            onConfirm={() => {
                                // Xử lý vào đây nhé thầy
                            }}
                        >
                            <Button color="gold" variant="filled">
                                Nhót
                            </Button>
                        </Popconfirm>
                    </ProtectedElement>
                </div>
                {/* <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        navigate(`/group/${id}/${key}`);
                    }}
                /> */}
                {/* {activeTab == 'members' && (
                    <div className="trong-2111">
                        <Button onClick={() => setAddMemberDialogOpen(true)}>Thêm thành viên</Button>
                    </div>
                )} */}
                {activeTab == 'exams' && (
                    <div className="leetcode">
                        <div className="wrapper flex flex-1 pr-16">
                            <div className="filters">
                                <Input
                                    placeholder="Tìm kiếm bài thi"
                                    // onChange={(e) => setSearch(e.target.value)}
                                    data-tourid="search-input"
                                    prefix={<SearchOutlined />}
                                />
                                <div className="group-create">
                                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                        <div
                                            className="custom-btn-ico"
                                            onClick={handleCreateGroupExam}
                                            data-tourid="create-btn"
                                        >
                                            <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                            Tạo bài kiểm tra cho nhóm
                                        </div>
                                    </ProtectedElement>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab == 'exercises' && authentication.isInstructor && (
                    <div className="trong-2111">
                        <div className="trong-2111">
                            <div className="trong-2111">
                                <Button onClick={() => setIsAddExerciseOpen(true)}>Thêm bài tập</Button>
                            </div>
                        </div>
                    </div>
                )}
                <div>
                    <Outlet />
                </div>
            </div>
            <AddMemberModal
                open={isAddMemberDialogOpen}
                onCancel={() => setAddMemberDialogOpen(false)}
                onSuccess={() => {
                    // Refresh will be handled by MembersTab component
                }}
            />

            <AddExerciseModal
                open={isAddExerciseOpen}
                onCancel={() => setIsAddExerciseOpen(false)}
                onSuccess={() => {
                    // Refresh will be handled by ExercisesTab component
                }}
                groupId={id || ''}
                allExercises={allExercises}
            />
            <ExamFormModal
                open={isExamModalOpen}
                updateId={null}
                editingRecord={null}
                groups={examGroupOptions}
                exercises={examExerciseOptions}
                onFinish={handleGroupExamSubmit}
                form={examForm}
                setUpdateId={(_id) => undefined}
                setEditingRecord={(_record) => undefined}
                onCancel={handleCloseExamModal}
            />
        </div>
    );
});

export default GroupDetail;
