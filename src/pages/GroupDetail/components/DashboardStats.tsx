import { UserOutlined, BookOutlined, CalendarOutlined } from '@ant-design/icons';
import { Card, Statistic, Row, Col } from 'antd';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';

interface DashboardData {
    totalStudents: number;
    totalGroups: number;
    totalExams: number;
    totalExercises: number;
    examsComing: number;
}

interface DashboardStatsProps {
    dashboardData: DashboardData;
    loading: boolean;
}

const DashboardStats = ({ dashboardData, loading }: DashboardStatsProps) => {
    return (
        <ProtectedElement acceptRoles={['INSTRUCTOR', 'ADMIN']}>
            <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng số sinh viên"
                            value={dashboardData.totalStudents}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng số bài kiểm tra"
                            value={dashboardData.totalExams}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng số bài tập"
                            value={dashboardData.totalExercises}
                            prefix={<BookOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Bài kiểm tra sắp tới"
                            value={dashboardData.examsComing}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </ProtectedElement>
    );
};

export default DashboardStats;

