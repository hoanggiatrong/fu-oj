import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Row, Col, Statistic } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as http from '../../../../lib/httpRequest';
import globalStore from '../../../../components/GlobalComponent/globalStore';

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
    const [groupExamId, setGroupExamId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

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

    // Lấy groupExamId từ API
    useEffect(() => {
        if (!groupId || !examId) {
            setGroupExamId(null);
            return;
        }

        const url = `/group-exams?groupId=${groupId}`;
        http.get(url)
            .then((res) => {
                const groupExams = res.data || [];
                const matchedExam = groupExams.find(
                    (item: { groupExamId: string; id: string; exam?: { id?: string } }) =>
                        item.groupExamId === examId || item.id === examId || item.exam?.id === examId
                );
                setGroupExamId(matchedExam?.groupExamId || examId);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                // Fallback: dùng examId trực tiếp
                setGroupExamId(examId);
            });
    }, [examId, groupId]);

    // Tính toán thống kê
    const totalStudents = studentsProgress.length;
    const joinedCount = studentsProgress.filter((s) => s.hasJoined).length;
    const notJoinedCount = totalStudents - joinedCount;
    const completedCount = studentsProgress.filter((s) => s.isCompleted).length;

    // Đếm AC/WA
    let acCount = 0;
    let waCount = 0;
    studentsProgress.forEach((student) => {
        if (student.submissionExercises) {
            student.submissionExercises.forEach((ex) => {
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

    studentsProgress.forEach((student) => {
        if (student.totalScore !== null) {
            const score = student.totalScore;
            if (score >= 0 && score <= 20) scoreDistribution['0-20']++;
            else if (score <= 40) scoreDistribution['21-40']++;
            else if (score <= 60) scoreDistribution['41-60']++;
            else if (score <= 80) scoreDistribution['61-80']++;
            else if (score <= 100) scoreDistribution['81-100']++;
        }
    });

    const handleExportExcel = async () => {
        if (!groupExamId) {
            globalStore.triggerNotification('warning', 'Không tìm thấy thông tin bài thi!', '');
            return;
        }

        setExporting(true);
        try {
            // Sử dụng axios trực tiếp để có responseType blob
            const axios = (await import('axios')).default;
            const token = localStorage.getItem('authenticationToken') || sessionStorage.getItem('authenticationToken');
            const baseURL = import.meta.env.VITE_REACT_APP_BASE_URL;

            // API export exam rankings
            const response = await axios.get(`${baseURL}/exam-rankings/export?groupExamId=${groupExamId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            // Tạo blob và download
            const blob = new Blob([response.data], {
                type:
                    response.headers['content-type'] ||
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Tạo tên file với timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `exam-rankings_${timestamp}.xlsx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            globalStore.triggerNotification('success', 'Xuất file thống kê thành công!', '');
        } catch (error: unknown) {
            console.error('Error exporting exam rankings:', error);
            const err = error as { response?: { data?: { message?: string } } };
            globalStore.triggerNotification(
                'error',
                err?.response?.data?.message || 'Có lỗi xảy ra khi xuất file thống kê!',
                ''
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Tổng số sinh viên" value={totalStudents} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Đã tham gia" value={joinedCount} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Chưa tham gia" value={notJoinedCount} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Đã hoàn thành" value={completedCount} valueStyle={{ color: '#1890ff' }} />
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
                            <div>[Biểu đồ tiến độ sẽ được hiển thị ở đây]</div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Phân bố điểm">
                        <div style={{ padding: '16px' }}>
                            {Object.entries(scoreDistribution).map(([range, count]) => (
                                <div
                                    key={range}
                                    style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <span>{range} điểm:</span>
                                    <strong>{count} sinh viên</strong>
                                </div>
                            ))}
                            {/* TODO: Add chart here */}
                            <div>[Biểu đồ phân bố điểm sẽ được hiển thị ở đây]</div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Số lượng nộp theo thời gian">
                <div>[Line chart số lượng nộp theo thời gian sẽ được hiển thị ở đây]</div>
            </Card>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    loading={exporting}
                    disabled={!groupExamId || exporting}
                >
                    Xuất file thống kê
                </Button>
            </div>
        </div>
    );
});

export default StatisticsTab;
