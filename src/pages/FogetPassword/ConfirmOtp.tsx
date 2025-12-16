import { LockOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import './FPcomponent.scss';

const ConfirmOtp = observer(() => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('forgotPasswordEmail');
    if (!storedEmail) {
      navigate('/login');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleConfirmOtp = async () => {
    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP!');
      return;
    }

    setLoading(true);
    try {
      await http.post('/auth/password/otp/verify', {
        email,
        otp
      });

      globalStore.triggerNotification(
        'success',
        'Xác thực OTP thành công. Vui lòng đổi mật khẩu mới.',
        ''
      );
      navigate('/change-password');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại sau!';
      globalStore.triggerNotification('error', message, '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lr-form">
      <div className="bg"></div>
      <div className="container">
        <div className="border-animation">
          <div className="red" />
          <div className="blue" />
        </div>
        <div className="inner">
          <div className="right" style={{ margin: '0 auto' }}>
            <div className="forgot right-content">
              <div className="header">
                <img src="/sources/logo-fullname.png" alt="" />
              </div>
              <div className={classnames('label', { error: !!error })}>
                {error
                  ? error
                  : `Nhập mã OTP đã được gửi tới email: ${email || ''}`}
              </div>
              <div
                className="form"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmOtp();
                  }
                }}
              >
                <Input
                  placeholder="Nhập mã OTP"
                  prefix={<LockOutlined />}
                  value={otp}
                  onChange={(e) => {
                    setError('');
                    setOtp(e.target.value);
                  }}
                />
              </div>
              <div className="actions flex-end" style={{ marginTop: 16 }}>
                <div
                  className="forgot-password uppercase"
                  onClick={() => {
                    navigate('/login');
                  }}
                >
                  Quay lại đăng nhập
                </div>
              </div>
              <Button
                className={classnames({ 'disabled-5': loading })}
                type="primary"
                onClick={handleConfirmOtp}
              >
                Xác thực OTP
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ConfirmOtp;


