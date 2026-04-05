function FeatureButtons({ onAction }) {
  const features = [
    { icon: '📚', label: 'Add Subject', color: '#DBEAFE' },
    { icon: '📅', label: 'Study Plan', color: '#DCFCE7' },
    { icon: '💬', label: 'Previous Chats', color: '#FCE7F3' },
    { icon: '⏰', label: 'Deadlines', color: '#FEF3C7' },
    { icon: '📊', label: 'Performance', color: '#E0E7FF' },
    { icon: '🤖', label: 'AI Chatbot', color: '#F3E8FF' },
  ];

  return (
    <div className="feature-grid">
      {features.map((feature, index) => (
        <button
          key={index}
          className="feature-card"
          onClick={() => (onAction ? onAction(feature.label) : console.log(`Navigate to ${feature.label}`))}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: feature.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginBottom: '12px',
            }}
          >
            {feature.icon}
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              textAlign: 'center',
            }}
          >
            {feature.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default FeatureButtons;