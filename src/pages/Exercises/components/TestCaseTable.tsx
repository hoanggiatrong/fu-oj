import { Button, Input, Popconfirm, Select, Table, Tag } from 'antd';

import type { ExercisePreview } from './ExercisePreviewCard';

interface TestCase {
    input: string;
    output: string;
    note?: string;
    isPublic: boolean;
}

interface TestCaseTableProps {
    testCases: TestCase[];
    isEditing: boolean;
    onUpdateTestCase: (
        testCaseIndex: number,
        field: keyof ExercisePreview['testCases'][number],
        value: string | boolean | undefined
    ) => void;
    onDeleteTestCase: (testCaseIndex: number) => void;
}

const TestCaseTable = ({ testCases, isEditing, onUpdateTestCase, onDeleteTestCase }: TestCaseTableProps) => {
    return (
        <Table
            dataSource={testCases.map((tc, tcIndex) => ({ ...tc, key: tcIndex }))}
            columns={[
                {
                    title: 'Đầu vào',
                    dataIndex: 'input',
                    key: 'input',
                    render: (text: string, record: any) => {
                        const testCaseIndex = record.key as number;
                        return isEditing ? (
                            <Input.TextArea
                                value={text}
                                onChange={(e) => onUpdateTestCase(testCaseIndex, 'input', e.target.value)}
                                rows={2}
                                style={{ fontFamily: 'monospace', fontSize: 12 }}
                            />
                        ) : (
                            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{text}</div>
                        );
                    }
                },
                {
                    title: 'Đầu ra',
                    dataIndex: 'output',
                    key: 'output',
                    render: (text: string, record: any) => {
                        const testCaseIndex = record.key as number;
                        return isEditing ? (
                            <Input.TextArea
                                value={text}
                                onChange={(e) => onUpdateTestCase(testCaseIndex, 'output', e.target.value)}
                                rows={2}
                                style={{ fontFamily: 'monospace', fontSize: 12 }}
                            />
                        ) : (
                            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{text}</div>
                        );
                    }
                },
                {
                    title: 'Ghi chú',
                    dataIndex: 'note',
                    key: 'note',
                    render: (text: string, record: any) => {
                        const testCaseIndex = record.key as number;
                        return isEditing ? (
                            <Input
                                value={text || ''}
                                onChange={(e) => onUpdateTestCase(testCaseIndex, 'note', e.target.value)}
                            />
                        ) : (
                            text || '-'
                        );
                    }
                },
                {
                    title: 'Hiển thị',
                    dataIndex: 'isPublic',
                    key: 'isPublic',
                    render: (isPublic: boolean, record: any) => {
                        const testCaseIndex = record.key as number;
                        return isEditing ? (
                            <Select
                                value={isPublic}
                                onChange={(value) => onUpdateTestCase(testCaseIndex, 'isPublic', value)}
                                style={{ width: '100%' }}
                                options={[
                                    { value: true, label: 'Công khai' },
                                    { value: false, label: 'Ẩn' }
                                ]}
                            />
                        ) : isPublic ? (
                            <Tag color="green">Công khai</Tag>
                        ) : (
                            <Tag color="red">Ẩn</Tag>
                        );
                    }
                },
                ...(isEditing
                    ? [
                          {
                              title: 'Thao tác',
                              key: 'action',
                              render: (_: unknown, record: any) => {
                                  const testCaseIndex = record.key as number;
                                  return (
                                      <Popconfirm
                                          title="Xóa test case"
                                          description="Bạn có chắc chắn muốn xóa test case này?"
                                          onConfirm={() => onDeleteTestCase(testCaseIndex)}
                                          okText="Xóa"
                                          cancelText="Hủy"
                                      >
                                          <Button size="small" danger>
                                              Xóa
                                          </Button>
                                      </Popconfirm>
                                  );
                              }
                          }
                      ]
                    : [])
            ]}
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
        />
    );
};

export default TestCaseTable;
