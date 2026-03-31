import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Image,
  InputNumber,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './EventDetails.css';

const { Title, Paragraph, Text } = Typography;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount || 0);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'TBA';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (parseError) {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`http://localhost:8080/api/events/${id}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }

        const data = await response.json();
        setEvent(data);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const availableTickets = event?.ticketQuantity || 0;
  const totalPrice = (event?.ticketPrice || 0) * quantity;

  const handleBooking = async () => {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', `/event/${id}`);
      navigate('/login', { state: { redirectTo: `/event/${id}` } });
      return;
    }

    try {
      setBooking(true);

      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Number(id),
          userId: user.id,
          quantity,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload === 'string'
            ? payload
            : payload?.message || 'Booking could not be completed'
        );
      }

      messageApi.success('Booking confirmed');
      navigate(`/booking-confirmation?bookingId=${payload.bookingId}`, {
        state: { booking: payload },
      });
    } catch (bookingError) {
      messageApi.error(bookingError.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details-page">
        {contextHolder}
        <Card className="event-details-shell">
          <Skeleton.Image active className="event-details-skeleton-image" />
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-page">
        {contextHolder}
        <Card className="event-details-shell">
          <Empty
            description={error || 'This event is unavailable right now.'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary">
              <Link to="/">Back to events</Link>
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="event-details-page">
      {contextHolder}
      <div className="event-details-shell">
        <Breadcrumb
          className="event-details-breadcrumb"
          items={[
            { title: <Link to="/">Events</Link> },
            { title: event.title },
          ]}
        />

        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={15}>
            <Card className="event-hero-card" bordered={false}>
              <Image
                className="event-hero-image"
                src={
                  event.imageUrl ||
                  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
                }
                alt={event.title}
                preview={false}
              />
              <div className="event-hero-content">
                <Space size={[8, 8]} wrap>
                  <Tag color="gold">{event.category || 'Featured event'}</Tag>
                  <Tag color={availableTickets > 0 ? 'green' : 'red'}>
                    {availableTickets > 0 ? 'Tickets available' : 'Sold out'}
                  </Tag>
                </Space>

                <Title level={1} className="event-title">
                  {event.title}
                </Title>

                <Paragraph className="event-description-copy">
                  {event.description || 'More event details will be shared soon.'}
                </Paragraph>

                <Row gutter={[16, 16]} className="event-stats-row">
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Event date"
                        prefix={<CalendarOutlined />}
                        value={formatDate(event.date)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Location"
                        prefix={<EnvironmentOutlined />}
                        value={event.location || 'Venue to be announced'}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Ticket price"
                        prefix={<TagOutlined />}
                        value={formatCurrency(event.ticketPrice)}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card className="booking-panel-card" bordered={false}>
              <Space direction="vertical" size={18} className="full-width">
                <div>
                  <Text className="booking-panel-label">Reserve your place</Text>
                  <Title level={3} className="booking-panel-title">
                    Booking summary
                  </Title>
                </div>

                {!user && (
                  <Alert
                    type="info"
                    showIcon
                    message="Sign in before checkout"
                    description="We'll keep your place in the flow and return you here after login."
                  />
                )}

                <Card className="booking-summary-box" bordered={false}>
                  <Space direction="vertical" size={12} className="full-width">
                    <div className="summary-row">
                      <Text>Price per ticket</Text>
                      <Text strong>{formatCurrency(event.ticketPrice)}</Text>
                    </div>
                    <div className="summary-row booking-quantity-row">
                      <Text>Tickets</Text>
                      <InputNumber
                        min={1}
                        max={Math.max(1, availableTickets)}
                        value={quantity}
                        onChange={(value) => setQuantity(value || 1)}
                        disabled={availableTickets === 0}
                      />
                    </div>
                    <div className="summary-row">
                      <Text>Availability</Text>
                      <Text strong>{availableTickets} remaining</Text>
                    </div>
                    <Divider className="booking-divider" />
                    <div className="summary-row total-row">
                      <Text strong>Total</Text>
                      <Title level={3} className="booking-total">
                        {formatCurrency(totalPrice)}
                      </Title>
                    </div>
                  </Space>
                </Card>

                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleBooking}
                  loading={booking}
                  disabled={availableTickets === 0}
                  className="booking-action-button"
                  block
                >
                  {user ? 'Confirm booking' : 'Sign in to book'}
                </Button>

                <Text type="secondary" className="booking-trust-copy">
                  Secure checkout flow, server-side price validation, and instant booking confirmation.
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default EventDetails;
