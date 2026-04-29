import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { getApiData, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authMessage, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const successMessage = location.state?.message || authMessage;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    const email = form.email.trim();

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/login", form);
      const { token, user } = getApiData(response.data);

      if (!token || !user) {
        throw new Error("Login response did not include a session token");
      }

      login({ token, user });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to login. Please try again."));
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
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              required
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </label>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="button-spinner" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
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
