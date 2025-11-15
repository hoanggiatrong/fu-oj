import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as http from '../../lib/httpRequest';
import { Card, Statistic, Row, Col, Carousel, Avatar, List, Tag, Empty } from 'antd';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { TeamOutlined, UserOutlined, BookOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import authentication from '../../shared/auth/authentication';
import dayjs from 'dayjs';

const carouselItems = [
    {
        id: 0,
        imgUrl: '/sources/home-bg-1.png'
    },
    {
        id: 1,
        imgUrl: '/sources/home-bg-2.png'
    }
];

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

interface Group {
    id: string;
    name: string;
    description?: string;
    studentCount?: number;
    exerciseCount?: number;
    examCount?: number;
}

interface Exam {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    groups?: Array<{ id: string; name: string }>;
}

interface RecentActivity {
    id: number;
    type: string;
    message: string;
    time: string;
}

const Dashboard = observer(() => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        totalStudents: 0,
        totalGroups: 0,
        totalExams: 0,
        totalExercises: 0,
        examsComing: 0
    });
    const [groups, setGroups] = useState<Group[]>([]);
    const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

    const getDashboardData = () => {
        if (!authentication.isInstructor) return;
        
        setLoading(true);
        http.get('/dashboard/instructor/')
            .then((res: DashboardResponse) => {
                setDashboardData(res.data || {
                    totalStudents: 0,
                    totalGroups: 0,
                    totalExams: 0,
                    totalExercises: 0,
                    examsComing: 0
                });
            })
            .catch((error) => {
                console.error('Error fetching dashboard data:', error);
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard!', '');
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    const getGroups = () => {
        http.get('/groups')
            .then((res) => {
                const groupsData = (res.data || []).slice(0, 5); // Lấy 5 nhóm đầu tiên
                setGroups(groupsData);
            })
            .catch((error) => {
                console.error('Error fetching groups:', error);
            });
    };

    const getUpcomingExams = () => {
        http.get('/exams')
            .then((res) => {
                const now = dayjs();
                const exams = (res.data || []).filter((exam: Exam) => {
                    if (!exam.startTime || !exam.endTime) return false;
                    const startTime = dayjs(exam.startTime);
                    const endTime = dayjs(exam.endTime);
                    // Lọc các bài thi đang diễn ra: startTime <= now <= endTime
                    return (startTime.isBefore(now) || startTime.isSame(now)) && 
                           (endTime.isAfter(now) || endTime.isSame(now));
                });
                // Sắp xếp theo thời gian bắt đầu và lấy 5 bài thi đầu tiên
                const sorted = exams.sort((a: Exam, b: Exam) => 
                    dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
                ).slice(0, 5);
                setUpcomingExams(sorted);
            })
            .catch((error) => {
                console.error('Error fetching upcoming exams:', error);
            });
    };

    const getRecentActivities = () => {
        // Mock data cho hoạt động gần đây (có thể thay bằng API thực tế)
        setRecentActivities([
            { id: 1, type: 'submission', message: 'Sinh viên đã nộp bài tập mới', time: '5 phút trước' },
            { id: 2, type: 'exam', message: 'Bài thi mới đã được tạo', time: '1 giờ trước' },
            { id: 3, type: 'group', message: 'Sinh viên mới tham gia nhóm', time: '2 giờ trước' },
        ]);
    };

    useEffect(() => {
        if (authentication.isInstructor) {
            getDashboardData();
            getGroups();
            getUpcomingExams();
            getRecentActivities();
        }
    }, []);

    const getTimeUntil = (endTime: string) => {
        const now = dayjs();
        const end = dayjs(endTime);
        const diff = end.diff(now, 'minute');
        
        if (diff < 0) {
            return 'Đã kết thúc';
        } else if (diff < 60) {
            return `Còn ${diff} phút`;
        } else if (diff < 1440) {
            return `Còn ${Math.floor(diff / 60)} giờ`;
        } else {
            return `Còn ${Math.floor(diff / 1440)} ngày`;
        }
    };

    return (
        <div className={classnames('dashboard', { 'p-24': globalStore.isBelow1300 })}>
            <LoadingOverlay loading={loading}>
                <Carousel className="custom-carousel" autoplay={{ dotDuration: true }} autoplaySpeed={5000}>
                    {carouselItems.map((item) => {
                        return (
                            <div key={item.id} className="carousel-item">
                                <img src={item.imgUrl} alt="" />
                            </div>
                        );
                    })}
                </Carousel>
            </LoadingOverlay>

            <div className="dashboard-content">
                {/* 3 Cards thống kê */}
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} sm={12} lg={8}>
                        <Card>
                            <Statistic
                                title="Tổng số nhóm"
                                value={dashboardData.totalGroups}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card>
                            <Statistic
                                title="Tổng số sinh viên"
                                value={dashboardData.totalStudents}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card>
                            <Statistic
                                title="Tổng số bài tập"
                                value={dashboardData.totalExercises}
                                prefix={<BookOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* 2 cột: Các nhóm của tôi và Bài thi sắp tới */}
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={12}>
                        <Card title="Các nhóm của tôi" className="dashboard-card">
                            {groups.length > 0 ? (
                                <List
                                    dataSource={groups}
                                    renderItem={(group) => (
                                        <List.Item
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/group/${group.id}/members`)}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<TeamOutlined />} />}
                                                title={group.name}
                                                description={group.description || 'Không có mô tả'}
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description="Chưa có nhóm nào" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Bài thi trong ngày" className="dashboard-card">
                            {upcomingExams.length > 0 ? (
                                <List
                                    dataSource={upcomingExams}
                                    renderItem={(exam) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<CalendarOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                                                title={exam.title}
                                                description={
                                                    <div>
                                                        <div>Bắt đầu: {dayjs(exam.startTime).format('DD/MM/YYYY HH:mm')}</div>
                                                        <div>Kết thúc: {dayjs(exam.endTime).format('DD/MM/YYYY HH:mm')}</div>
                                                        <Tag color="blue" icon={<ClockCircleOutlined />} style={{ marginTop: 4 }}>
                                                            {getTimeUntil(exam.endTime)}
                                                        </Tag>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description="Không có bài thi trong ngày" />
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Hoạt động gần đây */}
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={12}>
                        <Card title="Hoạt động gần đây" className="dashboard-card">
                            {recentActivities.length > 0 ? (
                                <List
                                    dataSource={recentActivities}
                                    renderItem={(activity) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={activity.message}
                                                description={<span style={{ fontSize: 12, color: '#999' }}>{activity.time}</span>}
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description="Chưa có hoạt động nào" />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
});

export default Dashboard;
