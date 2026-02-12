import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import MapPage from "./pages/MapPage";
import ItinerariesPage from "./pages/ItinerariesPage";

function Layout({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ fontFamily: "Arial", padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Link to="/questionnaire">Questionnaire</Link>
        <Link to="/recommendations">Recommendations</Link>
        <Link to="/map">Map</Link>
        <Link to="/itineraries">Itineraries</Link>
        <span style={{ flex: 1 }} />
        {token ? <button onClick={logout}>Logout</button> : <Link to="/login">Login</Link>}
      </nav>
      {children}
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />

        <Route
          path="/register"
          element={
            <Layout>
              <RegisterPage />
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
      </Routes>
    </BrowserRouter>
  );
}
