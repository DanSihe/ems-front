// src/pages/Login.js
import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Form, Input, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

import logoImage from '../../../assets/logo.svg';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [email, setEmail] = useState('');

  // Get redirect path if coming from an event
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid email or password');
      }

      const data = await response.json();
      setChallenge(data);
      setEmail(values.email);
      message.success(data.message || 'Verification code sent');
    } catch (error) {
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async ({ code }) => {
    setMfaLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/login/verify-mfa', {
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

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('loggedIn', 'true');
      window.dispatchEvent(new Event('storage'));
      message.success('Login successful');

      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin') || location.state?.redirectTo;
      if (redirectAfterLogin) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectAfterLogin, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      message.error(error.message || 'Verification failed');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logoImage} alt="Logo" className="login-logo" />
        <h1>Welcome to EMS</h1>
        <p>
          Event Management System to simplify client bookings and host event creation. Fast, Secure and Modern.
        </p>
      </div>
      <div className="login-right">
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={challenge ? verifyMfa : onFinish}
          className="login-form"
        >
          <h2 className="login-form-title">{challenge ? 'Verify Your Login' : 'Client Login'}</h2>
          <p className="login-form-subtitle">
            {challenge
              ? `Enter the code sent to ${challenge.maskedEmail || email}.`
              : 'Sign in with your password, then confirm the one-time code.'}
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
                rules={[{ required: true, message: 'Please input your Email!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Checkbox name="remember">Remember me</Checkbox>
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
            <Button block type="primary" htmlType="submit" loading={challenge ? mfaLoading : loading}>
              {challenge ? 'Verify Code' : 'Continue to Verification'}
            </Button>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              {challenge ? (
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() => {
                    setChallenge(null);
                    setEmail('');
                  }}
                >
                  Use a different email
                </button>
              ) : (
                <>
                  or <a href="/register">Register now!</a>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
