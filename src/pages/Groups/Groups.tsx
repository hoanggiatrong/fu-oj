import { AppstoreAddOutlined, DeleteOutlined, EditOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Avatar, Button, Card, Col, Empty, Form, Input, Modal, Pagination, Popconfirm, Radio, Row } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import Tab from '../../components/Tab/Tab';
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
    const [onJoinLoading, setOnJoinLoading] = useState(false);
    const [selectedTab, selectTab] = useState<number | string>('joined-group');
    const [datas, setDatas] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 6,
        total: 0
    });
    // const [groupCode, setGroupCode]: any = useState<string | null>(null);
    const [isJoinDialogOpen, setJoinDialogOpen]: any = useState<boolean>(false);

    // Calculate paginated data
    const getPaginatedData = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return displayDatas.slice(start, end);
    };

    const paginatedData = getPaginatedData();

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
            setOnJoinLoading(true);

            http.post(`/groups/join`, { code: code })
                .then((res) => {
                    globalStore.triggerNotification('success', res.message, '');
                    getGroups();
                })
                .catch((error) => {
                    globalStore.triggerNotification('error', error.response?.data?.message, '');
                })
                .finally(() => {
                    // getGroups(); // Always update enroll state
                    setOnJoinLoading(false);
                    setJoinDialogOpen(false);
                });
        }
    };

    const onJoinFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const getGroups = () => {
        setLoading(true);
        http.get('/groups?pageSize=9999999').then((res) => {
            let datas = res.data;

            if (authentication.isStudent) {
                datas = res.data.filter((d: any) => {
                    const isMatch = selectedTab == 'joined-group' ? d.joined : d.public && !d.joined;
                    return isMatch;
                });
            }

            setDatas(datas);
            setDisplayDatas(datas);
            setPagination((prev) => ({
                ...prev,
                current: 1,
                total: datas.length
            }));
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        });
    };

    useEffect(() => {
        getGroups();
    }, [selectedTab]);

    useEffect(() => {
        const filtered = search
            ? datas.filter(
                  (data: any) =>
                      data?.name.toLowerCase().includes(search.toLowerCase()) ||
                      data?.description.toLowerCase().includes(search.toLowerCase())
              )
            : datas;

        setDisplayDatas(filtered);
        setPagination((prev) => ({
            ...prev,
            current: 1,
            total: filtered.length
        }));
    }, [search, datas]);

    useEffect(() => {
        if (!globalStore.isDetailPopupOpen) {
            form.resetFields();
            setUpdateId(null);
        }
    }, [globalStore.isDetailPopupOpen]);

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div
                className={classnames('groups left', { 'p-24': globalStore.isBelow1300 })}
                style={{ overflow: 'visible' }}
            >
                <div className="header">
                    <div className="title">{authentication.isStudent ? 'Nhóm' : 'Quản lý nhóm'}</div>
                    <div className="description">
                        Giúp sinh viên và giảng viên tại FPT tạo, tham gia và quản lý các nhóm luyện tập lập trình. Mỗi
                        nhóm hoạt động như một “phòng học nhỏ” nơi các thành viên có thể cùng làm bài, thảo luận, và
                        theo dõi tiến độ của nhau.
                    </div>
                </div>
                <div className="wrapper flex">
                    <div className="filters">
                        <Input
                            placeholder="Tìm kiếm nhóm"
                            onChange={(e) => setSearch(e.target.value)}
                            prefix={<SearchOutlined />}
                        />

                        <div className="group-create" style={{ marginRight: 0 }}>
                            <div>
                                <ProtectedElement acceptRoles={['STUDENT']}>
                                    <Tab
                                        value={selectedTab}
                                        options={[
                                            { label: 'Nhóm công khai', value: 'public-group' },
                                            { label: 'Nhóm đã tham gia', value: 'joined-group' }
                                        ]}
                                        onClick={(value) => {
                                            selectTab(value);
                                        }}
                                    />
                                </ProtectedElement>
                            </div>
                            <ProtectedElement acceptRoles={['STUDENT']}>
                                <div className="custom-btn-ico" onClick={() => setJoinDialogOpen(true)}>
                                    <img src="/sources/icons/group-ico.svg" alt="" />
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
                            <div className={classnames('content mb-36')}>
                                <Row gutter={[16, 16]}>
                                    {paginatedData.length ? (
                                        paginatedData.map((item: any) => (
                                            <Col
                                                key={item.id}
                                                xs={24}
                                                sm={12}
                                                md={8}
                                                lg={8}
                                                xl={8}
                                                onClick={() => {
                                                    if (!item.joined && authentication.isStudent) {
                                                        globalStore.triggerNotification(
                                                            'error',
                                                            'Chỉ có thể xem thông tin khi đã gia nhập nhóm',
                                                            ''
                                                        );

                                                        return;
                                                    }
                                                    navigate(`/group/${item.id}/members`);
                                                }}
                                            >
                                                <Card
                                                    cover={
                                                        <div className="custom-card-header">
                                                            <div className="name max-1-line">
                                                                <Highlighter
                                                                    highlightClassName="highlight"
                                                                    searchWords={[search]}
                                                                    autoEscape={true}
                                                                    textToHighlight={item.name}
                                                                />
                                                            </div>
                                                            <div
                                                                className={classnames('is-public', {
                                                                    no: !item.public
                                                                })}
                                                            >
                                                                {item.public ? 'Công khai' : 'Riêng tư'}
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
                                                                      onPopupClick={(e) => e.stopPropagation()}
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
                                                                          loading={onJoinLoading}
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
                                                        title={item.owner.firstName + ' ' + item.owner.lastName}
                                                        description={item.owner.email}
                                                    />
                                                    <div className="group-infos">
                                                        <div className="header">Mô tả</div>
                                                        <div className="topics">
                                                            <div className="topic">
                                                                <TooltipWrapper
                                                                    tooltipText={item.description}
                                                                    position="top"
                                                                >
                                                                    <Highlighter
                                                                        className="max-1-line"
                                                                        highlightClassName="highlight"
                                                                        searchWords={[search]}
                                                                        autoEscape={true}
                                                                        textToHighlight={item.description}
                                                                    />
                                                                </TooltipWrapper>
                                                            </div>
                                                        </div>
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
                            {displayDatas.length > 0 && (
                                <div className="pagination-wrapper">
                                    <Pagination
                                        current={pagination.current}
                                        pageSize={pagination.pageSize}
                                        total={pagination.total}
                                        showSizeChanger={false}
                                        showTotal={(total, range) => `${range[0]}-${range[1]} trên ${total} nhóm`}
                                        onChange={(page) => {
                                            setPagination((prev) => ({
                                                ...prev,
                                                current: page
                                            }));
                                            // Scroll to top when page changes
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    />
                                </div>
                            )}
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
                                <Button loading={onJoinLoading} type="primary" htmlType="submit">
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

                            <Form.Item className="mt-8" name="isPublic" label="Chế độ hiển thị">
                                <Radio.Group className="ml-4">
                                    <Radio value={true}>Công khai</Radio>
                                    <Radio value={false}>Riêng tư</Radio>
                                </Radio.Group>
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
                <CustomCalendar
                    dateArr={utils.getDates()}
                    message={authentication.isStudent ? undefined : 'Nhớ kiểm tra lịch thi của hôm nay nhé!'}
                />
            </div>
        </div>
    );
});

export default Groups;
