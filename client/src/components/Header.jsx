import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        padding: "16px 24px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Link to={isAuthenticated ? "/dashboard" : "/login"} className="brand-link">
        <h2>Study Planner</h2>
      </Link>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {isAuthenticated ? (
          <>
            <span style={{ color: "#475569", fontWeight: 600 }}>
              {user?.name || "Student"}
            </span>
            <button type="button" className="header-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="header-link" to="/login">
              Login
            </Link>
            <Link className="header-link header-link-primary" to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
