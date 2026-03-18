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

function GeoJsonLayer({ data, style, onEachFeature }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.clearLayers();
            ref.current.addData(data);
        }
    }, [style, data]);

    return (
        <GeoJSON
            ref={ref}
            data={data}
            style={style}
            onEachFeature={onEachFeature}
        />
    );
}

function CountryPopup({ info, onClose, onSelect, existingStatus }) {
    if (!info) return null;

    return (
        <div className="country-popup-overlay" onClick={onClose}>
            <div className="country-popup" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close" onClick={onClose}>✕</button>
                <h4 className="popup-country-name">{info.name}</h4>

                {existingStatus && (
                    <p className="popup-current-status">
                        Status curent: <span className={`dest-status status-${existingStatus}`}>{existingStatus}</span>
                    </p>
                )}

                <p className="popup-label">Marcheaza ca:</p>

                <div className="popup-status-btns">
                    {['visited', 'planned', 'wishlist'].map((s) => (
                        <button
                            key={s}
                            className={`popup-status-btn popup-${s} ${existingStatus === s ? 'popup-active' : ''}`}
                            onClick={() => onSelect(info, s)}
                        >
                            {s === 'visited' ? 'Vizitat' : s === 'planned' ? 'Planificat' : 'Wishlist'}
                        </button>
                    ))}
                </div>

                {existingStatus && (
                    <button className="popup-remove-btn" onClick={() => onSelect(info, null)}>
                        Elimina din harta
                    </button>
                )}
            </div>
        </div>
    );
}

const MapPage = () => {
    const navigate = useNavigate();

    const [destinations, setDestinations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('visited');
    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState(null);

    const fetchMyMap = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${BASE}/api/map/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            setDestinations(data.destinations || []);
            setCountries(data.countries || []);
        } catch (err) {
            console.error('fetchMyMap error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyMap();
    }, [fetchMyMap]);

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');

                const res = await fetch(
                    `${BASE}/api/map/search?q=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();
                setSearchResults(data || []);
            } catch (err) {
                console.error('search error:', err);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const countryStatusMap = useMemo(() => {
        const map = {};

        for (const c of countries) {
            if (c.country_code) {
                map[c.country_code.trim().toUpperCase()] = c;
            }

            if (c.country_name) {
                map[c.country_name.trim().toLowerCase()] = c;
            }
        }

        return map;
    }, [countries]);

    const getFeatureCountryCode = (feature) => {
        const props = feature?.properties || {};

        return (
            props.ISO_A2 ||
            props.iso_a2 ||
            props.ISO2 ||
            props.iso2 ||
            props.CNTR_ID ||
            props.id ||
            ''
        ).toUpperCase();
    };

    const styleCountry = useCallback((feature) => {
        const code = getFeatureCountryCode(feature);
        const name = getFeatureCountryCode(feature);

        const countryData =
            countryStatusMap[code] ||
            countryStatusMap[name.trim().toLowerCase()];

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
    }, [countryStatusMap]);
    const onEachCountry = useCallback((feature, layer) => {
        const name = getFeatureCountryCode(feature);
        const countryData = countryStatusMap[name.trim().toLowerCase()];

        if (countryData) {
            const cityNames = (countryData.destinations || [])
                .map((d) => d.name)
                .slice(0, 6)
                .join(', ');

            layer.bindTooltip(
                `<strong>${countryData.country_name || name}</strong> - ${countryData.status}${cityNames ? `<br/><small>${cityNames}</small>` : ''}`,
                { sticky: true }
            );
        } else {
            layer.bindTooltip(
                `<strong>${name}</strong><br/><small>Click pentru a marca</small>`,
                { sticky: true }
            );
        }

        layer.on('click', () => {
            setPopupInfo({ name });
        });

        layer.on('mouseover', function () {
            this.setStyle({ weight: 2, fillOpacity: 0.85 });
        });

        layer.on('mouseout', function () {
            this.setStyle(styleCountry(feature));
        });
    }, [countryStatusMap, styleCountry]);

    const handleAddCity = async (dest) => {
        try {
            const token = localStorage.getItem('token');

            await fetch(`${BASE}/api/map/status`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destinationId: dest.id,
                    status: selectedStatus,
                }),
            });

            setSearchQuery('');
            setSearchResults([]);
            fetchMyMap();
        } catch (err) {
            console.error('handleAddCity error:', err);
        }
    };

    const handlePopupSelect = async (info, status) => {
        try {
            const token = localStorage.getItem('token');

            if (status === null) {
                await fetch(`${BASE}/api/map/country-remove`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        countryName: info.name,
                    }),
                });
            } else {
                await fetch(`${BASE}/api/map/country-status`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        countryName: info.name,
                        status,
                    }),
                });
            }

            setPopupInfo(null);
            fetchMyMap();
        } catch (err) {
            console.error('handlePopupSelect error:', err);
        }
    };

    // const handleRemove = async (destId) => {
    //     try {
    //         const token = localStorage.getItem('token');

    //         await fetch(`${BASE}/api/map/remove`, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 destinationId: destId,
    //             }),
    //         });

    //         fetchMyMap();
    //     } catch (err) {
    //         console.error('handleRemove error:', err);
    //     }
    // };
    const handleRemoveCountry = async (countryName) => {
        try {
            const token = localStorage.getItem('token');

            await fetch(`${BASE}/api/map/country-remove`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryName,
                }),
            });

            fetchMyMap();
        } catch (err) {
            console.error('handleRemoveCountry error:', err);
        }
    };
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const popupExistingStatus = useMemo(() => {
        if (!popupInfo) return null;
        const data = countryStatusMap[popupInfo.name?.trim().toLowerCase()];
        return data?.status || null;
    }, [popupInfo, countryStatusMap]);
    const countryList = useMemo(() => {
        const map = {};

        for (const dest of destinations) {
            const key = (dest.country_en || dest.country || '').trim().toLowerCase();
            if (!key) continue;

            if (!map[key]) {
                map[key] = {
                    country_name: dest.country_en || dest.country,
                    status: dest.status,
                };
            } else {
                const priority = {
                    wishlist: 1,
                    planned: 2,
                    visited: 3,
                };

                if (priority[dest.status] > priority[map[key].status]) {
                    map[key].status = dest.status;
                }
            }
        }

        return Object.values(map).sort((a, b) =>
            a.country_name.localeCompare(b.country_name)
        );
    }, [destinations]);
    return (
        <div className="map-page-container">
            <header className="dashboard-header">
                <div className="brand">
                    <h2>Travel Together</h2>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        Dashboard
                    </NavLink>

                    <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        My Map
                    </NavLink>

                    <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        Profile
                    </NavLink>

                    <span className="nav-item logout" onClick={handleLogout}>
                        Logout
                    </span>
                </nav>
            </header>

            <main className="map-page-main">
                <div className="map-page-left">
                    <div className="map-fullsize">
                        <MapContainer
                            center={[54, 15]}
                            zoom={4}
                            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                            scrollWheelZoom={true}
                            minZoom={3}
                            maxZoom={10}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            />

                            <GeoJsonLayer
                                data={europeGeoJson}
                                style={styleCountry}
                                onEachFeature={onEachCountry}
                            />
                        </MapContainer>
                    </div>

                    <div className="map-legend">
                        <span><span className="legend-dot visited"></span> Visited</span>
                        <span><span className="legend-dot planned"></span> Planned</span>
                        <span><span className="legend-dot wishlist"></span> Wishlist</span>
                        <span className="legend-hint">Click pe o tara pentru a o marca</span>
                    </div>
                </div>

                <div className="map-page-right">
                    <h3>Add destination</h3>

                    <div className="status-selector">
                        {['visited', 'planned', 'wishlist'].map((s) => (
                            <button
                                key={s}
                                className={`status-btn ${selectedStatus === s ? 'active-' + s : ''}`}
                                onClick={() => setSelectedStatus(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Cauta oras sau tara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((r) => (
                                    <li key={r.id} onClick={() => handleAddCity(r)}>
                                        {r.name}, {r.country_en}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <h3>My countries</h3>

                    <div className="dest-list">
                        {loading ? (
                            <p>Loading...</p>
                        ) : countryList.length === 0 ? (
                            <p className="empty-text">No countries added yet.</p>
                        ) : (
                            countryList.map((country) => (
                                <div key={country.country_name} className="dest-item">
                                    <div>
                                        <span className="dest-name">{country.country_name}</span>
                                        <span className={`dest-status status-${country.status}`}>
                                            {country.status}
                                        </span>
                                    </div>

                                    <button
                                        className="btn-remove"
                                        onClick={() => handleRemoveCountry(country.country_name)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <CountryPopup
                info={popupInfo}
                existingStatus={popupExistingStatus}
                onClose={() => setPopupInfo(null)}
                onSelect={handlePopupSelect}
            />
        </div>
    );
};

export default MapPage;