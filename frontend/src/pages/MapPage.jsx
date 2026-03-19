import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';
import europeGeoJson from '../data/europe.geo.json';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const STATUS_COLORS = {
    visited: '#9ba59f',
    planned: '#766fb5b8',
    wishlist: '#986666',
};

const STATUS_LABELS = { visited: 'Visited', planned: 'Planned', wishlist: 'Wishlist' };

/* ── Star Rating ────────────────────────────────────────────── */
function StarRating({ destinationId, currentRating, onRate }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="star-rating" title="Rate this destination">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${star <= (hovered || currentRating) ? 'star--on' : 'star--off'}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onRate(destinationId, star)}
                >★</span>
            ))}
        </div>
    );
}

/* ── GeoJSON layer ──────────────────────────────────────────── */
function GeoJsonLayer({ data, style, onEachFeature }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.options.style = style;
            ref.current.options.onEachFeature = onEachFeature;
            ref.current.clearLayers();
            ref.current.addData(data);
        }
    }, [style, onEachFeature, data]);
    return <GeoJSON ref={ref} data={data} style={style} onEachFeature={onEachFeature} />;
}

/* ── Country popup ──────────────────────────────────────────── */
function CountryPopup({ info, onClose, onSelect, existingStatus }) {
    if (!info) return null;
    return (
        <div className="country-popup-overlay" onClick={onClose}>
            <div className="country-popup" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close" onClick={onClose}>✕</button>
                <h4 className="popup-country-name">{info.name}</h4>
                {existingStatus && (
                    <p className="popup-current-status">
                        Current status: <span className={`dest-status status-${existingStatus}`}>{existingStatus}</span>
                    </p>
                )}
                <p className="popup-label">Mark as:</p>
                <div className="popup-status-btns">
                    {['visited', 'planned', 'wishlist'].map((s) => (
                        <button
                            key={s}
                            className={`popup-status-btn popup-${s} ${existingStatus === s ? 'popup-active' : ''}`}
                            onClick={() => onSelect(info, s)}
                        >
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
                {existingStatus && (
                    <button className="popup-remove-btn" onClick={() => onSelect(info, null)}>
                        Remove from map
                    </button>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const MapPage = () => {
    const navigate = useNavigate();

    const [destinations, setDestinations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStatus] = useState('visited');
    const [listFilter, setListFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState(null);
    const [ratings, setRatings] = useState({});
    const [expandedCountries, setExpandedCountries] = useState({});

    /* ── Fetch map data ── */
    const fetchMyMap = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE}/api/map/me`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setDestinations(data.destinations || []);
            setCountries(data.countries || []);
            const ratingMap = {};
            for (const d of data.destinations || []) {
                if (d.rating != null) ratingMap[d.id] = d.rating;
            }
            setRatings(ratingMap);
        } catch (err) { console.error('fetchMyMap error:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMyMap(); }, [fetchMyMap]);

    /* ── Search ── */
    useEffect(() => {
        if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${BASE}/api/map/search?q=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } });
                setSearchResults(await res.json() || []);
            } catch (err) { console.error('search error:', err); }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    /* ── Map helpers ── */
    const countryStatusMap = useMemo(() => {
        const map = {};
        for (const c of countries) {
            if (c.country_code) map[c.country_code.trim().toUpperCase()] = c;
            if (c.country_name) map[c.country_name.trim().toLowerCase()] = c;
        }
        return map;
    }, [countries]);

    const getFeatureCountryCode = (feature) => {
        const props = feature?.properties || {};
        return (props.ISO_A2 || props.iso_a2 || props.ISO2 || props.iso2 || props.CNTR_ID || props.id || '').toUpperCase();
    };
    const getFeatureName = (feature) => {
        const props = feature?.properties || {};
        return (props.NAME || props.name || props.ADMIN || props.NAME_EN || props.geounit || '').trim();
    };

    const styleCountry = useCallback((feature) => {
        const code = getFeatureCountryCode(feature);
        const name = getFeatureName(feature);
        const countryData = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];
        if (!countryData?.status) return { color: '#2f2e30', weight: 0.8, fillColor: '#1e293b', fillOpacity: 0.3 };
        return { color: '#000000', weight: 1.2, fillColor: STATUS_COLORS[countryData.status], fillOpacity: 0.7 };
    }, [countryStatusMap]);

    const onEachCountry = useCallback((feature, layer) => {
        const code = getFeatureCountryCode(feature);
        const name = getFeatureName(feature);
        const countryData = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];
        if (countryData) {
            const cityNames = (countryData.destinations || []).map((d) => d.name).slice(0, 6).join(', ');
            layer.bindTooltip(`<strong>${countryData.country_name || name}</strong> - ${countryData.status}${cityNames ? `<br/><small>${cityNames}</small>` : ''}`, { sticky: true });
        } else {
            layer.bindTooltip(`<strong>${name}</strong><br/><small>Click to mark</small>`, { sticky: true });
        }
        layer.on('click', () => { setPopupInfo({ name, code }); });
        layer.on('mouseover', function () { this.setStyle({ weight: 2, fillOpacity: 0.85 }); });
        layer.on('mouseout', function () { this.setStyle(styleCountry(feature)); });
    }, [countryStatusMap, styleCountry]);

    /* ── Actions ── */
    const handleAddCity = async (dest) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${BASE}/api/map/status`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: dest.id, status: selectedStatus }),
            });
            setSearchQuery(''); setSearchResults([]); fetchMyMap();
        } catch (err) { console.error('handleAddCity error:', err); }
    };

    const handlePopupSelect = async (info, status) => {
        try {
            const token = localStorage.getItem('token');
            const url = status === null ? `${BASE}/api/map/country-remove` : `${BASE}/api/map/country-status`;
            const body = status === null ? { countryName: info.name } : { countryName: info.name, status };
            await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setPopupInfo(null); fetchMyMap();
        } catch (err) { console.error('handlePopupSelect error:', err); }
    };

    const handleRemoveCountry = async (countryName) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${BASE}/api/map/country-remove`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryName }),
            });
            fetchMyMap();
        } catch (err) { console.error('handleRemoveCountry error:', err); }
    };

    const handleRate = async (destinationId, rating) => {
        setRatings((prev) => ({ ...prev, [destinationId]: rating }));
        try {
            const token = localStorage.getItem('token');
            await fetch(`${BASE}/api/map/rate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId, rating }),
            });
        } catch (err) { console.error('handleRate error:', err); }
    };

    const toggleExpand = (key) => {
        setExpandedCountries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    const popupExistingStatus = useMemo(() => {
        if (!popupInfo) return null;
        const data = (popupInfo.code ? countryStatusMap[popupInfo.code] : null) || countryStatusMap[popupInfo.name?.trim().toLowerCase()];
        return data?.status || null;
    }, [popupInfo, countryStatusMap]);

    const countryList = useMemo(() => {
        const map = {};
        const priority = { wishlist: 1, planned: 2, visited: 3 };
        for (const dest of destinations) {
            const key = (dest.country_en || dest.country || '').trim().toLowerCase();
            if (!key) continue;
            if (!map[key]) map[key] = { country_name: dest.country_en || dest.country, status: dest.status, destinations: [] };
            else if (priority[dest.status] > priority[map[key].status]) map[key].status = dest.status;
            map[key].destinations.push(dest);
        }
        return Object.values(map).sort((a, b) => a.country_name.localeCompare(b.country_name));
    }, [destinations]);

    const filteredCountryList = useMemo(() => {
        if (listFilter === 'all') return countryList;
        return countryList.filter((c) => c.status === listFilter);
    }, [countryList, listFilter]);

    const countByStatus = useMemo(() => ({
        visited: countryList.filter(c => c.status === 'visited').length,
        planned: countryList.filter(c => c.status === 'planned').length,
        wishlist: countryList.filter(c => c.status === 'wishlist').length,
    }), [countryList]);

    return (
        <div className="map-page-container">
            <header className="dashboard-header">
                <div className="brand"><h2>Travel Together</h2></div>
                <nav className="nav-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Dashboard</NavLink>
                    <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>My Map</NavLink>
                    <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Profile</NavLink>
                    <span className="nav-item logout" onClick={handleLogout}>Logout</span>
                </nav>
            </header>

            <main className="map-page-main">
                <div className="map-page-left">
                    <div className="map-fullsize">
                        <MapContainer center={[54, 15]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '12px' }} scrollWheelZoom minZoom={3} maxZoom={10}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                            <GeoJsonLayer data={europeGeoJson} style={styleCountry} onEachFeature={onEachCountry} />
                        </MapContainer>
                    </div>
                    <div className="map-legend">
                        <span><span className="legend-dot visited" /> Visited</span>
                        <span><span className="legend-dot planned" /> Planned</span>
                        <span><span className="legend-dot wishlist" /> Wishlist</span>
                        <span className="legend-hint">Click on a country to mark it</span>
                    </div>
                </div>

                <div className="map-page-right">
                    <h3>Add destination</h3>
                    <div className="search-box">
                        <input type="text" placeholder="Search city or country..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((r) => (
                                    <li key={r.id} onClick={() => handleAddCity(r)}>{r.name}, {r.country_en}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="my-countries-header">
                        <h3>My countries <span className="countries-count">({countryList.length})</span></h3>
                        <div className="list-filter-pills">
                            <button className={`list-filter-pill ${listFilter === 'all' ? 'list-filter-pill--active-all' : ''}`} onClick={() => setListFilter('all')}>All</button>
                            {['visited', 'planned', 'wishlist'].map((s) => (
                                <button key={s} className={`list-filter-pill ${listFilter === s ? `list-filter-pill--active-${s}` : ''}`} onClick={() => setListFilter(s)}>
                                    {STATUS_LABELS[s]}
                                    <span className="pill-num">{countByStatus[s]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="dest-list">
                        {loading ? (
                            <p className="empty-text">Loading...</p>
                        ) : countryList.length === 0 ? (
                            <p className="empty-text">No countries added yet.</p>
                        ) : filteredCountryList.length === 0 ? (
                            <p className="empty-text">No {listFilter} countries.</p>
                        ) : (
                            filteredCountryList.map((country) => {
                                const visitedCities = country.destinations?.filter(d => d.status === 'visited') || [];
                                const hasRateable = country.status === 'visited' && visitedCities.length > 0;
                                const isExpanded = expandedCountries[country.country_name];

                                return (
                                    <div key={country.country_name} className="country-card">
                                        {/* ── Country row ── */}
                                        <div className="country-card-row">
                                            <div className="country-card-left">
                                                <span className={`status-dot status-dot--${country.status}`} />
                                                <span className="country-card-name">{country.country_name}</span>
                                                <span className={`status-badge status-badge--${country.status}`}>{STATUS_LABELS[country.status]}</span>
                                            </div>
                                            <div className="country-card-actions">
                                                {hasRateable && (
                                                    <button
                                                        className="expand-btn"
                                                        onClick={() => toggleExpand(country.country_name)}
                                                        title="Rate cities"
                                                    >
                                                        {isExpanded ? '▲' : '★'}
                                                    </button>
                                                )}
                                                <button className="btn-remove" onClick={() => handleRemoveCountry(country.country_name)} title="Remove">✕</button>
                                            </div>
                                        </div>

                                        {/* ── Cities with star ratings (expanded) ── */}
                                        {hasRateable && isExpanded && (
                                            <div className="cities-list">
                                                {visitedCities.map((d) => (
                                                    <div key={d.id} className="city-rating-row">
                                                        <span className="city-name">📍 {d.name}</span>
                                                        <StarRating
                                                            destinationId={d.id}
                                                            currentRating={ratings[d.id] || 0}
                                                            onRate={handleRate}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <CountryPopup info={popupInfo} existingStatus={popupExistingStatus} onClose={() => setPopupInfo(null)} onSelect={handlePopupSelect} />
        </div>
    );
};

export default MapPage;