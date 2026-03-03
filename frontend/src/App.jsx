import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import MapPage from "./pages/MapPage";
import ItinerariesPage from "./pages/ItinerariesPage";
import DashboardPage from "./pages/DashboardPage";

function Layout({ children }) {
  return <>{children}</>;

};

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const token = localStorage.getItem("token");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />


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
      </Routes>
    </BrowserRouter>

  );
}
