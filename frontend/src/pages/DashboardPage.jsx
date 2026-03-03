import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import '../styles/Dashboard.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/dashboard', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Eroare la preluarea datelor');
                }

                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="brand">
                    <h2>Travel Together</h2>
                </div>

                <nav className="nav-menu">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/map"
                        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                    >
                        My Map
                    </NavLink>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                    >
                        Profile
                    </NavLink>

                    <span className="nav-item logout" onClick={handleLogout}>
                        Logout
                    </span>
                </nav>
            </header>

            <main className="dashboard-main">
                <section className="hero-section">
                    <h1>Unlock Europe</h1>
                    <p>Pick a spot. Let’s fill the map together!!</p>
                </section>

                <section className="map-section">
                    <div className="map-container">
                        <p>Harta Interactiva (Placeholder)</p>
                    </div>
                </section>

                <section className="offers-section">
                    <h3>You might be interested in:</h3>

                    <div className="offers-grid">
                        {loading ? (
                            <p>Loading your personalized trips...</p>
                        ) : recommendations.length === 0 ? (
                            <p>No recommendations available yet.</p>
                        ) : (
                            recommendations.map((dest) => {
                                const safeDescription =
                                    dest.description || 'A destination matched to your travel preferences.';

                                const shortDescription =
                                    safeDescription.length > 140
                                        ? safeDescription.slice(0, 140) + '...'
                                        : safeDescription;

                                return (
                                    <div key={dest.id} className="offer-card">
                                        <h4>{dest.name}</h4>
                                        <p>Location: {dest.country}</p>
                                        <p className="description">{shortDescription}</p>
                                        <button className="btn-primary">View Details</button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;