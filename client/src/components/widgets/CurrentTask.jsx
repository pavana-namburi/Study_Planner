import { useEffect, useMemo, useState } from "react";
import api, { getApiData, getApiErrorMessage } from "../../services/api";

function CurrentTask() {
  const [task, setTask] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchCurrentTask() {
      setLoading(true);
      setError("");

      try {
        const { data: payload } = await api.get("/api/current-task");

        if (active) {
          setTask(getApiData(payload)?.task || null);
        }
      } catch (err) {
        if (active) {
          console.error("Current task fetch failed:", err);
          setError(getApiErrorMessage(err, "Failed to load current task"));
          setTask(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCurrentTask();
    return () => {
      active = false;
    };
  }, []);

  const taskTimeRange = useMemo(() => {
    if (!task) return "";
    return `${task.start_time} - ${task.end_time}`;
  }, [task]);

  useEffect(() => {
    if (!task) {
      setCountdown("");
      return undefined;
    }

    function formatDuration(seconds) {
      const total = Math.max(0, seconds);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function refreshCountdown() {
      const now = new Date();
      const start = new Date(`${task.task_date}T${task.start_time}`);
      const end = new Date(`${task.task_date}T${task.end_time}`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setCountdown("Invalid schedule");
        return;
      }

      if (now < start) {
        const seconds = Math.floor((start.getTime() - now.getTime()) / 1000);
        setCountdown(`Starts in ${formatDuration(seconds)}`);
        return;
      }

      if (now <= end) {
        const seconds = Math.floor((end.getTime() - now.getTime()) / 1000);
        setCountdown(`Ends in ${formatDuration(seconds)}`);
        return;
      }

      setCountdown("Task ended");
    }

    refreshCountdown();
    const interval = setInterval(refreshCountdown, 1000);
    return () => clearInterval(interval);
  }, [task]);

  const deadlineLabel = useMemo(() => {
    if (!task?.deadline) return null;
    const deadlineDate = new Date(task.deadline);
    if (Number.isNaN(deadlineDate.getTime())) return null;
    return deadlineDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [task]);

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
        color: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              opacity: 0.82,
              color: "rgba(255, 255, 255, 0.85)",
              letterSpacing: "0.02em",
            }}
          >
            Today's Focus
          </p>
          <h2 style={{ margin: "8px 0 0 0", color: "#ffffff" }}>
            Current Task
          </h2>
        </div>
        {deadlineLabel ? (
          <span
            style={{
              fontSize: "14px",
              opacity: 0.9,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              padding: "6px 14px",
              borderRadius: "20px",
            }}
          >
            Due {deadlineLabel}
          </span>
        ) : null}
      </div>
      {loading ? (
        <p
          style={{
            opacity: 0.95,
            margin: "0 0 16px 0",
            lineHeight: 1.6,
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          Loading current task...
        </p>
      ) : error ? (
        <p
          style={{
            opacity: 0.95,
            margin: "0 0 16px 0",
            lineHeight: 1.6,
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      ) : !task ? (
        <p
          style={{
            opacity: 0.95,
            margin: "0 0 16px 0",
            lineHeight: 1.6,
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          No current tasks scheduled
        </p>
      ) : (
        <>
          <p
            style={{
              opacity: 0.95,
              margin: "0 0 16px 0",
              lineHeight: 1.6,
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            {task.subject}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                opacity: 0.95,
                padding: "8px 12px",
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: "999px",
              }}
            >
              Priority: {task.priority}
            </span>
            <span
              style={{
                fontSize: "12px",
                opacity: 0.95,
                padding: "8px 12px",
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: "999px",
              }}
            >
              Difficulty: {task.difficulty}
            </span>
            <span
              style={{
                fontSize: "12px",
                opacity: 0.85,
                padding: "8px 12px",
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: "999px",
              }}
            >
              {task.task_date} · {taskTimeRange}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  opacity: 0.85,
                  margin: 0,
                  lineHeight: 1.5,
                  color: "#ffffff",
                  fontSize: "14px",
                }}
              >
                Next task to work on
              </p>
              <p
                style={{
                  opacity: 0.95,
                  margin: "8px 0 0 0",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {task.subject}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{ opacity: 0.85, margin: "0 0 4px 0", fontSize: "12px" }}
              >
                {countdown === "Task ended" ? "Status" : "Countdown"}
              </p>
              <p
                style={{
                  opacity: 0.95,
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {countdown}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CurrentTask;
