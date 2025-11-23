import { Form, Input, Modal, Button } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface CreateCourseModalProps {
    open: boolean;
    form: FormInstance;
    confirmLoading: boolean;
    onOk: () => void;
    onCancel: () => void;
}

const CreateCourseModal = ({ open, form, confirmLoading, onOk, onCancel }: CreateCourseModalProps) => {
    return (
        <Modal
            className="detail-modal"
            title="Tạo khóa học mới"
            open={open}
            onOk={onOk}
            confirmLoading={confirmLoading}
            okText="Tạo khóa học"
            cancelText="Hủy"
            onCancel={onCancel}
            destroyOnClose
        >
            <div className="exercise-form">
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Tên khóa học"
                        name="title"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên khóa học' },
                            {
                                validator: (_, value) =>
                                    value && value.trim().length >= 3
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('Tên khóa học phải có ít nhất 3 ký tự'))
                            }
                        ]}
                    >
                        <Input placeholder="Ví dụ: Data Structures 101" autoFocus />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mô tả cho khóa học' },
                            {
                                max: 500,
                                message: 'Mô tả tối đa 500 ký tự.'
                            }
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Mô tả ngắn gọn về khóa học" />
                    </Form.Item>

                    <Form.Item label={null}>
                        <Button type="primary" htmlType="submit" onClick={onOk}>
                            Tạo mới
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default CreateCourseModal;
