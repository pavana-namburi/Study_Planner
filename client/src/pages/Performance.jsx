import { useState, useEffect } from 'react';
import Header from '../components/Header';

function Performance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/performance');

        if (!response.ok) {
          throw new Error(`Failed to fetch performance: ${response.statusText}`);
        }

        const data = await response.json();
        setPerformance(data);
      } catch (err) {
        console.error('Error fetching performance:', err);
        setError(err.message || 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  const getCardColor = (type) => {
    const colors = {
      'completed': '#10b981', // Green
      'missed': '#ef4444',    // Red
      'efficiency': '#3b82f6' // Blue
    };
    return colors[type] || '#6b7280';
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
            Performance Dashboard
          </h1>

          {loading && (
            <div className="deadlines-page-section">
              <div className="loading-state">
                <p>Loading performance data...</p>
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

          {!loading && !error && performance && (
            <div className="deadlines-page-section">
              <div className="deadlines-page-header">
                <p className="deadlines-page-subtitle">Track your study performance and completion rates</p>
              </div>
              <div className="performance-grid">
                <div className="performance-card">
                  <div className="performance-number">{performance.totalTasks}</div>
                  <div className="performance-label">Total Tasks</div>
                </div>
                <div className="performance-card">
                  <div className="performance-number" style={{ color: getCardColor('completed') }}>
                    {performance.completedTasks}
                  </div>
                  <div className="performance-label">Completed Tasks</div>
                </div>
                <div className="performance-card">
                  <div className="performance-number" style={{ color: getCardColor('missed') }}>
                    {performance.missedTasks}
                  </div>
                  <div className="performance-label">Missed Tasks</div>
                </div>
                <div className="performance-card">
                  <div className="performance-number" style={{ color: getCardColor('efficiency') }}>
                    {performance.efficiency}%
                  </div>
                  <div className="performance-label">Efficiency</div>
                </div>
              </div>
              {performance.insight && (
                <div className="performance-insight">
                  <div className="insight-icon">💡</div>
                  <div className="insight-text">{performance.insight}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;