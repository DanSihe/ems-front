// src/App.js
import React, { useEffect } from 'react';
import { Layout, message, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as path from './components/configs/routePath';

import LogIn from './components/pages/login/logIn';
import Presentation from './components/pages/presentation/presentation';
import Header from './components/header/header';
import Register from './components/pages/registration/register';
import UpdateAccount from './components/pages/updateAccount/updateAccount';
import HostLogin from './components/pages/hostLogin/hostLogin';
import HostRegister from './components/pages/hostRegister/hostRegister';
import HostUpdateAccount from './components/pages/hostUpdateAccount/hostUpdateAccount';
import EventDetails from './components/pages/event-details/eventdetails';
import MyEvents from './components/pages/my-events/MyEvents';
import BookingConfirmation from './components/pages/booking-confirmation/BookingConfirmation';
import HostDashboard from './components/pages/host-dashboard/HostDashboard';
import AdminLogin from './components/pages/admin-login/AdminLogin';
import AdminRegister from './components/pages/admin-register/AdminRegister';
import AdminDashboard from './components/pages/admin-dashboard/AdminDashboard';
import Footer from './components/footer/footer';
import './dark-theme.css';
import {
  AUTH_SESSION_DURATION_MS,
  clearAuthSession,
  getAuthSessionTimeRemaining,
  hasActiveLogin,
  startAuthSession,
} from './utils/authSession';
const { Content } = Layout;

const AuthSessionGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const expireSession = () => {
      if (!hasActiveLogin()) {
        return;
      }

      clearAuthSession();
      window.dispatchEvent(new Event('storage'));
      message.info('Your session expired after 1 hour. Please log in again.');
      navigate('/', { replace: true });
    };

    const scheduleLogout = () => {
      window.clearTimeout(timeoutId);

      if (!hasActiveLogin()) {
        return;
      }

      let remaining = getAuthSessionTimeRemaining();

      if (remaining === null) {
        startAuthSession();
        remaining = AUTH_SESSION_DURATION_MS;
      }

      if (remaining <= 0) {
        expireSession();
        return;
      }

      timeoutId = window.setTimeout(expireSession, remaining);
    };

    scheduleLogout();
    window.addEventListener('storage', scheduleLogout);
    window.addEventListener('focus', scheduleLogout);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('storage', scheduleLogout);
      window.removeEventListener('focus', scheduleLogout);
    };
  }, [navigate]);

  return null;
};

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Router>
      <AuthSessionGuard />
      <Layout className="ems-app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            // Make header fixed or static as needed, here static
          }}
        />
        <Content
          style={{
            flex: 1,
            margin: 0,
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Routes>
            <Route path={path.loginPath} element={<LogIn />} />
            <Route path={path.presentationPath} element={<Presentation />} />
            <Route path={path.registerPath} element={<Register />} />
            <Route path="/update-account" element={<UpdateAccount />} />
            <Route path="/host-login" element={<HostLogin />} />
            <Route path="/host-register" element={<HostRegister />} />
            <Route path="host-update" element={<HostUpdateAccount />} />
            <Route path={path.adminLoginPath} element={<AdminLogin />} />
            <Route path={path.adminRegisterPath} element={<AdminRegister />} />
            <Route path={path.adminDashboardPath} element={<AdminDashboard />} />
             <Route path="/event/:id" element={<EventDetails />} />
             <Route path="/my-events" element={<MyEvents />} />
             <Route path={path.bookingConfirmationPath} element={<BookingConfirmation />} />
             <Route path={path.dashboardPath} element={<HostDashboard />} />
        
          </Routes>
        </Content>
        <Footer />
      </Layout>
    </Router>
  );
};

export default App;
  
