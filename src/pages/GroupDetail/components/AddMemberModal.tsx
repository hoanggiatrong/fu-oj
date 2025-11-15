import type { FormProps } from 'antd';
import { Modal, Form, Input, Button } from 'antd';
import * as http from '../../../lib/httpRequest';
import globalStore from '../../../components/GlobalComponent/globalStore';

interface AddMemberModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const AddMemberModal = ({ open, onCancel, onSuccess }: AddMemberModalProps) => {
    const [form] = Form.useForm();

    const onFinish: FormProps['onFinish'] = (values) => {
        const code = values.joinCode;

        if (code) {
            http.post(`/groups/join`, { code: code })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    form.resetFields();
                    onSuccess();
                    onCancel();
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                });
        }
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Modal
            title="Tham gia nhóm"
            className="detail-modal"
            open={open}
            onCancel={onCancel}
            width={420}
            footer={null}
        >
            <div className="groups-form-content">
                <Form
                    form={form}
                    name="basic"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Mã tham gia"
                        name="joinCode"
                        rules={[{ required: true, message: 'Vui lòng nhập mã tham gia!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item label={null}>
                        <Button type="primary" htmlType="submit">
                            Tham gia
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default AddMemberModal;

