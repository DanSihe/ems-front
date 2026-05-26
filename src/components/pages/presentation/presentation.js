import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Presentation.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { FcGoogle } from 'react-icons/fc';
import { Rate } from 'antd';
import { gsap } from 'gsap';
import demoEvents from '../../../data/demoEvents';

const SEARCH_HISTORY_KEY = 'ems_recent_searches';
const VIEWED_CATEGORY_KEY = 'ems_viewed_event_categories';
const EVENTS_PER_PAGE = 10;

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

const getCurrentSearchProfile = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      return `user-${user.id}`;
    }
    if (user?.email) {
      return `user-${user.email}`;
    }
  } catch (error) {
    return 'guest';
  }

  return 'guest';
};

const scopedStorageKey = (baseKey) => `${baseKey}:${getCurrentSearchProfile()}`;

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
  const [currentPage, setCurrentPage] = useState(1);
  const searchHistoryKey = useMemo(() => scopedStorageKey(SEARCH_HISTORY_KEY), []);
  const viewedCategoryKey = useMemo(() => scopedStorageKey(VIEWED_CATEGORY_KEY), []);
  const selectedCategory = useMemo(
    () => new URLSearchParams(location.search).get('category') || '',
    [location.search]
  );
  const normalizedSelectedCategory = normalize(selectedCategory);

  useEffect(() => {
    setRecentSearches(readLocalArray(searchHistoryKey));
    setViewedCategories(readLocalArray(viewedCategoryKey));
  }, [searchHistoryKey, viewedCategoryKey]);

  useEffect(() => {
    setSearchTerm(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    fetch('http://localhost:8080/api/events/all')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setEvents(Array.isArray(data) && data.length ? data : demoEvents);
        setLoading(false);
      })
      .catch(() => {
        setEvents(demoEvents);
        setError(null);
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
      writeLocalArray(searchHistoryKey, nextSearches);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, recentSearches, searchHistoryKey]);

  const categorySuggestions = [...new Set(events.map((event) => event.category).filter(Boolean))].slice(0, 6);
  const publicAverage = averageRating(reviews);
  const normalizedSearch = normalize(searchTerm);
  const filteredEvents = events.filter((event) => {
    if (normalizedSelectedCategory && normalize(event.category) !== normalizedSelectedCategory) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    if (normalizedSelectedCategory && normalizedSearch === normalizedSelectedCategory) {
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
  const totalPages = Math.max(Math.ceil(filteredEvents.length / EVENTS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(pageStart, pageStart + EVENTS_PER_PAGE);
  const firstVisibleEvent = filteredEvents.length ? pageStart + 1 : 0;
  const lastVisibleEvent = Math.min(pageStart + EVENTS_PER_PAGE, filteredEvents.length);
  const paginationPages = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch, normalizedSelectedCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToEventPage = (pageNumber) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(nextPage);
    window.setTimeout(() => {
      pageRef.current?.querySelector('.events-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const recommendationSignals = [
    normalizedSelectedCategory,
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
      writeLocalArray(viewedCategoryKey, nextCategories);
    }

    navigate(`/event/${event.id}`, {
      state: {
        event,
      },
    });
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
                    onClick={() => {
                      setSearchTerm('');
                      if (selectedCategory) {
                        navigate('/');
                      }
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="search-meta-row">
              <span>
                {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} found
                {selectedCategory ? ` in ${selectedCategory}` : ''}
              </span>
              {recentSearches.length > 0 && (
                <span>Your private search history is visible only on this browser</span>
              )}
            </div>

            <div className="interest-chip-row">
              {selectedCategory && (
                <button
                  type="button"
                  className="interest-chip recent-chip"
                  onClick={() => navigate('/')}
                >
                  All categories
                </button>
              )}
              {recentSearches.map((term) => (
                <button
                  type="button"
                  key={term}
                  className="interest-chip recent-chip"
                  onClick={() => setSearchTerm(term)}
                >
                  Your search: {term}
                </button>
              ))}
              {categorySuggestions.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    normalize(category) === normalizedSelectedCategory
                      ? 'interest-chip active-interest-chip'
                      : 'interest-chip'
                  }
                  onClick={() => navigate(`/?category=${encodeURIComponent(category)}`)}
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
            <span className="section-eyebrow">Personal picks</span>
            <h2>Recommended for you</h2>
            <p>
              Suggestions use your private searches and the events opened on this device.
            </p>
          </div>
          <div className="recommendation-badge">
            <ThunderboltOutlined />
            <span>Private interests</span>
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
            <h2>
              {selectedCategory
                ? `${selectedCategory} events`
                : normalizedSearch
                ? `Search results for "${searchTerm}"`
                : 'Explore all upcoming events'}
            </h2>
            <p>
              {selectedCategory
                ? 'Browse this category or narrow it further by location, title, or keywords.'
                : 'Browse approved upcoming events across music, business, education, and sports.'}
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-search-state">
            <h3>No events matched this search</h3>
            <p>Try another keyword like a category, suburb, artist, or event style.</p>
          </div>
        ) : (
          <>
            <div className="events-toolbar">
              <span>
                Showing {firstVisibleEvent}-{lastVisibleEvent} of {filteredEvents.length}
              </span>
              <span>{EVENTS_PER_PAGE} events per page</span>
            </div>

            <div className="event-grid">
              {paginatedEvents.map((event) => (
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

            {totalPages > 1 && (
              <nav className="event-pagination" aria-label="Event pagination">
                <button
                  type="button"
                  onClick={() => goToEventPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                >
                  Previous
                </button>
                {paginationPages.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={pageNumber === safeCurrentPage ? 'active-page' : ''}
                    onClick={() => goToEventPage(pageNumber)}
                    aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToEventPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
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
