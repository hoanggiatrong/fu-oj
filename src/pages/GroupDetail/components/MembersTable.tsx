import { DeleteOutlined } from '@ant-design/icons';
import { Popconfirm, Table } from 'antd';
import Highlighter from 'react-highlight-words';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../../components/TooltipWrapper/TooltipWrapperComponent';
import authentication from '../../../shared/auth/authentication';

interface Member {
    id: string;
    avatar?: string;
    rollNumber?: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface MembersTableProps {
    dataSource: Member[];
    search: string;
    onRowClick?: (record: Member) => void;
}

const MembersTable = ({ dataSource, search, onRowClick }: MembersTableProps) => {
    const columns = [
        // {
        //     title: 'ID Photo',
        //     dataIndex: 'avatar',
        //     key: 'avatar',
        //     render: (avatar: string) => {
        //         return <Avatar src={avatar || '/sources/thaydat.jpg'} />;
        //     },
        //     width: 100
        // },
        {
            title: 'Mã sinh viên',
            dataIndex: 'rollNumber',
            key: 'rollNumber',
            sorter: (a: Member, b: Member) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
            render: (rollNumber: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={rollNumber || 'HE123456'}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: Member, b: Member) => (a.email || '').localeCompare(b.email || ''),
            render: (email: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={email}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Họ và tên',
            dataIndex: 'firstName',
            key: 'firstName',
            render: (firstName: string, record: Member) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={firstName + ' ' + record.lastName}
                        />
                    </div>
                );
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: () => {
                return (
                    <div className="actions-row cell" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn xóa sinh viên này khỏi nhóm?"
                                    placement="left"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        // TODO: Implement delete functionality
                                    }}
                                >
                                    <DeleteOutlined className="action-row-btn" />
                                </Popconfirm>
                            </TooltipWrapper>
                        </ProtectedElement>
                    </div>
                );
            }
        }
    ];

    const studentCols = [
        // {
        //     title: 'ID Photo',
        //     dataIndex: 'avatar',
        //     key: 'avatar',
        //     render: (avatar: string) => {
        //         return <Avatar src={avatar || '/sources/thaydat.jpg'} />;
        //     },
        //     width: 100
        // },
        {
            title: 'Mã sinh viên',
            dataIndex: 'rollNumber',
            key: 'rollNumber',
            sorter: (a: Member, b: Member) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
            render: (rollNumber: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={rollNumber || 'HE123456'}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: Member, b: Member) => (a.email || '').localeCompare(b.email || ''),
            render: (email: string) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={email}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Họ và tên',
            dataIndex: 'firstName',
            key: 'firstName',
            render: (firstName: string, record: Member) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={firstName + ' ' + record.lastName}
                        />
                    </div>
                );
            }
        }
    ];

    return (
        <Table
            key={`members-table-${authentication.isInstructor ? 'instructor' : 'student'}`}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            dataSource={dataSource}
            columns={authentication.isInstructor ? columns : studentCols}
            onRow={(record) => {
                return {
                    onClick: () => {
                        onRowClick?.(record);
                    }
                };
            }}
            rowClassName={(_record, index) => (index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd')}
        />
    );
};

export default MembersTable;
