import { Button, Avatar, Dropdown, Tabs } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';
import DashboardStats from './components/DashboardStats';
import AddMemberModal from './components/AddMemberModal';
import AddExerciseModal from './components/AddExerciseModal';

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

    const getAllExercises = () => {
        console.log('[API] GET /exercises - Fetching all exercises');
        http.get('/exercises')
            .then((res) => {
                console.log('[API] GET /exercises - Success:', res.data);
                setAllExercises(res.data || []);
            })
            .catch((error) => {
                console.error('[API] GET /exercises - Error:', error);
                setAllExercises([]);
            });
    };

    const getDashboardData = () => {
        if (!id || !authentication.isInstructor) return;
        
        const url = `/dashboard/instructor/?groupId=${id}`;
        console.log('[API] GET', url, '- Fetching dashboard data for group:', id);
        setLoadingDashboard(true);
        http.get(url)
            .then((res: DashboardResponse) => {
                console.log('[API] GET', url, '- Success:', res.data);
                setDashboardData(res.data || {
                    totalStudents: 0,
                    totalGroups: 0,
                    totalExams: 0,
                    totalExercises: 0,
                    examsComing: 0
                });
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard!', '');
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

    // Menu items cho Quản lý bài kiểm tra
    const examManagementMenuItems: MenuProps['items'] = [
        {
            key: 'view-exams',
            label: 'Xem bài kiểm tra',
            onClick: () => navigate(`/group/${id}/exams`)
        },
        // {
        //     key: 'view-submissions',
        //     label: 'Xem bài nộp',
        //     onClick: () => navigate(`/group/${id}/submissions`)
        // },
        {
            key: 'assign-exam',
            label: 'Gán bài kiểm tra cho nhóm',
            onClick: () => navigate(`/group/${id}/group-exams`)
        }
    ];

    // Menu items cho Quản lý bài tập
    const exerciseManagementMenuItems: MenuProps['items'] = [
        {
            key: 'view-exercises',
            label: 'Xem bài tập',
            onClick: () => navigate(`/group/${id}/exercises`)
        },
        {
            key: 'add-exercise',
            label: 'Thêm bài tập',
            onClick: () => setIsAddExerciseOpen(true)
        }
    ];

    // Menu items cho Quản lý thành viên
    const memberManagementMenuItems: MenuProps['items'] = [
        {
            key: 'add-member',
            label: 'Thêm thành viên',
            onClick: () => setAddMemberDialogOpen(true)
        },
        {
            key: 'view-members',
            label: 'Danh sách thành viên',
            onClick: () => navigate(`/group/${id}/members`)
        }
    ];

    const tabItems = [
        {
            key: 'members',
            label: (
                <NavLink to={`/group/${id}/members`} style={{ textDecoration: 'none' }}>
                    Thành viên
                </NavLink>
            )
        },
        {
            key: 'exams',
            label: (
                <NavLink to={`/group/${id}/exams`} style={{ textDecoration: 'none' }}>
                    Bài kiểm tra
                </NavLink>
            )
        },
        // {
        //     key: 'submissions',
        //     label: (
        //         <NavLink to={`/group/${id}/submissions`} style={{ textDecoration: 'none' }}>
        //             Bài nộp
        //         </NavLink>
        //     )
        // },
        {
            key: 'exercises',
            label: (
                <NavLink to={`/group/${id}/exercises`} style={{ textDecoration: 'none' }}>
                    Bài tập
                </NavLink>
            )
        }
    ];

    return (
        <div className="group-detail">
            <div className="header">
                <div className="title">
                    Nhóm
                </div>
                <div className="description">
                    <div className="owner">
                        <Avatar src={'/sources/thaydat.jpg'} />
                        Nhóm thầy Đạt
                    </div>
                </div>
            </div>
            <div className="actions">
                <div className="action-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Dropdown menu={{ items: examManagementMenuItems }} trigger={['click']}>
                            <Button type="primary">
                                Quản lý bài kiểm tra <DownOutlined />
                            </Button>
                        </Dropdown>
                    </ProtectedElement>
                    <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                        <Dropdown menu={{ items: exerciseManagementMenuItems }} trigger={['click']}>
                            <Button type="primary">
                                Quản lý bài tập <DownOutlined />
                            </Button>
                        </Dropdown>
                    </ProtectedElement>
                    <Dropdown menu={{ items: memberManagementMenuItems }} trigger={['click']}>
                        <Button type="primary">
                            Quản lý thành viên <DownOutlined />
                        </Button>
                    </Dropdown>
                </div>
            </div>
            <DashboardStats dashboardData={dashboardData} loading={loadingDashboard} />
            <div className="body">
                <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        navigate(`/group/${id}/${key}`);
                    }}
                />
                <div style={{ marginTop: 16 }}>
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
            <ProtectedElement acceptRoles={['STUDENT']}>
                <AIAssistant />
            </ProtectedElement>
        </div>
    );
});

export default GroupDetail;
