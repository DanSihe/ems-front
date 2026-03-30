// src/App.js
import React, { useEffect } from 'react';
import { Layout, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
const { Content } = Layout;

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            // Make header fixed or static as needed, here static
          }}
        />
        <Content
          style={{
            margin: 0,
            padding: 12,
            background: colorBgContainer,
            minHeight: `calc(100vh - 50px)`, // 64px default Ant header height, adjust if your header height differs
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
             <Route path="/event/:id" element={<EventDetails />} />
             <Route path="/my-events" element={<MyEvents />} />
        
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App;
  