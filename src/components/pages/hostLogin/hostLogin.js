// src/components/pages/hostLogin/HostLogin.js
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import './HostLogin.css';
import logo from '../../../assets/logo.svg';

const HostLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
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
      message.success('Login successful!');
      localStorage.setItem('host', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      message.error(`Login failed: ${error.message}`);
    }
    setLoading(false);
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
          onFinish={onFinish}
          layout="vertical"
          className="login-form"
        >
          <h2>Host Login</h2>

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

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
            <div className="register-link">
              Need an account? <Link to="/host-register">Register as Host</Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default HostLogin;
