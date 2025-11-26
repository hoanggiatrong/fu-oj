import { AppstoreAddOutlined, DeleteOutlined, EditOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Card, Checkbox, Col, Empty, Form, Input, Modal, Popconfirm, Row } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';

const { Meta } = Card;

const Groups = observer(() => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [joinForm] = Form.useForm();

    const [updateId, setUpdateId]: any = useState();
    const [loading, setLoading] = useState(false);
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
                    getGroups(); // Always update enroll state
                    setJoinDialogOpen(false);
                });
        }
    };

    const onJoinFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const getGroups = () => {
        setLoading(true);
        http.get('/groups').then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        });
    };

    useEffect(() => {
        getGroups();
    }, []);

    useEffect(() => {
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
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('groups left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">Nhóm</div>
                    <div className="description">
                        Giúp sinh viên và giảng viên tại FPT tạo, tham gia và quản lý các nhóm luyện tập lập trình. Mỗi
                        nhóm hoạt động như một “phòng học nhỏ” nơi các thành viên có thể cùng làm bài, thảo luận, và
                        theo dõi tiến độ của nhau.
                    </div>
                </div>
                <div className="wrapper flex">
                    <div className="filters">
                        <Input placeholder="Tìm kiếm nhóm" onChange={(e) => setSearch(e.target.value)} />

                        <div className="group-create">
                            <ProtectedElement acceptRoles={['STUDENT']}>
                                <div className="custom-btn-ico" onClick={() => setJoinDialogOpen(true)}>
                                    <MessageOutlined className="custom-ant-ico color-gold" />
                                    Nhập mã tham gia nhóm
                                </div>
                            </ProtectedElement>
                        </div>

                        <div className="group-create">
                            <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                <div className="custom-btn-ico" onClick={() => globalStore.setOpenDetailPopup(true)}>
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                    Tạo mới
                                </div>
                            </ProtectedElement>
                        </div>
                    </div>

                    <div className="body">
                        <LoadingOverlay loading={loading}>
                            <div className={classnames('content mb-36', { 'ml-16 mr-16': !globalStore.isBelow1300 })}>
                                <Row gutter={[16, 16]}>
                                    {displayDatas.length ? (
                                        displayDatas.map((item: any) => (
                                            <Col
                                                key={item.id}
                                                xs={24}
                                                sm={12}
                                                md={8}
                                                lg={8}
                                                xl={8}
                                                onClick={() => {
                                                    navigate(`/group/${item.id}/members`);
                                                }}
                                            >
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
                                                        </div>
                                                    }
                                                    actions={
                                                        authentication.isInstructor
                                                            ? [
                                                                  <EditOutlined
                                                                      key="edit"
                                                                      onClick={(e) => {
                                                                          e.stopPropagation();
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
                                                                          http.deleteById('/groups', item.id).then(
                                                                              (res) => {
                                                                                  globalStore.triggerNotification(
                                                                                      'success',
                                                                                      res.message ||
                                                                                          'Delete successfully!',
                                                                                      ''
                                                                                  );
                                                                                  getGroups();
                                                                              }
                                                                          );
                                                                      }}
                                                                  >
                                                                      <DeleteOutlined
                                                                          key="ellipsis"
                                                                          onClick={(e) => e.stopPropagation()}
                                                                      />
                                                                  </Popconfirm>,
                                                                  <SettingOutlined key="setting" />
                                                              ]
                                                            : [
                                                                  <div className="max-width pl-8 pr-8">
                                                                      <Button
                                                                          className="max-width"
                                                                          type="primary"
                                                                          disabled={item.joined}
                                                                          onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              onJoin({ joinCode: item.code });
                                                                          }}
                                                                      >
                                                                          {item.joined ? 'Đã tham gia' : 'Tham gia'}
                                                                      </Button>
                                                                  </div>
                                                              ]
                                                    }
                                                >
                                                    <Meta
                                                        avatar={
                                                            <Avatar
                                                                src={item?.owner?.avatar?.url || '/sources/thaydat.jpg'}
                                                            />
                                                        }
                                                        title={`Creator Name`}
                                                        description={item.owner.email}
                                                    />
                                                    <div className="group-infos">
                                                        {/* <div className="header">Mô tả</div>
                                                        <div className="topics">
                                                            <div className="topic">
                                                                <Highlighter
                                                                    highlightClassName="highlight"
                                                                    searchWords={[search]}
                                                                    autoEscape={true}
                                                                    textToHighlight={item.description}
                                                                />
                                                            </div>
                                                        </div> */}
                                                        <div className="members">
                                                            {item.alittleStudent?.map((i: any, index: any) => {
                                                                return (
                                                                    <TooltipWrapper
                                                                        key={`alittleStudent-${index}`}
                                                                        tooltipText={`${i.firstName || ''} ${
                                                                            i.lastName || ''
                                                                        }`}
                                                                        position="top"
                                                                    >
                                                                        <div className="member">
                                                                            <Avatar
                                                                                src={
                                                                                    i?.avatar?.url ||
                                                                                    '/sources/thaylam.jpeg'
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </TooltipWrapper>
                                                                );
                                                            }) || (
                                                                <div className="member">
                                                                    <Avatar
                                                                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item}`}
                                                                    />
                                                                </div>
                                                            )}
                                                            {item.alittleStudent.length > 5 ? (
                                                                <div className="member">
                                                                    `+${item.alittleStudent.length - 5}`
                                                                </div>
                                                            ) : item.alittleStudent.length == 0 ? (
                                                                <div className="member">0</div>
                                                            ) : (
                                                                <div className="member">...</div>
                                                            )}
                                                            {/* <Avatar src={`+4`} /> */}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))
                                    ) : (
                                        <Empty
                                            className="flex flex-col flex-center max-width"
                                            style={{ minHeight: 300 }}
                                        />
                                    )}
                                </Row>
                            </div>
                        </LoadingOverlay>
                    </div>
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
                            form={joinForm}
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
            <div className="right">
                <CustomCalendar dateArr={utils.getDates()} />
            </div>
        </div>
    );
});

export default Groups;
