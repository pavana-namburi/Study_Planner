function CurrentTask() {
  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.82, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.02em' }}>
            Today's Focus
          </p>
          <h2 style={{ margin: '8px 0 0 0', color: '#ffffff' }}>
            Current Task
          </h2>
        </div>
        <span style={{ fontSize: '14px', opacity: 0.9, backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: '20px' }}>
          Due Tomorrow
        </span>
      </div>
      <p style={{ opacity: 0.95, margin: '0 0 16px 0', lineHeight: 1.6, color: '#ffffff', fontSize: '16px', fontWeight: 500 }}>
        Complete the math assignment
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ opacity: 0.85, margin: 0, lineHeight: 1.5, color: '#ffffff', fontSize: '14px' }}>
          Focus on algebra problems 1-10
        </p>
        <div style={{ textAlign: 'right' }}>
          <p style={{ opacity: 0.85, margin: '0 0 4px 0', fontSize: '12px' }}>
            Time remaining
          </p>
          <p style={{ opacity: 0.95, margin: 0, fontSize: '18px', fontWeight: 600 }}>
            23h 45m
          </p>
        </div>
      </div>
    </div>
  );
}

export default CurrentTask;