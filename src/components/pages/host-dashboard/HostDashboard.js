import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Rate,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  EditOutlined,
  FundOutlined,
  MenuOutlined,
  PlusOutlined,
  StopOutlined,
  TeamOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './HostDashboard.css';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      year: 'numeric',
      })
    : 'TBA';

const averageRating = (items) => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
};

const HostDashboard = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState({ stats: {}, events: [], bookings: [] });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [eventForm] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [replyForm] = Form.useForm();

  const host = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('host'));
    } catch (error) {
      return null;
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!host?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/host-dashboard/${host.id}`);
      if (!response.ok) {
        throw new Error('Unable to load host dashboard');
      }
      const data = await response.json();
      setDashboard({
        stats: data.stats || {},
        events: data.events || [],
        bookings: data.bookings || [],
      });
    } catch (error) {
      messageApi.error(error.message || 'Dashboard load failed');
    } finally {
      setLoading(false);
    }
  }, [host?.id, messageApi]);

  const fetchReviews = useCallback(async () => {
    if (!host?.id) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/reviews/host/${host.id}`);
      if (!response.ok) {
        throw new Error('Unable to load reviews');
      }

      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      setReviews([]);
    }
  }, [host?.id]);

  useEffect(() => {
    if (!host?.id) {
      navigate('/host-login');
      return;
    }

    fetchDashboard();
    fetchReviews();
  }, [fetchDashboard, fetchReviews, host?.id, navigate]);

  const openCreateModal = () => {
    setEditingEvent(null);
    eventForm.resetFields();
    eventForm.setFieldsValue({
      category: host?.eventCategory || undefined,
      status: 'ACTIVE',
      ticketQuantity: 50,
      ticketPrice: 0,
    });
    setEventModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    eventForm.setFieldsValue({
      ...event,
      date: event.date ? dayjs(event.date) : null,
    });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        host: {
          email: host.email,
        },
      };

      const endpoint = editingEvent
        ? `http://localhost:8080/api/host-dashboard/events/${editingEvent.id}`
        : 'http://localhost:8080/api/events/create';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to save event');
      }

      messageApi.success(editingEvent ? 'Event updated and sent for admin review' : 'Event created and sent for admin review');
      setEventModalOpen(false);
      eventForm.resetFields();
      fetchDashboard();
      fetchReviews();
    } catch (error) {
      messageApi.error(error.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEvent = async (values) => {
    if (!selectedEvent) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `http://localhost:8080/api/host-dashboard/events/${selectedEvent.id}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to cancel event');
      }

      messageApi.success('Event cancelled and refund workflow started');
      setCancelModalOpen(false);
      cancelForm.resetFields();
      setSelectedEvent(null);
      fetchDashboard();
      fetchReviews();
    } catch (error) {
      messageApi.error(error.message || 'Cancellation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefundUpdate = async (bookingId, refundAmount) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/host-dashboard/bookings/${bookingId}/refund`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refundStatus: 'REFUNDED',
            refundAmount,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to mark refund as completed');
      }

      messageApi.success('Refund completed and customer email sent');
      fetchDashboard();
    } catch (error) {
      messageApi.error(error.message || 'Refund update failed');
    }
  };

  const handleReplySubmit = async (values) => {
    if (!selectedReview) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `http://localhost:8080/api/reviews/${selectedReview.id}/reply`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostReply: values.hostReply,
          }),
        }
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof payload === 'string' ? payload : 'Unable to save reply');
      }

      setReviews((current) =>
        current.map((review) => (review.id === payload.id ? payload : review))
      );
      setReplyModalOpen(false);
      setSelectedReview(null);
      replyForm.resetFields();
      messageApi.success('Reply saved');
    } catch (error) {
      messageApi.error(error.message || 'Reply failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRefunds = dashboard.bookings.filter(
    (booking) => booking.refundStatus === 'PENDING'
  );
  const reviewAverage = averageRating(reviews);

  const recentBookings = [...dashboard.bookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const menuItems = [
    { key: 'overview', icon: <AppstoreOutlined />, label: 'Overview' },
    { key: 'events', icon: <CalendarOutlined />, label: 'Events' },
    { key: 'bookings', icon: <TeamOutlined />, label: 'Bookings' },
    { key: 'refunds', icon: <CreditCardOutlined />, label: 'Refunds' },
    { key: 'reviews', icon: <MessageOutlined />, label: 'Reviews' },
  ];

  const statsCards = [
    {
      key: 'activeEvents',
      title: 'Active events',
      value: dashboard.stats.activeEvents || 0,
      icon: <CalendarOutlined />,
    },
    {
      key: 'bookings',
      title: 'Bookings',
      value: dashboard.stats.totalBookings || 0,
      icon: <TeamOutlined />,
    },
    {
      key: 'revenue',
      title: 'Revenue',
      value: dashboard.stats.revenue || 0,
      formatter: (value) => formatCurrency(value),
      icon: <DollarOutlined />,
    },
    {
      key: 'seats',
      title: 'Available seats',
      value: dashboard.stats.availableSeats || 0,
      icon: <FundOutlined />,
    },
    {
      key: 'reviews',
      title: 'Reviews',
      value: reviews.length,
      icon: <MessageOutlined />,
    },
  ];

  const eventsColumns = [
    {
      title: 'Event',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <div>
            <Text type="secondary">{record.category || 'General'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (value) => formatDate(value),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      responsive: ['lg'],
    },
    {
      title: 'Seats',
      key: 'ticketQuantity',
      render: (_, record) => `${record.ticketQuantity || 0} available`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={value === 'CANCELLED' ? 'red' : 'green'}>
          {value || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Approval',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (value) => (
        <Tag color={value === 'APPROVED' ? 'green' : value === 'REJECTED' ? 'red' : 'gold'}>
          {value || 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            disabled={record.status === 'CANCELLED'}
            onClick={() => {
              setSelectedEvent(record);
              cancelForm.setFieldsValue({ reason: `Host cancelled ${record.title}` });
              setCancelModalOpen(true);
            }}
          >
            Cancel
          </Button>
        </Space>
      ),
    },
  ];

  const bookingColumns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div>
          <Text strong>{`${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim() || 'Guest'}</Text>
          <div>
            <Text type="secondary">{record.user?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Event',
      key: 'event',
      render: (_, record) => record.event?.title,
    },
    {
      title: 'Tickets',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Amount',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space wrap>
          <Tag color={record.status === 'CONFIRMED' ? 'green' : record.status === 'REFUNDED' ? 'blue' : 'orange'}>
            {record.status}
          </Tag>
          <Tag color={record.refundStatus === 'PENDING' ? 'gold' : record.refundStatus === 'REFUNDED' ? 'cyan' : 'default'}>
            {record.refundStatus}
          </Tag>
        </Space>
      ),
    },
  ];

  const refundColumns = [
    ...bookingColumns,
    {
      title: 'Action',
      key: 'action',
      render: (_, record) =>
        record.refundStatus === 'PENDING' ? (
          <Button type="primary" onClick={() => handleRefundUpdate(record.id, record.refundAmount || record.totalPrice)}>
            Mark refunded
          </Button>
        ) : (
          <Badge status="success" text="Completed" />
        ),
    },
  ];

  const renderOverview = () => (
    <Space direction="vertical" size={24} className="dashboard-full-width">
      <Row gutter={[18, 18]}>
        {statsCards.map((card) => (
          <Col xs={24} sm={12} xl={6} key={card.key}>
            <Card className="metric-card" bordered={false}>
              <Statistic
                title={card.title}
                value={card.value}
                formatter={card.formatter}
                prefix={card.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={15}>
          <Card
            className="dashboard-section-card"
            bordered={false}
            title="Upcoming and managed events"
            extra={<Button onClick={openCreateModal} icon={<PlusOutlined />}>Create event</Button>}
          >
            <Table
              rowKey="id"
              columns={eventsColumns}
              dataSource={dashboard.events}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Space direction="vertical" size={18} className="dashboard-full-width">
            <Card className="dashboard-section-card" bordered={false} title="Refund queue">
              {pendingRefunds.length === 0 ? (
                <Alert type="success" showIcon message="No pending refunds right now" />
              ) : (
                pendingRefunds.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="queue-item">
                    <div>
                      <Text strong>{booking.event?.title}</Text>
                      <div><Text type="secondary">{booking.user?.email}</Text></div>
                    </div>
              <Button type="link" onClick={() => setActiveTab('refunds')}>
                      Manage
              </Button>
                  </div>
                ))
              )}
            </Card>

            <Card className="dashboard-section-card" bordered={false} title="Recent activity">
              {recentBookings.length === 0 ? (
                <Alert type="info" showIcon message="No booking activity yet" />
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="queue-item">
                    <div>
                      <Text strong>{booking.event?.title}</Text>
                      <div><Text type="secondary">{formatDate(booking.createdAt)}</Text></div>
                    </div>
                    <Tag>{booking.status}</Tag>
                  </div>
                ))
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );

  const renderEvents = () => (
    <Card
      className="dashboard-section-card"
      bordered={false}
      title="Create, update, and cancel events"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>New event</Button>}
    >
      <Table
        rowKey="id"
        columns={eventsColumns}
        dataSource={dashboard.events}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 960 }}
      />
    </Card>
  );

  const renderBookings = () => (
    <Card
      className="dashboard-section-card"
      bordered={false}
      title="Customer bookings and event flow"
      extra={<Tag color="blue">{dashboard.bookings.length} bookings tracked</Tag>}
    >
      <Table
        rowKey="id"
        columns={bookingColumns}
        dataSource={dashboard.bookings}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 960 }}
      />
    </Card>
  );

  const renderRefunds = () => (
    <Space direction="vertical" size={18} className="dashboard-full-width">
        <Alert
          type="info"
          showIcon
          message="User updates appear in My Events"
          description="Event cancellations and refund changes are shown to customers inside their booking view. No real email integration is used here."
        />
      <Card
        className="dashboard-section-card"
        bordered={false}
        title="Refund management"
        extra={<Tag color="gold">{pendingRefunds.length} pending</Tag>}
      >
        <Table
          rowKey="id"
          columns={refundColumns}
          dataSource={dashboard.bookings.filter((booking) => booking.refundStatus !== 'NOT_REQUIRED')}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </Space>
  );

  const reviewColumns = [
    {
      title: 'Event',
      key: 'eventTitle',
      render: (_, record) => (
        <div>
          <Text strong>{record.eventTitle}</Text>
          <div>
            <Text type="secondary">{record.reviewerName}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Rating',
      key: 'rating',
      render: (_, record) => <Rate disabled value={record.rating} />,
    },
    {
      title: 'Review',
      key: 'comment',
      render: (_, record) => (
        <div>
          <Text>{record.comment}</Text>
          {record.hostReply && (
            <div className="review-reply-preview">
              <Text type="secondary">Reply: {record.hostReply}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type={record.hostReply ? 'default' : 'primary'}
          onClick={() => {
            setSelectedReview(record);
            replyForm.setFieldsValue({ hostReply: record.hostReply || '' });
            setReplyModalOpen(true);
          }}
        >
          {record.hostReply ? 'Edit reply' : 'Reply'}
        </Button>
      ),
    },
  ];

  const renderReviews = () => (
    <Space direction="vertical" size={18} className="dashboard-full-width">
      <Card className="dashboard-section-card" bordered={false}>
        <div className="google-host-review-bar">
          <Space align="center">
            <div className="google-badge">G</div>
            <div>
              <Text strong>Public review score</Text>
              <div>
                <Text type="secondary">Based on real user reviews for your events</Text>
              </div>
            </div>
          </Space>
          <Space>
            <Title level={3} className="google-bar-score">
              {reviewAverage ? reviewAverage.toFixed(1) : '0.0'}
            </Title>
            <Rate allowHalf disabled value={reviewAverage} />
          </Space>
        </div>
      </Card>

      <Card
        className="dashboard-section-card"
        bordered={false}
        title="User reviews and host replies"
        extra={<Tag color="purple">{reviews.length} total</Tag>}
      >
        <Table
          rowKey="id"
          columns={reviewColumns}
          dataSource={reviews}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 960 }}
        />
      </Card>
    </Space>
  );

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'events':
        return renderEvents();
      case 'bookings':
        return renderBookings();
      case 'refunds':
        return renderRefunds();
      case 'reviews':
        return renderReviews();
      default:
        return renderOverview();
    }
  };

  if (!host?.id) {
    return null;
  }

  return (
    <div className="host-dashboard-page">
      {contextHolder}
      <Layout className="host-dashboard-layout">
        <Sider
          width={280}
          breakpoint="lg"
          collapsedWidth="0"
          className="host-dashboard-sider"
        >
          <div className="sider-brand">
            <Text className="sider-eyebrow">Host workspace</Text>
            <Title level={3}>Control center</Title>
            <Paragraph>
              Create events, monitor bookings, and manage cancellations and refunds from one place.
            </Paragraph>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key)}
            className="host-dashboard-menu"
          />
        </Sider>

        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          className="host-dashboard-drawer"
          title="Host workspace"
        >
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => {
              setActiveTab(key);
              setDrawerOpen(false);
            }}
          />
        </Drawer>

        <Layout className="host-dashboard-main">
          <Header className="host-dashboard-topbar">
            <div>
              <Button
                icon={<MenuOutlined />}
                className="dashboard-mobile-trigger"
                onClick={() => setDrawerOpen(true)}
              />
              <Text className="dashboard-welcome">Welcome back, {host.firstName}</Text>
              <Title level={2}>Modern host dashboard</Title>
            </div>
            <Space wrap>
              <Tag color="processing">Dummy payments and in-app updates</Tag>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Create event
              </Button>
            </Space>
          </Header>

          <Content className="host-dashboard-content">
            {loading ? (
              <div className="dashboard-loading">
                <Spin size="large" />
              </div>
            ) : (
              renderActivePanel()
            )}
          </Content>
        </Layout>
      </Layout>

      <Modal
        open={eventModalOpen}
        title={editingEvent ? 'Update event' : 'Create a new event'}
        onCancel={() => setEventModalOpen(false)}
        onOk={() => eventForm.submit()}
        okText={editingEvent ? 'Save changes' : 'Create event'}
        confirmLoading={submitting}
        width={820}
      >
        <Form form={eventForm} layout="vertical" onFinish={handleSaveEvent}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="title" label="Event title" rules={[{ required: true, message: 'Enter event title' }]}>
                <Input placeholder="Future of Events Summit" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Choose category' }]}>
                <Select
                  options={[
                    { value: 'music', label: 'Music' },
                    { value: 'business', label: 'Business' },
                    { value: 'educational', label: 'Educational' },
                    { value: 'sports', label: 'Sports' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="date" label="Event date" rules={[{ required: true, message: 'Select a date' }]}>
                <DatePicker className="dashboard-full-width" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Enter location' }]}>
                <Input placeholder="Sydney Convention Centre" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ticketQuantity" label="Available seats" rules={[{ required: true, message: 'Enter capacity' }]}>
                <InputNumber min={1} className="dashboard-full-width" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ticketPrice" label="Ticket price" rules={[{ required: true, message: 'Enter price' }]}>
                <InputNumber min={0} className="dashboard-full-width" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="imageUrl" label="Banner image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Add event description' }]}>
                <TextArea rows={4} placeholder="Tell attendees what makes this event worth joining." />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="status" label="Event status" rules={[{ required: true, message: 'Choose status' }]}>
                <Select
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'DRAFT', label: 'Draft' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={cancelModalOpen}
        title="Cancel event and start refunds"
        onCancel={() => setCancelModalOpen(false)}
        onOk={() => cancelForm.submit()}
        okText="Cancel event"
        okButtonProps={{ danger: true }}
        confirmLoading={submitting}
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelEvent}>
          <Alert
            type="warning"
            showIcon
            message="Customers will move into refund processing"
            description="Confirmed bookings will be marked cancelled, refunds will be set to pending, and a cancellation/refund email will be triggered."
            className="dashboard-modal-alert"
          />
          <Form.Item
            name="reason"
            label="Cancellation reason"
            rules={[{ required: true, message: 'Add a reason for cancellation' }]}
          >
            <TextArea rows={4} placeholder="Venue issue, host request, weather disruption..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={replyModalOpen}
        title="Reply to review"
        onCancel={() => {
          setReplyModalOpen(false);
          setSelectedReview(null);
        }}
        onOk={() => replyForm.submit()}
        okText="Save reply"
        confirmLoading={submitting}
      >
        <Form form={replyForm} layout="vertical" onFinish={handleReplySubmit}>
          <Form.Item label="Reviewer">
            <Text>{selectedReview?.reviewerName || '-'}</Text>
          </Form.Item>
          <Form.Item label="Review">
            <Text>{selectedReview?.comment || '-'}</Text>
          </Form.Item>
          <Form.Item
            name="hostReply"
            label="Your reply"
            rules={[{ required: true, message: 'Write a reply for the user' }]}
          >
            <TextArea rows={4} placeholder="Thank the user and respond professionally." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HostDashboard;
