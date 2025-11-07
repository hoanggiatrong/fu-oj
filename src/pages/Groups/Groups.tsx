import { EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Card, Col, Form, Input, Modal, Row, Checkbox, Popconfirm, Empty } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import authentication from '../../shared/auth/authentication';
import Highlighter from 'react-highlight-words';

const { Meta } = Card;

const Groups = observer(() => {
    const [form] = Form.useForm();

    const [updateId, setUpdateId]: any = useState();
    const [datas, setDatas] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');
    // const [groupCode, setGroupCode]: any = useState<string | null>(null);
    const [isJoinDialogOpen, setJoinDialogOpen]: any = useState<boolean>(false);

    const onFinish: FormProps['onFinish'] = (values) => {
        console.log('Success:', values);

        if (updateId) {
            http.putaaa(updateId, '/groups', { ...values })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    getGroups();
                    globalStore.setOpenDetailPopup(false);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                });
        } else {
            http.post('/groups', { ...values })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    getGroups();
                    setUpdateId(res.data.id);
                    globalStore.setOpenDetailPopup(false);
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                });
        }
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const onJoin: FormProps['onFinish'] = (values) => {
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
                    setJoinDialogOpen(false);
                });
        }
    };

    const onJoinFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const getGroups = () => {
        http.get('/groups').then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    useEffect(() => {
        getGroups();
    }, []);

    useEffect(() => {
        console.log('log:', datas);
        const displayDatas = search
            ? datas.filter(
                  (data: any) =>
                      data?.name.toLowerCase().includes(search.toLowerCase()) ||
                      data?.description.toLowerCase().includes(search.toLowerCase())
              )
            : datas;

        setDisplayDatas(displayDatas);
    }, [search]);

    useEffect(() => {
        if (!globalStore.isDetailPopupOpen) {
            form.resetFields();
            setUpdateId(null);
        }
    }, [globalStore.isDetailPopupOpen]);

    return (
        <div className="groups">
            <div className="header">
                <div className="title">
                    Nhóm
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Button type="primary" onClick={() => globalStore.setOpenDetailPopup(true)}>
                            Create New Group
                        </Button>
                    </ProtectedElement>
                </div>
                <div className="description">
                    Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                </div>
            </div>
            <div className="actions">
                <div className="search">
                    <Input placeholder="Tìm nhóm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="action-btns">
                    <Button type="primary" onClick={() => setJoinDialogOpen(true)}>
                        Tham gia nhóm
                    </Button>
                </div>
            </div>
            <div className="content">
                <Row gutter={[16, 16]}>
                    {displayDatas.length ? (
                        displayDatas.map((item: any) => (
                            <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                                <Card
                                    cover={
                                        <div className="custom-card-header">
                                            <div className="name">
                                                <Highlighter
                                                    highlightClassName="highlight"
                                                    searchWords={[search]}
                                                    autoEscape={true}
                                                    textToHighlight={item.name}
                                                />
                                            </div>
                                            <div className="status">Inactive</div>
                                        </div>
                                    }
                                    actions={
                                        authentication.isInstructor
                                            ? [
                                                  <EditOutlined
                                                      key="edit"
                                                      onClick={() => {
                                                          globalStore.setOpenDetailPopup(true);

                                                          form.setFieldsValue({
                                                              name: item.name,
                                                              description: item.description,
                                                              isPublic: item.public
                                                          });

                                                          setUpdateId(item.id);
                                                      }}
                                                  />,
                                                  <Popconfirm
                                                      // title="Are you sure you want to delete this exercise?"
                                                      title="Bạn có chắc chắn muốn xóa nhóm này?"
                                                      okText="Có"
                                                      cancelText="Không"
                                                      onConfirm={() => {
                                                          http.deleteById('/groups', item.id).then((res) => {
                                                              globalStore.triggerNotification(
                                                                  'success',
                                                                  res.message || 'Delete successfully!',
                                                                  ''
                                                              );
                                                              getGroups();
                                                          });
                                                      }}
                                                  >
                                                      <DeleteOutlined key="ellipsis" />
                                                  </Popconfirm>,
                                                  <SettingOutlined key="setting" />
                                              ]
                                            : []
                                    }
                                >
                                    <Meta
                                        avatar={<Avatar src={item.owner.avatar || '/sources/thaydat.jpg'} />}
                                        title={`Creator Name`}
                                        description={item.owner.email}
                                    />
                                    <div className="group-infos">
                                        <div className="header">Mô tả</div>
                                        <div className="topics">
                                            <div className="topic">
                                                <Highlighter
                                                    highlightClassName="highlight"
                                                    searchWords={[search]}
                                                    autoEscape={true}
                                                    textToHighlight={item.description}
                                                />
                                            </div>
                                        </div>
                                        <div className="members">
                                            <div className="member">
                                                <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item}`} />
                                            </div>
                                            <div className="member">
                                                <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item}`} />
                                            </div>
                                            <div className="member">
                                                <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item}`} />
                                            </div>
                                            <div className="member">
                                                <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item}`} />
                                            </div>
                                            <div className="member">
                                                <Avatar src={`+4`} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Empty className="flex flex-col flex-center max-width" style={{ minHeight: 300 }} />
                    )}
                </Row>
            </div>
            <Modal
                title={`Tham gia nhóm`}
                className="detail-modal"
                open={isJoinDialogOpen}
                onCancel={() => setJoinDialogOpen(false)}
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
                        onFinish={onJoin}
                        onFinishFailed={onJoinFailed}
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
            <Modal
                title={`${updateId ? 'Chỉnh sửa' : 'Tạo mới'} nhóm`}
                className="detail-modal"
                open={globalStore.isDetailPopupOpen}
                onCancel={() => globalStore.setOpenDetailPopup(false)}
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
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Tên nhóm"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm!' }]}
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

                        <Form.Item name="isPublic" valuePropName="checked">
                            <Checkbox>Is Public?</Checkbox>
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
    );
});

export default Groups;
