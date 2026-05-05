import React, { useEffect, useState } from 'react';
import './Header.css';
import { Avatar, Drawer, Dropdown, Menu, Modal } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);  // client
  const [host, setHost] = useState(null);  // host
  const [admin, setAdmin] = useState(null); // admin
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedHost = JSON.parse(localStorage.getItem('host'));
    const storedAdmin = JSON.parse(localStorage.getItem('admin'));

    if (storedAdmin) {
      setAdmin(storedAdmin);
    } else {
      setAdmin(null);
    }
    setUser(storedUser);
    setHost(storedHost);

    const syncUser = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
      setHost(JSON.parse(localStorage.getItem('host')));
      setAdmin(JSON.parse(localStorage.getItem('admin')));
    };

    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const handleMenuClick = ({ key }) => {
    if (key === 'update') {
      if (key === 'update') {
  if (host) {
    navigate('/host-update');
  } else {
    navigate('/update-account');
  }
};
    } else if (key === 'logout') {
      if (host) {
        localStorage.removeItem('host');
        setHost(null);
      }
      if (user) {
        localStorage.removeItem('user');
        localStorage.removeItem('loggedIn');
        setUser(null);
      }
      if (admin) {
        localStorage.removeItem('admin');
        setAdmin(null);
      }
      localStorage.removeItem('redirectAfterLogin');
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } else if (key === 'login') {
      setIsModalVisible(true);
    } else if (key === 'manage') {
      navigate('/dashboard');
    } else if (key === 'admin-dashboard') {
      navigate('/admin-dashboard');
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {admin ? (
        <>
          <Menu.Item key="admin-dashboard" icon={<CalendarOutlined />}>
            Admin Dashboard
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />}>
            Logout
          </Menu.Item>
        </>
      ) : host ? (
        <>
          <Menu.Item key="manage" icon={<CalendarOutlined />}>
            Manage Events
          </Menu.Item>
          <Menu.Item key="update" icon={<SettingOutlined />}>
            Update Account
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />}>
            Logout
          </Menu.Item>
        </>
      ) : user ? (
        <>
          <Menu.Item key="update" icon={<SettingOutlined />}>
            Update Account
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />}>
            Logout
          </Menu.Item>
        </>
      ) : (
        <Menu.Item key="login" icon={<UserOutlined />}>
          Login
        </Menu.Item>
      )}
    </Menu>
  );

  const handleClientLogin = () => {
    setIsModalVisible(false);
    navigate('/login');
  };

    const handleAdminLogin = () => {    
    setIsModalVisible(false);
    navigate('/admin-login');
  };


  const handleHostLogin = () => {
    setIsModalVisible(false);
    navigate('/host-login');
  };

  const handleHomeNavigation = () => {
    setMobileMenuOpen(false);
    navigate('/', { state: { refreshAt: Date.now() } });
  };

  const greeting = host
    ? `Hi, ${host.firstName}! (Host)`
    : admin
    ? `Hi, ${admin.firstName}! (Admin)`
    : user
    ? `Hi, ${user.firstName}!`
    : null;

  const navLinks = (
    <>
      <Link to="/" className="tab" onClick={() => setMobileMenuOpen(false)}>Featured Events</Link>
      <Link to="/" className="tab" onClick={() => setMobileMenuOpen(false)}>Music</Link>
      <Link to="/" className="tab" onClick={() => setMobileMenuOpen(false)}>Business</Link>
      <Link to="/" className="tab" onClick={() => setMobileMenuOpen(false)}>Educational</Link>
      {user && (
        <Link to="/my-events" className="tab" onClick={() => setMobileMenuOpen(false)}>My Events</Link>
      )}
      {host && (
        <Link to="/dashboard" className="tab highlight-tab" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
      )}
      {admin && (
        <Link to="/admin-dashboard" className="tab highlight-tab" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
      )}
    </>
  );

  return (
    <>
      <header className="header_box">
        <button type="button" className="header_logo_button" onClick={handleHomeNavigation}>
          <img className="header_logo" src={logo} alt="logo" />
        </button>

        <div className="tabs">
          {navLinks}
        </div>

        <div className="user_area">
          <button
            type="button"
            className="mobile_menu_button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
          >
            <MenuOutlined />
          </button>
          {greeting && <span className="user_greeting">{greeting}</span>}
          <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
            <Avatar icon={<UserOutlined />} size={50} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </div>
      </header>

      <Modal
        title="Login As"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <div className="login-role-selection">
  <div className="login-card" onClick={handleClientLogin}>
   
    <h3>Client</h3>
    <p>Book your favorite events and manage your bookings.</p>
  </div>

  <div className="login-card" onClick={handleHostLogin}>
    
    <h3>Host</h3>
    <p>Create and manage your events with powerful tools.</p>
  </div>

  <div className="login-card" onClick={handleAdminLogin}>
    
    <h3>Admin</h3>
    <p>Manage all aspects of the platform.</p>
  </div>
</div>
      </Modal>

      <Drawer
        title="Navigation"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        className="mobile_nav_drawer"
      >
        <div className="mobile_nav_links">
          {navLinks}
        </div>
      </Drawer>
    </>
  );
};

export default Header;
