import { Modal, Form, Input, DatePicker, Select, Button, InputNumber, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import globalStore from '../../../components/GlobalComponent/globalStore';
import type { ExamData, SelectOption } from '../types';
import type { FormProps } from 'antd';
import * as http from '../../../lib/httpRequest';
import classnames from 'classnames';
import Line from '../../../components/Line/Line';
import { difficulties, type Difficulty } from '../../../constants/difficulty';
import { visbilities } from '../../../constants/visibility';

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
    onCancel?: () => void;
}

const ExamFormModal = observer(
    ({
        open,
        updateId,
        editingRecord,
        groups,
        exercises,
        onFinish,
        form,
        setUpdateId,
        setEditingRecord,
        onCancel
    }: ExamFormModalProps) => {
        const [originalDatas, setOriginalDatas] = useState<any>(null);
        const [displayDatas, setDisplayDatas] = useState<any>(null);
        const [topics, setTopics] = useState([]);
        const [filters, setFilters] = useState({
            difficulty: null,
            topicIds: [],
            visibility: null
        });

        const applyFilter = () => {
            if (!originalDatas) return;

            const filtered = originalDatas.filter((item: any) => {
                if (filters.difficulty && item.difficulty !== filters.difficulty) {
                    return false;
                }

                if (filters.topicIds.length > 0) {
                    const itemTopicIds = item.topics?.map((t: any) => t.id) || [];

                    const hasMatch = filters.topicIds.some((id: any) => itemTopicIds.includes(id));

                    if (!hasMatch) return false;
                }

                if (filters.visibility && item.visibility !== filters.visibility) {
                    return false;
                }

                return true;
            });

            setDisplayDatas(filtered);
        };

        const handleFilterChange = (key: string, value: any) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value
            }));
        };

        useEffect(() => {
            applyFilter();
        }, [filters]);

        useEffect(() => {
            setOriginalDatas(exercises);
            setDisplayDatas(exercises);
        }, [exercises]);

        useEffect(() => {
            if (open && editingRecord && updateId) {
                // Set giá trị form khi modal mở và có record cần edit
                setTimeout(() => {
                    form.setFieldsValue({
                        title: editingRecord.title,
                        description: editingRecord.description,
                        startTime: editingRecord.startTime ? dayjs(editingRecord.startTime) : null,
                        endTime: editingRecord.endTime ? dayjs(editingRecord.endTime) : null,
                        timeLimit: (editingRecord as ExamData & { timeLimit?: number | null }).timeLimit || null,
                        groupIds: editingRecord.groups?.map((g) => g.id) || [],
                        exerciseIds: editingRecord.exercises?.map((e) => e.id) || []
                    });
                }, 100);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open, editingRecord, updateId]);

        useEffect(() => {
            http.get('/topics').then((res) => {
                setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
            });
        }, []);

        const handleCancel = () => {
            form.resetFields();
            setUpdateId(null);
            setEditingRecord(null);
            if (onCancel) {
                onCancel();
            } else {
                globalStore.setOpenDetailPopup(false);
            }
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
                                    disabledDate={(current) => {
                                        const minTime = dayjs().add(5, 'minute');
                                        return current && current < minTime.startOf('day');
                                    }}
                                    disabledTime={(date) => {
                                        const minTime = dayjs().add(1, 'minute');
                                        if (!date) return {};

                                        // Nếu user chọn ngày trước ngày minTime → disable toàn bộ giờ
                                        if (date.isBefore(minTime, 'day')) {
                                            return {
                                                disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
                                                disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
                                                disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i)
                                            };
                                        }

                                        // Nếu cùng ngày → disable giờ/phút/giây trước minTime
                                        if (date.isSame(minTime, 'day')) {
                                            return {
                                                disabledHours: () =>
                                                    Array.from({ length: 24 }, (_, i) => i).filter(
                                                        (h) => h < minTime.hour()
                                                    ),

                                                disabledMinutes: () =>
                                                    date.hour() === minTime.hour()
                                                        ? Array.from({ length: 60 }, (_, i) => i).filter(
                                                              (m) => m < minTime.minute()
                                                          )
                                                        : [],

                                                disabledSeconds: () =>
                                                    date.hour() === minTime.hour() && date.minute() === minTime.minute()
                                                        ? Array.from({ length: 60 }, (_, i) => i).filter(
                                                              (s) => s < minTime.second()
                                                          )
                                                        : []
                                            };
                                        }

                                        // Ngày sau minTime → không disable gì
                                        return {};
                                    }}
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
                                    disabledDate={(current) => {
                                        const minTime = dayjs().add(5, 'minute');
                                        return current && current < minTime.startOf('day');
                                    }}
                                    disabledTime={(date) => {
                                        const minTime = dayjs().add(5, 'minute');
                                        if (!date) return {};

                                        // Nếu user chọn ngày trước ngày minTime → disable toàn bộ giờ
                                        if (date.isBefore(minTime, 'day')) {
                                            return {
                                                disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
                                                disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
                                                disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i)
                                            };
                                        }

                                        // Nếu cùng ngày → disable giờ/phút/giây trước minTime
                                        if (date.isSame(minTime, 'day')) {
                                            return {
                                                disabledHours: () =>
                                                    Array.from({ length: 24 }, (_, i) => i).filter(
                                                        (h) => h < minTime.hour()
                                                    ),

                                                disabledMinutes: () =>
                                                    date.hour() === minTime.hour()
                                                        ? Array.from({ length: 60 }, (_, i) => i).filter(
                                                              (m) => m < minTime.minute()
                                                          )
                                                        : [],

                                                disabledSeconds: () =>
                                                    date.hour() === minTime.hour() && date.minute() === minTime.minute()
                                                        ? Array.from({ length: 60 }, (_, i) => i).filter(
                                                              (s) => s < minTime.second()
                                                          )
                                                        : []
                                            };
                                        }

                                        // Ngày sau minTime → không disable gì
                                        return {};
                                    }}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="Thời gian làm bài (phút)"
                            name="timeLimit"
                            dependencies={['startTime', 'endTime']}
                            rules={[
                                { required: true, message: 'Vui lòng nhập thời gian làm bài!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const start = getFieldValue('startTime');
                                        const end = getFieldValue('endTime');

                                        if (!start || !end || !value) {
                                            return Promise.resolve();
                                        }

                                        const diffMinutes = end.diff(start, 'minute');

                                        if (value > diffMinutes) {
                                            return Promise.reject(
                                                new Error(
                                                    `Thời gian làm bài không được vượt quá ${diffMinutes} phút (khoảng giữa thời gian bắt đầu và kết thúc)!`
                                                )
                                            );
                                        }

                                        return Promise.resolve();
                                    }
                                })
                            ]}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                placeholder="Nhập thời gian làm bài (phút)"
                            />
                        </Form.Item>

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

                        <Line
                            width={40}
                            height={40}
                            text="Chọn bài tập để thêm"
                            lineOnly
                            styles={{ marginBottom: 4 }}
                        />

                        <Form.Item label="Lọc bài tập theo độ khó" name="difficulty">
                            <Select
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Chọn độ khó"
                                onChange={(value) => handleFilterChange('difficulty', value)}
                                options={Object.entries(difficulties).map(([value, { text: label }]) => ({
                                    value,
                                    label
                                }))}
                            />
                        </Form.Item>

                        <Form.Item label="Lọc bài tập theo khả năng hiển thị" name="visibility">
                            <Select
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Chọn khả năng hiển thị"
                                onChange={(value) => handleFilterChange('visibility', value)}
                                options={Object.entries(visbilities)
                                    .filter(([value]) => value !== 'DRAFT')
                                    .map(([value, { text: label }]) => ({
                                        value,
                                        label
                                    }))}
                            />
                        </Form.Item>

                        <Form.Item label="Lọc bài tập theo chủ đề" name="topics">
                            <Select
                                allowClear
                                mode="multiple"
                                style={{ width: '100%' }}
                                placeholder="Chọn một hoặc nhiều chủ đề"
                                defaultValue={[]}
                                onChange={(value) => handleFilterChange('topicIds', value)}
                                options={topics}
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
                                options={(displayDatas || []).map((item: any) => ({
                                    value: item.value,
                                    label: (
                                        <Tooltip
                                            placement="right"
                                            className="custom-tooltip"
                                            title={
                                                <>
                                                    <div className="custom-tooltip-child">
                                                        <div className="custom-select-exercises">
                                                            <div className="name">
                                                                {item.label}
                                                                <span
                                                                    className={classnames(
                                                                        'difficulty',
                                                                        item.difficulty
                                                                    )}
                                                                >
                                                                    {difficulties[item.difficulty as Difficulty].text}
                                                                </span>
                                                            </div>
                                                            <div className="description">
                                                                <b>Mô tả: </b>
                                                                {item.description}
                                                            </div>
                                                            <div className="author mt-8">
                                                                <b>Mã bài tập: </b>
                                                                {/* {console.log('log:', item)} */}
                                                            </div>
                                                            <div className="color-red"># {item.code}</div>
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                            style={{ width: 500 }}
                                        >
                                            <span>
                                                {item.code} - {item.label}
                                            </span>
                                        </Tooltip>
                                    ),
                                    searchText: `${item.label} ${item.description} ${item.difficulty}`
                                }))}
                                filterOption={(input, option) =>
                                    option?.searchText?.toLowerCase().includes(input.toLowerCase())
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
    }
);

export default ExamFormModal;
