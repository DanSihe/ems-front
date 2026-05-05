import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, AuditOutlined, TeamOutlined, CalendarOutlined, SafetyCertificateOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const { Title, Text, Paragraph } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [dashboard, setDashboard] = useState({
    stats: {},
    users: [],
    hosts: [],
    events: [],
  });

  const admin = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('admin'));
    } catch (error) {
      return null;
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Unable to load admin dashboard');
      }

      const payload = await response.json();
      setDashboard({
        stats: payload.stats || {},
        users: payload.users || [],
        hosts: payload.hosts || [],
        events: payload.events || [],
      });
    } catch (error) {
      messageApi.error(error.message || 'Unable to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (!admin?.id) {
      navigate('/admin-login');
      return;
    }

    fetchDashboard();
  }, [admin?.id, fetchDashboard, navigate]);

  const updateApproval = async (type, id, approvalStatus) => {
    const actionKey = `${type}-${id}-${approvalStatus}`;
    try {
      setActionLoading(actionKey);
      const response = await fetch(`http://localhost:8080/api/admin/dashboard/${type}/${id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Approval update failed');
      }

      messageApi.success(`${type.slice(0, -1)} ${approvalStatus.toLowerCase()} successfully`);
      fetchDashboard();
    } catch (error) {
      messageApi.error(error.message || 'Approval update failed');
    } finally {
      setActionLoading('');
    }
  };

  const renderApprovalActions = (type, record) => (
    <Space wrap>
      <Button
        type={record.approvalStatus === 'APPROVED' ? 'default' : 'primary'}
        icon={<CheckCircleOutlined />}
        disabled={record.approvalStatus === 'APPROVED'}
        loading={actionLoading === `${type}-${record.id}-APPROVED`}
        onClick={() => updateApproval(type, record.id, 'APPROVED')}
      >
        {record.approvalStatus === 'APPROVED' ? 'Approved' : 'Approve'}
      </Button>
      <Button
        danger
        icon={<CloseCircleOutlined />}
        disabled={record.approvalStatus === 'REJECTED'}
        loading={actionLoading === `${type}-${record.id}-REJECTED`}
        onClick={() => updateApproval(type, record.id, 'REJECTED')}
      >
        {record.approvalStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
      </Button>
    </Space>
  );

  const approvalColumn = {
    title: 'Approval',
    dataIndex: 'approvalStatus',
    key: 'approvalStatus',
    render: (value) => {
      const color = value === 'APPROVED' ? 'green' : value === 'REJECTED' ? 'red' : 'gold';
      return <Tag color={color}>{value || 'PENDING'}</Tag>;
    },
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <Text strong>{`${record.firstName || ''} ${record.lastName || ''}`.trim() || 'User'}</Text>
          <div><Text type="secondary">{record.email}</Text></div>
        </div>
      ),
    },
    { title: 'Nickname', dataIndex: 'nickname', key: 'nickname' },
    approvalColumn,
    { title: 'Action', key: 'action', render: (_, record) => renderApprovalActions('users', record) },
  ];

  const hostColumns = [
    {
      title: 'Host',
      key: 'host',
      render: (_, record) => (
        <div>
          <Text strong>{`${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Host'}</Text>
          <div><Text type="secondary">{record.email}</Text></div>
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'eventCategory', key: 'eventCategory' },
    approvalColumn,
    { title: 'Action', key: 'action', render: (_, record) => renderApprovalActions('hosts', record) },
  ];

  const eventColumns = [
    {
      title: 'Event',
      key: 'event',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <div><Text type="secondary">{record.host?.email || 'Unknown host'}</Text></div>
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Live Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={value === 'CANCELLED' ? 'red' : 'blue'}>{value || 'ACTIVE'}</Tag>,
    },
    approvalColumn,
    { title: 'Action', key: 'action', render: (_, record) => renderApprovalActions('events', record) },
  ];

  if (!admin?.id) {
    return null;
  }

  return (
    <div className="admin-dashboard-page">
      {contextHolder}
      <div className="admin-dashboard-shell">
        <Card className="admin-hero-card" bordered={false}>
          <div className="admin-hero-layout">
            <div>
              <Text className="admin-eyebrow">Admin control center</Text>
              <Title level={2}>Approve hosts and events, and moderate platform users from one page.</Title>
              <Paragraph>
                Regular users can join and book immediately. Host applications and host-created events still require admin review, and admins can also block users later if they misuse the platform.
              </Paragraph>
            </div>
            <div className="admin-hero-badges">
              <div className="admin-hero-chip">
                <SafetyCertificateOutlined />
                <span>Host approvals</span>
              </div>
              <div className="admin-hero-chip">
                <CalendarOutlined />
                <span>Event approvals</span>
              </div>
              <div className="admin-hero-chip">
                <UserSwitchOutlined />
                <span>User moderation</span>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="admin-loading"><Spin size="large" /></div>
        ) : (
          <Space direction="vertical" size={24} className="admin-full-width">
            <Row gutter={[18, 18]}>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Total Users" value={dashboard.stats.totalUsers || 0} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Pending Users" value={dashboard.stats.pendingUsers || 0} prefix={<AuditOutlined />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Total Hosts" value={dashboard.stats.totalHosts || 0} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Pending Hosts" value={dashboard.stats.pendingHosts || 0} prefix={<AuditOutlined />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Total Events" value={dashboard.stats.totalEvents || 0} prefix={<CalendarOutlined />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Card className="admin-stat-card" bordered={false}>
                  <Statistic title="Pending Events" value={dashboard.stats.pendingEvents || 0} prefix={<AuditOutlined />} />
                </Card>
              </Col>
            </Row>

            <Alert
              type="info"
              showIcon
              message="Approval workflow"
              description="Users are active immediately by default. Hosts and new or edited host-created events require admin approval, and admins can still reject users later if moderation is needed."
            />

            <Card className="admin-section-card" bordered={false} title="User controls">
              <Table rowKey="id" columns={userColumns} dataSource={dashboard.users} pagination={{ pageSize: 6 }} scroll={{ x: 900 }} />
            </Card>

            <Card className="admin-section-card" bordered={false} title="Host approvals">
              <Table rowKey="id" columns={hostColumns} dataSource={dashboard.hosts} pagination={{ pageSize: 6 }} scroll={{ x: 900 }} />
            </Card>

            <Card className="admin-section-card" bordered={false} title="Event approvals">
              <Table rowKey="id" columns={eventColumns} dataSource={dashboard.events} pagination={{ pageSize: 6 }} scroll={{ x: 1000 }} />
            </Card>
          </Space>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
