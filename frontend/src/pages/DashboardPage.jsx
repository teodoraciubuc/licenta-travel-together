import React from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [offset, setOffset] = React.useState(0);
    const userName = localStorage.getItem('user_name') || 'Călătorule';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const fetchDashboardData = async (currentOffset) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/dashboard?offset=${currentOffset}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Eroare');

            const data = await response.json();
            const newRecs = data.recommendations || [];

            if (newRecs.length === 0 && currentOffset > 0) {
                alert("Ai parcurs toate recomandările disponibile!");
                setLoading(false);
                return;
            }

            setRecommendations(newRecs);
            setOffset(currentOffset);
        } catch (error) {
            console.error('Error:', error);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData(0);
    }, []);

    const handleRefresh = () => {
        fetchDashboardData(offset + 6);
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="brand">
                    <h2>Travel Together</h2>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        My Map
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        Profile
                    </NavLink>
                    <span className="nav-item logout" onClick={handleLogout}>
                        Logout
                    </span>
                </nav>
            </header>

            <main className="dashboard-main">
                <section className="hero-section">
                    <h1>Bună, {userName}!</h1>
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
                            <p>Loading...</p>
                        ) : recommendations.length === 0 ? (
                            <div className="no-recommendations">
                                <p>No recommendations available yet.</p>
                                <Link to="/questionnaire" className="btn-secondary">
                                    Go to Questionnaire!
                                </Link>
                            </div>
                        ) : (
                            recommendations.map((dest) => (
                                <div key={dest.id} className="offer-card">
                                    <div className="card-image-container">
                                        {dest.image_url ? (
                                            <img src={dest.image_url} alt={dest.name} className="city-image" />
                                        ) : (
                                            <div className="image-placeholder">No Image Available</div>
                                        )}
                                    </div>

                                    <div className="card-content">
                                        <h4>{dest.name}</h4>
                                        <p className="location-text">
                                            <strong>Location:</strong> {dest.country_en}
                                        </p>
                                        <p className="match-score">
                                            Match Score: {dest.match_percentage}%
                                        </p>
                                        <button className="btn-primary" onClick={() => navigate('/map')}>
                                            View on Map
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!loading && recommendations.length > 0 && (
                        <div className="refresh-container">
                            <button className="btn-refresh" onClick={handleRefresh}>
                                <span>🔄</span> Show next 6 spots
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;