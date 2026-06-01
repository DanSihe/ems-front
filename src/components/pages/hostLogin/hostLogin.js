// src/components/pages/hostLogin/HostLogin.js
import React, { useState } from 'react';
import { Alert, Form, Input, Button, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import './HostLogin.css';
import logo from '../../../assets/logo.svg';
import { getAuthErrorMessage } from '../../../utils/authMessages';
import { startAuthSession } from '../../../utils/authSession';

const HostLogin = () => {
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setAuthError('');
    try {
      const response = await fetch('http://localhost:8080/api/hosts/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setChallenge(data);
      message.success(data.message || 'Verification code sent');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'host');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async ({ code }) => {
    setMfaLoading(true);
    setAuthError('');
    try {
      const response = await fetch('http://localhost:8080/api/hosts/login/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge?.challengeId,
          code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      message.success('Login successful!');
      localStorage.setItem('host', JSON.stringify(data));
      startAuthSession();
      window.dispatchEvent(new Event('storage'));
      navigate('/dashboard');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error, 'host');
      setAuthError(friendlyMessage);
      message.error(friendlyMessage);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Welcome, Host!</h1>
        <p>Access your dashboard, manage events, and connect with your audience.</p>
      </div>

      <div className="login-right">
        <Form
          name="host-login"
          onFinish={challenge ? verifyMfa : onFinish}
          layout="vertical"
          className="login-form"
        >
          <h2>{challenge ? 'Verify Host Login' : 'Host Login'}</h2>
          <p className="host-login-subtitle">
            {challenge
              ? `Enter the verification code sent to ${challenge.maskedEmail}.`
              : 'Use your password first, then confirm the one-time email code.'}
          </p>

          {authError && (
            <Alert
              className="auth-error-alert"
              type="error"
              showIcon
              message={authError}
            />
          )}

          {challenge && (
            <Alert
              className="host-mfa-alert"
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
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password!' }]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[
                { required: true, message: 'Please enter your verification code!' },
                { len: 6, message: 'Verification code must be 6 digits' },
              ]}
            >
              <Input maxLength={6} placeholder="Enter 6-digit verification code" />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={challenge ? mfaLoading : loading} block>
              {challenge ? 'Verify Code' : 'Continue to Verification'}
            </Button>
            <div className="register-link">
              {challenge ? (
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() => {
                    setChallenge(null);
                    setAuthError('');
                  }}
                >
                  Use a different host account
                </button>
              ) : (
                <>
                  Need an account? <Link to="/host-register">Register as Host</Link>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default HostLogin;
