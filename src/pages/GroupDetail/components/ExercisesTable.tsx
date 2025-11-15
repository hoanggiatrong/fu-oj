import { Table } from 'antd';

interface Exercise {
    id: string;
    code: string;
    title: string;
    description?: string;
}

interface ExercisesTableProps {
    dataSource: Exercise[];
}

const ExercisesTable = ({ dataSource }: ExercisesTableProps) => {
    const columns = [
        { title: 'Mã bài tập', dataIndex: 'code', key: 'code' },
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' }
    ];

    return (
        <Table
            rowKey="id"
            dataSource={dataSource}
            pagination={{ pageSize: 10 }}
            columns={columns}
        />
    );
};

export default ExercisesTable;

