import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Row, Col, Statistic } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as http from '../../../../lib/httpRequest';

interface StudentProgress {
    userId: string;
    hasJoined: boolean;
    isCompleted: boolean;
    totalScore: number | null;
    submissionExercises: Array<{
        score: number;
        hasSubmitted: boolean;
    }>;
}

const StatisticsTab = observer(() => {
    const params = useParams();
    const groupId = params.id || params.groupId;
    const examId = params.examId;
    const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);

    useEffect(() => {
        if (examId && groupId) {
            const url = `/exams/${examId}/groups/${groupId}/students-progress`;
            http.get(url)
                .then((res) => {
                    setStudentsProgress(res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                });
        }
    }, [examId, groupId]);

    // Tính toán thống kê
    const totalStudents = studentsProgress.length;
    const joinedCount = studentsProgress.filter(s => s.hasJoined).length;
    const notJoinedCount = totalStudents - joinedCount;
    const completedCount = studentsProgress.filter(s => s.isCompleted).length;
    
    // Đếm AC/WA
    let acCount = 0;
    let waCount = 0;
    studentsProgress.forEach(student => {
        if (student.submissionExercises) {
            student.submissionExercises.forEach(ex => {
                if (ex.hasSubmitted) {
                    if (ex.score > 0) {
                        acCount++;
                    } else {
                        waCount++;
                    }
                }
            });
        }
    });

    // Phân bố điểm
    const scoreDistribution = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
    };

    studentsProgress.forEach(student => {
        if (student.totalScore !== null) {
            const score = student.totalScore;
            if (score >= 0 && score <= 20) scoreDistribution['0-20']++;
            else if (score <= 40) scoreDistribution['21-40']++;
            else if (score <= 60) scoreDistribution['41-60']++;
            else if (score <= 80) scoreDistribution['61-80']++;
            else if (score <= 100) scoreDistribution['81-100']++;
        }
    });

    const handleExportExcel = () => {
        // TODO: Implement export to Excel
        console.log('Export to Excel');
    };

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số sinh viên"
                            value={totalStudents}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đã tham gia"
                            value={joinedCount}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Chưa tham gia"
                            value={notJoinedCount}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đã hoàn thành"
                            value={completedCount}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={12}>
                    <Card title="Tiến độ (AC/WA/Chưa tham gia)">
                        <div style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#3f8600' }}>AC (Accepted): </span>
                                <strong>{acCount}</strong>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#cf1322' }}>WA (Wrong Answer): </span>
                                <strong>{waCount}</strong>
                            </div>
                            <div>
                                <span>Chưa tham gia: </span>
                                <strong>{notJoinedCount}</strong>
                            </div>
                            {/* TODO: Add chart here */}
                            <div style={{ marginTop: '16px', padding: '20px', background: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                [Biểu đồ tiến độ sẽ được hiển thị ở đây]
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Phân bố điểm">
                        <div style={{ padding: '16px' }}>
                            {Object.entries(scoreDistribution).map(([range, count]) => (
                                <div key={range} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{range} điểm:</span>
                                    <strong>{count} sinh viên</strong>
                                </div>
                            ))}
                            {/* TODO: Add chart here */}
                            <div style={{ marginTop: '16px', padding: '20px', background: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                                [Biểu đồ phân bố điểm sẽ được hiển thị ở đây]
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Số lượng nộp theo thời gian">
                <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                    [Line chart số lượng nộp theo thời gian sẽ được hiển thị ở đây]
                </div>
            </Card>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                >
                    Export Excel
                </Button>
            </div>
        </div>
    );
});

export default StatisticsTab;

