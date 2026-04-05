import { useState } from "react";
import Header from "../components/Header";
import CurrentTask from "../components/widgets/CurrentTask";
import FeatureButtons from "../components/widgets/FeatureButtons";
import AddSubjectModal from "../components/widgets/AddSubjectModal";

function Dashboard({ isAddSubjectOpen, setIsAddSubjectOpen, onFeatureAction }) {

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