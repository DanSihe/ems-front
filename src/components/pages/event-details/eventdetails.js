import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Rate,
  Radio,
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
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate, useParams } from 'react-router-dom';
import mockCards from '../../../data/mockCards.json';
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

const averageRating = (items) => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(mockCards[0]?.id || null);
  const [cardCvv, setCardCvv] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm] = Form.useForm();

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const response = await fetch(`http://localhost:8080/api/reviews/event/${id}`);
        if (!response.ok) {
          throw new Error('Unable to load reviews');
        }
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  const availableTickets = event?.ticketQuantity || 0;
  const totalPrice = (event?.ticketPrice || 0) * quantity;
  const eventAverageRating = averageRating(reviews);

  const submitBooking = async () => {
    const selectedCard = mockCards.find((card) => card.id === selectedCardId);

    if (!selectedCard) {
      messageApi.error('Select a dummy card to continue');
      return;
    }

    if (cardCvv.trim() !== selectedCard.cvv) {
      messageApi.error('CVV does not match the selected dummy card');
      return;
    }

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
      sessionStorage.setItem(
        `paymentCard_${payload.bookingId}`,
        `**** **** **** ${selectedCard.cardNumber.slice(-4)}`
      );
      navigate(`/booking-confirmation?bookingId=${payload.bookingId}`, {
        state: {
          booking: {
            ...payload,
            paymentCard: `**** **** **** ${selectedCard.cardNumber.slice(-4)}`,
          },
        },
      });
      setPaymentModalOpen(false);
      setCardCvv('');
    } catch (bookingError) {
      messageApi.error(bookingError.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleBooking = async () => {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', `/event/${id}`);
      navigate('/login', { state: { redirectTo: `/event/${id}` } });
      return;
    }

    setPaymentModalOpen(true);
  };

  const handleReviewSubmit = async (values) => {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', `/event/${id}`);
      navigate('/login', { state: { redirectTo: `/event/${id}` } });
      return;
    }

    try {
      setReviewSubmitting(true);
      const response = await fetch('http://localhost:8080/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Number(id),
          userId: user.id,
          rating: values.rating,
          comment: values.comment,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof payload === 'string' ? payload : 'Unable to submit review');
      }

      setReviews((current) => [payload, ...current]);
      reviewForm.resetFields();
      messageApi.success('Review added successfully');
    } catch (submitError) {
      messageApi.error(submitError.message || 'Review submission failed');
    } finally {
      setReviewSubmitting(false);
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
                  Dummy checkout for development only. Pick one sample card and enter its CVV to confirm.
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} className="review-section-row">
          <Col xs={24} lg={10}>
            <Card className="review-google-card" bordered={false}>
              <Space direction="vertical" size={12} className="full-width">
                <div className="google-review-head">
                  <Space>
                    <span className="google-icon-wrap"><FcGoogle size={26} /></span>
                    <Text className="google-review-label">Google reviews</Text>
                  </Space>
                  <Tag color="blue">{reviews.length} real reviews</Tag>
                </div>
                <div className="google-review-score">
                  <Title level={2}>{eventAverageRating ? eventAverageRating.toFixed(1) : '0.0'}</Title>
                  <Rate allowHalf disabled value={eventAverageRating} />
                </div>
                <Text type="secondary">
                  Public visitors can read these reviews. Logged-in users can leave a review, and hosts can reply from the dashboard.
                </Text>
              </Space>
            </Card>

            <Card className="review-form-card" bordered={false}>
              <Space direction="vertical" size={16} className="full-width">
                <div>
                  <Text className="booking-panel-label">Share feedback</Text>
                  <Title level={3} className="booking-panel-title">Leave a review</Title>
                </div>
                {!user && (
                  <Alert
                    type="info"
                    showIcon
                    message="Sign in to leave a review"
                    description="Everyone can read reviews here, but only logged-in users can post one."
                  />
                )}
                <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
                  <Form.Item
                    name="rating"
                    label="Your rating"
                    rules={[{ required: true, message: 'Select a rating' }]}
                  >
                    <Rate />
                  </Form.Item>
                  <Form.Item
                    name="comment"
                    label="Your review"
                    rules={[{ required: true, message: 'Write a review comment' }]}
                  >
                    <Input.TextArea
                      rows={5}
                      placeholder="Tell others what stood out about this event."
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={reviewSubmitting} block>
                    Submit review
                  </Button>
                </Form>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card className="review-list-card" bordered={false}>
              <Space direction="vertical" size={18} className="full-width">
                <div className="review-list-header">
                  <Title level={3}>Guest reviews</Title>
                  <Tag color="gold">{reviews.length} reviews</Tag>
                </div>

                {reviewLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : reviews.length === 0 ? (
                  <Empty description="No reviews yet" />
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="single-review-card">
                      <Space direction="vertical" size={12} className="full-width">
                        <div className="review-meta-row">
                          <div>
                            <Text strong>{review.reviewerName}</Text>
                            <div>
                              <Text type="secondary">
                                {review.createdAt ? formatDate(review.createdAt) : 'Just now'}
                              </Text>
                            </div>
                          </div>
                          <Rate disabled value={review.rating} />
                        </div>
                        <Paragraph className="review-comment">{review.comment}</Paragraph>
                        {review.hostReply && (
                          <div className="host-reply-box">
                            <Text strong>Host reply</Text>
                            <Paragraph>{review.hostReply}</Paragraph>
                          </div>
                        )}
                      </Space>
                    </Card>
                  ))
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        open={paymentModalOpen}
        title="Mock card payment"
        onCancel={() => setPaymentModalOpen(false)}
        onOk={submitBooking}
        okText="Pay and book"
        confirmLoading={booking}
      >
        <Space direction="vertical" size={16} className="full-width">
          <Alert
            type="info"
            showIcon
            message="Development-only payment"
            description="Choose one of the 10 dummy cards from the JSON file and enter its CVV."
          />

          <Radio.Group
            className="mock-card-group"
            value={selectedCardId}
            onChange={(event) => setSelectedCardId(event.target.value)}
          >
            <Space direction="vertical" className="full-width">
              {mockCards.map((card) => (
                <Radio key={card.id} value={card.id} className="mock-card-option">
                  <div>
                    <Text strong>{card.holderName}</Text>
                    <div>
                      <Text type="secondary">
                        {`**** **** **** ${card.cardNumber.slice(-4)} | Exp ${card.expiry}`}
                      </Text>
                    </div>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          <div className="summary-row">
            <Text>Booking total</Text>
            <Text strong>{formatCurrency(totalPrice)}</Text>
          </div>

          <InputNumber
            min={100}
            max={999}
            value={cardCvv ? Number(cardCvv) : null}
            onChange={(value) => setCardCvv(value ? String(value) : '')}
            className="full-width"
            placeholder="Enter card CVV"
          />
        </Space>
      </Modal>
    </div>
  );
};

export default EventDetails;
