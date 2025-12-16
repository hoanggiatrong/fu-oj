import type { FormProps } from 'antd';
import { Modal, Form, Select, Button, Tooltip } from 'antd';
import * as http from '../../../lib/httpRequest';
import globalStore from '../../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { useState, useEffect } from 'react';
import { difficulties, type Difficulty } from '../../../constants/difficulty';
import { visbilities } from '../../../constants/visibility';

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

    const [originalDatas, setOriginalDatas] = useState<any>(null);
    const [displayDatas, setDisplayDatas] = useState<any>(null);
    const [topics, setTopics] = useState([]);
    const [filters, setFilters] = useState({
        difficulty: null,
        topicIds: [],
        visibility: null
    });

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
        const formattedData = allExercises.map((exercise: any) => ({
            value: exercise.id,
            label: exercise.title || exercise.code || '',
            ...exercise
        }));

        setOriginalDatas(formattedData);
        setDisplayDatas(formattedData);
    }, [allExercises]);

    useEffect(() => {
        http.get('/topics').then((res) => {
            setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
        });
    }, []);

    return (
        <Modal
            className="detail-modal"
            title="Thêm bài tập cho nhóm"
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            width={600}
        >
            <div className="">
                <Form
                    form={form}
                    name="addExercise"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                    onFinish={onFinish}
                    autoComplete="off"
                >
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
                            options={Object.entries(visbilities).map(([value, { text: label }]) => ({
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
                            placeholder="Chọn chủ đề"
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
                                                            <span className={classnames('difficulty', item.difficulty)}>
                                                                {difficulties[
                                                                    item.difficulty as Difficulty
                                                                ].text.toLocaleUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="description">
                                                            <b>Mô tả: </b>
                                                            {item.description}
                                                        </div>
                                                        <div className="author mt-8">
                                                            <b>Mã bài tập: </b>
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
                            Thêm bài tập
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default AddExerciseModal;
