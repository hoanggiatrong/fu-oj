import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Card } from 'antd';
import * as http from '../../../lib/httpRequest';
import authentication from '../../../shared/auth/authentication';

interface ExamRankingData {
    id: string;
    createdTimestamp: string; // ISO 8601 format UTC
    exam: {
        examId: string;
        startTime: number;
        endTime: number;
        timeLimit: number | null;
    };
}

interface ExamCountdownTimerProps {
    examId: string;
}

const ExamCountdownTimer = observer(({ examId }: ExamCountdownTimerProps) => {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExamRanking = async () => {
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) {
                    setError('Không tìm thấy thông tin người dùng');
                    setLoading(false);
                    return;
                }

                const response = await http.get(`/exam-rankings?userId=${userId}&examId=${examId}`);
                const data: ExamRankingData[] = response.data || [];

                if (data.length === 0) {
                    setError('Không tìm thấy thông tin bài thi');
                    setLoading(false);
                    return;
                }

                const examRanking = data[0];
                const timeLimit = examRanking.exam.timeLimit || 90; // Mặc định 90 phút nếu null
                
                // Lấy thời điểm bắt đầu làm bài từ createdTimestamp (UTC ISO string)
                // createdTimestamp là thời điểm user bắt đầu làm bài, không phải thời điểm exam bắt đầu
                const startTimeDate = new Date(examRanking.createdTimestamp);
                const startTimeMs = startTimeDate.getTime(); // UTC milliseconds
                
                // Tính thời gian kết thúc: startTime + timeLimit (phút)
                const timeLimitMs = timeLimit * 60 * 1000; // Chuyển phút sang milliseconds
                const endTimeMs = startTimeMs + timeLimitMs;
                
                // Lấy thời gian hiện tại (UTC milliseconds)
                const now = Date.now();
                
                // Tính thời gian còn lại (milliseconds)
                const remaining = Math.max(0, endTimeMs - now);
                setTimeRemaining(remaining);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching exam ranking:', err);
                setError('Không thể tải thông tin thời gian');
                setLoading(false);
            }
        };

        fetchExamRanking();
    }, [examId]);

    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Card style={{ marginBottom: 16 }}>
                <div>Đang tải thời gian...</div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card style={{ marginBottom: 16 }}>
                <div style={{ color: 'red' }}>{error}</div>
            </Card>
        );
    }

    if (timeRemaining === null || timeRemaining <= 0) {
        return (
            <Card style={{ marginBottom: 16, backgroundColor: '#fff2e8' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    Hết thời gian làm bài
                </div>
            </Card>
        );
    }

    const isWarning = timeRemaining < 5 * 60 * 1000; // Cảnh báo khi còn dưới 5 phút

    return (
        <Card
            style={{
                marginBottom: 16,
                backgroundColor: isWarning ? '#fff2e8' : '#f6ffed',
                borderColor: isWarning ? '#ff7875' : '#52c41a'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                        Thời gian còn lại
                    </div>
                    <div
                        style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: isWarning ? '#ff4d4f' : '#52c41a',
                            fontFamily: 'monospace'
                        }}
                    >
                        {formatTime(timeRemaining)}
                    </div>
                </div>
                {isWarning && (
                    <div style={{ fontSize: '14px', color: '#ff4d4f' }}>
                        ⚠️ Sắp hết thời gian!
                    </div>
                )}
            </div>
        </Card>
    );
});

export default ExamCountdownTimer;

