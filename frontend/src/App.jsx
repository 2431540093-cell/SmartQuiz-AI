import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage     from "./pages/ChatPage";
import QuizPage     from "./pages/QuizPage";
import ResultsPage  from "./pages/ResultsPage";
import ProfilePage  from "./pages/ProfilePage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/quiz"      element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      <Route path="/results"   element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
