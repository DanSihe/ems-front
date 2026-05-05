import React, { useState } from 'react';
import { Alert, Button, Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import '../login/Login.css';
import './AdminLogin.css';
import logo from '../../../assets/logo.svg';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const startLogin = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Admin login failed');
      }

      const payload = await response.json();
      setChallenge(payload);
      message.success(payload.message || 'Verification code sent');
    } catch (error) {
      message.error(error.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async ({ code }) => {
    setMfaLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/login/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge?.challengeId,
          code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid verification code');
      }

      const payload = await response.json();
      localStorage.setItem('admin', JSON.stringify(payload));
      window.dispatchEvent(new Event('storage'));
      message.success('Admin login successful');
      navigate('/admin-dashboard');
    } catch (error) {
      message.error(error.message || 'Verification failed');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-container admin-login-page">
      <div className="login-left admin-login-left">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Admin Control Access</h1>
        <p>Review and approve users, hosts, and newly created events from one secure workspace.</p>
      </div>

      <div className="login-right">
        <Form
          name="admin-login"
          className="login-form"
          onFinish={challenge ? verifyMfa : startLogin}
        >
          <h2 className="login-form-title">{challenge ? 'Verify Admin Login' : 'Admin Login'}</h2>
          <p className="login-form-subtitle">
            {challenge
              ? `Enter the verification code sent to ${challenge.maskedEmail}.`
              : 'Sign in with your admin account, then confirm the one-time verification code.'}
          </p>

          {challenge && (
            <Alert
              className="mfa-alert"
              type="info"
              showIcon
              message={challenge.message}
              description={
                <div className="mfa-alert-content">
                  <p>Code expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
                  {challenge.demoCode && (
                    <div className="demo-code-box">
                      <span>Use this code for verification</span>
                      <strong>{challenge.demoCode}</strong>
                    </div>
                  )}
                </div>
              }
            />
          )}

          {!challenge ? (
            <>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please input admin email!' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Admin email" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input admin password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="code"
              rules={[
                { required: true, message: 'Please enter your verification code!' },
                { len: 6, message: 'Verification code must be 6 digits' },
              ]}
            >
              <Input
                maxLength={6}
                placeholder="Enter 6-digit verification code"
                className="mfa-code-input"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={challenge ? mfaLoading : loading}>
              {challenge ? 'Verify and Continue' : 'Continue to Verification'}
            </Button>
            <div className="admin-auth-link-row">
              {challenge ? (
                <button type="button" className="login-link-button" onClick={() => setChallenge(null)}>
                  Use a different admin account
                </button>
              ) : (
                <>Need admin access? <Link to="/admin-register">Create admin account</Link></>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;
