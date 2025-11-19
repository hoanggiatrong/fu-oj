import { Form, Input, InputNumber, Select, Spin } from 'antd';

interface ExerciseFormProps {
    form: any;
    topics: Array<{ value: string; label: string }>;
    topicsLoading: boolean;
    selectedTopic: string;
    setSelectedTopic: (value: string) => void;
    selectedLevels: string[];
    setSelectedLevels: (value: string[]) => void;
    numberOfExercise: number;
    setNumberOfExercise: (value: number) => void;
    numberOfPublicTestCases: number;
    setNumberOfPublicTestCases: (value: number) => void;
    numberOfPrivateTestCases: number;
    setNumberOfPrivateTestCases: (value: number) => void;
    solutionLanguage: string;
    setSolutionLanguage: (value: string) => void;
    prompt: string;
    setPrompt: (value: string) => void;
    visibility: string;
    setVisibility: (value: string) => void;
}

const ExerciseForm = ({
    form,
    topics,
    topicsLoading,
    selectedTopic,
    setSelectedTopic,
    selectedLevels,
    setSelectedLevels,
    numberOfExercise,
    setNumberOfExercise,
    numberOfPublicTestCases,
    setNumberOfPublicTestCases,
    numberOfPrivateTestCases,
    setNumberOfPrivateTestCases,
    solutionLanguage,
    setSolutionLanguage,
    prompt,
    setPrompt,
    visibility,
    setVisibility
}: ExerciseFormProps) => {
    const totalTestCases = numberOfPublicTestCases + numberOfPrivateTestCases;

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                topic: selectedTopic,
                numberOfExercise: numberOfExercise,
                level: selectedLevels,
                numberOfPublicTestCases: numberOfPublicTestCases,
                numberOfPrivateTestCases: numberOfPrivateTestCases,
                solutionLanguage: solutionLanguage,
                prompt: prompt,
                visibility: visibility
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Form.Item
                    name="topic"
                    label="Topic"
                    rules={[{ required: true, message: 'Vui lòng chọn topic!' }]}
                >
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Chọn topic"
                        value={selectedTopic || undefined}
                        onChange={(value) => {
                            setSelectedTopic(value);
                            form.setFieldsValue({ topic: value });
                        }}
                        options={topics}
                        notFoundContent={topicsLoading ? <Spin size="small" /> : 'Không có dữ liệu'}
                        loading={topicsLoading}
                    />
                </Form.Item>
                <Form.Item
                    name="numberOfExercise"
                    label="Số lượng bài tập"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số lượng bài tập!' },
                        { type: 'number', min: 1, max: 10, message: 'Số lượng phải từ 1 đến 10!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        max={10}
                        value={numberOfExercise}
                        onChange={(value) => {
                            setNumberOfExercise(value || 2);
                            form.setFieldsValue({ numberOfExercise: value || 2 });
                        }}
                    />
                </Form.Item>
            </div>
            <Form.Item
                name="level"
                label="Độ khó"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một độ khó!' }]}
            >
                <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Chọn độ khó"
                    value={selectedLevels}
                    onChange={(value) => {
                        setSelectedLevels(value);
                        form.setFieldsValue({ level: value });
                    }}
                    options={[
                        { value: 'EASY', label: 'EASY' },
                        { value: 'MEDIUM', label: 'MEDIUM' },
                        { value: 'HARD', label: 'HARD' }
                    ]}
                />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Form.Item
                    name="numberOfPublicTestCases"
                    label="Số lượng test case công khai"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số lượng test case công khai!' },
                        { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        value={numberOfPublicTestCases}
                        onChange={(value) => {
                            setNumberOfPublicTestCases(value || 2);
                            form.setFieldsValue({ numberOfPublicTestCases: value || 2 });
                        }}
                    />
                </Form.Item>
                <Form.Item
                    name="numberOfPrivateTestCases"
                    label="Số lượng test case ẩn"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số lượng test case ẩn!' },
                        { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        value={numberOfPrivateTestCases}
                        onChange={(value) => {
                            setNumberOfPrivateTestCases(value || 2);
                            form.setFieldsValue({ numberOfPrivateTestCases: value || 2 });
                        }}
                    />
                </Form.Item>
            </div>
            <Form.Item
                label="Tổng số test case mỗi bài tập"
                style={{ marginBottom: 16 }}
            >
                <div style={{ padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6}}>
                    {totalTestCases}
                </div>
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Form.Item
                    name="solutionLanguage"
                    label="Ngôn ngữ solution"
                    rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ solution!' }]}
                >
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Chọn ngôn ngữ"
                        value={solutionLanguage}
                        onChange={(value) => {
                            setSolutionLanguage(value);
                            form.setFieldsValue({ solutionLanguage: value });
                        }}
                        options={[
                            { value: 'Java', label: 'Java' },
                            { value: 'Python', label: 'Python' },
                            { value: 'C++', label: 'C++' },
                            { value: 'C', label: 'C' }
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    name="visibility"
                    label="Khả năng hiển thị"
                    rules={[{ required: true, message: 'Vui lòng chọn khả năng hiển thị!' }]}
                    initialValue="DRAFT"
                >
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Chọn khả năng hiển thị"
                        value={visibility || 'DRAFT'}
                        onChange={(value) => {
                            setVisibility(value);
                            form.setFieldsValue({ visibility: value });
                        }}
                        options={[
                            { value: 'DRAFT', label: 'DRAFT' },
                            { value: 'PRIVATE', label: 'PRIVATE' }
                        ]}
                    />
                </Form.Item>
            </div>
            <Form.Item
                name="prompt"
                label="Prompt (tùy chọn)"
            >
                <Input.TextArea
                    rows={6}
                    placeholder="Nhập prompt tùy chỉnh (nội dung yêu cầu tùy chỉnh)..."
                    value={prompt}
                    onChange={(e) => {
                        setPrompt(e.target.value);
                        form.setFieldsValue({ prompt: e.target.value });
                    }}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
            </Form.Item>
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                <div style={{ color: '#595959', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>⚠️ Lưu ý:</div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 12 }}>
                    AI tạo bài tập chỉ nên THAM KHẢO, vì vậy hãy double-check lại nhé!
                </div>
                <div style={{ color: '#595959', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>💡 Ví dụ prompt hiệu quả:</div>
                <div style={{ color: '#8c8c8c', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', backgroundColor: '#ffffff', padding: 8, borderRadius: 4, border: '1px solid #e0e0e0' }}>
{`Tạo bài tập về Array

bài 1: tìm số lớn nhất trong 1 mảng ( easy )

bài 2: sắp xếp mảng string ( medium )

bài 3: Viết chương trình Java để tìm phần tử lớn thứ hai trong một mảng.( hard )`}
                </div>
            </div>
        </Form>
    );
};

export default ExerciseForm;

