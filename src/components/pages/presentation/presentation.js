import React, { useEffect, useState } from "react";
import "./Presentation.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Rate } from "antd";

const averageRating = (items) => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
};

export default function Presentation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace this URL with your Spring Boot endpoint
    fetch("http://localhost:8080/api/events/all")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [location.key, location.state?.refreshAt]);

  useEffect(() => {
    fetch("http://localhost:8080/api/reviews/public")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Reviews response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setReviews([]);
      });
  }, [location.key, location.state?.refreshAt]);

  const publicAverage = averageRating(reviews);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error loading events: {error}</p>;

  return (
    <div className="presentation">
      <section className="hero">
        <h1>Discover & Join Exciting Events</h1>
        <p>Connect, explore, and experience the best events near you.</p>
      </section>

      <section className="event-grid">
        {events.map((event) => (
          <div className="event-card" key={event.id}>
            <img src={event.imageUrl} alt={event.title} loading="lazy" />
            <div className="event-content">
              <h3>{event.title}</h3>
              <p className="date">{event.date}</p>
              <p>{event.description}</p>
              <button onClick={() => navigate(`/event/${event.id}`)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="public-review-section">
        <div className="public-review-heading">
          <div>
            <span className="public-review-eyebrow">Community feedback</span>
            <h2>Public event reviews</h2>
            <p>Visitors can read real reviews here. Logged-in users can leave a review from each event page, and hosts can reply from the dashboard.</p>
          </div>

          <div className="public-google-bar">
            <div className="public-google-top">
              <div className="public-google-icon"><FcGoogle size={26} /></div>
              <span>Google-style rating</span>
            </div>
            <div className="public-google-score">
              <strong>{publicAverage ? publicAverage.toFixed(1) : "0.0"}</strong>
              <Rate allowHalf disabled value={publicAverage} />
            </div>
            <small>{reviews.length} submitted reviews</small>
          </div>
        </div>

        <div className="public-review-grid">
          {reviews.length === 0 ? (
            <div className="public-review-empty">
              <h3>No reviews yet</h3>
              <p>Once users start sharing their experiences, they will appear here for everyone to read.</p>
            </div>
          ) : (
            reviews.slice(0, 6).map((review) => (
              <div className="public-review-card" key={review.id}>
                <div className="public-review-card-top">
                  <div>
                    <h3>{review.reviewerName}</h3>
                    <span>{review.eventTitle}</span>
                  </div>
                  <Rate disabled value={review.rating} />
                </div>
                <p>{review.comment}</p>
                {review.hostReply && (
                  <div className="public-review-reply">
                    <strong>Host reply</strong>
                    <p>{review.hostReply}</p>
                  </div>
                )}
                <button onClick={() => navigate(`/event/${review.eventId}`)}>
                  View Event
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
