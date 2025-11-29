import { LoadingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Checkbox, Form, Input, Modal } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import authentication from '../../../shared/auth/authentication';
import './lr-component.scss';
import Line from '../../../components/Line/Line';

const flexSliderItems = [
    {
        id: 0,
        imgUrl: 'https://international.fpt.edu.vn/web/image/image.gallery/1356/image'
    },
    {
        id: 1,
        imgUrl: 'https://daihoc.fpt.edu.vn/en/wp-content/themes/fpt-university/images/header.jpg'
    },
    {
        id: 2,
        imgUrl: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hoc_phi_dai_hoc_fpt_2025_0_dbb0222f41.jpg'
    },
    {
        id: 3,
        imgUrl: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2023_12_9_638376784136834685_hoc-phi-he-dai-hoc-fpt-cover.jpeg'
    }
];

type FieldType = {
    username?: string;
    password?: string;
    remember?: string;
};

const LRComponent = observer(() => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % 4);
        }, 3000); // 2 giây

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (authentication.isAuthenticated && !authentication.loading) navigate(`/`);
    }, [authentication.isAuthenticated]);

    return (
        <div className="lr-component">
            <Modal
                className="lr-modal"
                closable={{ 'aria-label': 'Custom Close Button' }}
                // open={!authentication.isAuthenticated ? true : globalStore.isLROpen}
                open={globalStore.isLROpen}
                onOk={() => {}}
                onCancel={() => globalStore.setLROpen(false)}
                footer={false}
            >
                <div className={classnames('left', { 'max-width': globalStore.isBelow1000 })}>
                    {step == 0 ? <LoginComponent setStep={setStep} /> : <ForgetPasswordComponent setStep={setStep} />}
                </div>
                <div className="split"></div>
                <div
                    className={classnames('right', { hide: globalStore.isBelow1000 })}
                    style={{
                        backgroundImage: `url('${
                            globalStore.theme == 'theme-dark'
                                ? '/sources/login/image.jpeg'
                                : 'https://i.ex-cdn.com/mientay.giadinhonline.vn/files/content/2025/05/12/z6594050220643_b9164f734c54e153355c37e32d3de83f-1635.jpg'
                        }')`
                    }}
                >
                    <img className="logo" src="/favicon.svg" alt="" />
                    <div className="content">
                        <div className="title">
                            NỀN TẢNG <span>HỖ TRỢ LUYỆN LẬP TRÌNH</span>
                        </div>
                        <div className="flex-slider">
                            {flexSliderItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex-slider-item ${activeIndex === item.id ? 'active' : ''}`}
                                >
                                    <img src={item.imgUrl} alt="" />
                                </div>
                            ))}
                        </div>
                        <div className="title-2">
                            LUYỆN TẬP <span>NHANH CHÓNG</span>
                        </div>
                        {activeIndex === 0 && <MoveFromRightComponent />}
                        {activeIndex === 1 && <MoveFromRightComponent />}
                        {activeIndex === 2 && <MoveFromRightComponent />}
                        {activeIndex === 3 && <MoveFromRightComponent />}
                    </div>
                </div>
            </Modal>
        </div>
    );
});

const ForgetPasswordComponent = observer(({ setStep }: { setStep: any }) => {
    const onFinish = (values: any) => {
        const email = values.email;

        globalStore.triggerNotification('success', 'Thầy làm thì thông báo bằng cái này nhé', '');
    };

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div className="content">
            <div className="logo">
                <img className="logo" src="/sources/logo-fullname.png" alt="" />
            </div>
            <div className="header">YÊU CẦU MẬT KHẨU MỚI</div>
            <Form
                name="basic"
                style={{ maxWidth: globalStore.isBelow1000 ? 1000 : 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    name="email"
                    rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                    className="custom-input-email"
                >
                    <Input style={{ height: 50, paddingTop: 24 }} placeholder="Nhập Email để nhận mật khẩu mới" />
                </Form.Item>

                <Line width={40} height={40} lineOnly />

                <Form.Item label={null}>
                    <Button
                        className={classnames('login-btn', { disabled: authentication.loading })}
                        block
                        type="primary"
                        htmlType="submit"
                    >
                        Gửi mật khẩu về email {authentication.loading && <LoadingOutlined />}
                    </Button>
                </Form.Item>
            </Form>
            <div className="forget">
                <a
                    href=""
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStep(0);
                    }}
                >
                    QUAY LẠI ĐĂNG NHẬP
                </a>
            </div>
            <div className="footer">Copyright © 2025, FUOJ. All trademarks and copyrights belong to FUOJ.</div>
        </div>
    );
});

const LoginComponent = observer(({ setStep }: { setStep: any }) => {
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        authentication.login(values.username || '', values.password || '', !!values.remember);
    };

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div className="content">
            <div className="logo">
                <img className="logo" src="/sources/logo-fullname.png" alt="" />
            </div>
            {/* <div className="header">ĐĂNG NHẬP</div> */}
            <Form
                name="basic"
                // labelCol={{ span: 8 }}
                // wrapperCol={{ span: 16 }}
                style={{ maxWidth: globalStore.isBelow1000 ? 1000 : 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    name="username"
                    rules={[{ required: true, message: 'Vui lòng nhập tài khoản | Email!' }]}
                    className="custom-input-username"
                >
                    <Input style={{ height: 50, paddingTop: 24 }} placeholder="Nhập tài khoản | Email" />
                </Form.Item>

                <Form.Item<FieldType>
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    className="custom-input-password"
                >
                    <Input.Password style={{ height: 50, paddingTop: 24 }} placeholder="Nhập mật khẩu" />
                </Form.Item>

                <Form.Item<FieldType> name="remember" valuePropName="checked" label={null} className="remember">
                    <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>

                <Form.Item label={null}>
                    <Button
                        className={classnames('login-btn', { disabled: authentication.loading })}
                        block
                        type="primary"
                        htmlType="submit"
                    >
                        Đăng nhập {authentication.loading && <LoadingOutlined />}
                    </Button>
                </Form.Item>
            </Form>
            <div className="forget">
                <a
                    href=""
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStep(1);
                    }}
                >
                    Quên mật khẩu
                </a>
            </div>
            {/* <div className="split-content">Hoặc</div>
            <div className="group-btn">
                <Button>
                    <img src="/sources/login/google.webp" alt="" style={{ width: 20 }} />
                    Google
                </Button>
                <Button>
                    <img src="/sources/login/nbg-fb.png" alt="" style={{ width: 20 }} />
                    Facebook
                </Button>
            </div> */}
            {/** biome-ignore lint/a11y/useValidAnchor: the <a> is currently for decoration */}
            {/* <div className="register">
                Bạn chưa có tài khoản? <a>ĐĂNG KÝ</a>
            </div> */}
            <div className="footer">Copyright © 2025, FUOJ. All trademarks and copyrights belong to FUOJ.</div>
        </div>
    );
});

const MoveFromRightComponent = () => {
    return (
        <>
            <div className="move-from-right mfr-1">Hoàng Gia Trọng aka Trọng Đẹp trai</div>
            <div className="move-from-right mfr-2">Lê Đức Đạt aka Thầy Đạt</div>
            <div className="move-from-right mfr-3">Phạm Ngọc Tùng Lâm</div>
            <div className="move-from-right mfr-4">Hồ Anh Dũng</div>
        </>
    );
};

export { LRComponent };
