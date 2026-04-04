import { useState, useEffect } from "react";
import { testServer } from "./services/api";

function App() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await testServer();
        setMessage(response.message);
      } catch (error) {
        console.error("Failed to fetch message:", error);
        setError(
          "Unable to connect to server. Please check your connection and try again.",
        );
        setMessage("");
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        flexDirection: "column",
      }}
    >
      <h1>AI Study Planner Dashboard</h1>
      {loading && <p>Loading...</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default App;
