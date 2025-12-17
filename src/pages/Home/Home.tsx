import { observer } from 'mobx-react-lite';
import classnames from 'classnames';
import globalStore from '../../components/GlobalComponent/globalStore';
import { useEffect, useState } from 'react';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import {
    // Carousel,
    Avatar
} from 'antd';
import * as http from '../../lib/httpRequest';
import CourseList from './components/CourseList';
import utils from '../../utils/utils';
import authentication from '../../shared/auth/authentication';
import QuickStatistic from './components/QuickStatistic';
import TopBySubmissions from './components/TopBySubmissions';

// const carouselItems = [
//     // {
//     //     id: 0,
//     //     imgUrl: '/sources/home-bg-1.png'
//     // },
//     {
//         id: 1,
//         imgUrl: '/sources/home-bg-2.png'
//     }
// ];

const Home = observer(() => {
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any>([]);
    const [tops, setTops] = useState<any>([]);
    const [summary, setSummary] = useState<any>(null);
    const [topBySubmissions, setTopBySubmissions] = useState<any>(null);
    const [upcomingExams, setUpcomingExams] = useState<any>([]);
    const [dashboardData, setDashboardData] = useState<any>({
        totalStudents: 0,
        totalGroups: 0,
        totalExams: 0,
        totalExercises: 0,
        examsComing: 0
    });

    const getCourses = async () => {
        try {
            const response = await http.get('/courses', {
                params: { page: 1, size: 3 }
            });

            const datas: any[] = (response?.data ?? []).map((course: any) => ({
                id: course.id,
                title: course.title,
                description: course.description
            }));

            setCourses(datas);
        } catch (error) {
            console.error('Error fetching courses for slider', error);
            globalStore.triggerNotification('error', 'Không thể tải danh sách khóa học!', '');
            setCourses([]);
        }
    };

    const getTops = () => {
        http.get('/scores?page=1&pageSize=5').then((res) => {
            setTops(res.data);
        });
    };

    const getSummary = () => {
        const from = utils.formatDate(utils.getDateTheWeekBefore(), 'YYYY-MM-DD');
        const to = utils.formatDate(new Date(), 'YYYY-MM-DD');

        http.get(`/dashboard/student-submission-stats?startDate=${from}&endDate=${to}`).then((res) => {
            setSummary(res.data);
        });
    };

    const getTopBySubmissions = () => {
        http.get(
            `/exercises/top-by-submissions?ownerId=${
                authentication.isInstructor ? authentication.account.data.id : null
            }`
        ).then((res) => {
            setTopBySubmissions(res.data);
        });
    };

    const getExams = () => {
        const startOfToday = new Date();
        // const endOfToday = new Date();

        startOfToday.setHours(0, 0, 0, 0);
        // endOfToday.setHours(23, 59, 59, 999);

        const startOfTodayByMil = startOfToday.getTime();

        http.get(`/exams`).then((res) => {
            setUpcomingExams(
                res.data?.filter((d: any) => {
                    const startTime = new Date(d.startTime).getTime();
                    const endTime = new Date(d.endTime).getTime();

                    return !d.deletedTimestamp && startTime < startOfTodayByMil && endTime > startOfTodayByMil;
                })
            );
        });
    };

    const getDashboardData = () => {
        if (!authentication.isInstructor) return;

        http.get('/dashboard/instructor/')
            .then((res) => {
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
                console.error('Error fetching dashboard data:', error);
                globalStore.triggerNotification(
                    'error',
                    error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard!',
                    ''
                );
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    const init = () => {
        getCourses();
        getTops();
        getSummary();
        getTopBySubmissions();
        getExams();
        getDashboardData();
    };

    useEffect(() => {
        setTimeout(() => {
            init();
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className={classnames('home', { 'p-24': globalStore.isBelow1300 })}>
            {/* <LoadingOverlay loading={loading}>
                <Carousel className="custom-carousel" autoplay={{ dotDuration: true }} autoplaySpeed={5000}>
                    {carouselItems.map((item) => {
                        return (
                            <div className="carousel-item">
                                <img src={item.imgUrl} alt="" />
                            </div>
                        );
                    })}
                </Carousel>
            </LoadingOverlay> */}
            <ProtectedElement acceptRoles={['STUDENT']}>
                <StudentStatistic summary={summary} loading={loading} />
                <div className="mt-24" />
            </ProtectedElement>
            <ProtectedElement acceptRoles={['STUDENT']}>
                <div className={classnames('flex gap-24 container', { 'flex-col': globalStore.isBelow1000 })}>
                    <div className="news flex-1 child-container">
                        <div className="header">
                            <Avatar src={'/sources/news.png'} />
                            Khóa học nổi bật
                        </div>
                        <div className="content">
                            <CourseList courses={courses} />
                        </div>
                    </div>
                    <LoadingOverlay loading={loading}>
                        <div className="rank child-container">
                            <div className="header">
                                <Avatar src={'/sources/rank-user.png'} />
                                Hoàn thành nhiều nhất
                            </div>
                            <div className="content">
                                {tops.map((t: any, index: number) => {
                                    return index == 0 ? (
                                        <div className="rank-item flex gap">
                                            <div className="left">
                                                <img src="/sources/ranks/rank-frog.png" alt="" />
                                                <Avatar src={t?.user?.avatar?.url || '/sources/thaydat.jpg'} />
                                            </div>
                                            <div className="right">
                                                <div className="name">
                                                    {t?.user?.firstName + ' ' + t?.user?.lastName}
                                                </div>
                                                <div className="roll-number">
                                                    <b className="color-gold">{utils.formatNumber(t?.totalScore, 0)}</b>{' '}
                                                    | Lượt nộp bài: {t?.totalSolved}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rank-item flex gap">
                                            <div className="left">
                                                <img src={`/sources/ranks/rank${index}.png`} alt="" />
                                                <Avatar src={t?.user?.avatar?.url || '/sources/thaytrong.png'} />
                                            </div>
                                            <div className="right">
                                                <div className="name">
                                                    {t?.user?.firstName + ' ' + t?.user?.lastName}
                                                </div>
                                                <div className="roll-number">
                                                    <b className="color-cyan">{utils.formatNumber(t?.totalScore, 0)}</b>{' '}
                                                    | Lượt nộp bài: {t?.totalSolved}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* <div className="rank-item flex gap">
                                    <div className="left">
                                        <img src="/sources/ranks/rank2.png" alt="" />
                                        <Avatar src={'/sources/thaydung.jpeg'} />
                                    </div>
                                    <div className="right">
                                        <div className="name">Hồ Anh Dũng</div>
                                        <div className="roll-number">HE969696</div>
                                    </div>
                                </div>
                                <div className="rank-item flex gap">
                                    <div className="left">
                                        <img src="/sources/ranks/rank3.png" alt="" />
                                        <Avatar src={'/sources/thaylam.jpeg'} />
                                    </div>
                                    <div className="right">
                                        <div className="name">Phạm Ngọc Tùng Lâm</div>
                                        <div className="roll-number">HE969696</div>
                                    </div>
                                </div>
                                <div className="rank-item flex gap">
                                    <div className="left">
                                        <img src="/sources/ranks/rank10.png" alt="" />
                                        <Avatar src={'/sources/thaydat.jpg'} />
                                    </div>
                                    <div className="right">
                                        <div className="name">Lê Minh Chiến</div>
                                        <div className="roll-number">HE969696</div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </LoadingOverlay>
                </div>
            </ProtectedElement>
            {/* <div className="submitted-exs container"></div> */}
            <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
                <InstructorStatistic
                    topBySubmissions={topBySubmissions}
                    upcomingExams={upcomingExams}
                    dashboardData={dashboardData}
                />
            </ProtectedElement>
            <div className="mb-24" />
        </div>
    );
});

const InstructorStatistic = observer(
    ({
        topBySubmissions,
        upcomingExams,
        dashboardData
    }: {
        topBySubmissions: any;
        upcomingExams: any;
        dashboardData: any;
    }) => {
        return (
            <>
                <div
                    className={classnames('flex gap-24 container', { 'flex-col': globalStore.isBelow1000 })}
                    style={{ marginTop: 2 }}
                >
                    <div className="news flex-1 child-container">
                        <div className="header">
                            <Avatar src={'/sources/news.png'} />
                            Thống kê nhanh
                        </div>
                        <div className="content">
                            <QuickStatistic upcomingExams={upcomingExams} dashboardData={dashboardData} />
                        </div>
                    </div>
                </div>
                <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                    <div className={classnames('flex gap-24 container', { 'flex-col': globalStore.isBelow1000 })}>
                        <div className="news flex-1 child-container">
                            <div className="header">
                                <Avatar src={'/sources/icons/fire-ico.svg'} />
                                Đóng góp nổi bật của tôi
                            </div>
                            <div className="content">
                                <TopBySubmissions topBySubmissions={topBySubmissions} />
                            </div>
                        </div>
                    </div>
                </ProtectedElement>
                <div className="instructor-statistic"></div>
            </>
        );
    }
);

const StudentStatistic = observer(({ summary, loading }: { summary: any; loading: boolean }) => {
    const [stats, setStats] = useState([]);
    const [hard, setHard] = useState(0);
    const [medium, setMedium] = useState(0);
    const [easy, setEasy] = useState(0);

    useEffect(() => {
        if (summary) {
            setStats(summary.stats);

            let easy = 0;
            let medium = 0;
            let hard = 0;

            summary.stats.map((s: any) => {
                easy += s.easy;
                medium += s.medium;
                hard += s.hard;
            });

            setTimeout(() => {
                setEasy(easy);
                setMedium(medium);
                setHard(hard);
            }, 0);
        }
    }, [summary]);

    return (
        <div className="student-statistic">
            <div className={classnames('container-1', { 'flex-col': globalStore.isBelow1000 })}>
                <div className="statistic">
                    <div className="header">Số bài tập đã hoàn thành</div>
                    <div className="summary">
                        <div className="cell color-cyan">Dễ: {easy}</div>
                        <div className="cell color-gold">Trung bình: {medium}</div>
                        <div className="cell color-red">Khó: {hard}</div>
                        <div className="cell total">Tổng: {summary?.totalSolved}</div>
                    </div>
                </div>
                <div className="chart flex-1">
                    <LoadingOverlay loading={loading}>
                        <ResponsiveContainer width="100%">
                            <AreaChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />

                                {/* Easy */}
                                <Area
                                    type="monotone"
                                    dataKey="easy"
                                    name="Dễ"
                                    stroke="#22c55e"
                                    fill="#22c55e"
                                    fillOpacity={0.2}
                                />

                                {/* Medium */}
                                <Area
                                    type="monotone"
                                    dataKey="medium"
                                    name="Trung bình"
                                    stroke="#facc15"
                                    fill="#facc15"
                                    fillOpacity={0.25}
                                />

                                {/* Hard */}
                                <Area
                                    type="monotone"
                                    dataKey="hard"
                                    name="Khó"
                                    stroke="#ef4444"
                                    fill="#ef4444"
                                    fillOpacity={0.25}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </LoadingOverlay>
                </div>
            </div>
        </div>
    );
});

export default Home;
