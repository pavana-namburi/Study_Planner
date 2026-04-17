import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CurrentTask from "../components/widgets/CurrentTask";
import FeatureButtons from "../components/widgets/FeatureButtons";
import AddSubjectModal from "../components/widgets/AddSubjectModal";

function Home() {
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const navigate = useNavigate();

  const handleFeatureAction = (label) => {
    if (label === "Add Subject") {
      setIsAddSubjectOpen(true);
      return;
    }

    if (label === "Study Plan") {
      navigate("/study-plan");
      return;
    }

    if (label === "Deadlines") {
      navigate("/deadlines");
      return;
    }

    if (label === "Performance") {
      navigate("/performance");
      return;
    }

    if (label === "AI Chatbot") {
      navigate("/chatbot");
      return;
    }

    console.log(`Navigate to ${label}`);
  };

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
        <div style={{ maxWidth: 800, width: "100%", marginBottom: 32 }}>
          <h1 style={{ marginBottom: 24, fontSize: "2rem" }}>
            Study Dashboard
          </h1>
          <CurrentTask />
          <FeatureButtons onAction={handleFeatureAction} />
          <div
            style={{
              marginTop: 48,
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button
              type="button"
              className="primary-action-button"
              aria-label="Ask Gemini"
              onClick={() => navigate('/chatbot')}
            >
              Ask Gemini
            </button>
          </div>
          <AddSubjectModal
            isOpen={isAddSubjectOpen}
            onClose={() => setIsAddSubjectOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
