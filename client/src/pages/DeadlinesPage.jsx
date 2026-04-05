import { useState, useEffect } from 'react';
import Header from '../components/Header';

function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/deadlines');

        if (!response.ok) {
          throw new Error(`Failed to fetch deadlines: ${response.statusText}`);
        }

        const data = await response.json();
        setDeadlines(data);
      } catch (err) {
        console.error('Error fetching deadlines:', err);
        setError(err.message || 'Failed to load deadlines');
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',  // Yellow
      'completed': '#10b981', // Green
      'missed': '#ef4444'     // Red
    };
    return colors[status] || '#94a3b8';
  };

  const formatDeadline = (deadlineString) => {
    const date = new Date(deadlineString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Header />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, width: "100%", marginBottom: 32 }}>
          <h1 style={{ marginBottom: 24, fontSize: "2rem" }}>
            Deadlines
          </h1>

          {loading && (
            <div className="deadlines-page-section">
              <div className="loading-state">
                <p>Loading deadlines...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="deadlines-page-section">
              <div className="error-state">
                <p>Error: {error}</p>
              </div>
            </div>
          )}

          {!loading && !error && deadlines.length === 0 && (
            <div className="deadlines-page-section">
              <div className="empty-state">
                <p>No deadlines set. Add subjects with deadlines to track them here.</p>
              </div>
            </div>
          )}

          {!loading && !error && deadlines.length > 0 && (
            <div className="deadlines-page-section">
              <div className="deadlines-page-header">
                <p className="deadlines-page-subtitle">Track your assignment deadlines and time remaining</p>
              </div>
              <div className="deadlines-page-list">
                {deadlines.map((item, index) => (
                  <div key={index} className="deadline-page-item">
                    <div className="deadline-page-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <h3 className="deadline-page-subject">{item.subject}</h3>
                        {item.rescheduled && (
                          <span className="rescheduled-deadline-badge">Rescheduled in Study Plan</span>
                        )}
                      </div>
                      <div className="deadline-page-details">
                        <span className="deadline-page-date">
                          {formatDeadline(item.deadline)}
                        </span>
                        <span className="deadline-page-time-remaining">
                          {item.timeRemaining}
                        </span>
                      </div>
                    </div>
                    <div className="deadline-page-status">
                      <span
                        className="status-page-badge"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeadlinesPage;