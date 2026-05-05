import React, { useEffect, useRef, useState } from 'react';
import './Presentation.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { FcGoogle } from 'react-icons/fc';
import { Rate } from 'antd';
import { gsap } from 'gsap';

const SEARCH_HISTORY_KEY = 'ems_recent_searches';
const VIEWED_CATEGORY_KEY = 'ems_viewed_event_categories';

const averageRating = (items) => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
};

const formatDate = (date) => {
  if (!date) {
    return 'Date to be announced';
  }

  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const readLocalArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
};

const writeLocalArray = (key, values) => {
  localStorage.setItem(key, JSON.stringify(values));
};

export default function Presentation() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [viewedCategories, setViewedCategories] = useState([]);

  useEffect(() => {
    setRecentSearches(readLocalArray(SEARCH_HISTORY_KEY));
    setViewedCategories(readLocalArray(VIEWED_CATEGORY_KEY));
  }, []);

  useEffect(() => {
    fetch('http://localhost:8080/api/events/all')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
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
    fetch('http://localhost:8080/api/reviews/public')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Reviews response was not ok');
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

  useEffect(() => {
    const normalizedTerm = normalize(searchTerm);
    if (!normalizedTerm || normalizedTerm.length < 2) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const nextSearches = [
        normalizedTerm,
        ...recentSearches.filter((item) => item !== normalizedTerm),
      ].slice(0, 6);

      if (JSON.stringify(nextSearches) === JSON.stringify(recentSearches)) {
        return;
      }

      setRecentSearches(nextSearches);
      writeLocalArray(SEARCH_HISTORY_KEY, nextSearches);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, recentSearches]);

  const categorySuggestions = [...new Set(events.map((event) => event.category).filter(Boolean))].slice(0, 6);
  const publicAverage = averageRating(reviews);
  const normalizedSearch = normalize(searchTerm);
  const filteredEvents = events.filter((event) => {
    if (!normalizedSearch) {
      return true;
    }

    const searchableText = normalize([
      event.title,
      event.category,
      event.location,
      event.description,
      event.date,
    ].join(' '));

    return searchableText.includes(normalizedSearch);
  });

  const recommendationSignals = [
    ...recentSearches,
    ...viewedCategories,
    ...normalizedSearch.split(' ').filter(Boolean),
  ];

  const recommendedEvents = [...events]
    .map((event) => {
      const haystack = normalize([
        event.title,
        event.category,
        event.location,
        event.description,
      ].join(' '));
      const normalizedCategory = normalize(event.category);
      let score = 0;

      recommendationSignals.forEach((signal) => {
        if (!signal) {
          return;
        }

        if (normalizedCategory && normalizedCategory === signal) {
          score += 5;
        } else if (normalizedCategory && normalizedCategory.includes(signal)) {
          score += 3;
        }

        if (haystack.includes(signal)) {
          score += 2;
        }
      });

      if (event.category && viewedCategories.includes(normalize(event.category))) {
        score += 2;
      }

      return { event, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(left.event.date || 0) - new Date(right.event.date || 0);
    })
    .filter((item, index) => item.score > 0 || index < 3)
    .slice(0, 4)
    .map((item) => item.event);

  useEffect(() => {
    if (loading || !pageRef.current) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.set(['.hero-animate', '.search-animate', '.recommendation-animate'], {
        opacity: 0,
        y: 26,
      });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.hero-animate', {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
        })
        .to('.search-animate', {
          opacity: 1,
          y: 0,
          duration: 0.75,
        }, '-=0.35')
        .to('.recommendation-animate', {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
        }, '-=0.3');
    }, pageRef);

    return () => context.revert();
  }, [loading, recommendedEvents.length]);

  useEffect(() => {
    if (!pageRef.current) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        '.results-animate',
        { opacity: 0, y: 20, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }, pageRef);

    return () => context.revert();
  }, [filteredEvents.length, normalizedSearch]);

  const openEvent = (event) => {
    const normalizedCategory = normalize(event.category);
    const nextCategories = normalizedCategory
      ? [normalizedCategory, ...viewedCategories.filter((item) => item !== normalizedCategory)].slice(0, 8)
      : viewedCategories;

    if (normalizedCategory) {
      setViewedCategories(nextCategories);
      writeLocalArray(VIEWED_CATEGORY_KEY, nextCategories);
    }

    navigate(`/event/${event.id}`);
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error loading events: {error}</p>;

  return (
    <div className="presentation" ref={pageRef}>
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-animate">Discover & Join Exciting Events</h1>
          <p className="hero-animate">Connect, explore, and experience the best events near you.</p>

          <div className="hero-search-panel search-animate">
            <div className="search-shell">
              <div className="search-shell-border" />
              <div className="search-input-wrap">
                <SearchOutlined className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by event name, category, location, or vibe"
                  aria-label="Search events"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="search-meta-row">
              <span>{filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} found</span>
              {recentSearches.length > 0 && (
                <span>Built from your recent searches and viewed interests</span>
              )}
            </div>

            <div className="interest-chip-row">
              {recentSearches.map((term) => (
                <button
                  type="button"
                  key={term}
                  className="interest-chip recent-chip"
                  onClick={() => setSearchTerm(term)}
                >
                  Recent: {term}
                </button>
              ))}
              {categorySuggestions.map((category) => (
                <button
                  type="button"
                  key={category}
                  className="interest-chip"
                  onClick={() => setSearchTerm(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="recommendation-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">Picked for the customer</span>
            <h2>Recommended for you</h2>
            <p>
              These suggestions adapt to what the customer searches for and the kinds of events they open most often.
            </p>
          </div>
          <div className="recommendation-badge">
            <ThunderboltOutlined />
            <span>Smart demo recommendations</span>
          </div>
        </div>

        <div className="recommendation-grid">
          {recommendedEvents.map((event) => (
            <div className="recommended-card recommendation-animate" key={event.id}>
              <div className="recommended-card-image">
                <img src={event.imageUrl} alt={event.title} loading="lazy" />
              </div>
              <div className="recommended-card-content">
                <span className="recommended-category">{event.category || 'Featured event'}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="recommended-meta">
                  <span>{formatDate(event.date)}</span>
                  <span><EnvironmentOutlined /> {event.location || 'Location to be announced'}</span>
                </div>
                <button onClick={() => openEvent(event)}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="events-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">Browse events</span>
            <h2>{normalizedSearch ? `Search results for "${searchTerm}"` : 'Explore all upcoming events'}</h2>
            <p>
              Customers can quickly narrow down events by type, location, or keywords with the live search above.
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-search-state">
            <h3>No events matched this search</h3>
            <p>Try another keyword like a category, suburb, artist, or event style.</p>
          </div>
        ) : (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <div className="event-card results-animate" key={event.id}>
                <img src={event.imageUrl} alt={event.title} loading="lazy" />
                <div className="event-content">
                  <span className="event-category-pill">{event.category || 'Featured'}</span>
                  <h3>{event.title}</h3>
                  <p className="date">{formatDate(event.date)}</p>
                  <p className="event-location"><EnvironmentOutlined /> {event.location || 'Location to be announced'}</p>
                  <p>{event.description}</p>
                  <button onClick={() => openEvent(event)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
              <strong>{publicAverage ? publicAverage.toFixed(1) : '0.0'}</strong>
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
