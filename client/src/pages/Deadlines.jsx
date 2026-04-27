import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Deadlines() {
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
    switch (status.toLowerCase()) {
      case 'pending':
        return '#fbbf24'; // Yellow
      case 'missed':
        return '#ef4444'; // Red
      case 'completed':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
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
      <div className="deadlines-page-section">
        <div className="deadlines-page-header">
          <h1>Deadlines Dashboard</h1>
          <p className="deadlines-page-subtitle">Track your assignment deadlines and time remaining</p>
        </div>
        <div className="loading-state">
          <p>Loading deadlines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deadlines-page-section">
        <div className="deadlines-page-header">
          <h1>Deadlines Dashboard</h1>
          <p className="deadlines-page-subtitle">Track your assignment deadlines and time remaining</p>
        </div>
        <div className="error-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="deadlines-page-section">
        <div className="deadlines-page-header">
          <h1>Deadlines Dashboard</h1>
          <p className="deadlines-page-subtitle">Track your assignment deadlines and time remaining</p>
        </div>
        <div className="empty-state">
          <p>No deadlines available. Add subjects with deadlines to track them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deadlines-page-section">
      <div className="deadlines-page-header">
        <h1>Deadlines Dashboard</h1>
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
  );
}
