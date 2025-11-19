import { Table } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import type { Course } from '../Courses';

interface CoursesTableSectionProps {
    data: Course[];
    columns: ColumnsType<Course>;
    pagination: TablePaginationConfig & { total?: number };
    loading: boolean;
    onChange: (pagination: TablePaginationConfig) => void;
}

const CoursesTableSection = ({ data, columns, pagination, loading, onChange }: CoursesTableSectionProps) => {
    return (
        <div className="courses-table">
            <LoadingOverlay loading={loading}>
                <Table<Course>
                    rowKey="id"
                    columns={columns}
                    dataSource={data}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total = 0) => `${total} khóa học`
                    }}
                    onChange={onChange}
                />
            </LoadingOverlay>
        </div>
    );
};

export default CoursesTableSection;

