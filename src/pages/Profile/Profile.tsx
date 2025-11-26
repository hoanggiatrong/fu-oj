import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormProps, GetProp, UploadProps } from 'antd';
import { Button, Form, Input, Upload } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import globalStore from '../../components/GlobalComponent/globalStore';
import Line from '../../components/Line/Line';
import * as http from '../../lib/httpRequest';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import MultiCircleChart from './components/MultiCircleChart';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const Profile = observer(() => {
    const [scores, setScores]: any = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }

        const file = info.file.originFileObj as FileType;
        if (file) {
            setSelectedFile(file); // lưu vào state
            utils.getBase64(file, (url) => {
                setImageUrl(url);
                setLoading(false);
            });
        }
    };

    const handleUploadToCloudinary = async () => {
        const updateId = authentication.account?.data?.id;

        if (!selectedFile) return;

        if (!updateId) {
            globalStore.triggerNotification('error', 'Không tìm thấy ID của tài khoản', '');

            return;
        }

        setLoading(true);

        // Phần này dùng Cloudinary
        // const url = await globalStore.uploadImageToCloudinary(selectedFile);

        // if (url) {
        //     setImageUrl(url); // cập nhật url chính thức

        //     http.patchV2(updateId, '/me/profile', { avatar: { url: url } })
        //         .then((res) => {
        //             globalStore.triggerNotification('success', res.message, '');
        //             globalStore.setOpenDetailPopup(false);
        //             authentication.getAccount();
        //         })
        //         .catch((error) => {
        //             globalStore.triggerNotification('error', error.response?.data?.message, '');
        //         });
        // }
        // Phần này dùng Cloudinary

        const formData = new FormData();
        formData.append('file', selectedFile!); // ! đảm bảo selectedFile không null

        http.patchV2(updateId, '/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then((res) => {
                globalStore.triggerNotification('success', res.message, '');
                globalStore.setOpenDetailPopup(false);
                authentication.getAccount();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message, '');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const onFinish: FormProps['onFinish'] = (values) => {
        console.log('Success:', values);

        const updateId = authentication.account?.data?.id;

        if (!updateId) {
            globalStore.triggerNotification('error', 'Không tìm thấy ID của tài khoản', '');

            return;
        }

        setLoading(true);
        http.patchV2(updateId, '/me/profile', { ...values })
            .then((res) => {
                globalStore.triggerNotification('success', res.message, '');
                globalStore.setOpenDetailPopup(false);
                authentication.getAccount();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message, '');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    useEffect(() => {
        if (authentication.account?.data?.avatar?.url) {
            setImageUrl(authentication.account?.data?.avatar?.url);
        }

        http.get(`/scores?userId=${authentication.account?.data?.id}`).then((res) => {
            if (res.data[0]) {
                setScores(res.data[0]);
            }
        });
    }, [authentication.account]);

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="profile">
                    <div className="quick-info flex gap">
                        <div className="left-side">
                            <div className="container">
                                <LoadingOverlay loading={loading}>
                                    <div className="child-container flex gap">
                                        <Upload
                                            name="avatar"
                                            listType="picture-card"
                                            className="avatar-uploader"
                                            showUploadList={false}
                                            action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                                            beforeUpload={utils.beforeUpload}
                                            onChange={handleChange}
                                        >
                                            {imageUrl ? (
                                                <img
                                                    draggable={false}
                                                    src={imageUrl}
                                                    alt="avatar"
                                                    style={{ width: '100%', borderRadius: 5 }}
                                                />
                                            ) : (
                                                uploadButton
                                            )}
                                        </Upload>
                                        <div className="info">
                                            <div className="name">
                                                {authentication.account?.data?.firstName +
                                                    ' ' +
                                                    authentication.account?.data?.lastName}
                                            </div>
                                            <div className="roll-number">
                                                {authentication.account?.data?.rollNumber || 'Mã số Sinh viên'}
                                            </div>
                                            <div className="rank">
                                                Rank <b>~5.000.000</b>
                                            </div>
                                        </div>
                                    </div>
                                    <Button className="max-width" onClick={handleUploadToCloudinary}>
                                        {!selectedFile ? 'Hồ sơ đã được cập nhật' : 'Cập nhật ảnh đại diện'}
                                    </Button>
                                </LoadingOverlay>
                            </div>
                            <Line width={40} height={40} lineOnly />
                            <div className="container">
                                <div className="header">Community Stats</div>
                                <div className="child-container">
                                    <div className="child-container-left">
                                        <img src="/sources/icons/code-ico.svg" alt="" />
                                    </div>
                                    <div className="child-container-right">
                                        <div className="view">Views</div>
                                        <div className="lw">Last week</div>
                                    </div>
                                </div>
                                <div className="child-container">
                                    <div className="child-container-left">
                                        <img src="/sources/icons/code-ico.svg" alt="" />
                                    </div>
                                    <div className="child-container-right">
                                        <div className="view">Views</div>
                                        <div className="lw">Last week</div>
                                    </div>
                                </div>
                                <div className="child-container">
                                    <div className="child-container-left">
                                        <img src="/sources/icons/code-ico.svg" alt="" />
                                    </div>
                                    <div className="child-container-right">
                                        <div className="view">Views</div>
                                        <div className="lw">Last week</div>
                                    </div>
                                </div>
                            </div>
                            <Line width={40} height={40} lineOnly />
                            <div className="container">
                                <div className="header">Languages</div>
                                <div className="child-container"></div>
                            </div>{' '}
                            <Line width={40} height={40} lineOnly />
                            <div className="container">
                                <div className="header">Skills</div>
                                <div className="child-container"></div>
                            </div>
                        </div>
                        <div className="right-side">
                            <div className="top">
                                <LoadingOverlay loading={loading}>
                                    <div className="exercise-form other">
                                        <Form
                                            className="max-width"
                                            form={form}
                                            labelCol={{ span: 4 }}
                                            wrapperCol={{ span: 20 }}
                                            labelAlign="left"
                                            onFinish={onFinish}
                                            onFinishFailed={onFinishFailed}
                                        >
                                            <div>
                                                <Form.Item
                                                    className="flex-1"
                                                    label="Họ"
                                                    name="firstName"
                                                    style={{ margin: 0, padding: 0, marginTop: 8 }}
                                                >
                                                    <Input placeholder="Nhập họ" />
                                                </Form.Item>

                                                <Form.Item
                                                    className="flex-1"
                                                    label="Tên"
                                                    name="lastName"
                                                    style={{ margin: 0, padding: 0, marginTop: 8 }}
                                                >
                                                    <Input placeholder="Nhập tên" />
                                                </Form.Item>

                                                <Form.Item
                                                    label="MSSV"
                                                    name="rollNumber"
                                                    style={{ margin: 0, padding: 0, marginTop: 8 }}
                                                >
                                                    <Input placeholder="Nhập Mã số sinh viên" />
                                                </Form.Item>

                                                <Form.Item label={'´꒳`'}>
                                                    <Button
                                                        className="max-width"
                                                        type="primary"
                                                        htmlType="submit"
                                                        style={{ padding: 0, width: 100, height: 28 }}
                                                    >
                                                        Cập nhật
                                                    </Button>
                                                </Form.Item>
                                            </div>
                                        </Form>
                                    </div>
                                </LoadingOverlay>
                                <div className="statistic">
                                    <div className="chart">
                                        <MultiCircleChart
                                            scores={{
                                                solvedEasy: scores?.solvedEasy,
                                                solvedMedium: scores?.solvedMedium,
                                                solvedHard: scores?.solvedHard
                                            }}
                                        />
                                    </div>
                                    <div className="group-cell">
                                        <div className="cell">
                                            <div className="label color-cyan">Easy</div>
                                            {scores?.solvedEasy}
                                        </div>
                                        <div className="cell">
                                            <div className="label color-gold">Medium</div>
                                            {scores?.solvedMedium}
                                        </div>
                                        <div className="cell">
                                            <div className="label color-red">Hard</div>
                                            {scores?.solvedHard}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bottom"></div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="right">Right</div> */}
        </div>
    );
});

export default Profile;
