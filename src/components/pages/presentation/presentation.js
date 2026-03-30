import React, { useEffect, useState } from "react";
import "./Presentation.css";
import { useNavigate } from "react-router-dom";

export default function Presentation() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
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
  }, []);

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
    </div>
  );
}