import { LeftOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Spin, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';

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

interface SubmissionResult {
    token: string;
    actualOutput: string | null;
    stderr: string | null;
    verdict: string;
    time: string;
    memory: string;
}

interface SubmissionDetailData {
    id: string;
    sourceCode: string;
    languageCode: string;
    time: string;
    memory: string;
    verdict: string;
    passedTestCases: number;
    totalTestCases: number;
    isAccepted: boolean;
    submissionResults: SubmissionResult[];
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

const ExamResult = () => {
    const navigate = useNavigate();
    const { examId } = useParams();
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<ExamResultData | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionData | null>(null);
    const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetailData | null>(null);
    const [codeLoading, setCodeLoading] = useState(false);

    useEffect(() => {
        if (!examId) {
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

                const response = await http.get(`/exams/submissions/results?userId=${userId}&groupExamId=${examId}`);
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
    }, [examId]);

    useEffect(() => {
        if (!resultData?.submissions || resultData.submissions.length === 0) {
            setSelectedSubmission(null);
            setSubmissionDetail(null);
            return;
        }

        if (
            selectedSubmission &&
            !resultData.submissions.some((submission) => submission.exerciseId === selectedSubmission.exerciseId)
        ) {
            setSelectedSubmission(null);
            setSubmissionDetail(null);
        }
    }, [resultData, selectedSubmission]);

    const handleSubmissionClick = async (submission: SubmissionData) => {
        setSelectedSubmission(submission);
        setSubmissionDetail(null);

        if (!submission.submissionId) {
            return;
        }

        setCodeLoading(true);
        try {
            const response = await http.get(`/submissions/${submission.submissionId}/result`);
            setSubmissionDetail(response.data);
        } catch (error) {
            console.error('Error fetching submission detail:', error);
            globalStore.triggerNotification('error', 'Không thể tải chi tiết bài nộp!', '');
            setSubmissionDetail(null);
        } finally {
            setCodeLoading(false);
        }
    };

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
                <div className="cell">{submittedAt ? dayjs.unix(submittedAt).format('DD/MM/YYYY HH:mm:ss') : '-'}</div>
            )
        }
    ];

    const renderBody = () => {
        if (authentication.isInstructor) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    Tính năng xem kết quả chỉ dành cho sinh viên.
                </div>
            );
        }

        if (!examId) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    Không tìm thấy thông tin bài thi.
                </div>
            );
        }

        if (!resultData && !loading) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    Không tìm thấy kết quả bài thi.
                </div>
            );
        }

        if (!resultData) {
            return null;
        }

        return (
            <>
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
                            rowClassName={(record, index) => {
                                const baseClass = index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
                                return selectedSubmission?.exerciseId === record.exerciseId
                                    ? `${baseClass} row-selected`
                                    : baseClass;
                            }}
                            onRow={(record) => ({
                                onClick: () => handleSubmissionClick(record),
                                style: {
                                    cursor: 'pointer',
                                    backgroundColor:
                                        selectedSubmission?.exerciseId === record.exerciseId ? '#f0f5ff' : undefined
                                }
                            })}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Chưa có bài tập nào được nộp</div>
                    )}
                </Card>

                {selectedSubmission && (
                    <>
                        <Card title="Code đã nộp" style={{ marginTop: 16 }}>
                            {selectedSubmission.submissionId ? (
                                <Spin spinning={codeLoading}>
                                    {submissionDetail ? (
                                        <pre
                                            style={{
                                                backgroundColor: '#0f0f0f',
                                                color: '#ffffff',
                                                padding: '12px',
                                                borderRadius: '4px',
                                                minHeight: '150px',
                                                overflowX: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                                                border: '1px solid #1f1f1f'
                                            }}
                                        >
                                            {submissionDetail.sourceCode || '// Bài nộp trống'}
                                        </pre>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '12px' }}>
                                            Đang tải code...
                                        </div>
                                    )}
                                </Spin>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '12px', color: '#999' }}>
                                    Bài tập chưa được làm
                                </div>
                            )}
                        </Card>

                        {selectedSubmission.submissionId && submissionDetail && (
                            <Card title="Kết quả testcases" style={{ marginTop: 16 }}>
                                {submissionDetail.submissionResults &&
                                submissionDetail.submissionResults.length > 0 ? (
                                    <Table
                                        columns={[
                                            {
                                                title: 'Testcase',
                                                key: 'index',
                                                render: (_: SubmissionResult, __: SubmissionResult, index: number) => (
                                                    <div className="cell">Testcase {index + 1}</div>
                                                )
                                            },
                                            {
                                                title: 'Verdict',
                                                dataIndex: 'verdict',
                                                key: 'verdict',
                                                render: (verdict: string) => (
                                                    <Tag
                                                        color={
                                                            verdict === 'ACCEPTED'
                                                                ? 'green'
                                                                : verdict === 'WRONG_ANSWER'
                                                                ? 'red'
                                                                : 'orange'
                                                        }
                                                    >
                                                        {verdict}
                                                    </Tag>
                                                )
                                            },
                                            {
                                                title: 'Output',
                                                dataIndex: 'actualOutput',
                                                key: 'actualOutput',
                                                render: (output: string | null) => (
                                                    <div className="cell">
                                                        {output !== null && output !== undefined
                                                            ? output
                                                            : '-'}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Thời gian (s)',
                                                dataIndex: 'time',
                                                key: 'time',
                                                render: (time: string) => <div className="cell">{time}</div>
                                            },
                                            {
                                                title: 'Bộ nhớ (KB)',
                                                dataIndex: 'memory',
                                                key: 'memory',
                                                render: (memory: string) => <div className="cell">{memory}</div>
                                            }
                                        ]}
                                        dataSource={submissionDetail.submissionResults}
                                        rowKey="token"
                                        pagination={false}
                                        rowClassName={(_record, index) => {
                                            return index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd';
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        Không có kết quả testcase
                                    </div>
                                )}
                            </Card>
                        )}
                    </>
                )}

                {!selectedSubmission && (
                    <Card title="Code đã nộp" style={{ marginTop: 16 }}>
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            Chọn một bài tập để xem code đã nộp
                        </div>
                    </Card>
                )}
            </>
        );
    };

    return (
        <div className="exam-result-page">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
                <h2 style={{ marginLeft: 16, marginBottom: 0 }}>Kết quả bài thi</h2>
            </div>
            <Spin spinning={loading}>{renderBody()}</Spin>
        </div>
    );
};

export default ExamResult;

