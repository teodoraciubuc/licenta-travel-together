import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';
import europeGeoJson from '../data/europe.geo.json';
import TopNav from '../components/TopNav';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const STATUS_COLORS = { visited: '#9ba59f', planned: '#766fb5b8', wishlist: '#986666' };
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

/* ── Manual add form ────────────────────────────────────────── */
function AddManualForm({ cityName, onAdded, onCancel }) {
    const [form, setForm] = useState({
        name: cityName || '',
        country: '',
        status: 'visited',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.country.trim()) {
            setError('City name and country are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE}/api/map/suggest`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error saving');
            onAdded(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manual-form">
            <p className="manual-form-title">➕ Add city manually</p>
            <p className="manual-form-sub">This city will be added to the database for everyone.</p>

            <div className="manual-field">
                <label>City name *</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Sinaia" />
            </div>

            <div className="manual-field">
                <label>Country *</label>
                <input value={form.country} onChange={set('country')} placeholder="e.g. Romania" />
            </div>

            <div className="manual-field">
                <label>Mark as</label>
                <select value={form.status} onChange={set('status')}>
                    <option value="visited">Visited</option>
                    <option value="planned">Planned</option>
                    <option value="wishlist">Wishlist</option>
                </select>
            </div>

            {error && <p className="manual-error">{error}</p>}

            <div className="manual-actions">
                <button className="manual-btn-ghost" onClick={onCancel}>Cancel</button>
                <button className="manual-btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save city'}
                </button>
            </div>
        </div>
    );
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
                        <button key={s} className={`popup-status-btn popup-${s} ${existingStatus === s ? 'popup-active' : ''}`} onClick={() => onSelect(info, s)}>
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
                {existingStatus && (
                    <button className="popup-remove-btn" onClick={() => onSelect(info, null)}>Remove from map</button>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const MapPage = () => {
    const [destinations, setDestinations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchDone, setSearchDone] = useState(false); // true after search completes
    const [showManual, setShowManual] = useState(false);
    const [selectedStatus] = useState('visited');
    const [listFilter, setListFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState(null);
    const [ratings, setRatings] = useState({});
    const [expandedCountries, setExpandedCountries] = useState({});

    /* ── Fetch ── */
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
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setSearchDone(false);
            setShowManual(false);
            return;
        }
        setSearchDone(false);
        const timeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${BASE}/api/map/search?q=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json() || [];
                setSearchResults(data);
                setSearchDone(true);
                // If no results found, show manual add suggestion
                if (data.length === 0) setShowManual(true);
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

    const getFeatureCountryCode = (f) => {
        const p = f?.properties || {};
        return (p.ISO_A2 || p.iso_a2 || p.ISO2 || p.iso2 || p.CNTR_ID || p.id || '').toUpperCase();
    };
    const getFeatureName = (f) => {
        const p = f?.properties || {};
        return (p.NAME || p.name || p.ADMIN || p.NAME_EN || p.geounit || '').trim();
    };

    const styleCountry = useCallback((feature) => {
        const code = getFeatureCountryCode(feature);
        const name = getFeatureName(feature);
        const cd = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];
        if (!cd?.status) return { color: '#2f2e30', weight: 0.8, fillColor: '#1e293b', fillOpacity: 0.3 };
        return { color: '#000000', weight: 1.2, fillColor: STATUS_COLORS[cd.status], fillOpacity: 0.7 };
    }, [countryStatusMap]);

    const onEachCountry = useCallback((feature, layer) => {
        const code = getFeatureCountryCode(feature);
        const name = getFeatureName(feature);
        const cd = countryStatusMap[code] || countryStatusMap[name.trim().toLowerCase()];
        if (cd) {
            layer.bindTooltip(`<strong>${cd.country_name || name}</strong> — ${cd.status}`, { sticky: true });
        } else {
            layer.bindTooltip(`<strong>${name}</strong><br/><small>Click to mark</small>`, { sticky: true });
        }
        layer.on('click', () => setPopupInfo({ name, code }));
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
            setSearchQuery(''); setSearchResults([]); setSearchDone(false); setShowManual(false);
            fetchMyMap();
        } catch (err) { console.error('handleAddCity error:', err); }
    };

    const handleManualAdded = () => {
        setSearchQuery(''); setSearchResults([]); setSearchDone(false); setShowManual(false);
        fetchMyMap();
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
        } catch (err) {
            console.error('handleRate error:', err);
            setRatings((prev) => ({ ...prev, [destinationId]: prev[destinationId] }));
        }
    };

    const popupExistingStatus = useMemo(() => {
        if (!popupInfo) return null;
        const d = (popupInfo.code ? countryStatusMap[popupInfo.code] : null) || countryStatusMap[popupInfo.name?.trim().toLowerCase()];
        return d?.status || null;
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
            <TopNav />

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
                        <input
                            type="text"
                            placeholder="Search city or country..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowManual(false); }}
                        />
                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((r) => (
                                    <li key={r.id} onClick={() => handleAddCity(r)}>{r.name}, {r.country_en}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* No results banner */}
                    {searchDone && searchResults.length === 0 && !showManual && (
                        <div className="no-results-banner">
                            <span>🔍 No results for "<strong>{searchQuery}</strong>"</span>
                            <button className="no-results-add-btn" onClick={() => setShowManual(true)}>
                                + Add manually
                            </button>
                        </div>
                    )}

                    {/* Manual add form */}
                    {showManual && (
                        <AddManualForm
                            cityName={searchQuery}
                            onAdded={handleManualAdded}
                            onCancel={() => setShowManual(false)}
                        />
                    )}

                    {!showManual && (
                        <>
                            <div className="my-countries-header">
                                <h3>My countries <span className="countries-count">({countryList.length})</span></h3>
                                <div className="list-filter-pills">
                                    <button className={`list-filter-pill ${listFilter === 'all' ? 'list-filter-pill--active-all' : ''}`} onClick={() => setListFilter('all')}>All</button>
                                    {['visited', 'planned', 'wishlist'].map((s) => (
                                        <button key={s} className={`list-filter-pill ${listFilter === s ? `list-filter-pill--active-${s}` : ''}`} onClick={() => setListFilter(s)}>
                                            {STATUS_LABELS[s]}<span className="pill-num">{countByStatus[s]}</span>
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
                                        // All visited cities — rated ones first, then alphabetically
                                        const visitedCities = country.destinations
                                            .filter(d => d.status === 'visited')
                                            .sort((a, b) => {
                                                const rA = ratings[a.id] || 0;
                                                const rB = ratings[b.id] || 0;
                                                if (rB !== rA) return rB - rA;
                                                return a.name.localeCompare(b.name);
                                            });
                                        const hasRateable = visitedCities.length > 0;
                                        const isExpanded = !!expandedCountries[country.country_name];

                                        return (
                                            <div key={country.country_name} className="country-card">
                                                <div className="country-card-row">
                                                    <div className="country-card-left">
                                                        <span className={`status-dot status-dot--${country.status}`} />
                                                        <span className="country-card-name">{country.country_name}</span>
                                                        <span className={`status-badge status-badge--${country.status}`}>{STATUS_LABELS[country.status]}</span>
                                                    </div>
                                                    <div className="country-card-actions">
                                                        {hasRateable && (
                                                            <button
                                                                className={`expand-btn ${isExpanded ? 'expand-btn--open' : ''}`}
                                                                onClick={() => setExpandedCountries(p => ({ ...p, [country.country_name]: !p[country.country_name] }))}
                                                                title="Rate visited cities"
                                                            >
                                                                {isExpanded ? '▲' : '★'}
                                                            </button>
                                                        )}
                                                        <button className="btn-remove" onClick={() => handleRemoveCountry(country.country_name)} title="Remove">✕</button>
                                                    </div>
                                                </div>

                                                {hasRateable && isExpanded && (
                                                    <div className="cities-list">
                                                        <p className="cities-hint">Rate cities to improve your recommendations</p>
                                                        {visitedCities.map((d) => (
                                                            <div key={d.id} className="city-rating-row">
                                                                <span className="city-name">📍 {d.name}</span>
                                                                <StarRating destinationId={d.id} currentRating={ratings[d.id] || 0} onRate={handleRate} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <CountryPopup info={popupInfo} existingStatus={popupExistingStatus} onClose={() => setPopupInfo(null)} onSelect={handlePopupSelect} />
        </div>
    );
};

export default MapPage;
