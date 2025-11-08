import { DeleteOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Form, Input, Modal, Popconfirm, Table } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';

const GroupDetail = observer(() => {
    const { id } = useParams();

    const [form] = Form.useForm();
    const [searchName, setSearchName]: any = useState();
    const [datas, setDatas]: any = useState([]);
    datas;
    const [displayDatas, setDisplayDatas]: any = useState([]);
    const [search, setSearch]: any = useState('');
    setSearch;
    const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    const columns = [
        {
            title: 'ID',
            key: 'index',
            render: (_: any, __: any, index: any) => index + 1,
            width: 50
        },
        {
            title: 'ID Photo',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (avatar: string) => {
                return <Avatar src={avatar || '/sources/thaydat.jpg'} />;
            },
            width: 100
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'rollNumber',
            key: 'rollNumber',
            sorter: (a: any, b: any) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
            render: (rollNumber: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={rollNumber || 'HE123456'}
                    />
                );
            }
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: any, b: any) => (a.email || '').localeCompare(b.email || ''),
            render: (email: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={email}
                    />
                );
            }
        },
        {
            title: 'Họ và tên',
            dataIndex: 'firstName',
            key: 'firstName',
            // sorter: (a: any, b: any) => (a.email || '').localeCompare(b.email || ''),
            render: (firstName: any, record: any) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={firstName + ' ' + record.lastName}
                    />
                );
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (actions: any) => {
                actions;
                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    // title="Are you sure you want to delete this exercise?"
                                    title="Bạn có chắc chắn muốn xóa sinh viên này khỏi nhóm?"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        // http.deleteById('/exercises', record.id).then((res) => {
                                        //     globalStore.triggerNotification(
                                        //         'success',
                                        //         res.message || 'Delete successfully!',
                                        //         ''
                                        //     );
                                        //     getExercises();
                                        // });
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

    const getStudentByGroupId = () => {
        http.get(`/groups/${id}/students`).then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    const onAdd: FormProps['onFinish'] = (values) => {
        console.log('Success:', values);

        const code = values.joinCode;

        if (code) {
            http.post(`/groups/join`, { code: code })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                })
                .finally(() => {
                    getStudentByGroupId(); // Always update enroll state
                    setAddMemberDialogOpen(false);
                });
        }
    };

    const onAddFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    useEffect(() => {
        getStudentByGroupId();
    }, []);

    return (
        <div className="group-detail">
            <div className="header">
                <div className="title">
                    Nhóm
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Button type="primary" onClick={() => globalStore.setOpenDetailPopup(true)}>
                            Thêm thành viên
                        </Button>
                    </ProtectedElement>
                </div>
                <div className="description">
                    <div className="owner">
                        <Avatar src={'/sources/thaydat.jpg'} />
                        Nhóm thầy Đạt
                    </div>
                    {/* Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end". */}
                </div>
            </div>
            <div className="actions">
                <div className="search">
                    <Input
                        placeholder="Tìm thành viên"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="action-btns">
                    <Button type="primary" onClick={() => setAddMemberDialogOpen(true)}>
                        Thêm thành viên
                    </Button>
                </div>
            </div>
            <div className="body">
                <Table
                    rowKey="id"
                    scroll={{ x: 800 }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    dataSource={displayDatas}
                    columns={columns}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                record;
                                // navigate(`/${routesConfig.exercise}`.replace(':id?', record.id));
                            }
                        };
                    }}
                />
            </div>
            <Modal
                title={`Tham gia nhóm`}
                className="detail-modal"
                open={isAddMemberDialogOpen}
                onCancel={() => setAddMemberDialogOpen(false)}
                width={420}
            >
                <div className="groups-form-content">
                    <Form
                        form={form}
                        name="basic"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        labelAlign="left"
                        initialValues={{ remember: true }}
                        onFinish={onAdd}
                        onFinishFailed={onAddFailed}
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
        </div>
    );
});

export default GroupDetail;
