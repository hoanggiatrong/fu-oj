import { Button, Input, InputNumber, Popconfirm, Select, Tag } from 'antd';
import utils from '../../../utils/utils';
import TestCaseTable from './TestCaseTable';

export interface ExercisePreview {
    code: string;
    title: string;
    description: string;
    solution?: string;
    solutionLanguage?: string;
    difficulty: string;
    timeLimit: number;
    memory: number;
    visibility: string;
    prompt?: string;
    topicIds?: string[];
    testCases: Array<{
        input: string;
        output: string;
        note?: string;
        isPublic: boolean;
    }>;
}

interface ExercisePreviewCardProps {
    exercise: ExercisePreview;
    index: number;
    isEditing: boolean;
    topics: Array<{ value: string; label: string }>;
    onStartEdit: () => void;
    onStopEdit: () => void;
    onDelete: () => void;
    onUpdateExercise: (
        field: keyof ExercisePreview,
        value: string | number | boolean | string[] | null | undefined
    ) => void;
    onUpdateTestCase: (
        testCaseIndex: number,
        field: keyof ExercisePreview['testCases'][number],
        value: string | boolean | undefined
    ) => void;
    onDeleteTestCase: (testCaseIndex: number) => void;
    onAddTestCase: () => void;
}

const ExercisePreviewCard = ({
    exercise,
    index,
    isEditing,
    topics,
    onStartEdit,
    onStopEdit,
    onDelete,
    onUpdateExercise,
    onUpdateTestCase,
    onDeleteTestCase,
    onAddTestCase
}: ExercisePreviewCardProps) => {
    return (
        <div
            className="ai-exercise-preview-card"
            style={{
                marginBottom: 24,
                padding: 16,
                borderRadius: 8,
                border: '1px solid #d9d9d9'
            }}
        >
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                    Bài tập {index + 1}:{' '}
                    {isEditing ? (
                        <Input
                            value={exercise.title}
                            onChange={(e) => onUpdateExercise('title', e.target.value)}
                            style={{ width: '60%', marginLeft: 8 }}
                        />
                    ) : (
                        exercise.title
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isEditing ? (
                        <Button size="small" type="primary" onClick={onStopEdit}>
                            Lưu
                        </Button>
                    ) : (
                        <Button size="small" onClick={onStartEdit}>
                            Sửa
                        </Button>
                    )}
                    <Popconfirm
                        title="Xóa bài tập"
                        description="Bạn có chắc chắn muốn xóa bài tập này?"
                        onConfirm={onDelete}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button size="small" danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </div>
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Mã bài tập:</strong>{' '}
                {isEditing ? (
                    <Input
                        value={exercise.code}
                        onChange={(e) => onUpdateExercise('code', e.target.value)}
                        style={{ width: '200px', marginLeft: 8 }}
                    />
                ) : (
                    exercise.code
                )}
            </div>
            {exercise.topicIds && exercise.topicIds.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <strong>Topics:</strong>{' '}
                    {isEditing ? (
                        <Select
                            mode="multiple"
                            value={exercise.topicIds}
                            onChange={(value) => onUpdateExercise('topicIds', value)}
                            style={{ width: '300px', marginLeft: 8 }}
                            options={topics}
                        />
                    ) : (
                        exercise.topicIds.map((topicId: string) => {
                            const topic = topics.find((t) => t.value === topicId);
                            return (
                                <Tag key={topicId} color="blue" style={{ marginRight: 4 }}>
                                    {topic?.label || topicId}
                                </Tag>
                            );
                        })
                    )}
                </div>
            )}
            <div style={{ marginBottom: 8 }}>
                <strong>Độ khó:</strong>{' '}
                {isEditing ? (
                    <Select
                        value={exercise.difficulty}
                        onChange={(value) => onUpdateExercise('difficulty', value)}
                        style={{ width: '150px', marginLeft: 8 }}
                        options={[
                            { value: 'EASY', label: 'EASY' },
                            { value: 'MEDIUM', label: 'MEDIUM' },
                            { value: 'HARD', label: 'HARD' }
                        ]}
                    />
                ) : (
                    utils.getDifficultyClass(exercise.difficulty)
                )}
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Giới hạn thời gian:</strong>{' '}
                {isEditing ? (
                    <InputNumber
                        value={exercise.timeLimit}
                        onChange={(value) => onUpdateExercise('timeLimit', value)}
                        min={0}
                        step={0.1}
                        style={{ width: '150px', marginLeft: 8 }}
                        addonAfter="s"
                    />
                ) : (
                    `${exercise.timeLimit}s`
                )}
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Bộ nhớ:</strong>{' '}
                {isEditing ? (
                    <InputNumber
                        value={exercise.memory}
                        onChange={(value) => onUpdateExercise('memory', value)}
                        min={0}
                        style={{ width: '150px', marginLeft: 8 }}
                        addonAfter="bytes"
                    />
                ) : (
                    `${exercise.memory} bytes`
                )}
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Khả năng hiển thị:</strong>{' '}
                {isEditing ? (
                    <Select
                        value={exercise.visibility}
                        onChange={(value) => onUpdateExercise('visibility', value)}
                        style={{ width: '150px', marginLeft: 8 }}
                        options={[
                            { value: 'DRAFT', label: 'DRAFT' },
                            { value: 'PRIVATE', label: 'PRIVATE' }
                        ]}
                    />
                ) : (
                    <Tag
                        color={
                            exercise.visibility === 'PRIVATE'
                                ? 'red'
                                : 'orange'
                        }
                    >
                        {exercise.visibility || 'DRAFT'}
                    </Tag>
                )}
            </div>
            {exercise.prompt && (
                <div style={{ marginBottom: 12 }}>
                    <strong>Prompt:</strong>
                    {isEditing ? (
                        <Input.TextArea
                            value={exercise.prompt}
                            onChange={(e) => onUpdateExercise('prompt', e.target.value)}
                            rows={4}
                            style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
                            placeholder="Nhập prompt..."
                        />
                    ) : (
                        <div
                            style={{
                                marginTop: 4,
                                padding: 12,
                                borderRadius: 4,
                                border: '1px solid #d9d9d9',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                whiteSpace: 'pre-wrap',
                                backgroundColor: '#fafafa'
                            }}
                        >
                            {exercise.prompt}
                        </div>
                    )}
                </div>
            )}
            {isEditing && !exercise.prompt && (
                <div style={{ marginBottom: 8 }}>
                    <strong>Prompt:</strong>
                    <Input.TextArea
                        value={exercise.prompt || ''}
                        onChange={(e) => onUpdateExercise('prompt', e.target.value)}
                        rows={4}
                        style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
                        placeholder="Nhập prompt (tùy chọn)..."
                    />
                </div>
            )}
            {exercise.solution && (
                <div style={{ marginBottom: 12 }}>
                    <strong>Solution:</strong>
                    {isEditing ? (
                        <Input.TextArea
                            value={exercise.solution}
                            onChange={(e) => onUpdateExercise('solution', e.target.value)}
                            rows={8}
                            style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
                            placeholder="Nhập solution code..."
                        />
                    ) : (
                        <div
                            style={{
                                marginTop: 4,
                                padding: 12,
                                borderRadius: 4,
                                border: '1px solid #d9d9d9',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                whiteSpace: 'pre-wrap',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}
                        >
                            {exercise.solution}
                        </div>
                    )}
                </div>
            )}
            {isEditing && !exercise.solution && (
                <div style={{ marginBottom: 8 }}>
                    <strong>Solution:</strong>
                    <Input.TextArea
                        value={exercise.solution || ''}
                        onChange={(e) => onUpdateExercise('solution', e.target.value)}
                        rows={8}
                        style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
                        placeholder="Nhập solution code..."
                    />
                </div>
            )}
            <div style={{ marginBottom: 12 }}>
                <strong>Mô tả:</strong>
                {isEditing ? (
                    <Input.TextArea
                        value={exercise.description}
                        onChange={(e) => onUpdateExercise('description', e.target.value)}
                        rows={6}
                        style={{ marginTop: 4 }}
                    />
                ) : (
                    <div
                        className="ai-exercise-description"
                        style={{
                            marginTop: 4,
                            padding: 8,
                            borderRadius: 4,
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {exercise.description}
                    </div>
                )}
            </div>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Test Cases ({exercise.testCases.length}):</strong>
                {isEditing && (
                    <Button size="small" type="dashed" onClick={onAddTestCase} style={{ marginBottom: 8 }}>
                        + Thêm test case
                    </Button>
                )}
            </div>
            <TestCaseTable
                testCases={exercise.testCases}
                isEditing={isEditing}
                onUpdateTestCase={onUpdateTestCase}
                onDeleteTestCase={onDeleteTestCase}
            />
        </div>
    );
};

export default ExercisePreviewCard;

