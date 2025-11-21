import type { FormProps } from 'antd';
import { Button, Checkbox, Form, Input, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import authentication from '../../../shared/auth/authentication';
import './lr-component.scss';

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
                <div className="left">
                    <LoginComponent />
                </div>
                <div className="split"></div>
                <div
                    className="right"
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

const LoginComponent = () => {
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        authentication.login(values.username || '', values.password || '', !!values.remember);
    };

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div className="content">
            <div className="header">ĐĂNG NHẬP</div>
            <Form
                name="basic"
                // labelCol={{ span: 8 }}
                // wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    name="username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                    className="custom-input-username"
                >
                    <Input style={{ height: 50, paddingTop: 24 }} placeholder="Nhập tài khoản | Email" />
                </Form.Item>

                <Form.Item<FieldType>
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                    className="custom-input-password"
                >
                    <Input.Password style={{ height: 50, paddingTop: 24 }} placeholder="Nhập mật khẩu" />
                </Form.Item>

                <Form.Item<FieldType> name="remember" valuePropName="checked" label={null} className="remember">
                    <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>

                <Form.Item label={null}>
                    <Button className="login-btn" block type="primary" htmlType="submit">
                        Đăng nhập
                    </Button>
                </Form.Item>
            </Form>
            <div className="split-content">Hoặc</div>
            <div className="group-btn">
                <Button>
                    <img src="/sources/login/google.webp" alt="" style={{ width: 20 }} />
                    Google
                </Button>
                <Button>
                    <img src="/sources/login/nbg-fb.png" alt="" style={{ width: 20 }} />
                    Facebook
                </Button>
            </div>
            <div className="register">
                {/** biome-ignore lint/a11y/useValidAnchor: the <a> is currently for decoration */}
                Bạn chưa có tài khoản? <a>ĐĂNG KÝ</a>
            </div>
        </div>
    );
};

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
