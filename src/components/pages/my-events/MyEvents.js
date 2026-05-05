import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  BellOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { gsap } from 'gsap';
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
  const pageRef = useRef(null);
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

  useEffect(() => {
    if (loading || !pageRef.current) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.set(['.my-events-animate', '.my-booking-animate', '.booking-update-animate'], {
        opacity: 0,
        y: 24,
      });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.my-events-animate', {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
        })
        .to('.my-booking-animate', {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
        }, '-=0.35')
        .to('.booking-update-animate', {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
        }, '-=0.35');
    }, pageRef);

    return () => context.revert();
  }, [loading, bookings.length]);

  useEffect(() => {
    if (!bookings.length) {
      return;
    }

    const cancellationUpdates = bookings.filter(
      (booking) =>
        booking.status === 'CANCELLED' &&
        booking.refundStatus === 'PENDING' &&
        booking.notificationMessage
    );

    if (!cancellationUpdates.length) {
      return;
    }

    const seenNotifications = new Set(
      JSON.parse(sessionStorage.getItem('seenBookingUpdates') || '[]')
    );

    const unseenUpdates = cancellationUpdates.filter(
      (booking) => !seenNotifications.has(String(booking.id))
    );

    if (!unseenUpdates.length) {
      return;
    }

    unseenUpdates.forEach((booking) => {
      messageApi.info({
        content: `${booking.event?.title || 'An event'} was cancelled. Please wait for your refund.`,
        duration: 5,
      });
      seenNotifications.add(String(booking.id));
    });

    sessionStorage.setItem('seenBookingUpdates', JSON.stringify([...seenNotifications]));
  }, [bookings, messageApi]);

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

  const activeUpdates = bookings.filter(
    (booking) =>
      booking.status === 'CANCELLED' &&
      booking.refundStatus === 'PENDING' &&
      booking.notificationMessage
  );

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
    <div className="my-events-page" ref={pageRef}>
      {contextHolder}
      <div className="my-events-shell">
        <div className="my-events-header my-events-animate">
          <Title level={2}>My booked events</Title>
          <Text type="secondary">
            Manage your upcoming reservations and keep track of your confirmed tickets.
          </Text>
        </div>

        <Card className="my-events-host-card my-events-animate">
          <div className="my-events-host-card-copy">
            <div>
              <Title level={4}>Want to become a host?</Title>
              <Text type="secondary">
                Regular users can browse and book immediately. If you want to create and manage events, apply for a host account and the admin will review it.
              </Text>
            </div>
            <Button type="primary" onClick={() => window.location.assign('/host-register')}>
              Become a Host
            </Button>
          </div>
        </Card>

        {activeUpdates.length > 0 && (
          <Card className="my-events-update-banner my-events-animate" bordered={false}>
            <div className="my-events-update-banner-copy">
              <div className="update-banner-icon">
                <BellOutlined />
              </div>
              <div>
                <Title level={5}>Booking updates available</Title>
                <Text>
                  {activeUpdates.length} cancelled event{activeUpdates.length > 1 ? 's have' : ' has'} refund processing in progress.
                </Text>
              </div>
            </div>
          </Card>
        )}

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
                  className="my-booking-card my-booking-animate"
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
                        type={booking.status === 'CANCELLED' ? 'warning' : 'info'}
                        showIcon
                        message={booking.status === 'CANCELLED' ? 'Event cancelled' : 'Latest update'}
                        description={booking.notificationMessage}
                        className="booking-update-animate"
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
