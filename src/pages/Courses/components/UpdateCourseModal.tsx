import { DeleteOutlined, FileTextOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Form, Input, Modal, Button, Empty, Spin, Upload } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import type { CourseExercise } from '../Courses';
import globalStore from '../../../components/GlobalComponent/globalStore';
import httpRequest from '../../../lib/httpRequest';

interface UpdateCourseModalProps {
    open: boolean;
    form: FormInstance;
    confirmLoading: boolean;
    onOk: () => void;
    onCancel: () => void;
    courseTitle?: string;
    courseId?: string;
    courseImageUrl?: string;
    exercises: CourseExercise[];
    exercisesLoading: boolean;
    removingExerciseId: string | null;
    onRemoveExercise: (exerciseId: string) => void;
}

const UpdateCourseModal = ({
    open,
    form,
    confirmLoading,
    onOk,
    onCancel,
    courseTitle,
    courseId,
    courseImageUrl,
    exercises,
    exercisesLoading,
    removingExerciseId,
    onRemoveExercise
}: UpdateCourseModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(courseImageUrl);

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            form.resetFields(['imageFile']);
        }
    }, [open, form]);

    useEffect(() => {
        setPreviewUrl(courseImageUrl);
    }, [courseImageUrl]);

    const handleUploadImage = async () => {
        if (!courseId) {
            globalStore.triggerNotification('error', 'Không xác định được khóa học để cập nhật ảnh.', '');
            return;
        }

        const fileList = (form.getFieldValue('imageFile') as any[]) || [];
        const file = fileList[0]?.originFileObj;

        if (!file) {
            globalStore.triggerNotification('error', 'Vui lòng chọn một ảnh trước khi cập nhật.', '');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setImageUploading(true);
            const res = await httpRequest.patch(`/courses/${courseId}/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const raw: any = res;
            const responseData = raw?.data ?? raw;
            const message = responseData?.message || 'Cập nhật ảnh khóa học thành công!';
            const newImageUrl =
                responseData?.data?.image?.url ||
                responseData?.data?.imageUrl ||
                responseData?.image?.url ||
                responseData?.imageUrl;

            if (newImageUrl) {
                setPreviewUrl(newImageUrl);
            }

            globalStore.triggerNotification('success', message, '');
        } catch (error: any) {
            const message =
                error?.response?.data?.message || 'Không thể cập nhật ảnh khóa học. Vui lòng thử lại sau.';
            globalStore.triggerNotification('error', message, '');
        } finally {
            setImageUploading(false);
        }
    };

    const filteredExercises = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return exercises;
        return exercises.filter((exercise) => {
            const topic = exercise.topicName ?? '';
            return (
                exercise.title.toLowerCase().includes(keyword) ||
                exercise.difficulty.toLowerCase().includes(keyword) ||
                topic.toLowerCase().includes(keyword)
            );
        });
    }, [exercises, searchTerm]);

    const renderExercises = () => {
        if (exercisesLoading) {
            return (
                <div className="section-loading">
                    <Spin />
                </div>
            );
        }

        if (exercises.length === 0) {
            return <Empty description="Chưa có bài tập nào trong khóa" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        if (filteredExercises.length === 0) {
            return <Empty description="Không tìm thấy bài tập phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        return (
            <div className="exercise-scroll">
                {filteredExercises.map((exercise) => (
                    <div className="exercise-card" key={exercise.id}>
                        <div className="exercise-icon">
                            <FileTextOutlined />
                        </div>
                        <div className="exercise-details">
                            <div className="exercise-top">
                                <div>
                                    <div className="exercise-title">{exercise.title}</div>
                                    <div className="exercise-meta-line">
                                        {[exercise.difficulty, exercise.topicName]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </div>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={removingExerciseId === exercise.id}
                                    onClick={() => onRemoveExercise(exercise.id)}
                                >
                                    Gỡ
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Modal
            title={`Cập nhật khóa học${courseTitle ? `: ${courseTitle}` : ''}`}
            open={open}
            onOk={onOk}
            confirmLoading={confirmLoading}
            okText="Cập nhật"
            cancelText="Hủy"
            onCancel={onCancel}
            destroyOnClose
            className="update-course-modal"
        >
            <div className="update-modal-content">
                <div className="form-section">
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Tên khóa học"
                            name="title"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên khóa học.' },
                                {
                                    validator: (_, value) =>
                                        value && value.trim().length >= 3
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Tên khóa học phải có ít nhất 3 ký tự.'))
                                }
                            ]}
                        >
                            <Input placeholder="Ví dụ: Data Structures 101" autoFocus />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[
                                {
                                    max: 500,
                                    message: 'Mô tả tối đa 500 ký tự.'
                                }
                            ]}
                        >
                            <Input.TextArea rows={4} placeholder="Nhập mô tả cho khóa học" />
                        </Form.Item>

                        {previewUrl && (
                            <Form.Item label="Ảnh hiện tại">
                                <img
                                    src={previewUrl}
                                    alt="Ảnh khóa học"
                                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="Ảnh khóa học"
                            name="imageFile"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                                <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item label={null}>
                            <Button type="default" onClick={handleUploadImage} loading={imageUploading}>
                                Cập nhật ảnh khóa học
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                <div className="course-exercises-section">
                    <div className="section-title">Bài tập trong khóa</div>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="🔍 Tìm kiếm bài tập..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        disabled={exercisesLoading || exercises.length === 0}
                    />

                    {renderExercises()}
                </div>
            </div>
        </Modal>
    );
};

export default UpdateCourseModal;

