import { Modal, Table, Card, Descriptions, Spin } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import * as http from '../../../lib/httpRequest';
import authentication from '../../../shared/auth/authentication';
import globalStore from '../../../components/GlobalComponent/globalStore';

interface SubmissionData {
    exerciseId: string;
    exerciseTitle: string;
    exerciseCode: string;
    submissionId: string;
    score: number | null;
    isAccepted: boolean;
    passedTestCases: number;
    totalTestCases: number;
    submittedAt: number;
}

interface ExamResultData {
    examId: string;
    examCode: string;
    examTitle: string;
    startTime: number;
    endTime: number;
    userId: string;
    userName: string;
    submissions: SubmissionData[];
    totalScore: number;
    totalExercises: number;
    completedExercises: number;
    timeLimit: number | null;
}

interface ExamResultModalProps {
    open: boolean;
    examId: string;
    onCancel: () => void;
}

const ExamResultModal = ({ open, examId, onCancel }: ExamResultModalProps) => {
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<ExamResultData | null>(null);

    useEffect(() => {
        if (!open || !examId) {
            setResultData(null);
            return;
        }

        if (authentication.isInstructor) {
            setResultData(null);
            return;
        }

        const fetchResult = async () => {
            setLoading(true);
            try {
                const userId = authentication.account?.data?.id;
                if (!userId) {
                    globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
                    setLoading(false);
                    return;
                }

                const response = await http.get(`/exams/submissions/results?userId=${userId}&examId=${examId}`);
                setResultData(response.data);
            } catch (error) {
                console.error('Error fetching exam result:', error);
                globalStore.triggerNotification('error', 'Không thể tải kết quả bài thi!', '');
                setResultData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [open, examId]);

    const columns = [
        {
            title: 'Mã bài tập',
            dataIndex: 'exerciseCode',
            key: 'exerciseCode',
            render: (code: string) => <div className="cell">{code}</div>
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'exerciseTitle',
            key: 'exerciseTitle',
            render: (title: string) => <div className="cell">{title}</div>
        },
        {
            title: 'Số testcase đã pass',
            dataIndex: 'passedTestCases',
            key: 'passedTestCases',
            render: (passedTestCases: number) => <div className="cell">{passedTestCases}</div>
        },
        {
            title: 'Tổng số testcases',
            dataIndex: 'totalTestCases',
            key: 'totalTestCases',
            render: (totalTestCases: number) => <div className="cell">{totalTestCases}</div>
        },
        {
            title: 'Thời gian nộp',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (submittedAt: number) => (
                <div className="cell">
                    {submittedAt ? dayjs.unix(submittedAt).format('DD/MM/YYYY HH:mm:ss') : '-'}
                </div>
            )
        }
    ];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Kết quả bài thi"
            footer={null}
            width={1000}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {resultData ? (
                    <div>
                        <Card style={{ marginBottom: 16 }}>
                            <Descriptions title="Thông tin tổng quan" bordered column={2}>
                                <Descriptions.Item label="Mã bài thi">{resultData.examCode}</Descriptions.Item>
                                <Descriptions.Item label="Tiêu đề">{resultData.examTitle}</Descriptions.Item>
                                <Descriptions.Item label="Tổng điểm">
                                    <strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                        {resultData.totalScore.toFixed(1)}
                                    </strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số bài đã làm">
                                    {resultData.completedExercises}/{resultData.totalExercises}
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian bắt đầu">
                                    {dayjs.unix(resultData.startTime).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian kết thúc">
                                    {dayjs.unix(resultData.endTime).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Chi tiết các bài tập">
                            {resultData.submissions && resultData.submissions.length > 0 ? (
                                <Table
                                    columns={columns}
                                    dataSource={resultData.submissions}
                                    rowKey="exerciseId"
                                    pagination={false}
                                    rowClassName={(_record, index) => {
                                        return index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
                                    }}
                                    onRow={() => ({
                                        style: { cursor: 'default' },
                                        onMouseEnter: (e) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = 'inherit';
                                        }
                                    })}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    Chưa có bài tập nào được nộp
                                </div>
                            )}
                        </Card>
                    </div>
                ) : (
                    !loading && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            Không tìm thấy kết quả bài thi
                        </div>
                    )
                )}
            </Spin>
        </Modal>
    );
};

export default ExamResultModal;

