import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../registration/Register.css';
import './AdminRegister.css';
import logo from '../../../assets/logo.svg';

const AdminRegister = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { confirmPassword, ...payload } = values;

    try {
      const response = await fetch('http://localhost:8080/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Admin registration failed');
      }

      message.success('Admin account created successfully. You can now log in.');
      form.resetFields();
      setTimeout(() => navigate('/admin-login'), 1400);
    } catch (error) {
      message.error(error.message || 'Admin registration failed');
    }
  };

  return (
    <div className="register-container admin-register-page">
      <div className="register-left admin-register-left">
        <img src={logo} alt="Logo" className="register-logo" />
        <h2>Admin Setup</h2>
        <p>Create the admin account that will approve users, hosts, and event submissions.</p>
      </div>

      <div className="register-form-container">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Admin Email"
            rules={[
              { required: true, message: 'Enter admin email' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Enter password' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                message: 'Use upper, lower, number, special character, and at least 8 characters',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Admin Account
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AdminRegister;
