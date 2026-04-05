import { useState, useEffect } from 'react';
import Header from '../components/Header';

function StudyPlanPage() {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudyPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/study-plan');

        if (!response.ok) {
          throw new Error(`Failed to fetch study plan: ${response.statusText}`);
        }

        const data = await response.json();
        setPlan(data);
      } catch (err) {
        console.error('Error fetching study plan:', err);
        setError(err.message || 'Failed to load study plan');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyPlan();
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#10b981',
    };
    return colors[priority] || '#94a3b8';
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
            Today's Study Plan
          </h1>

          {loading && (
            <div className="study-plan-section">
              <div className="loading-state">
                <p>Loading your study plan...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="study-plan-section">
              <div className="error-state">
                <p>Error: {error}</p>
              </div>
            </div>
          )}

          {!loading && !error && plan.length === 0 && (
            <div className="study-plan-section">
              <div className="empty-state">
                <p>No subjects scheduled. Add subjects to generate a study plan.</p>
              </div>
            </div>
          )}

          {!loading && !error && plan.length > 0 && (
            <div className="study-plan-section">
              <div className="study-plan-header">
                <p className="plan-subtitle">6 hours daily schedule starting at 9:00 AM</p>
              </div>
              <div className="study-plan-grid">
                {plan.map((item, index) => (
                  <div key={index} className="study-plan-card">
                    <div className="card-time">
                      <span className="time-range">
                        {item.start} - {item.end}
                      </span>
                    </div>
                    <div className="card-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <h3 className="card-subject">{item.subject}</h3>
                        {item.rescheduled && (
                          <span className="rescheduled-badge">Rescheduled</span>
                        )}
                      </div>
                      <div className="card-priority">
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(item.priority) }}
                        >
                          {item.priority}
                        </span>
                      </div>
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

export default StudyPlanPage;