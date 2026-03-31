import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './myEvents.css';

const { Title, Text } = Typography;

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
        month: 'long',
        year: 'numeric',
      })
    : 'TBA';

const MyEvents = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (parseError) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadBookings = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.get(
          `http://localhost:8080/api/bookings/user/${user.id}`
        );

        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch (fetchError) {
        setError('Unable to load your bookings right now.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user?.id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `http://localhost:8080/api/bookings/user/${user.id}`
      );

      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (fetchError) {
      setError('Unable to load your bookings right now.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await axios.delete(`http://localhost:8080/api/bookings/${bookingId}`);
      messageApi.success('Booking cancelled successfully');
      fetchBookings();
    } catch (cancelError) {
      messageApi.error('Unable to cancel this booking');
    }
  };

  if (!user?.id) {
    return (
      <div className="my-events-page">
        {contextHolder}
        <Card className="my-events-shell">
          <Alert
            type="info"
            showIcon
            message="Sign in to view your bookings"
            description="Your confirmed events and cancellation options will appear here after login."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="my-events-page">
      {contextHolder}
      <div className="my-events-shell">
        <div className="my-events-header">
          <Title level={2}>My booked events</Title>
          <Text type="secondary">
            Manage your upcoming reservations and keep track of your confirmed tickets.
          </Text>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Could not load bookings"
            description={error}
            className="my-events-alert"
          />
        )}

        {loading ? (
          <Row gutter={[20, 20]}>
            {[1, 2, 3].map((item) => (
              <Col xs={24} md={12} xl={8} key={item}>
                <Card className="my-booking-card">
                  <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : bookings.length === 0 ? (
          <Card className="my-events-empty">
            <Empty description="No bookings yet" />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {bookings.map((booking) => (
              <Col xs={24} md={12} xl={8} key={booking.id}>
                <Card
                  className="my-booking-card"
                  cover={
                    <img
                      src={
                        booking.event?.imageUrl ||
                        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={booking.event?.title || 'Event'}
                      className="my-booking-image"
                    />
                  }
                >
                  <Space direction="vertical" size={14} className="full-width">
                    <div className="my-booking-top">
                      <Tag color={booking.status === 'CONFIRMED' ? 'green' : booking.status === 'REFUNDED' ? 'blue' : 'orange'}>
                        {booking.status}
                      </Tag>
                      <Text type="secondary">Ref #{booking.id}</Text>
                    </div>

                    <div>
                      <Title level={4} className="my-booking-title">
                        {booking.event?.title}
                      </Title>
                      <Text type="secondary">{booking.event?.category || 'Event'}</Text>
                    </div>

                    <Space direction="vertical" size={8}>
                      <Text>
                        <CalendarOutlined /> {formatDate(booking.event?.date)}
                      </Text>
                      <Text>
                        <EnvironmentOutlined /> {booking.event?.location || 'Venue TBA'}
                      </Text>
                      <Text>Tickets: {booking.quantity}</Text>
                      <Text>Total: {formatCurrency(booking.totalPrice)}</Text>
                      {booking.refundStatus && booking.refundStatus !== 'NOT_REQUIRED' && (
                        <Text>Refund: {booking.refundStatus}</Text>
                      )}
                    </Space>

                    {booking.notificationMessage && (
                      <Alert
                        type="info"
                        showIcon
                        message="Latest update"
                        description={booking.notificationMessage}
                      />
                    )}

                    <Popconfirm
                      title="Cancel this booking?"
                      description="Tickets will be returned to event inventory."
                      okText="Yes, cancel"
                      cancelText="Keep booking"
                      onConfirm={() => cancelBooking(booking.id)}
                    >
                      <Button danger icon={<DeleteOutlined />} block disabled={booking.status !== 'CONFIRMED'}>
                        Cancel booking
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
