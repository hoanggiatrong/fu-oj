import { LockOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import * as http from '../../lib/httpRequest';
import './change-password.scss';

interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword = observer(() => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish: FormProps['onFinish'] = async (values: ChangePasswordFormValues) => {
    setSubmitting(true);
    try {
      await http.patchV2(null, '/auth/password', {
        password: values.oldPassword,
        newPassword: values.newPassword
      });
      globalStore.triggerNotification('success', 'Đổi mật khẩu thành công!', '');
      form.resetFields();
      navigate('/home');
    } catch (error: any) {
      let message =
        error?.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau!';
      
      // Chuyển đổi message "Password not match." thành tiếng Việt
      if (message && (message.includes('Password not match') || message.includes('password not match'))) {
        message = 'Mật khẩu cũ chưa đúng';
      }
      
      globalStore.triggerNotification('error', message, '');
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="change-password-container">
      <div className="change-password-content">
        <div className="change-password-header">
          <div className="change-password-icon">
            <LockOutlined />
          </div>
          <h2 className="change-password-title">Đổi mật khẩu</h2>
          <p className="change-password-subtitle">Vui lòng nhập thông tin để đổi mật khẩu</p>
        </div>

        <Form<ChangePasswordFormValues>
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          className="change-password-form"
        >
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu cũ"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
                message: 'Mật khẩu phải có ít nhất 1 chữ in hoa, 1 số và 1 ký tự đặc biệt'
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
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
                message: 'Mật khẩu phải có ít nhất 1 chữ in hoa, 1 số và 1 ký tự đặc biệt'
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
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
              Lưu
            </Button>
            <Button
              type="default"
              block
              onClick={() => navigate('/home')}
              style={{ marginTop: 12 }}
            >
              Quay lại
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});

export default ChangePassword;

