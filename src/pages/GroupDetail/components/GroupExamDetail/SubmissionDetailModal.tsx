import { useState } from 'react';
import { Modal, Button, Spin, Descriptions, Table, Tag, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as http from '../../../../lib/httpRequest';
import globalStore from '../../../../components/GlobalComponent/globalStore';

interface SubmissionDetail {
    exerciseId: string;
    exerciseTitle: string;
    exerciseCode: string;
    submissionId: string;
    score: number;
    isAccepted: boolean;
    passedTestCases: number;
    totalTestCases: number;
    submittedAt: number;
}

interface SubmissionResult {
    examId: string;
    examCode: string;
    examTitle: string;
    startTime: number;
    endTime: number;
    userId: string;
    userName: string;
    submissions: SubmissionDetail[];
    totalScore: number;
    totalExercises: number;
    completedExercises: number;
    timeLimit: number | null;
}

interface SubmissionResultData {
    id: string;
    sourceCode: string;
    languageCode: string;
    time: string;
    memory: string;
    verdict: string;
    passedTestCases: number;
    totalTestCases: number;
    isAccepted: boolean;
    exercise: {
        id: string;
        code: string;
        title: string;
        description: string;
        timeLimit: number;
        memory: number;
        difficulty: string;
        testCases: Array<{
            id: string;
            input: string;
            output: string;
            note: string | null;
            isPublic: boolean;
        }>;
        testCasesCount: number;
    };
    submissionResults: Array<{
        token: string;
        actualOutput: string | null;
        stderr: string | null;
        verdict: string;
        time: string;
        memory: string;
    }>;
}

interface SubmissionDetailModalProps {
    open: boolean;
    onCancel: () => void;
    submissionResult: SubmissionResult | null;
    loading: boolean;
}

const SubmissionDetailModal = ({ open, onCancel, submissionResult, loading }: SubmissionDetailModalProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [submissionDataMap, setSubmissionDataMap] = useState<Map<string, SubmissionResultData>>(new Map());
    const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());

    const handleExpand = (expanded: boolean, record: SubmissionDetail) => {
        const submissionId = record.submissionId;

        if (expanded) {
            const newExpanded = new Set(expandedRows);
            newExpanded.add(submissionId);
            setExpandedRows(newExpanded);

            // Nếu chưa có data, gọi API
            if (!submissionDataMap.has(submissionId)) {
                const newLoadingMap = new Map(loadingMap);
                newLoadingMap.set(submissionId, true);
                setLoadingMap(newLoadingMap);

                const url = `/submissions/${submissionId}/result`;
                http.get(url)
                    .then((res) => {
                        const newDataMap = new Map(submissionDataMap);
                        newDataMap.set(submissionId, res.data);
                        setSubmissionDataMap(newDataMap);
                    })
                    .catch((error) => {
                        console.error('[API] GET', url, '- Error:', error);
                        globalStore.triggerNotification('error', 'Không thể tải chi tiết bài nộp', '');
                        const newExpanded = new Set(expandedRows);
                        newExpanded.delete(submissionId);
                        setExpandedRows(newExpanded);
                    })
                    .finally(() => {
                        const newLoadingMap = new Map(loadingMap);
                        newLoadingMap.set(submissionId, false);
                        setLoadingMap(newLoadingMap);
                    });
            }
        } else {
            const newExpanded = new Set(expandedRows);
            newExpanded.delete(submissionId);
            setExpandedRows(newExpanded);
        }
    };

    const getVerdictColor = (verdict: string) => {
        if (verdict === 'ACCEPTED') return 'green';
        if (verdict === 'WRONG_ANSWER') return 'red';
        if (verdict === 'TIME_LIMIT_EXCEEDED') return 'orange';
        if (verdict === 'MEMORY_LIMIT_EXCEEDED') return 'purple';
        if (verdict === 'RUNTIME_ERROR') return 'red';
        if (verdict === 'COMPILATION_ERROR') return 'red';
        return 'default';
    };

    const getVerdictLabel = (verdict: string) => {
        const verdictMap: { [key: string]: string } = {
            ACCEPTED: 'AC',
            WRONG_ANSWER: 'WA',
            TIME_LIMIT_EXCEEDED: 'TLE',
            MEMORY_LIMIT_EXCEEDED: 'MLE',
            RUNTIME_ERROR: 'RE',
            COMPILATION_ERROR: 'CE'
        };
        return verdictMap[verdict] || verdict;
    };

    return (
        <Modal
            title="Chi tiết bài nộp"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Đóng
                </Button>
            ]}
            width={1000}
        >
            <Spin spinning={loading}>
                {submissionResult && (
                    <div>
                        <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Mã bài thi">{submissionResult.examCode}</Descriptions.Item>
                            <Descriptions.Item label="Tên bài thi">{submissionResult.examTitle}</Descriptions.Item>
                            <Descriptions.Item label="Học sinh">{submissionResult.userName}</Descriptions.Item>
                            <Descriptions.Item label="Tổng điểm">
                                <strong>{submissionResult.totalScore?.toFixed(1)}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số bài tập đã hoàn thành">
                                {submissionResult.completedExercises} / {submissionResult.totalExercises}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian bắt đầu">
                                {dayjs.unix(submissionResult.startTime).format('DD/MM/YYYY HH:mm:ss')}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ marginBottom: '16px' }}>Danh sách bài nộp:</h4>
                            <Table
                                dataSource={submissionResult.submissions}
                                rowKey="submissionId"
                                pagination={false}
                                expandable={{
                                    expandedRowRender: (record: SubmissionDetail) => {
                                        const submissionId = record.submissionId;
                                        const data = submissionDataMap.get(submissionId);
                                        const isLoading = loadingMap.get(submissionId) || false;

                                        if (isLoading) {
                                            return (
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <Spin />
                                                </div>
                                            );
                                        }

                                        if (!data) {
                                            return null;
                                        }

                                        return (
                                            <div style={{ padding: '16px' }}>
                                                <Descriptions
                                                    bordered
                                                    column={2}
                                                    size="small"
                                                    style={{ marginBottom: '16px' }}
                                                >
                                                    <Descriptions.Item label="Ngôn ngữ">
                                                        {data.languageCode}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Trạng thái">
                                                        <Tag
                                                            color={getVerdictColor(data.verdict)}
                                                            icon={
                                                                data.isAccepted ? (
                                                                    <CheckCircleOutlined />
                                                                ) : (
                                                                    <CloseCircleOutlined />
                                                                )
                                                            }
                                                        >
                                                            {getVerdictLabel(data.verdict)}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Thời gian">
                                                        {data.time} giây
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Bộ nhớ">
                                                        {parseFloat(data.memory).toFixed(2)} MB
                                                    </Descriptions.Item>
                                                </Descriptions>

                                                <Card title="Source Code" size="small" style={{ marginBottom: '16px' }}>
                                                    <pre
                                                        style={{
                                                            background: '#0f0f0f',
                                                            color: '#ffffff',
                                                            padding: '12px',
                                                            borderRadius: '4px',
                                                            overflow: 'auto',
                                                            maxHeight: '300px',
                                                            margin: 0,
                                                            fontSize: '12px',
                                                            fontFamily: 'Menlo, Monaco, Consolas, monospace',
                                                            border: '1px solid #1f1f1f',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        <code>{data.sourceCode}</code>
                                                    </pre>
                                                </Card>

                                                <Card title="Kết quả test cases" size="small">
                                                    <Table
                                                        dataSource={data.submissionResults}
                                                        rowKey="token"
                                                        pagination={false}
                                                        size="small"
                                                        columns={[
                                                            {
                                                                title: 'Test case',
                                                                key: 'index',
                                                                width: 100,
                                                                align: 'center' as const,
                                                                render: (_: unknown, __: unknown, index: number) =>
                                                                    `Test ${index + 1}`
                                                            },
                                                            {
                                                                title: 'Input',
                                                                key: 'input',
                                                                render: (_: unknown, __: unknown, index: number) => {
                                                                    const testCase = data.exercise.testCases[index];
                                                                    return testCase ? (
                                                                        <pre
                                                                            style={{
                                                                                margin: 0,
                                                                                whiteSpace: 'pre-wrap',
                                                                                fontSize: '12px'
                                                                            }}
                                                                        >
                                                                            {testCase.input}
                                                                        </pre>
                                                                    ) : (
                                                                        '-'
                                                                    );
                                                                }
                                                            },
                                                            {
                                                                title: 'Expected Output',
                                                                key: 'expected',
                                                                render: (_: unknown, __: unknown, index: number) => {
                                                                    const testCase = data.exercise.testCases[index];
                                                                    return testCase ? (
                                                                        <pre
                                                                            style={{
                                                                                margin: 0,
                                                                                whiteSpace: 'pre-wrap',
                                                                                fontSize: '12px'
                                                                            }}
                                                                        >
                                                                            {testCase.output}
                                                                        </pre>
                                                                    ) : (
                                                                        '-'
                                                                    );
                                                                }
                                                            },
                                                            {
                                                                title: 'Actual Output',
                                                                key: 'actual',
                                                                render: (_: unknown, record) => (
                                                                    <pre
                                                                        style={{
                                                                            margin: 0,
                                                                            whiteSpace: 'pre-wrap',
                                                                            fontSize: '12px'
                                                                        }}
                                                                    >
                                                                        {record.actualOutput || '-'}
                                                                    </pre>
                                                                )
                                                            },
                                                            {
                                                                title: 'Trạng thái',
                                                                key: 'verdict',
                                                                width: 100,
                                                                align: 'center' as const,
                                                                render: (_: unknown, record) => (
                                                                    <Tag color={getVerdictColor(record.verdict)}>
                                                                        {getVerdictLabel(record.verdict)}
                                                                    </Tag>
                                                                )
                                                            }
                                                        ]}
                                                    />
                                                </Card>
                                            </div>
                                        );
                                    },
                                    expandedRowKeys: Array.from(expandedRows),
                                    onExpand: handleExpand,
                                    expandRowByClick: false
                                }}
                                columns={[
                                    {
                                        title: 'STT',
                                        key: 'index',
                                        width: 60,
                                        align: 'center' as const,
                                        render: (_: unknown, __: unknown, index: number) => index + 1
                                    },
                                    {
                                        title: 'Mã bài tập',
                                        dataIndex: 'exerciseCode',
                                        key: 'exerciseCode',
                                        width: 100
                                    },
                                    {
                                        title: 'Tên bài tập',
                                        dataIndex: 'exerciseTitle',
                                        key: 'exerciseTitle'
                                    },
                                    {
                                        title: 'Điểm',
                                        dataIndex: 'score',
                                        key: 'score',
                                        width: 100,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionDetail) => (
                                            // <strong>{score.toFixed(1)}</strong>
                                            <strong>
                                                {(
                                                    (record.passedTestCases /
                                                        record.totalTestCases /
                                                        submissionResult.totalExercises) *
                                                    100
                                                ).toFixed(1)}
                                            </strong>
                                        )
                                    },
                                    {
                                        title: 'Test case',
                                        key: 'testCases',
                                        width: 120,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionDetail) => (
                                            <span>
                                                {record.passedTestCases} / {record.totalTestCases}
                                            </span>
                                        )
                                    },
                                    {
                                        title: 'Trạng thái',
                                        key: 'isAccepted',
                                        width: 120,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionDetail) => (
                                            <Tag
                                                color={record.isAccepted ? 'green' : 'red'}
                                                icon={
                                                    record.isAccepted ? (
                                                        <CheckCircleOutlined />
                                                    ) : (
                                                        <CloseCircleOutlined />
                                                    )
                                                }
                                            >
                                                {record.isAccepted ? 'AC' : 'WA'}
                                            </Tag>
                                        )
                                    },
                                    {
                                        title: 'Thời gian nộp',
                                        key: 'submittedAt',
                                        width: 180,
                                        render: (_: unknown, record: SubmissionDetail) =>
                                            dayjs.unix(record.submittedAt).format('DD/MM/YYYY HH:mm:ss')
                                    },
                                    {
                                        title: 'Hành động',
                                        key: 'action',
                                        width: 100,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionDetail) => (
                                            <Button
                                                type="text"
                                                icon={<EyeOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleExpand(!expandedRows.has(record.submissionId), record);
                                                }}
                                                title="Xem chi tiết"
                                            />
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default SubmissionDetailModal;
export type { SubmissionResult, SubmissionDetail };
