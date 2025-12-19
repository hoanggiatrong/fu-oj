import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Card } from 'antd';
import * as http from '../../../lib/httpRequest';
import authentication from '../../../shared/auth/authentication';

interface ExamRankingData {
    id: string;
    createdTimestamp: string; // ISO 8601 format UTC
    groupExam?: {
        groupExamId: string;
        examId: string;
        examCode: string;
        examTitle: string;
        groupId: string;
        groupName: string;
        startTime: number;
        endTime: number;
        timeLimit: number | null;
    };
}

interface ExamCountdownTimerProps {
    examId: string;
    compact?: boolean;
    onTimeExpired?: () => void;
    setTimeIsUp?: any;
}

const ExamCountdownTimer = observer(
    ({ examId, compact = false, onTimeExpired, setTimeIsUp }: ExamCountdownTimerProps) => {
        const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const hasCalledCallbackRef = useRef(false);

        useEffect(() => {
            const fetchExamRanking = async () => {
                try {
                    const userId = authentication.account?.data?.id;
                    if (!userId) {
                        setError('Không tìm thấy thông tin người dùng');
                        setLoading(false);
                        return;
                    }

                    const response = await http.get(`/exam-rankings?userId=${userId}&groupExamId=${examId}`);
                    const data: ExamRankingData[] = response.data || [];

                    if (data.length === 0) {
                        setError('Không tìm thấy thông tin bài thi');
                        setLoading(false);
                        return;
                    }

                    const examRanking = data[0];
                    const timeLimit = examRanking.groupExam?.timeLimit ?? 90; // Mặc định 90 phút nếu null hoặc undefined

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
            if (timeRemaining === null || timeRemaining <= 0) {
                // Nếu thời gian đã hết và chưa gọi callback
                if (timeRemaining !== null && timeRemaining <= 0 && onTimeExpired && !hasCalledCallbackRef.current) {
                    hasCalledCallbackRef.current = true;
                    onTimeExpired();
                }
                return;
            }

            // Reset flag khi có thời gian còn lại
            hasCalledCallbackRef.current = false;

            const interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 0) {
                        clearInterval(interval);
                        // Gọi callback khi hết thời gian (chỉ gọi một lần)
                        if (onTimeExpired && !hasCalledCallbackRef.current) {
                            hasCalledCallbackRef.current = true;
                            onTimeExpired();
                        }
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);

            return () => clearInterval(interval);
        }, [timeRemaining, onTimeExpired]);

        const formatTime = (ms: number): string => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
                2,
                '0'
            )}`;
        };

        const isWarning = timeRemaining !== null && timeRemaining > 0 && timeRemaining < 5 * 60 * 1000; // Cảnh báo khi còn dưới 5 phút

        // Compact version cho header (không dùng Card, style phù hợp nền đen)
        if (compact) {
            if (loading) {
                return <div style={{ color: '#fff', fontSize: '14px' }}>Đang tải...</div>;
            }

            if (error) {
                return <div style={{ color: '#ff4d4f', fontSize: '14px' }}>Lỗi</div>;
            }

            if (timeRemaining === null || timeRemaining <= 0) {
                return (
                    <div
                        style={{
                            color: '#ff4d4f',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                        }}
                    >
                        00:00:00
                    </div>
                );
            }

            return (
                <div
                    style={{
                        padding: '4px 12px',
                        backgroundColor: isWarning ? '#ff4d4f' : '#52c41a',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {formatTime(timeRemaining)}
                </div>
            );
        }

        // Full version với Card (cho ExamDetail)
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
            setTimeIsUp(true);

            return (
                <Card style={{ marginBottom: 16, backgroundColor: '#fff2e8' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>Hết thời gian làm bài</div>
                </Card>
            );
        }

        return (
            <Card
                className="event-none-cell good-bg overflow-hidden"
                style={{
                    // marginBottom: 16,
                    backgroundColor: isWarning ? '#fff2e8' : '#f6ffed',
                    borderColor: isWarning ? '#ff7875' : '#52c41a'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                    <div>
                        <div className="bold" style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
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
                    {isWarning && <div style={{ fontSize: '14px', color: '#ff4d4f' }}>⚠️ Sắp hết thời gian!</div>}
                </div>
            </Card>
        );
    }
);

export default ExamCountdownTimer;
