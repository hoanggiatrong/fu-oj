import { FacebookOutlined, InstagramOutlined, LoadingOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import './fp-component.scss';

const flexSliderItems = [
    {
        id: 0,
        imgUrl: 'https://ss-images.saostar.vn/2020/02/15/6994345/7campusdhfpttphcm.jpg'
    },
    {
        id: 1,
        imgUrl: 'https://international.fpt.edu.vn/web/image/image.gallery/1356/image'
    },
    {
        id: 2,
        imgUrl: 'https://scontent.cdninstagram.com/v/t51.82787-15/548844642_18295404853270902_1926921536060933698_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ig_cache_key=MzcyMDU3NzUyMjg4ODU0ODc2Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTgwMC5zZHIuQzMifQ%3D%3D&_nc_ohc=CW9xyIhLU3QQ7kNvwEoYfYy&_nc_oc=AdnaLLe1WjM0KToFPox0d9wmu4O_FiFCWfzFaOq6qlaX0tyAIwf_Gk9Uk5uamqI0hOQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=4Au4OaNnIaS7uMcUHGhnxg&oh=00_Afko8IQejAMUGJIFtqgwZOJ9seRHZxkC0FRZ0VBZv0LKUA&oe=693CE6CD'
    },
    {
        id: 3,
        imgUrl: 'https://scontent.cdninstagram.com/v/t51.82787-15/547587128_18295404880270902_7111032811508598037_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ig_cache_key=MzcyMDU3NzUyMjk5NzY0MDE3MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0Mzl4MTc5OS5zZHIuQzMifQ%3D%3D&_nc_ohc=llCWpr1z4GYQ7kNvwHM_cd2&_nc_oc=AdnZDVk5eeYYhY-rKqja-_qjOMCM7oVACIWaSE2gyFH5RH6Xo3swoa4xNGyUXlFHHtM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=4Au4OaNnIaS7uMcUHGhnxg&oh=00_AfniC9F1407olPaX0oqnvn6hyPbZkW8LRQ-ai8KqmYwLgA&oe=693D0472'
    }
];

const LRComponent = observer(() => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // LOGIN
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [email, setEmail] = useState('');

    const login = () => {
        setError('');

        if (username.trim() == '') {
            setError('Email là bắt buộc!');
            return;
        }

        if (!utils.isEmail(username)) {
            setError('Email không đúng định dạng!');
            return;
        }

        if (password.trim() == '') {
            setError('Mật khẩu là bắt buộc!');
            return;
        }

        authentication.login(username || '', password || '', !!remember);
    };

    const forgetPassword = async () => {
        if (!email) {
            setError('Email là bắt buộc!');
            return;
        }

        if (!utils.isEmail(email)) {
            setError('Email không đúng định dạng!');
            return;
        }

        setLoading(true);
        try {
            await http.post(`/auth/password/otp?email=${encodeURIComponent(email)}`, {});
            globalStore.triggerNotification('success', 'Mã OTP đã được gửi về email.', '');
            localStorage.setItem('forgotPasswordEmail', email);
            setEmail('');
            navigate('/confirm-otp');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau!';
            globalStore.triggerNotification('error', message, '');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % 4);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (authentication.isAuthenticated && !authentication.loading) navigate(`/`);
    }, [authentication.isAuthenticated]);

    return (
        <div className="lr-form">
            <div className="bg"></div>
            <div className="container">
                <div className="border-animation">
                    <div className="red" />
                    <div className="blue" />
                </div>
                <div className="inner">
                    {!globalStore.isBelow1000 && (
                        <div className="left">
                            <div className="hello">
                                <div className="hello-1">Chào mừng</div>
                                <div className="hello-2">FU-OJ,</div>
                                <div className="hello-3">Đăng nhập để bắt đầu Luyện tập</div>
                            </div>
                            <div className="carousel">
                                {flexSliderItems.map((i) => {
                                    return (
                                        <div
                                            key={`flex-slider-item-${i.id}`}
                                            className={classnames('carousel-item', { active: i.id == activeIndex })}
                                            style={{ backgroundImage: `url("${i.imgUrl}")` }}
                                        />
                                    );
                                })}
                                <div className="dots">
                                    {flexSliderItems.map((i) => {
                                        return (
                                            <div
                                                key={`flex-slider-item-dot-${i.id}`}
                                                className={classnames('dot', { active: i.id == activeIndex })}
                                                onClick={() => setActiveIndex(i.id)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="byebye">
                                <div className="byebye-1">Liên hệ với chúng tôi</div>
                                <div className="social flex gap">
                                    <FacebookOutlined className="ico" />
                                    <InstagramOutlined className="ico" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="right">
                        {step == 0 && (
                            <div className="login right-content">
                                <div className="header">
                                    <img src="/sources/logo-fullname.png" alt="" />
                                </div>
                                <div className={classnames('label', { error: !!error })}>
                                    {error ? error : 'Vui lòng nhập thông tin đăng nhập.'}
                                </div>
                                <div
                                    className="form"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && step == 0) {
                                            login();
                                        }
                                    }}
                                >
                                    <Input
                                        placeholder="Email"
                                        suffix={<MailOutlined />}
                                        value={username}
                                        onChange={(e) => {
                                            setError('');
                                            setUsername(e.target.value);
                                        }}
                                    />
                                    <Input.Password
                                        placeholder="Mật khẩu"
                                        value={password}
                                        onChange={(e) => {
                                            setError('');
                                            setPassword(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="actions">
                                    <Checkbox
                                        checked={remember}
                                        value={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    >
                                        Duy trì đăng nhập
                                    </Checkbox>
                                    <div
                                        className="forgot-password"
                                        onClick={() => {
                                            setStep(1);
                                            setError('');
                                        }}
                                    >
                                        Quên mật khẩu?
                                    </div>
                                </div>
                                <Button
                                    className={classnames({ 'disabled-5': authentication.loading })}
                                    type="primary"
                                    onClick={login}
                                >
                                    Đăng nhập
                                    {authentication.loading && <LoadingOutlined className="ml-8" />}
                                </Button>
                            </div>
                        )}
                        {step == 1 && (
                            <div className="forgot right-content">
                                <div className="header">
                                    <img src="/sources/logo-fullname.png" alt="" />
                                </div>
                                <div className={classnames('label', { error: !!error })}>
                                    {error ? error : 'Yêu cầu mật khẩu mới.'}
                                </div>
                                <div
                                    className="form"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && step == 1) {
                                            forgetPassword();
                                        }
                                    }}
                                >
                                    <Input
                                        placeholder="Email"
                                        suffix={<MailOutlined />}
                                        value={email}
                                        onChange={(e) => {
                                            setError('');
                                            setEmail(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="actions flex-end">
                                    <div
                                        className="forgot-password uppercase"
                                        onClick={() => {
                                            setStep(0);
                                            setError('');
                                        }}
                                    >
                                        Quay lại đăng nhập
                                    </div>
                                </div>
                                <Button
                                    className={classnames({ 'disabled-5': loading })}
                                    type="primary"
                                    onClick={forgetPassword}
                                >
                                    Gửi mật khẩu về email
                                    {loading && <LoadingOutlined className="ml-8" />}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        // <div className="lr-component">
        //     <Modal
        //         className="lr-modal"
        //         closable={{ 'aria-label': 'Custom Close Button' }}
        //         // open={!authentication.isAuthenticated ? true : globalStore.isLROpen}
        //         open={globalStore.isLROpen}
        //         onOk={() => { }}
        //         onCancel={() => globalStore.setLROpen(false)}
        //         footer={false}
        //     >
        //         <div className={classnames('left', { 'max-width': globalStore.isBelow1000 })}>
        //             {step == 0 ? <LoginComponent setStep={setStep} /> : <ForgetPasswordComponent setStep={setStep} />}
        //         </div>
        //         <div className="split"></div>
        //         <div
        //             className={classnames('right', { hide: globalStore.isBelow1000 })}
        //             style={{
        //                 backgroundImage: `url('${globalStore.theme == 'theme-dark'
        //                     ? '/sources/login/image.jpeg'
        //                     : 'https://i.ex-cdn.com/mientay.giadinhonline.vn/files/content/2025/05/12/z6594050220643_b9164f734c54e153355c37e32d3de83f-1635.jpg'
        //                     }')`
        //             }}
        //         >
        //             <img className="logo" src="/favicon.svg" alt="" />
        //             <div className="content">
        //                 <div className="title">
        //                     NỀN TẢNG <span>HỖ TRỢ LUYỆN LẬP TRÌNH</span>
        //                 </div>
        //                 <div className="flex-slider">
        //                     {flexSliderItems.map((item) => (
        //                         <div
        //                             key={item.id}
        //                             className={`flex-slider-item ${activeIndex === item.id ? 'active' : ''}`}
        //                         >
        //                             <img src={item.imgUrl} alt="" />
        //                         </div>
        //                     ))}
        //                 </div>
        //                 <div className="title-2">
        //                     LUYỆN TẬP <span>NHANH CHÓNG</span>
        //                 </div>
        //                 {activeIndex === 0 && <MoveFromRightComponent />}
        //                 {activeIndex === 1 && <MoveFromRightComponent />}
        //                 {activeIndex === 2 && <MoveFromRightComponent />}
        //                 {activeIndex === 3 && <MoveFromRightComponent />}
        //             </div>
        //         </div>
        //     </Modal>
        // </div>
    );
});

// const ForgetPasswordComponent = observer(({ setStep }: { setStep: any }) => {
//     const [loading, setLoading] = useState(false);
//     const [form] = Form.useForm();

//     const onFinish = async (values: any) => {
//         const email = values.email;

//         if (!email) {
//             globalStore.triggerNotification('error', 'Vui lòng nhập email!', '');
//             return;
//         }

//         setLoading(true);
//         try {
//             await http.get(`/auth/forget-password?to=${encodeURIComponent(email)}`);
//             globalStore.triggerNotification('success', 'Mật khẩu mới đã được gửi về email.', '');
//             form.setFieldsValue({ email: '' }); // Clear input email sau khi gửi thành công
//         } catch (error: any) {
//             const message = error?.response?.data?.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau!';
//             globalStore.triggerNotification('error', message, '');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
//         console.log('Failed:', errorInfo);
//     };

//     return (
//         <div className="content">
//             <div className="logo">
//                 <img className="logo" src="/sources/logo-fullname.png" alt="" />
//             </div>
//             <div className="header">YÊU CẦU MẬT KHẨU MỚI</div>
//             <Form
//                 form={form}
//                 name="basic"
//                 style={{ maxWidth: globalStore.isBelow1000 ? 1000 : 600 }}
//                 initialValues={{ remember: true }}
//                 onFinish={onFinish}
//                 onFinishFailed={onFinishFailed}
//                 autoComplete="off"
//             >
//                 <Form.Item
//                     name="email"
//                     rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
//                     className="custom-input-email"
//                 >
//                     <Input style={{ height: 50, paddingTop: 24 }} placeholder="Nhập Email để nhận mật khẩu mới" />
//                 </Form.Item>

//                 <Line width={40} height={40} lineOnly />

//                 <Form.Item label={null}>
//                     <Button
//                         className={classnames('login-btn', { disabled: loading })}
//                         block
//                         type="primary"
//                         htmlType="submit"
//                         loading={loading}
//                     >
//                         Gửi mật khẩu về email {loading && <LoadingOutlined />}
//                     </Button>
//                 </Form.Item>
//             </Form>
//             <div className="forget">
//                 <a
//                     href=""
//                     onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setStep(0);
//                     }}
//                 >
//                     QUAY LẠI ĐĂNG NHẬP
//                 </a>
//             </div>
//             <div className="footer">Copyright © 2025, FUOJ. All trademarks and copyrights belong to FUOJ.</div>
//         </div>
//     );
// });

// const LoginComponent = observer(({ setStep }: { setStep: any }) => {
//     const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
//         authentication.login(values.username || '', values.password || '', !!values.remember);
//     };

//     const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
//         console.log('Failed:', errorInfo);
//     };

//     return (
//         <div className="content">
//             <div className="logo">
//                 <img className="logo" src="/sources/logo-fullname.png" alt="" />
//             </div>
//             {/* <div className="header">ĐĂNG NHẬP</div> */}
//             <Form
//                 name="basic"
//                 // labelCol={{ span: 8 }}
//                 // wrapperCol={{ span: 16 }}
//                 style={{ maxWidth: globalStore.isBelow1000 ? 1000 : 600 }}
//                 initialValues={{ remember: true }}
//                 onFinish={onFinish}
//                 onFinishFailed={onFinishFailed}
//                 autoComplete="off"
//             >
//                 <Form.Item<FieldType>
//                     name="username"
//                     rules={[{ required: true, message: 'Vui lòng nhập tài khoản | Email!' }]}
//                     className="custom-input-username"
//                 >
//                     <Input style={{ height: 50, paddingTop: 24 }} placeholder="Nhập tài khoản | Email" />
//                 </Form.Item>

//                 <Form.Item<FieldType>
//                     name="password"
//                     rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
//                     className="custom-input-password"
//                 >
//                     <Input.Password style={{ height: 50, paddingTop: 24 }} placeholder="Nhập mật khẩu" />
//                 </Form.Item>

//                 <Form.Item<FieldType> name="remember" valuePropName="checked" label={null} className="remember">
//                     <Checkbox>Ghi nhớ đăng nhập</Checkbox>
//                 </Form.Item>

//                 <Form.Item label={null}>
//                     <Button
//                         className={classnames('login-btn', { disabled: authentication.loading })}
//                         block
//                         type="primary"
//                         htmlType="submit"
//                     >
//                         Đăng nhập {authentication.loading && <LoadingOutlined />}
//                     </Button>
//                 </Form.Item>
//             </Form>
//             <div className="forget">
//                 <a
//                     href=""
//                     onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setStep(1);
//                     }}
//                 >
//                     Quên mật khẩu
//                 </a>
//             </div>
//             {/* <div className="split-content">Hoặc</div>
//             <div className="group-btn">
//                 <Button>
//                     <img src="/sources/login/google.webp" alt="" style={{ width: 20 }} />
//                     Google
//                 </Button>
//                 <Button>
//                     <img src="/sources/login/nbg-fb.png" alt="" style={{ width: 20 }} />
//                     Facebook
//                 </Button>
//             </div> */}
//             {/** biome-ignore lint/a11y/useValidAnchor: the <a> is currently for decoration */}
//             {/* <div className="register">
//                 Bạn chưa có tài khoản? <a>ĐĂNG KÝ</a>
//             </div> */}
//             <div className="footer">Copyright © 2025, FUOJ. All trademarks and copyrights belong to FUOJ.</div>
//         </div>
//     );
// });

// const MoveFromRightComponent = () => {
//     return (
//         <>
//             <div className="move-from-right mfr-1">Hoàng Gia Trọng aka Trọng Đẹp trai</div>
//             <div className="move-from-right mfr-2">Lê Đức Đạt aka Thầy Đạt</div>
//             <div className="move-from-right mfr-3">Phạm Ngọc Tùng Lâm</div>
//             <div className="move-from-right mfr-4">Hồ Anh Dũng</div>
//         </>
//     );
// };

export { LRComponent };
