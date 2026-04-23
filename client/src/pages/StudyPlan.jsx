import { useState, useEffect } from "react";
import Header from "../components/Header";

function StudyPlan() {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:5000";

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "";
    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  const getBadgeStyle = (status) => {
    const colors = {
      pending: "#f59e0b",
      completed: "#10b981",
      skipped: "#6b7280",
      missed: "#ef4444",
    };

    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "0.85rem",
      fontWeight: 700,
      color: "#ffffff",
      backgroundColor: colors[status] || "#94a3b8",
      textTransform: "capitalize",
      minWidth: "96px",
    };
  };

  const fetchTasks = async () => {
    const response = await fetch(`${apiBase}/api/tasks`);
    if (!response.ok) {
      throw new Error(`Failed to load tasks: ${response.statusText}`);
    }
    const data = await response.json();
    setTasks(data);
  };

  const fetchCurrentTask = async () => {
    const response = await fetch(`${apiBase}/api/current-task`);
    if (!response.ok) {
      throw new Error(`Failed to load current task: ${response.statusText}`);
    }
    const { task } = await response.json();
    setCurrentTask(task);
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchTasks(), fetchCurrentTask()]);
    } catch (err) {
      console.error("Error refreshing task data:", err);
      setError(err.message || "Failed to load task data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await fetch(`${apiBase}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to update task status");
      }

      refreshData();
    } catch (err) {
      console.error("Error updating task status:", err);
      setError(err.message || "Failed to update task status");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to delete task");
      }

      refreshData();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err.message || "Failed to delete task");
    }
  };

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const missedCount = tasks.filter((task) => task.status === "missed").length;
  const efficiency =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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
        <div style={{ maxWidth: 1000, width: "100%", marginBottom: 32 }}>
          <h1 style={{ marginBottom: 24, fontSize: "2rem" }}>
            Study Task Manager
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div
              style={{
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
              }}
            >
              <p className="plan-subtitle" style={{ marginBottom: 10 }}>
                Total tasks
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                {totalTasks}
              </p>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
              }}
            >
              <p className="plan-subtitle" style={{ marginBottom: 10 }}>
                Completed
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                {completedCount}
              </p>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
              }}
            >
              <p className="plan-subtitle" style={{ marginBottom: 10 }}>
                Missed
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                {missedCount}
              </p>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
              }}
            >
              <p className="plan-subtitle" style={{ marginBottom: 10 }}>
                Efficiency
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                {efficiency}%
              </p>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
              }}
            >
              <p className="plan-subtitle" style={{ marginBottom: 10 }}>
                Current task
              </p>
              {currentTask ? (
                <>
                  <p
                    style={{
                      fontSize: "1rem",
                      margin: "0 0 6px",
                      fontWeight: 700,
                    }}
                  >
                    {currentTask.subject}
                  </p>
                  <p style={{ margin: 0, color: "#64748b" }}>
                    {formatDate(currentTask.task_date)} ·{" "}
                    {formatTime(currentTask.start_time)} -{" "}
                    {formatTime(currentTask.end_time)}
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, color: "#64748b" }}>
                  No active current task
                </p>
              )}
            </div>
          </div>

          {loading && (
            <div className="study-plan-section">
              <div className="loading-state">
                <p>Loading your tasks...</p>
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

          {!loading && !error && tasks.length === 0 && (
            <div className="study-plan-section">
              <div className="empty-state">
                <p>No study tasks planned yet</p>
              </div>
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="study-plan-section">
              <div
                className="study-plan-grid"
                style={{ display: "grid", gap: 18 }}
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="study-plan-card"
                    style={{
                      padding: 24,
                      borderRadius: 22,
                      background: "#ffffff",
                      boxShadow: "0 24px 55px rgba(15, 23, 42, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h3
                          className="card-subject"
                          style={{ margin: "0 0 10px" }}
                        >
                          {task.subject}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "0.95rem",
                          }}
                        >
                          {formatDate(task.task_date)} ·{" "}
                          {formatTime(task.start_time)} -{" "}
                          {formatTime(task.end_time)}
                        </p>
                        <p
                          style={{
                            margin: "10px 0 0",
                            color: "#475569",
                            fontSize: "0.95rem",
                          }}
                        >
                          Priority {task.priority} · {task.difficulty}
                        </p>
                      </div>
                      <span style={getBadgeStyle(task.status)}>
                        {task.status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 12,
                        marginTop: 20,
                      }}
                    >
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "#f8fafc",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "0.82rem",
                          }}
                        >
                          Subject type
                        </p>
                        <p style={{ margin: "8px 0 0", fontWeight: 700 }}>
                          {task.type}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "#f8fafc",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "0.82rem",
                          }}
                        >
                          Task date
                        </p>
                        <p style={{ margin: "8px 0 0", fontWeight: 700 }}>
                          {formatDate(task.task_date)}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "#f8fafc",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "0.82rem",
                          }}
                        >
                          Start / End
                        </p>
                        <p style={{ margin: "8px 0 0", fontWeight: 700 }}>
                          {formatTime(task.start_time)} -{" "}
                          {formatTime(task.end_time)}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginTop: 20,
                      }}
                    >
                      <button
                        type="button"
                        className="button-primary"
                        disabled={task.status === "completed"}
                        onClick={() => updateTaskStatus(task.id, "completed")}
                        style={{
                          minWidth: 120,
                          opacity: task.status === "completed" ? 0.65 : 1,
                        }}
                      >
                        Complete
                      </button>
                      {task.status !== "completed" &&
                        task.status !== "skipped" && (
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => updateTaskStatus(task.id, "skipped")}
                            style={{ minWidth: 120 }}
                          >
                            Skip
                          </button>
                        )}
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => deleteTask(task.id)}
                        style={{
                          minWidth: 120,
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                        }}
                      >
                        Delete
                      </button>
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

export default StudyPlan;
