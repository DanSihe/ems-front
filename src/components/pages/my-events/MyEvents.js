import React, { useEffect, useState } from "react";
import axios from "axios";

const MyEvents = () => {
  const [bookings, setBookings] = useState([]);

  const email = localStorage.getItem("email");

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/events/my-events`,
        {
          params: { email }
        }
      );

      console.log(response.data);

      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setBookings([]);
    }
  };

  const cancelEvent = async (id) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/events/${id}`
      );

      alert("Event canceled");

      fetchMyEvents();
    } catch (error) {
      console.error(error);
      alert("Cannot cancel event");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Booked Events</h2>

      {bookings.length === 0 ? (
        <p>No events booked yet.</p>
      ) : (
        bookings.map((event) => (
          <div
            key={event.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px"
            }}
          >
            <h3>{event.title}</h3>

            <p>
              <strong>Date:</strong> {event.date}
            </p>

            <p>
              <strong>Location:</strong> {event.location}
            </p>

            <button
              onClick={() => cancelEvent(event.id)}
              style={{
                backgroundColor: "red",
                color: "white",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Cancel Event
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default MyEvents;