import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import { Button, Input, Select, Table, Tag, Popconfirm, Form } from 'antd';
import Line from '../../components/Line/Line';
import globalStore from '../../components/GlobalComponent/globalStore';
import classnames from 'classnames';
import { DeleteOutlined, HeartOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authentication from '../../shared/auth/authentication';
import routesConfig from '../../routes/routesConfig';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import Highlighter from 'react-highlight-words';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';

const Exams = observer(() => {
    const navigate = useNavigate();
    const [search, setSearch]: any = useState();
    const [updateId, setUpdateId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [datas, setDatas] = useState([]);
    datas;
    const [topics, setTopics] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);

    const [form] = Form.useForm();

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
    };

    const columns = [
        {
            title: 'Mã bài tập',
            dataIndex: 'code',
            key: 'code',
            sorter: (a: any, b: any) => (a.code || '').localeCompare(b.code || ''),
            render: (code: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={code}
                    />
                );
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={title}
                    />
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description'
        },
        {
            title: 'Chủ đề',
            dataIndex: 'topics',
            key: 'topics',
            render: (topics: any[]) => {
                if (!topics) return null;

                return topics.map((topic, index) => {
                    const text = topic.name.trim().toUpperCase();
                    const colors = [
                        'magenta',
                        'red',
                        'volcano',
                        'orange',
                        'gold',
                        'lime',
                        'green',
                        'cyan',
                        'blue',
                        'geekblue',
                        'purple'
                    ];
                    const color = colors[index];

                    return (
                        <Tag color={color} key={text} style={{ marginBottom: 8 }}>
                            {text}
                        </Tag>
                    );
                });
            }
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            render: (actions: any, record: any) => {
                actions;
                return (
                    <div className="actions-row" onClick={(e) => e.stopPropagation()}>
                        <TooltipWrapper tooltipText="Thêm vào yêu thích" position="left">
                            <HeartOutlined className="action-row-btn" />
                        </TooltipWrapper>

                        <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                            <TooltipWrapper tooltipText="Chỉnh sửa" position="left">
                                <SettingOutlined
                                    className="action-row-btn"
                                    onClick={() => {
                                        setUpdateId(record.id);
                                        globalStore.setOpenDetailPopup(true);
                                        form.setFieldsValue({
                                            ...record,
                                            topicIds: record.topics.map((topic: any) => topic.id)
                                        });
                                    }}
                                />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Xóa" position="left">
                                <Popconfirm
                                    // title="Are you sure you want to delete this exercise?"
                                    title="Bạn có chắc chắn muốn xóa bài tập này?"
                                    okText="Có"
                                    cancelText="Không"
                                    onConfirm={() => {
                                        http.deleteById('/exercises', record.id).then((res) => {
                                            globalStore.triggerNotification(
                                                'success',
                                                res.message || 'Delete successfully!',
                                                ''
                                            );
                                            getExams();
                                        });
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

    const getExams = () => {
        setLoading(true);
        http.get('/exercises').then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        });
    };

    useEffect(() => {
        getExams();

        http.get('/topics').then((res) => {
            setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
        });
    }, []);

    return (
        <div className={classnames('exams', { 'p-24': globalStore.isBelow1300 })}>
            <div className="header">
                <div className="title">
                    Bài thi
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Button type="primary" onClick={() => globalStore.setOpenDetailPopup(true)}>
                            Tạo bài thi
                        </Button>
                    </ProtectedElement>
                </div>
                <div className="description">
                    Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                </div>
            </div>
            <div
                className={classnames('wrapper flex', {
                    'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                })}
            >
                <div className="search">
                    <div className="title">
                        <SearchOutlined />
                        Bộ lọc
                    </div>
                    <Input
                        value={search}
                        placeholder="Tìm kiếm theo Mã, Tên, Mô tả, Chủ đề"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Line width={0} height={0} text="Chủ đề" center />
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select topics"
                        defaultValue={[]}
                        onChange={handleChange}
                        options={topics}
                    />
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Line width={0} height={0} text="Quản lý" center />
                        <Button onClick={() => globalStore.setOpenDetailPopup(true)}>Tạo mới</Button>
                    </ProtectedElement>
                </div>
                <div className="body">
                    <LoadingOverlay loading={loading}>
                        <Table
                            rowKey="id"
                            scroll={{ x: 800 }}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            dataSource={displayDatas}
                            columns={columns}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        if (!authentication.isStudent) return;
                                        navigate(`/${routesConfig.exercise}`.replace(':id?', record.id));
                                    }
                                };
                            }}
                        />
                    </LoadingOverlay>
                </div>
            </div>
        </div>
    );
});

export default Exams;
