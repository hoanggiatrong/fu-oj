import { BookOutlined, CalendarOutlined, CopyOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Popconfirm, Row } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import Tab from '../../components/Tab/Tab';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
// import authentication from '../../shared/auth/authentication';
import routesConfig from '../../routes/routesConfig';
import utils from '../../utils/utils';
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
            })
            .catch((error) => {
                error;
                setAllExercises([]);
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
        });
    }, [id]);

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
                <div
                    className={classnames('flex flex-space-beetween mb-8', {
                        'pr-16': globalStore.windowSize.width > 1300
                    })}
                >
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
                            title="Bạn có thực sự muốn rời nhóm không?"
                            description="Sau khi rời nhóm, bạn sẽ không thể xem thành viên, làm bài thi, cũng như thực hành bài tập theo định hướng của Giảng viên!"
                            okText="Vẫn rời nhóm"
                            placement="left"
                            cancelText="Ở lại"
                            onConfirm={() => {
                                http.put(`/groups/out-group/${id}`, {}).then(() => {
                                    globalStore.triggerNotification(
                                        'success',
                                        'Rời nhóm thành công!',
                                        'Hãy nhớ rằng Bạn vẫn có thể tham gia lại nhóm sau này!'
                                    );
                                    navigate(`/${routesConfig.groups}`);
                                });
                            }}
                        >
                            <Button color="gold" variant="filled">
                                Rời nhóm
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
                        <div
                            className={classnames('wrapper flex flex-1', {
                                'pr-16': globalStore.windowSize.width > 1300,
                                hide:
                                    location.pathname.includes('students-progress') ||
                                    /\/exams\/[^/]+/.test(location.pathname)
                            })}
                        ></div>
                    </div>
                )}
                {/* {activeTab == 'exercises' && authentication.isInstructor && (
                    <div className="trong-2111">
                        <div className="trong-2111">
                            <div className="trong-2111">
                                <Button onClick={() => setIsAddExerciseOpen(true)}>Thêm bài tập</Button>
                            </div>
                        </div>
                    </div>
                )} */}
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
        </div>
    );
});

export default GroupDetail;
