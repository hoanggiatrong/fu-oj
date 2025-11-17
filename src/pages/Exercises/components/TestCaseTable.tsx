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
                    title: 'Input',
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
                    title: 'Output',
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
                    title: 'Note',
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
                    title: 'State',
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
                                    { value: true, label: 'Public' },
                                    { value: false, label: 'Hidden' }
                                ]}
                            />
                        ) : (
                            isPublic ? <Tag color="green">Public</Tag> : <Tag color="red">Hidden</Tag>
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

