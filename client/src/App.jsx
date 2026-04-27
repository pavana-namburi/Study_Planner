import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import StudyPlan from './pages/StudyPlan';
import DeadlinesPage from './pages/DeadlinesPage';
import Performance from './pages/Performance';
import Chatbot from './pages/Chatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/study-plan" element={<StudyPlan />} />
        <Route path="/deadlines" element={<DeadlinesPage />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
