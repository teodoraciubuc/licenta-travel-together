import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TopNav from '../components/TopNav';
import '../styles/Accommodations.css';

const TRENDING_CITIES = [
    { city: 'Rome', country: 'Italy', note: 'Historic center and easy weekend stays' },
    { city: 'Barcelona', country: 'Spain', note: 'Beach city breaks with lots of apartments' },
    { city: 'Amsterdam', country: 'Netherlands', note: 'Boutique hotels and canal stays' },
    { city: 'Vienna', country: 'Austria', note: 'Elegant hotels close to landmarks' },
];

function toDateInputValue(value, fallback) {
    if (!value) return fallback;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const isoDateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);

        if (isoDateMatch) {
            return isoDateMatch[1];
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
        }
    }

    return fallback;
}

function buildBookingUrl(city, checkin, checkout, guests) {
    const params = new URLSearchParams({
        ss: city,
        checkin,
        checkout,
        group_adults: String(guests),
        no_rooms: '1',
        lang: 'en',
    });

    return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function buildAirbnbUrl(city, checkin, checkout, guests) {
    const params = new URLSearchParams({
        checkin,
        checkout,
        adults: String(guests),
    });

    return `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes?${params.toString()}`;
}

export default function AccommodationsPage() {
    const location = useLocation();
    const initialDestination = location.state?.destination?.trim() || 'Rome';

    const [form, setForm] = useState({
        city: initialDestination,
        checkin: '',
        checkout: '',
        guests: 2,
    });

    const setField = (key) => (event) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const featuredLinks = useMemo(() => {
        const location = form.city.trim() || 'Rome';

        return {
            booking: buildBookingUrl(location, form.checkin, form.checkout, form.guests),
            airbnb: buildAirbnbUrl(location, form.checkin, form.checkout, form.guests),
        };
    }, [form]);

    const hasValidDates =
        !!form.checkin &&
        !!form.checkout &&
        toDateInputValue(form.checkin, '') <= toDateInputValue(form.checkout, '');

    const applyCity = (city, country) => {
        setForm((prev) => ({ ...prev, city: `${city}, ${country}` }));
    };

    return (
        <div className="stays-page">
            <TopNav />

            <main className="stays-main">
                <section className="stays-hero">
                    <div className="stays-copy">
                        <p className="stays-eyebrow">Accommodation planning</p>
                        <h1>Find the right accommodation for your next trip</h1>
                        <p className="stays-description">
                            Pick a city, travel dates and number of guests, then jump straight to booking platforms.
                        </p>
                    </div>

                    <div className="stays-panel">
                        <div className="stays-field">
                            <label>Destination</label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={setField('city')}
                                placeholder="City or country"
                            />
                        </div>

                        <div className="stays-grid">
                            <div className="stays-field">
                                <label>Check-in</label>
                                <input type="date" value={form.checkin} onChange={setField('checkin')} />
                            </div>

                            <div className="stays-field">
                                <label>Check-out</label>
                                <input type="date" value={form.checkout} onChange={setField('checkout')} />
                            </div>
                        </div>

                        {!hasValidDates && (
                            <p className="stays-hint">
                                Choose your travel dates first. They will be sent to Booking and Airbnb when you open a search.
                            </p>
                        )}

                        <div className="stays-field">
                            <label>Guests</label>
                            <select value={form.guests} onChange={setField('guests')}>
                                {[1, 2, 3, 4, 5, 6].map((guestCount) => (
                                    <option key={guestCount} value={guestCount}>
                                        {guestCount} guest{guestCount > 1 ? 's' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="stays-actions">
                            <a
                                href={featuredLinks.booking}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`stays-btn stays-btn--booking ${!hasValidDates ? 'stays-btn--disabled' : ''}`}
                                aria-disabled={!hasValidDates}
                                onClick={(event) => {
                                    if (!hasValidDates) event.preventDefault();
                                }}
                            >
                                Search on Booking
                            </a>
                            <a
                                href={featuredLinks.airbnb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`stays-btn stays-btn--airbnb ${!hasValidDates ? 'stays-btn--disabled' : ''}`}
                                aria-disabled={!hasValidDates}
                                onClick={(event) => {
                                    if (!hasValidDates) event.preventDefault();
                                }}
                            >
                                Search on Airbnb
                            </a>
                        </div>
                    </div>
                </section>

                <section className="stays-trending">
                    <div className="stays-section-head">
                        <h2>Popular city ideas</h2>
                        <p>Quick shortcuts for destinations that usually have a good mix of hotels and apartments.</p>
                    </div>

                    <div className="stays-cards">
                        {TRENDING_CITIES.map((item) => (
                            <article key={item.city} className="stays-card">
                                <div className="stays-card__meta">{item.country}</div>
                                <h3>{item.city}</h3>
                                <p>{item.note}</p>
                                <button type="button" className="stays-card__btn" onClick={() => applyCity(item.city, item.country)}>
                                    Use this destination
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
