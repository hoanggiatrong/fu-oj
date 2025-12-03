import { Button, Form, Input, Modal, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';

interface CreateCourseModalProps {
    open: boolean;
    form: FormInstance;
    confirmLoading: boolean;
    onOk: () => void;
    onCancel: () => void;
    exercises: any[];
}

const CreateCourseModal = ({ open, form, confirmLoading, onOk, onCancel, exercises }: CreateCourseModalProps) => {
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

                    <Form.Item
                        label="Ảnh khóa học"
                        name="file"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                    >
                        <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Bài tập trong khóa" name="exerciseIds">
                        <Select
                            mode="multiple"
                            showSearch
                            allowClear
                            placeholder="Chọn bài tập để thêm vào khóa học"
                            options={exercises.map((item) => ({
                                value: item.value,
                                label: item.label
                            }))}
                            filterOption={(input, option) =>
                                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        />
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
