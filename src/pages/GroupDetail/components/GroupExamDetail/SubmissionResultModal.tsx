import { Modal, Button, Spin, Descriptions, Table, Tag, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface TestCase {
    id: string;
    input: string;
    output: string;
    note: string | null;
    isPublic: boolean;
}

interface Exercise {
    id: string;
    code: string;
    title: string;
    description: string;
    timeLimit: number;
    memory: number;
    difficulty: string;
    testCases: TestCase[];
    testCasesCount: number;
}

interface SubmissionResultItem {
    token: string;
    actualOutput: string | null;
    stderr: string | null;
    verdict: string;
    time: string;
    memory: string;
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
    exercise: Exercise;
    submissionResults: SubmissionResultItem[];
}

interface SubmissionResultModalProps {
    open: boolean;
    onCancel: () => void;
    submissionData: SubmissionResultData | null;
    loading: boolean;
}

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
        'ACCEPTED': 'AC',
        'WRONG_ANSWER': 'WA',
        'TIME_LIMIT_EXCEEDED': 'TLE',
        'MEMORY_LIMIT_EXCEEDED': 'MLE',
        'RUNTIME_ERROR': 'RE',
        'COMPILATION_ERROR': 'CE'
    };
    return verdictMap[verdict] || verdict;
};

const SubmissionResultModal = ({ open, onCancel, submissionData, loading }: SubmissionResultModalProps) => {
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
                {submissionData && (
                    <div>
                        <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Mã bài tập">{submissionData.exercise.code}</Descriptions.Item>
                            <Descriptions.Item label="Tên bài tập">{submissionData.exercise.title}</Descriptions.Item>
                            <Descriptions.Item label="Ngôn ngữ">{submissionData.languageCode}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag 
                                    color={getVerdictColor(submissionData.verdict)}
                                    icon={submissionData.isAccepted ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                >
                                    {getVerdictLabel(submissionData.verdict)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">{submissionData.time} giây</Descriptions.Item>
                            <Descriptions.Item label="Bộ nhớ">{parseFloat(submissionData.memory).toFixed(2)} MB</Descriptions.Item>
                            <Descriptions.Item label="Test case đã pass">
                                {submissionData.passedTestCases} / {submissionData.totalTestCases}
                            </Descriptions.Item>
                            <Descriptions.Item label="Độ khó">
                                <Tag color={submissionData.exercise.difficulty === 'EASY' ? 'green' : submissionData.exercise.difficulty === 'MEDIUM' ? 'orange' : 'red'}>
                                    {submissionData.exercise.difficulty}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <Card title="Source Code" style={{ marginBottom: '16px' }}>
                            <pre style={{ 
                                background: '#f5f5f5', 
                                padding: '16px', 
                                borderRadius: '4px',
                                overflow: 'auto',
                                maxHeight: '400px',
                                margin: 0
                            }}>
                                <code>{submissionData.sourceCode}</code>
                            </pre>
                        </Card>

                        <Card title="Kết quả test cases">
                            <Table
                                dataSource={submissionData.submissionResults}
                                rowKey="token"
                                pagination={false}
                                columns={[
                                    {
                                        title: 'Test case',
                                        key: 'index',
                                        width: 100,
                                        align: 'center' as const,
                                        render: (_: unknown, __: unknown, index: number) => `Test ${index + 1}`
                                    },
                                    {
                                        title: 'Input',
                                        key: 'input',
                                        render: (_: unknown, __: unknown, index: number) => {
                                            const testCase = submissionData.exercise.testCases[index];
                                            return testCase ? (
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{testCase.input}</pre>
                                            ) : '-';
                                        }
                                    },
                                    {
                                        title: 'Expected Output',
                                        key: 'expectedOutput',
                                        render: (_: unknown, __: unknown, index: number) => {
                                            const testCase = submissionData.exercise.testCases[index];
                                            return testCase ? (
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{testCase.output}</pre>
                                            ) : '-';
                                        }
                                    },
                                    {
                                        title: 'Actual Output',
                                        key: 'actualOutput',
                                        render: (_: unknown, record: SubmissionResultItem) => (
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {record.actualOutput || '-'}
                                            </pre>
                                        )
                                    },
                                    {
                                        title: 'Trạng thái',
                                        key: 'verdict',
                                        width: 120,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionResultItem) => (
                                            <Tag color={getVerdictColor(record.verdict)}>
                                                {getVerdictLabel(record.verdict)}
                                            </Tag>
                                        )
                                    },
                                    {
                                        title: 'Thời gian',
                                        key: 'time',
                                        width: 100,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionResultItem) => `${record.time} giây`
                                    },
                                    {
                                        title: 'Bộ nhớ',
                                        key: 'memory',
                                        width: 100,
                                        align: 'center' as const,
                                        render: (_: unknown, record: SubmissionResultItem) => `${record.memory} KB`
                                    }
                                ]}
                            />
                        </Card>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default SubmissionResultModal;
export type { SubmissionResultData };

