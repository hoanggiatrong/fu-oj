import { Form, Input, Modal } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface AssignExercisesModalProps {
    open: boolean;
    form: FormInstance;
    confirmLoading: boolean;
    onOk: () => void;
    onCancel: () => void;
    courseTitle?: string;
}

const AssignExercisesModal = ({
    open,
    form,
    confirmLoading,
    onOk,
    onCancel,
    courseTitle
}: AssignExercisesModalProps) => {
    return (
        <Modal
            title={`Gán bài tập cho khóa học${courseTitle ? `: ${courseTitle}` : ''}`}
            open={open}
            onOk={onOk}
            confirmLoading={confirmLoading}
            okText="Gán bài tập"
            cancelText="Hủy"
            onCancel={onCancel}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Danh sách ID bài tập"
                    name="exerciseIds"
                    rules={[{ required: true, message: 'Vui lòng nhập danh sách ID bài tập.' }]}
                    extra="Nhập mỗi ID trên một dòng hoặc cách nhau bởi dấu phẩy."
                >
                    <Input.TextArea rows={5} placeholder="Ví dụ: 96c4966d-2847-4250-99ac-38dc7fd018e5" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AssignExercisesModal;

