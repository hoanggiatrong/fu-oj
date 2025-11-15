import { Select, Table } from 'antd';

interface Exam {
    id: string;
    title: string;
}

interface ExamRanking {
    id: string;
    user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    totalScore?: number | null;
    updatedTimestamp?: string;
    createdTimestamp?: string;
}

interface SubmissionsTabContentProps {
    exams: Exam[];
    selectedExamId: string | null;
    examRankings: ExamRanking[];
    onExamChange: (examId: string) => void;
}

const SubmissionsTabContent = ({ exams, selectedExamId, examRankings, onExamChange }: SubmissionsTabContentProps) => {
    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Chọn bài kiểm tra"
                    style={{ width: '100%' }}
                    onChange={onExamChange}
                    value={selectedExamId}
                >
                    {exams.map((exam) => (
                        <Select.Option key={exam.id} value={exam.id}>
                            {exam.title}
                        </Select.Option>
                    ))}
                </Select>
            </div>
            {selectedExamId && (
                <Table
                    rowKey="id"
                    dataSource={examRankings}
                    pagination={{ pageSize: 10 }}
                    columns={[
                        {
                            title: 'Tên sinh viên',
                            key: 'studentName',
                            render: (_: unknown, record: ExamRanking) => {
                                const firstName = record.user?.firstName || '';
                                const lastName = record.user?.lastName || '';
                                const fullName = `${firstName} ${lastName}`.trim();
                                return fullName || record.user?.email || '-';
                            }
                        },
                        {
                            title: 'Điểm',
                            key: 'score',
                            render: (_: unknown, record: ExamRanking) => {
                                return record.totalScore !== null && record.totalScore !== undefined
                                    ? record.totalScore.toFixed(1)
                                    : '-';
                            }
                        },
                        {
                            title: 'Thời gian nộp',
                            key: 'submittedAt',
                            render: (_: unknown, record: ExamRanking) => {
                                const time = record.updatedTimestamp || record.createdTimestamp;
                                return time ? new Date(time).toLocaleString('vi-VN') : '-';
                            }
                        }
                    ]}
                />
            )}
        </div>
    );
};

export default SubmissionsTabContent;

