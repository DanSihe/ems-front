import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarOutlined, EnvironmentOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import "./EventDetails.css";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("loggedIn") === "true");

  useEffect(() => {
    // Fetch individual event by id from backend
    fetch(`http://localhost:8080/api/events/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch event");
        return response.json();
      })
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Listen to login status changes
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem("loggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [id]);

  if (loading) return <p>Loading event details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!event) return <h2 className="not-found">Event not found</h2>;

  const handleAction = () => {
    if (isLoggedIn) {
      alert(`You have booked: ${event.title}`);
    } else {
      localStorage.setItem("redirectAfterLogin", `/event/${event.id}`);
      navigate("/login");
    }
  };

  return (
    <div className="event-details-body">
      {/* Left: Event Info */}
      <div className="event-left">
        <div className="event-overlay"></div>
        <h1>{event.title}</h1>
        <p className="event-date">📅 {event.date}</p>
        <p className="event-description">{event.description}</p>

        <ul className="event-highlights">
          <li>Interactive sessions</li>
          <li>Networking opportunities</li>
          <li>Exclusive content</li>
          <li>Expert speakers</li>
        </ul>
      </div>

      {/* Right: Booking Card */}
      <div className="event-right">
        <div className="booking-card">
          <img src={event.image} alt={event.title} className="booking-img" />
          <button className="action-btn" onClick={handleAction}>
            {isLoggedIn ? "Book Now" : "Sign in to Book"}
          </button>
          <p className="platform-info">Book securely through our platform</p>
        </div>
      </div>
    </div>
  );
}