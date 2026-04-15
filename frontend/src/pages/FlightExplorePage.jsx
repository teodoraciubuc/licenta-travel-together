import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/FlightExplore.css';
import TopNav from '../components/TopNav';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const ORIGINS = [
    { code: 'OTP', label: 'Bucharest (OTP)' },
    { code: 'CLJ', label: 'Cluj (CLJ)' },
    { code: 'TSR', label: 'Timisoara (TSR)' },
    { code: 'IAS', label: 'Iasi (IAS)' },
];

const EXCLUDED_DESTINATION_CODES = new Set(['DXB', 'HRG', 'SSH', 'RAK', 'TUN']);

const VOLA_ORIGINS = {
    OTP: { city: 'Bucuresti', code: 'BUH' },
    CLJ: { city: 'Cluj Napoca', code: 'CLJ' },
    TSR: { city: 'Timisoara', code: 'TSR' },
    IAS: { city: 'Iasi', code: 'IAS' },
};

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayDate() {
    return formatDateInput(new Date());
}

function parseLocalDate(value) {
    return new Date(`${value}T00:00:00`);
}

function addDays(value, days) {
    const date = parseLocalDate(value);
    date.setDate(date.getDate() + days);
    return formatDateInput(date);
}

function normalizeCityForPath(value) {
    return String(value ?? '').trim().replace(/\s+/g, '-');
}

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

export default function FlightExplorePage() {
    const navigate = useNavigate();
    const today = getTodayDate();

    const [origin, setOrigin] = useState('OTP');
    const [departureDate, setDepartureDate] = useState(today);
    const [returnDate, setReturnDate] = useState(() => addDays(today, 3));
    const [oneWay, setOneWay] = useState(false);
    const [nonStop, setNonStop] = useState(false);

    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    const listRef = useRef(null);

    const getTravelDates = useCallback(
        (dest = {}) => {
            const outbound = dest.departureDate || departureDate;
            const inbound = oneWay ? null : dest.returnDate || returnDate;

            return {
                outbound,
                inbound,
            };
        },
        [departureDate, returnDate, oneWay]
    );

    const fetchExplore = useCallback(async () => {
        setLoading(true);
        setError('');
        setSelected(null);
        setDestinations([]);

        try {
            const params = new URLSearchParams({
                origin,
                departureDate,
                oneWay: String(oneWay),
                nonStop: String(nonStop),
            });

            if (!oneWay && returnDate) {
                params.append('returnDate', returnDate);
            }

            const res = await fetch(`${BASE}/api/dashboard/flight-explore?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!res.ok) {
                throw new Error('Server error');
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
                country_name: d.country_name ?? d.country ?? '',
            }));

            const valid = normalized.filter(
                (d) =>
                    d.city &&
                    d.destination &&
                    !EXCLUDED_DESTINATION_CODES.has(d.destination) &&
                    Number.isFinite(d.lat) &&
                    Number.isFinite(d.lon) &&
                    Number.isFinite(d.price)
            );

            setDestinations(valid);
        } catch (err) {
            console.error('flight-explore error:', err);
            setError("We couldn't load destinations.");
        } finally {
            setLoading(false);
        }
    }, [origin, departureDate, returnDate, oneWay, nonStop]);

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

    const handleDepartureDateChange = (event) => {
        const nextDepartureDate = event.target.value || today;
        const safeDepartureDate = nextDepartureDate < today ? today : nextDepartureDate;

        setDepartureDate(safeDepartureDate);

        if (returnDate < safeDepartureDate) {
            setReturnDate(addDays(safeDepartureDate, 3));
        }
    };

    const handleReturnDateChange = (event) => {
        const nextReturnDate = event.target.value;
        if (!nextReturnDate) {
            setReturnDate(addDays(departureDate, 3));
            return;
        }

        setReturnDate(nextReturnDate < departureDate ? departureDate : nextReturnDate);
    };

    const fmtDate = (iso) => {
        if (!iso) return '';

        return parseLocalDate(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getAccomDates = (dest) => {
        const { outbound, inbound } = getTravelDates(dest);
        return {
            checkin: outbound,
            checkout: inbound || addDays(outbound, 3),
        };
    };

    const getBookingUrl = (dest) => {
        const { checkin, checkout } = getAccomDates(dest);
        return `https://www.booking.com/search.html?ss=${encodeURIComponent(dest.city)}&checkin=${checkin}&checkout=${checkout}&lang=en`;
    };

    const getAirbnbUrl = (dest) => {
        const { checkin, checkout } = getAccomDates(dest);
        return `https://www.airbnb.com/s/${encodeURIComponent(dest.city)}/homes?checkin=${checkin}&checkout=${checkout}`;
    };

    const getMomondoUrl = (dest) => {
        const { outbound, inbound } = getTravelDates(dest);
        const searchPath = inbound
            ? `${dest.origin}-${dest.destination}/${outbound}/${inbound}/1adults`
            : `${dest.origin}-${dest.destination}/${outbound}/1adults`;
        return `https://www.momondo.ro/flight-search/${searchPath}?sort=bestflight_a`;
    };

    const getVolaUrl = (dest) => {
        const { outbound, inbound } = getTravelDates(dest);
        const originInfo = VOLA_ORIGINS[dest.origin] ?? {
            city: dest.origin,
            code: dest.origin,
        };
        const baseUrl =
            `https://www.vola.ro/bilete-avion/din-${normalizeCityForPath(originInfo.city)}-${originInfo.code}` +
            `/catre-${normalizeCityForPath(dest.city)}-${dest.destination}/`;
        const params = new URLSearchParams({
            departureDate: outbound,
            adults: '1',
            flightType: inbound ? 'roundTrip' : 'oneWay',
        });

        if (inbound) {
            params.set('returnDate', inbound);
        }

        return `${baseUrl}?${params.toString()}`;
    };

    const getWizzUrl = (dest) => {
        const { outbound, inbound } = getTravelDates(dest);
        const inboundSegment = inbound || 'null';
        return `https://www.wizzair.com/en-gb/booking/select-flight/${dest.origin}/${dest.destination}/${outbound}/${inboundSegment}/1/0/0/null`;
    };

    const getRyanairUrl = (dest) => {
        const { outbound, inbound } = getTravelDates(dest);
        const params = new URLSearchParams({
            adults: '1',
            teens: '0',
            children: '0',
            infants: '0',
            dateOut: outbound,
            originIata: dest.origin,
            destinationIata: dest.destination,
            isConnectedFlight: 'false',
            discount: '0',
            promoCode: '',
            isReturn: inbound ? 'true' : 'false',
        });

        if (inbound) {
            params.set('dateIn', inbound);
        }

        return `https://www.ryanair.com/gb/en/trip/flights/select?${params.toString()}`;
    };

    return (
        <div className="explore-page">
            <TopNav />

            <div className="explore-body">
                <aside className="explore-sidebar">
                    <div className="explore-search-box">
                        <h2 className="explore-title">Explore flights</h2>
                        <p className="explore-sub">
                            Map prices are estimates. The selected date range is forwarded to
                            Momondo, Vola, Wizz Air and Ryanair.
                        </p>

                        <div className="explore-field">
                            <label>From</label>
                            <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                                {ORIGINS.map((o) => (
                                    <option key={o.code} value={o.code}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="explore-field">
                            <label>Departure date</label>
                            <input
                                type="date"
                                value={departureDate}
                                min={today}
                                onChange={handleDepartureDateChange}
                            />
                        </div>

                        <div className="explore-field">
                            <label>Return date</label>
                            <input
                                type="date"
                                value={returnDate}
                                min={departureDate}
                                onChange={handleReturnDateChange}
                                disabled={oneWay}
                            />
                        </div>

                        <div className="explore-toggles">
                            <label className="toggle-chip">
                                <input
                                    type="checkbox"
                                    checked={nonStop}
                                    onChange={(e) => setNonStop(e.target.checked)}
                                />
                                <span>Non-stop only</span>
                            </label>

                            <label className="toggle-chip">
                                <input
                                    type="checkbox"
                                    checked={oneWay}
                                    onChange={(e) => setOneWay(e.target.checked)}
                                />
                                <span>One way</span>
                            </label>
                        </div>

                        <button className="btn-explore-search" onClick={fetchExplore} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="btn-spinner" /> Searching...
                                </>
                            ) : (
                                'Search destinations'
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
                                <span>Price map</span>
                                <p>Click "Search destinations" to view prices on the map.</p>
                            </div>
                        )}

                        {!loading &&
                            destinations.map((dest, i) => {
                                const isCheap = cheapThreshold > 0 ? dest.price <= cheapThreshold : false;
                                const isSelected = selected?.id === dest.id;
                                const { outbound, inbound } = getTravelDates(dest);

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

                                                {outbound && (
                                                    <div className="dest-dates">
                                                        {fmtDate(outbound)}
                                                        {inbound && ` -> ${fmtDate(inbound)}`}
                                                        {inbound ? ' - Round trip' : ' - One way'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="dest-card-right">
                                            {isCheap && <div className="cheap-badge">Best deal</div>}

                                            <div className="dest-price">
                                                from {Math.round(dest.price)}{' '}
                                                <span className="dest-currency">{dest.currency}</span>
                                            </div>

                                            <a
                                                href={getMomondoUrl(dest)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-book-small"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Book {'->'}
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
                                X
                            </button>

                            <div className="popup-city">{selected.city}</div>
                            <div className="popup-code">
                                {selected.origin} {'->'} {selected.destination}
                            </div>

                            {getTravelDates(selected).outbound && (
                                <div className="popup-dates">
                                    {fmtDate(getTravelDates(selected).outbound)}
                                    {getTravelDates(selected).inbound &&
                                        ` - ${fmtDate(getTravelDates(selected).inbound)}`}
                                </div>
                            )}

                            <div className="popup-price">
                                from {Math.round(selected.price)} <span>{selected.currency}</span>
                            </div>

                            <p className="popup-hint">
                                The map price is indicative, but the links below open with the date range
                                selected in the filters.
                            </p>

                            <div className="popup-section-label">Flights</div>
                            <div className="popup-actions popup-actions--flights">
                                <a
                                    href={getMomondoUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-momondo"
                                >
                                    Momondo
                                </a>

                                <a
                                    href={getVolaUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-vola"
                                >
                                    Vola
                                </a>

                                <a
                                    href={getWizzUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-wizz"
                                >
                                    Wizz Air
                                </a>

                                <a
                                    href={getRyanairUrl(selected)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-popup-book btn-ryanair"
                                >
                                    Ryanair
                                </a>
                            </div>

                            <div className="popup-section-label" style={{ marginTop: '14px' }}>
                                Accommodation in {selected.city}
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
                                Create itinerary for {selected.city}
                            </button>
                        </div>
                    )}

                    {destinations.length > 0 && (
                        <div className="explore-legend">
                            <div className="legend-item">
                                <span className="legend-dot green" /> Cheapest
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot dark" /> Other destinations
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot purple" /> Selected
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
