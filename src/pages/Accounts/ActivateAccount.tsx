import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Result, Spin } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import './activate-account.scss';

const ActivateAccount = observer(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      setError('Email không được để trống');
      setLoading(false);
      return;
    }


    http.get(`/auth/active-account/${encodeURIComponent(email)}`)
      .then(() => {
        setSuccess(true);
        globalStore.triggerNotification('success', 'Kích hoạt tài khoản thành công!', '');
      })
      .catch((error: any) => {
        const errorMessage =
          error?.response?.data?.message || 'Có lỗi xảy ra khi kích hoạt tài khoản. Vui lòng thử lại!';
        setError(errorMessage);
        globalStore.triggerNotification('error', errorMessage, '');
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-content">
          <Spin size="large" tip="Đang xử lý kích hoạt tài khoản..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-content">
          <Result
            status="error"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Kích hoạt tài khoản thất bại"
            subTitle={error}
            extra={[
              <Button type="primary" key="login" onClick={handleGoToLogin}>
                Đăng nhập
              </Button>
            ]}
          />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-content">
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title={<span style={{ color: '#ff8c42' }}>Kích hoạt tài khoản thành công!</span>}
            subTitle="Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ."
            extra={[
              <Button type="primary" key="login" onClick={handleGoToLogin}>
                Đăng nhập ngay
              </Button>
            ]}
          />
        </div>
      </div>
    );
  }

  return null;
});

export default ActivateAccount;

