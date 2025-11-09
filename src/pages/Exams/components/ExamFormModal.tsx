import { Modal, Form, Input, DatePicker, Select, Button } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import globalStore from '../../../components/GlobalComponent/globalStore';
import type { ExamData, SelectOption } from '../types';
import type { FormProps } from 'antd';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ExamFormModalProps {
    open: boolean;
    updateId: string | null;
    editingRecord: ExamData | null;
    groups: SelectOption[];
    exercises: SelectOption[];
    onFinish: FormProps['onFinish'];
    form: any;
    setUpdateId: (id: string | null) => void;
    setEditingRecord: (record: ExamData | null) => void;
}

const ExamFormModal = observer(({
    open,
    updateId,
    editingRecord,
    groups,
    exercises,
    onFinish,
    form,
    setUpdateId,
    setEditingRecord
}: ExamFormModalProps) => {
    useEffect(() => {
        if (open && editingRecord && updateId) {
            // Set giá trị form khi modal mở và có record cần edit
            setTimeout(() => {
                form.setFieldsValue({
                    title: editingRecord.title,
                    description: editingRecord.description,
                    startTime: editingRecord.startTime ? dayjs(editingRecord.startTime) : null,
                    endTime: editingRecord.endTime ? dayjs(editingRecord.endTime) : null,
                    groupIds: editingRecord.groups?.map((g) => g.id) || [],
                    exerciseIds: editingRecord.exercises?.map((e) => e.id) || []
                });
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editingRecord, updateId]);

    const handleCancel = () => {
        form.resetFields();
        setUpdateId(null);
        setEditingRecord(null);
        globalStore.setOpenDetailPopup(false);
    };

    return (
        <Modal
            title={updateId ? 'Chỉnh sửa bài thi' : 'Tạo bài thi mới'}
            className="detail-modal"
            open={open}
            onCancel={handleCancel}
            width={600}
            footer={null}
        >
            <div className="groups-form-content">
                <Form
                    form={form}
                    name="exam-form"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Tiêu đề"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <div className="flex gap">
                        <Form.Item
                            className="flex-1"
                            label="Thời gian bắt đầu"
                            name="startTime"
                            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm"
                                style={{ width: '100%' }}
                                placeholder="Chọn thời gian bắt đầu"
                            />
                        </Form.Item>

                        <Form.Item
                            className="flex-1"
                            label="Thời gian kết thúc"
                            name="endTime"
                            rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc!' }]}
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm"
                                style={{ width: '100%' }}
                                placeholder="Chọn thời gian kết thúc"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Nhóm"
                        name="groupIds"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 nhóm!' }]}
                    >
                        <Select
                            mode="multiple"
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Chọn nhóm"
                            options={groups}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Bài tập"
                        name="exerciseIds"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 bài tập!' }]}
                    >
                        <Select
                            mode="multiple"
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Chọn bài tập"
                            options={exercises}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item label={null}>
                        <Button type="primary" htmlType="submit">
                            {updateId ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
});

export default ExamFormModal;

