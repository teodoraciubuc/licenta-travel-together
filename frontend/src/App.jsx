import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import MapPage from "./pages/MapPage";
import ItinerariesPage from "./pages/ItinerariesPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from './pages/ProfilePage';
import FlightExplorePage from './pages/FlightExplorePage';
function Layout({ children }) {
  return <>{children}</>;
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/itineraries/new" element={<ItinerariesPage />} />
        <Route path="/itineraries/:id" element={<ItinerariesPage />} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/flights/explore" element={<FlightExplorePage />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            </Layout>
          }
        />

        <Route
          path="/questionnaire"
          element={
            <Layout>
              <PrivateRoute>
                <QuestionnairePage />
              </PrivateRoute>
            </Layout>
          }
        />

        <Route
          path="/recommendations"
          element={
            <Layout>
              <PrivateRoute>
                <RecommendationsPage />
              </PrivateRoute>
            </Layout>
          }
        />

        <Route
          path="/map"
          element={
            <Layout>
              <PrivateRoute>
                <MapPage />
              </PrivateRoute>
            </Layout>
          }
        />

        <Route
          path="/itineraries"
          element={
            <Layout>
              <PrivateRoute>
                <ItinerariesPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}