import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StudyPlan from './pages/StudyPlan';
import Deadlines from './pages/Deadlines';
import Performance from './pages/Performance';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/study-plan" element={<StudyPlan />} />
      <Route path="/deadlines" element={<Deadlines />} />
      <Route path="/performance" element={<Performance />} />
    </Routes>
  );
}

export default App;
