function Header() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <h2>
        John Doe
      </h2>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '18px',
            padding: '8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          🔔
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '18px',
            padding: '8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;
