import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  MailOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './BookingConfirmation.css';

const { Title, Text } = Typography;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount || 0);

const formatDate = (value, options) => {
  if (!value) {
    return 'TBA';
  }

  return new Date(value).toLocaleString('en-AU', options);
};

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bookingId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('bookingId');
  }, [location.search]);

  useEffect(() => {
    if (booking || !bookingId) {
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof payload === 'string'
              ? payload
              : payload?.message || 'Booking details are unavailable'
          );
        }

        setBooking(payload);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load booking confirmation');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [booking, bookingId]);

  const paymentCard =
    booking?.paymentCard || (bookingId ? sessionStorage.getItem(`paymentCard_${bookingId}`) : '');

  if (loading) {
    return (
      <div className="booking-confirmation-page">
        <Card className="booking-confirmation-shell">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="booking-confirmation-page">
        <Card className="booking-confirmation-shell">
          <Alert
            type="error"
            showIcon
            message="Booking confirmation unavailable"
            description={error || 'We could not find that booking.'}
            action={
              <Button type="primary" onClick={() => navigate('/')}>
                Browse events
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-page">
      <div className="booking-confirmation-shell">
        <Result
          status="success"
          icon={<CheckCircleFilled />}
          title="Booking confirmed"
          subTitle={`Your reservation for ${booking.eventTitle} is locked in and ready.`}
          extra={[
            <Button key="events" type="primary">
              <Link to="/">Explore more events</Link>
            </Button>,
            <Button key="my-events">
              <Link to="/my-events">View my events</Link>
            </Button>,
          ]}
          className="confirmation-result"
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} xl={15}>
            <Card className="confirmation-main-card" bordered={false}>
              <Space direction="vertical" size={20} className="full-width">
                <div className="confirmation-header">
                  <Tag color="green">{booking.status}</Tag>
                  <Title level={2} className="confirmation-title">
                    {booking.eventTitle}
                  </Title>
                  <Text type="secondary">
                    Booking reference #{booking.bookingId}
                  </Text>
                </div>

                <Descriptions
                  column={1}
                  labelStyle={{ fontWeight: 600 }}
                  className="confirmation-descriptions"
                >
                  <Descriptions.Item label="Event date">
                    <Space>
                      <CalendarOutlined />
                      {formatDate(booking.eventDate, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Venue">
                    <Space>
                      <EnvironmentOutlined />
                      {booking.location}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Booked for">
                    {`${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account email">
                    <Space>
                      <MailOutlined />
                      {booking.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment method">
                    {paymentCard || 'Dummy card used during booking'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Seats">
                    {booking.selectedSeats?.length ? booking.selectedSeats.join(', ') : 'Auto-assigned'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Booked at">
                    {formatDate(booking.bookedAt, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Space direction="vertical" size={24} className="full-width">
              <Card className="confirmation-side-card" bordered={false}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} xl={24}>
                    <Statistic
                      title="Tickets booked"
                      value={booking.quantity}
                      prefix={<NumberOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={24}>
                    <Statistic
                      title="Total paid"
                      value={booking.totalPrice}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                </Row>
              </Card>

              <Card className="confirmation-side-card" bordered={false}>
                <Space direction="vertical" size={12} className="full-width">
                  <Text strong>Order breakdown</Text>
                  <div className="confirmation-row">
                    <Text>Ticket price</Text>
                    <Text>{formatCurrency(booking.ticketPrice)}</Text>
                  </div>
                  <div className="confirmation-row">
                    <Text>Quantity</Text>
                    <Text>{booking.quantity}</Text>
                  </div>
                  <div className="confirmation-row">
                    <Text>Remaining tickets</Text>
                    <Text>{booking.remainingTickets}</Text>
                  </div>
                  <div className="confirmation-row confirmation-total-row">
                    <Text strong>Total charged</Text>
                    <Text strong>{formatCurrency(booking.totalPrice)}</Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default BookingConfirmation;
