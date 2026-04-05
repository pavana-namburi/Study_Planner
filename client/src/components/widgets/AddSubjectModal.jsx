import { useEffect, useState } from "react";

function AddSubjectModal({ isOpen, onClose }) {
  const [subjectName, setSubjectName] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [maxTime, setMaxTime] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [type, setType] = useState("Exam");
  const [confidence, setConfidence] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSubjectName("");
      setDifficulty("Medium");
      setMaxTime(1);
      setDeadline("");
      setPriority("Medium");
      setType("Exam");
      setConfidence(3);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleAddSubject = async (event) => {
    event.preventDefault();

    const payload = {
      name: subjectName,
      difficulty,
      maxTime,
      deadline,
      priority,
      type,
      confidence,
    };

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add subject:', errorData.error || response.statusText);
        return;
      }

      const result = await response.json();
      console.log('Subject added successfully', result);
      onClose();
    } catch (error) {
      console.error('Error sending subject data:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-subject-title">
        <div className="modal-header">
          <div>
            <p className="modal-kicker">New subject</p>
            <h2 id="add-subject-title">Add Subject</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close add subject modal">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleAddSubject}>
          <div className="modal-grid">
            <div className="form-field">
              <label htmlFor="subject-name" className="form-label">
                Subject Name
              </label>
              <input
                id="subject-name"
                type="text"
                className="form-input"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. Calculus"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="difficulty" className="form-label">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                className="form-select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="max-time" className="form-label">
                Max Time per Day (hours)
              </label>
              <input
                id="max-time"
                type="number"
                className="form-input"
                min="0.5"
                step="0.5"
                value={maxTime}
                onChange={(event) => setMaxTime(parseFloat(event.target.value) || 0)}
                placeholder="1"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="deadline" className="form-label">
                Deadline
              </label>
              <input
                id="deadline"
                type="datetime-local"
                className="form-input"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                className="form-select"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="type" className="form-label">
                Type
              </label>
              <select
                id="type"
                className="form-select"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option>Exam</option>
                <option>Assignment</option>
                <option>Practice</option>
              </select>
            </div>

            <div className="form-field range-field">
              <label htmlFor="confidence" className="form-label">
                Confidence Level
              </label>
              <div className="range-control">
                <input
                  id="confidence"
                  type="range"
                  className="form-range"
                  min="1"
                  max="5"
                  step="1"
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                />
                <span className="range-value">{confidence}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubjectModal;
