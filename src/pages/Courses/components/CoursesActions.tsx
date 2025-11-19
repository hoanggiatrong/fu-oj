import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface CoursesActionsProps {
    onRefresh: () => void;
    onOpenCreate: () => void;
}

const CoursesActions = ({ onRefresh, onOpenCreate }: CoursesActionsProps) => {
    return (
        <div className="courses-actions">
            <div className="left-side">
                <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                    Làm mới
                </Button>
            </div>
            <div className="right-side">
                <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
                    Tạo khóa học
                </Button>
            </div>
        </div>
    );
};

export default CoursesActions;

