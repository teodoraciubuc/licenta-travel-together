import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/FlightExplore.css';
import TopNav from '../components/TopNav';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const ORIGINS = [
    { code: 'OTP', label: 'Bucuresti (OTP)' },
    { code: 'CLJ', label: 'Cluj (CLJ)' },
    { code: 'TSR', label: 'Timisoara (TSR)' },
    { code: 'IAS', label: 'Iasi (IAS)' },
];

const MONTH_OPTIONS = [
    { value: '', label: 'Oricand' },
    { value: '2026-03', label: 'Martie 2026' },
    { value: '2026-04', label: 'Aprilie 2026' },
    { value: '2026-05', label: 'Mai 2026' },
    { value: '2026-06', label: 'Iunie 2026' },
    { value: '2026-07', label: 'Iulie 2026' },
    { value: '2026-08', label: 'August 2026' },
];

function makePriceIcon(price, currency, isSelected, isCheap) {
    const bg = isSelected ? '#6366f1' : isCheap ? '#16a34a' : '#1e293b';
    const border = isSelected ? '#818cf8' : isCheap ? '#22c55e' : '#334155';
    const label = `${Math.round(price)} ${currency}`;

    return L.divIcon({
        className: '',
        html: `
            <div
                class="price-marker ${isSelected ? 'price-marker--selected' : ''} ${isCheap ? 'price-marker--cheap' : ''}"
                style="background:${bg};border-color:${border}"
            >
                ${label}
            </div>
        `,
        iconSize: [null, null],
        iconAnchor: [30, 16],
    });
}

function MapController({ selected, destinations }) {
    const map = useMap();

    useEffect(() => {
        if (selected && Number.isFinite(selected.lat) && Number.isFinite(selected.lon)) {
            map.setView([selected.lat, selected.lon], 7, { animate: true });
            return;
        }

        if (destinations.length > 0) {
            const validPoints = destinations
                .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon))
                .map((d) => [d.lat, d.lon]);

            if (validPoints.length === 1) {
                map.setView(validPoints[0], 6, { animate: true });
                return;
            }

            if (validPoints.length > 1) {
                const bounds = L.latLngBounds(validPoints);
                map.fitBounds(bounds, { padding: [60, 60] });
            }
        }
    }, [selected, destinations, map]);

    return null;
}

const FlightExplorePage = () => {
    const navigate = useNavigate();

    const [origin, setOrigin] = useState('OTP');
    const [month, setMonth] = useState('');
    const [oneWay, setOneWay] = useState(false);
    const [nonStop, setNonStop] = useState(false);

    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    const listRef = useRef(null);

    const fetchExplore = useCallback(async () => {
        setLoading(true);
        setError('');
        setSelected(null);
        setDestinations([]);

        try {
            const params = new URLSearchParams({
                origin,
                oneWay: String(oneWay),
                nonStop: String(nonStop),
            });

            if (month) {
                params.append('departureDate', month);
            }

            const res = await fetch(`${BASE}/api/dashboard/flight-explore?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!res.ok) {
                throw new Error('Eroare server');
            }

            const data = await res.json();

            const normalized = (Array.isArray(data) ? data : []).map((d, index) => ({
                id: d.id ?? `${d.destination ?? d.name ?? 'dest'}-${index}`,
                city: d.city ?? d.name ?? d.destination ?? '',
                destination: d.destination ?? d.code ?? d.name ?? '',
                origin: d.origin ?? origin,
                lat: Number(d.lat ?? d.latitude),
                lon: Number(d.lon ?? d.longitude),
                price: Number(d.price ?? 0),
                currency: d.currency ?? 'EUR',
                departureDate: d.departureDate ?? null,
                returnDate: d.returnDate ?? null,
            }));

            const valid = normalized.filter(
                (d) =>
                    d.city &&
                    d.destination &&
                    Number.isFinite(d.lat) &&
                    Number.isFinite(d.lon) &&
                    Number.isFinite(d.price)
            );

            setDestinations(valid);
        } catch (err) {
            console.error('flight-explore error:', err);
            setError('Nu am putut incarca destinatiile.');
        } finally {
            setLoading(false);
        }
    }, [origin, month, oneWay, nonStop]);

    useEffect(() => {
        fetchExplore();
    }, [fetchExplore]);

    const minPrice = destinations.length > 0 ? Math.min(...destinations.map((d) => d.price)) : 0;
    const cheapThreshold = minPrice > 0 ? minPrice * 1.3 : 0;

    const handleSelect = (dest) => {
        setSelected(dest);

        if (listRef.current) {
            const element = listRef.current.querySelector(`[data-dest-id="${dest.id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    const fmtDate = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getAccomDates = (dest) => {
        const checkin =
            dest.departureDate ||
            new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        const checkout =
            dest.returnDate ||
            new Date(new Date(checkin).getTime() + 3 * 86400000)
                .toISOString()
                .split('T')[0];

        return { checkin, checkout };
    };

    const getBookingUrl = (dest) => {
        const { checkin, checkout } = getAccomDates(dest);
        return `https://www.booking.com/search.html?ss=${encodeURIComponent(dest.city)}&checkin=${checkin}&checkout=${checkout}&lang=ro`;
    };

    const getAirbnbUrl = (dest) => {
        const { checkin, checkout } = getAccomDates(dest);
        return `https://www.airbnb.com/s/${encodeURIComponent(dest.city)}/homes?checkin=${checkin}&checkout=${checkout}`;
    };

    const getMomondoUrl = (dest) => {
        const departure = dest.departureDate || new Date().toISOString().split('T')[0];
        return `https://www.momondo.ro/flight-search/${dest.origin}-${dest.destination}/${departure}/1`;
    };

    return (
        <div className="explore-page">
            <TopNav />

            <div className="explore-body">
                <aside className="explore-sidebar">
                    <div className="explore-search-box">
                        <h2 className="explore-title">✈️ Exploreaza zboruri</h2>
                        <p className="explore-sub">
                            Preturi orientative · pentru oferte exacte cauta pe Momondo
                        </p>

                        <div className="explore-field">
                            <label>De la</label>
                            <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                                {ORIGINS.map((o) => (
                                    <option key={o.code} value={o.code}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="explore-field">
                            <label>Cand</label>
                            <select value={month} onChange={(e) => setMonth(e.target.value)}>
                                {MONTH_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="explore-toggles">
                            <label className="toggle-chip">
                                <input
                                    type="checkbox"
                                    checked={nonStop}
                                    onChange={(e) => setNonStop(e.target.checked)}
                                />
                                <span>Doar direct</span>
                            </label>

                            <label className="toggle-chip">
                                <input
                                    type="checkbox"
                                    checked={oneWay}
                                    onChange={(e) => setOneWay(e.target.checked)}
                                />
                                <span>Dus simplu</span>
                            </label>
                        </div>

                        <button
                            className="btn-explore-search"
                            onClick={fetchExplore}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="btn-spinner" /> Cauta...
                                </>
                            ) : (
                                '🔍 Cauta destinatii'
                            )}
                        </button>
                    </div>

                    {error && <div className="explore-error">{error}</div>}

                    <div className="explore-list" ref={listRef}>
                        {loading && (
                            <div className="explore-loading">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="dest-card-skeleton"
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && destinations.length === 0 && !error && (
                            <div className="explore-empty">
                                <span>🗺️</span>
                                <p>Apasa "Cauta destinatii" pentru a vedea preturile pe harta.</p>
                            </div>
                        )}

                        {!loading &&
                            destinations.map((dest, i) => {
                                const isCheap = cheapThreshold > 0 ? dest.price <= cheapThreshold : false;
                                const isSelected = selected?.id === dest.id;

                                return (
                                    <div
                                        key={dest.id}
                                        data-dest-id={dest.id}
                                        className={`dest-card ${isSelected ? 'dest-card--selected' : ''} ${isCheap ? 'dest-card--cheap' : ''}`}
                                        onClick={() => handleSelect(dest)}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <div className="dest-card-left">
                                            <div className="dest-rank">#{i + 1}</div>

                                            <div className="dest-info">
                                                <div className="dest-city">{dest.city}</div>
                                                <div className="dest-code">{dest.destination}</div>

                                                {dest.departureDate && (
                                                    <div className="dest-dates">
                                                        {fmtDate(dest.departureDate)}
                                                        {dest.returnDate && ` → ${fmtDate(dest.returnDate)}`}
                                                        {dest.returnDate ? ' · Dus-intors' : ' · Dus'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="dest-card-right">
                                            {isCheap && <div className="cheap-badge">🔥 Ieftin</div>}

                                            <div className="dest-price">
                                                de la {Math.round(dest.price)}{' '}
                                                <span className="dest-currency">{dest.currency}</span>
                                            </div>

                                            <a
                                                href={getMomondoUrl(dest)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-book-small"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Rezerva →
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </aside>

                <div className="explore-map">
                    <MapContainer
                        center={[48, 16]}
                        zoom={4}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                            attribution="&copy; CARTO"
                        />

                        <MapController selected={selected} destinations={destinations} />

                        {destinations.map((dest) => {
                            const isCheap = cheapThreshold > 0 ? dest.price <= cheapThreshold : false;
                            const isSelected = selected?.id === dest.id;

                            return (
                                <Marker
                                    key={dest.id}
                                    position={[dest.lat, dest.lon]}
                                    icon={makePriceIcon(dest.price, dest.currency, isSelected, isCheap)}
                                    eventHandlers={{ click: () => handleSelect(dest) }}
                                />
                            );
                        })}
                    </MapContainer>

                    {selected && (
                        <div className="explore-popup">
                            <button className="popup-close" onClick={() => setSelected(null)}>
                                ✕
                            </button>

                            <div className="popup-city">{selected.city}</div>
                            <div className="popup-code">
                                {selected.origin} → {selected.destination}
                            </div>

                            {selected.departureDate && (
                                <div className="popup-dates">
                                    📅 {fmtDate(selected.departureDate)}
                                    {selected.returnDate && ` – ${fmtDate(selected.returnDate)}`}
                                </div>
                            )}

                            <div className="popup-price">
                                de la {Math.round(selected.price)} <span>{selected.currency}</span>
                            </div>

                            <p className="popup-hint">
                                Preturi orientative · pentru oferte exacte cauta pe Momondo
                            </p>

                            <div className="popup-section-label">✈️ Zboruri</div>
                            <div className="popup-actions">
                                <a
                                    href={getMomondoUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-momondo"
                                >
                                    Momondo
                                </a>
                            </div>

                            <div className="popup-section-label" style={{ marginTop: '14px' }}>
                                🏨 Cazare in {selected.city}
                            </div>

                            <div className="popup-actions">
                                <a
                                    href={getBookingUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-booking"
                                >
                                    Booking.com
                                </a>

                                <a
                                    href={getAirbnbUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-airbnb"
                                >
                                    Airbnb
                                </a>
                            </div>

                            <button
                                className="btn-popup-plan"
                                style={{ marginTop: '12px', width: '100%' }}
                                onClick={() =>
                                    navigate('/itineraries/new', {
                                        state: { city: selected.city, country: selected.country_name ?? '' },
                                    })
                                }
                            >
                                📋 Creeaza itinerariu pentru {selected.city}
                            </button>
                        </div>
                    )}

                    {destinations.length > 0 && (
                        <div className="explore-legend">
                            <div className="legend-item">
                                <span className="legend-dot green" /> Cel mai ieftin
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot dark" /> Alte destinatii
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot purple" /> Selectat
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightExplorePage;
