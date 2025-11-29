import { ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, Result, Typography, Divider } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import './activate-account.scss';

interface ChangePasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordFirstTime = observer(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: ChangePasswordFormValues) => {
    if (!email) {
      globalStore.triggerNotification('error', 'Không tìm thấy email. Vui lòng mở lại link trong email.', '');
      return;
    }

    setSubmitting(true);
    try {
      await http.patchV2(
        null,
        `/auth/password/first-time?email=${encodeURIComponent(email)}`,
        {
          newPassword: values.newPassword
        }
      );
      globalStore.triggerNotification('success', 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.', '');
      navigate('/login');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau!';
      globalStore.triggerNotification('error', message, '');
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-content">
          <Result
            status="error"
            title="Liên kết không hợp lệ"
            subTitle="Không tìm thấy địa chỉ email trong đường dẫn. Vui lòng kiểm tra lại email kích hoạt."
            extra={[
              <Button key="login" type="primary" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="activate-account-container">
      <div className="activate-account-content change-password-first-time">
        <div className="change-password-header">
          <div className="change-password-icon">
            <ExclamationCircleOutlined />
          </div>
          <Typography.Title level={3} className="change-password-title">
            Đặt mật khẩu cho lần đăng nhập đầu tiên
          </Typography.Title>
          <Typography.Paragraph className="change-password-subtitle">
            Tài khoản: <span className="change-password-email">{email}</span>
          </Typography.Paragraph>
        </div>

        <Divider className="change-password-divider" />

        <Form<ChangePasswordFormValues> layout="vertical" size="large" onFinish={handleFinish}>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/,
                message: 'Mật khẩu phải có ít nhất 1 chữ in hoa và 1 ký tự đặc biệt'
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Nhập lại mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item className="change-password-actions">
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Xác nhận và đăng nhập
            </Button>
            <Button type="link" className="change-password-back" onClick={() => navigate('/login')}>
              Quay lại trang đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});

export default ChangePasswordFirstTime;


