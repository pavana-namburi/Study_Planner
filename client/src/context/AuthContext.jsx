import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { setAuthToken, setUnauthorizedHandler } from "../services/api";

const TOKEN_KEY = "studyplanner_token";
const USER_KEY = "studyplanner_user";

const AuthContext = createContext(null);

function readStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(token));
  const [authMessage, setAuthMessage] = useState("");

  const isAuthenticated = Boolean(token);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(({ token: nextToken, user: nextUser }) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthMessage("");
    setIsCheckingAuth(false);
  }, []);

  const logout = useCallback(
    (message = "") => {
      clearSession();
      setAuthMessage(message);
      setIsCheckingAuth(false);
      navigate("/login", {
        replace: true,
        state: message ? { message } : undefined,
      });
    },
    [clearSession, navigate],
  );

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    const response = await api.get("/api/auth/me");
    const nextUser = response.data.user;

    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);

    return nextUser;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsCheckingAuth(false);
      return undefined;
    }

    let isMounted = true;

    const validateStoredToken = async () => {
      setIsCheckingAuth(true);

      try {
        const response = await api.get("/api/auth/me");

        if (!isMounted) {
          return;
        }

        const nextUser = response.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        setAuthMessage("");
      } catch {
        if (!isMounted) {
          return;
        }

        clearSession();
        setAuthMessage("Your session expired. Please log in again.");
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    validateStoredToken();

    return () => {
      isMounted = false;
    };
  }, [clearSession, token]);

  useEffect(() => {
    return setUnauthorizedHandler(() => {
      logout("Your session expired. Please log in again.");
    });
  }, [logout]);

  useEffect(() => {
    if (location.pathname !== "/login" || location.state?.message) {
      return;
    }

    setAuthMessage("");
  }, [location.pathname, location.state]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isCheckingAuth,
      login,
      logout,
      authMessage,
      refreshUser,
      token,
      user,
    }),
    [
      authMessage,
      isAuthenticated,
      isCheckingAuth,
      login,
      logout,
      refreshUser,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
