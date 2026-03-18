import React from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Dashboard.css';
import europeGeoJson from '../data/europe.geo.json';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const STATUS_COLORS = {
    visited: '#9ba59f',
    planned: '#766fb5b8',
    wishlist: '#986666',
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = React.useState([]);
    const [visitedCountries, setVisitedCountries] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [offset, setOffset] = React.useState(0);
    const userName = localStorage.getItem('user_name') || 'Călătorule';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const fetchDashboardData = async (currentOffset) => {
        try {
            const response = await fetch(`${BASE}/api/dashboard?offset=${currentOffset}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Eroare la dashboard');
            const data = await response.json();
            const newRecs = data.recommendations || [];

            if (newRecs.length === 0 && currentOffset > 0) {
                alert('Ai parcurs toate recomandările disponibile!');
                return false;
            }
            setRecommendations(newRecs);
            setOffset(currentOffset);
            return true;
        } catch (error) {
            console.error('Dashboard error:', error);
            return false;
        }
    };

    const fetchMapData = async () => {
        try {
            const response = await fetch(`${BASE}/api/map/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const data = await response.json();
            setVisitedCountries(data.countries || []);
        } catch (error) {
            console.error('Map error:', error);
        }
    };

    React.useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchDashboardData(0), fetchMapData()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        await fetchDashboardData(offset + 6);
        setLoading(false);
    };

    const countryStatusMap = React.useMemo(() => {
        const map = {};
        for (const c of visitedCountries) {
            if (c.country_code) map[c.country_code.toUpperCase()] = c;
            if (c.country_name) map[c.country_name.trim().toLowerCase()] = c;
        }
        return map;
    }, [visitedCountries]);

    const getFeatureCountryCode = (feature) => {
        const props = feature?.properties || {};
        return (props.ISO_A2 || props.iso_a2 || props.ISO2 || props.iso2 || props.CNTR_ID || props.id || '').toUpperCase();
    };

    const styleCountry = (feature) => {
        const props = feature?.properties || {};
        const code = getFeatureCountryCode(feature);
        const name = props.NAME || props.name || props.ADMIN || '';
        const countryData = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];
        const status = countryData?.status;

        if (!status) {
            return {
                color: '#2f2e30',
                weight: 0.8,
                fillColor: '#1e293b',
                fillOpacity: 0.3,
            };
        }

        return {
            color: '#000000',
            weight: 1.2,
            fillColor: STATUS_COLORS[status],
            fillOpacity: 0.7,
        };
    };

    const onEachCountry = (feature, layer) => {
        const props = feature?.properties || {};
        const code = getFeatureCountryCode(feature);
        const name = props.NAME || props.name || props.ADMIN || code;
        const countryData = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];

        if (countryData) {
            const cityNames = countryData.destinations.map(d => d.name).slice(0, 6).join(', ');
            layer.bindTooltip(`${countryData.country_name || name} - ${countryData.status}\n${cityNames}`, { sticky: true });
        } else {
            layer.bindTooltip(name, { sticky: true });
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="brand"><h2>Travel Together</h2></div>
                <nav className="nav-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Dashboard</NavLink>
                    <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>My Map</NavLink>
                    <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Profile</NavLink>
                    <span className="nav-item logout" onClick={handleLogout}>Logout</span>
                </nav>
            </header>

            <main className="dashboard-main">
                <section className="hero-section">
                    <h1>Bună, {userName}!</h1>
                    <p>Pick a spot. Let's fill the map together!!</p>
                </section>

                <section className="map-section">
                    <div className="map-container">
                        <MapContainer
                            center={[54, 15]}
                            zoom={4}
                            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                            scrollWheelZoom={false}
                            minZoom={3}
                            maxZoom={8}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />
                            <GeoJSON data={europeGeoJson} style={styleCountry} onEachFeature={onEachCountry} />
                        </MapContainer>
                    </div>
                    <div className="map-edit-bar">
                        <button className="btn-edit-map" onClick={() => navigate('/map')}>✏️ Editează harta</button>
                    </div>
                </section>

                <section className="offers-section">
                    <h3>You might be interested in:</h3>
                    <div className="offers-grid">
                        {loading ? <p>Loading...</p> : recommendations.length === 0 ? (
                            <div className="no-recommendations">
                                <p>No recommendations available yet.</p>
                                <Link to="/questionnaire" className="btn-secondary">Go to Questionnaire!</Link>
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
                                        <p className="location-text"><strong>Location:</strong> {dest.country_en}</p>
                                        <p className="match-score">Match Score: {dest.final_score}%</p>
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate('/itineraries/new', { state: { city: dest.name, country: dest.country_en } })}
                                        >
                                            Planifică o excursie acum!
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {!loading && recommendations.length > 0 && (
                        <div className="refresh-container">
                            <button className="btn-refresh" onClick={handleRefresh}><span>🔄</span> Show next 6 spots</button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;