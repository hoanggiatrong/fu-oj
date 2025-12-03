import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import { Button, Input, Table, Form, Modal } from 'antd';
import type { FormProps } from 'antd';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';

interface TopicData {
    id: string;
    name: string;
    description: string;
}

interface TopicsResponse {
    data: TopicData[];
    total: number;
    page: number;
    pageSize: number;
}

const Topics = observer(() => {
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState<TopicData[]>([]);
    const [displayDatas, setDisplayDatas] = useState<TopicData[]>([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const [form] = Form.useForm();
    const [updateId, setUpdateId]: any = useState();

    const onFinish: FormProps['onFinish'] = (values) => {
        const payload = {
            name: values.name,
            description: values.description
        };

        if (updateId) {
            // Call PATCH /topics/{id} to update topic
            http.patch(updateId, '/topics', payload)
                .then((res) => {
                    globalStore.triggerNotification('success', res.message || 'Cập nhật topic thành công!', '');
                    getTopics(pagination.current, pagination.pageSize);
                    globalStore.setOpenDetailPopup(false);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
                });
        } else {
            http.post('/topics', payload)
                .then((res) => {
                    globalStore.triggerNotification('success', res.message || 'Tạo topic thành công!', '');
                    getTopics(pagination.current, pagination.pageSize);
                    globalStore.setOpenDetailPopup(false);
                    form.resetFields();
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
                });
        }
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: TopicData, b: TopicData) => (a.name || '').localeCompare(b.name || ''),
            render: (name: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={name || ''}
                    />
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={description || ''}
                    />
                );
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TopicData) => (
                <ProtectedElement acceptRoles={['ADMIN']}>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => {
                            form.setFieldsValue({
                                name: record.name,
                                description: record.description
                            });
                            setUpdateId(record.id);
                            globalStore.setOpenDetailPopup(true);
                        }}
                    >
                        Sửa
                    </Button>
                </ProtectedElement>
            )
        }
    ];

    const getTopics = (page: number = 1, pageSize: number = 10, name: string = '') => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            name: name,
            order: ''
        });
        http.get(`/topics?${params.toString()}`)
            .then((res: TopicsResponse) => {
                setDatas(res.data || []);
                setDisplayDatas(res.data || []);
                setPagination({
                    current: res.page || page,
                    pageSize: res.pageSize || pageSize,
                    total: res.total || 0
                });
            })
            .catch((error) => {
                console.error('Error fetching topics:', error);
                setDatas([]);
                setDisplayDatas([]);
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
            });
    };

    useEffect(() => {
        getTopics(pagination.current, pagination.pageSize, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const filtered = search
            ? datas.filter(
                (data: TopicData) =>
                    (data?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                    (data?.description || '').toLowerCase().includes(search.toLowerCase())
            )
            : datas;
        setDisplayDatas(filtered);
    }, [search, datas]);

    useEffect(() => {
        if (!globalStore.isDetailPopupOpen) {
            form.resetFields();
            setUpdateId(null);
        }
    }, [globalStore.isDetailPopupOpen, form]);

    const handleTableChange = (page: number, pageSize: number) => {
        getTopics(page, pageSize, search);
    };

    return (
        <ProtectedElement acceptRoles={['ADMIN']}>
            <div className={classnames('topics', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">
                        Quản lý Topics
                    </div>
                    <div className="description">
                        Quản lý các chủ đề (topics) trong hệ thống. Chỉ admin mới có quyền truy cập trang này.
                    </div>
                </div>
                <div
                    className={classnames('wrapper', {
                        'wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filter-row">
                        <div className="search">
                            <div className="title">
                                <SearchOutlined />
                                Bộ lọc
                            </div>
                            <Input
                                value={search}
                                placeholder="Tìm kiếm theo Tên, Mô tả"
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <ProtectedElement acceptRoles={['ADMIN']}>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setUpdateId(null);
                                    form.resetFields();
                                    globalStore.setOpenDetailPopup(true);
                                }}
                            >
                                Tạo mới
                            </Button>
                        </ProtectedElement>
                    </div>
                    <div className="body">
                        <LoadingOverlay loading={loading}>
                            <Table
                                rowKey="id"
                                scroll={{ x: 800 }}
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    showSizeChanger: true,
                                    showTotal: (total) => `Tổng ${total} topics`,
                                    onChange: handleTableChange,
                                    onShowSizeChange: handleTableChange
                                }}
                                dataSource={displayDatas}
                                columns={columns}
                            />
                        </LoadingOverlay>
                    </div>
                </div>
                <Modal
                    title={updateId ? 'Cập nhật topic' : 'Tạo topic mới'}
                    className="detail-modal"
                    open={globalStore.isDetailPopupOpen}
                    onCancel={() => globalStore.setOpenDetailPopup(false)}
                    width={600}
                    footer={null}
                >
                    <div className="topics-form-content">
                        <Form
                            form={form}
                            name="topic-form"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                            labelAlign="left"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="Tên"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên topic!' }]}
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

                            <Form.Item label={null}>
                                <Button type="primary" htmlType="submit">
                                    {updateId ? 'Cập nhật' : 'Tạo mới'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Modal>
            </div>
        </ProtectedElement>
    );
});

export default Topics;

