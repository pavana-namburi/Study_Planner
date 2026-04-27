import { useState, useEffect } from 'react';
import api from '../../services/api';

function Deadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get('/deadlines');
        setDeadlines(data);
      } catch (err) {
        console.error('Error fetching deadlines:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load deadlines');
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  const getStatusColor = (status) => {
    return status === 'pending' ? '#10b981' : '#ef4444';
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

  if (loading) {
    return (
      <div className="deadlines-section">
        <div className="deadlines-header">
          <h2>Upcoming Deadlines</h2>
        </div>
        <div className="loading-state">
          <p>Loading deadlines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deadlines-section">
        <div className="deadlines-header">
          <h2>Upcoming Deadlines</h2>
        </div>
        <div className="error-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="deadlines-section">
        <div className="deadlines-header">
          <h2>Upcoming Deadlines</h2>
        </div>
        <div className="empty-state">
          <p>No deadlines set. Add subjects with deadlines to track them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deadlines-section">
      <div className="deadlines-header">
        <h2>Upcoming Deadlines</h2>
        <p className="deadlines-subtitle">Track your assignment deadlines and time remaining</p>
      </div>
      <div className="deadlines-list">
        {deadlines.map((item, index) => (
          <div key={index} className="deadline-item">
            <div className="deadline-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <h3 className="deadline-subject">{item.subject}</h3>
                {item.rescheduled && (
                  <span className="rescheduled-deadline-badge">Rescheduled in Study Plan</span>
                )}
              </div>
              <div className="deadline-details">
                <span className="deadline-date">
                  {formatDeadline(item.deadline)}
                </span>
                <span className="deadline-time-remaining">
                  {item.timeRemaining}
                </span>
              </div>
            </div>
            <div className="deadline-status">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Deadlines;
