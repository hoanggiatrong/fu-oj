import type { FormProps } from 'antd';
import { Modal, Form, Select, Button } from 'antd';
import * as http from '../../../lib/httpRequest';
import globalStore from '../../../components/GlobalComponent/globalStore';

interface Exercise {
    id: string;
    code: string;
    title: string;
}

interface AddExerciseModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    groupId: string;
    allExercises: Exercise[];
}

const AddExerciseModal = ({ open, onCancel, onSuccess, groupId, allExercises }: AddExerciseModalProps) => {
    const [form] = Form.useForm();

    const onFinish: FormProps['onFinish'] = (values) => {
        const exerciseIds = values.exerciseIds || [];
        http.post(`/groups/${groupId}/exercises`, { exerciseIds })
            .then((res) => {
                globalStore.triggerNotification('success', res.message || 'Thêm bài tập thành công!', '');
                form.resetFields();
                onSuccess();
                onCancel();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
            });
    };

    return (
        <Modal
            title="Thêm bài tập cho nhóm"
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                name="addExercise"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                labelAlign="left"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label="Chọn bài tập"
                    name="exerciseIds"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một bài tập!' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Chọn bài tập"
                        style={{ width: '100%' }}
                        options={allExercises.map((exercise) => ({
                            value: exercise.id,
                            label: `${exercise.code} - ${exercise.title}`
                        }))}
                    />
                </Form.Item>

                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Thêm bài tập
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddExerciseModal;

