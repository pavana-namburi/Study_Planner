import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authMessage, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const successMessage = location.state?.message || authMessage;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/login", form);
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Login response did not include a session token");
      }

      login({ token, user });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to login. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-copy">
          <p className="auth-kicker">Study Planner</p>
          <h1 id="login-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to continue planning, tracking, and improving your study
            routine.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {successMessage && <div className="auth-notice">{successMessage}</div>}
          {error && <div className="auth-error">{error}</div>}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
