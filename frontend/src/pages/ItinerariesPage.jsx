import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Itineraries.css';
import api from '../api/axios';
import TopNav from '../components/TopNav';

const CATEGORY_META = {
    breakfast: { label: 'Breakfast', color: '#f59e0b', icon: '☕' },
    brunch: { label: 'Brunch', color: '#f97316', icon: '🥞' },
    lunch: { label: 'Lunch', color: '#10b981', icon: '🍽' },
    dinner: { label: 'Dinner', color: '#8b5cf6', icon: '🍷' },
    culture: { label: 'Culture', color: '#3b82f6', icon: '🏛' },
    leisure: { label: 'Leisure', color: '#ec4899', icon: '🛍' },
    transport: { label: 'Transport', color: '#64748b', icon: '🚆' },
    hotel: { label: 'Hotel', color: '#a78bfa', icon: '🏨' },
    nature: { label: 'Nature', color: '#22c55e', icon: '🌿' },
    other: { label: 'Other', color: '#94a3b8', icon: '📍' },
};

const inferCategoryFromKinds = (kinds) => {
    const normalized = String(kinds || '').toLowerCase();

    if (!normalized) return 'other';
    if (normalized.includes('museum') || normalized.includes('historic') || normalized.includes('architecture') || normalized.includes('cultural')) return 'culture';
    if (normalized.includes('restaurant') || normalized.includes('foods') || normalized.includes('cafe') || normalized.includes('bakery')) return 'breakfast';
    if (normalized.includes('hotel') || normalized.includes('hostel') || normalized.includes('apartment') || normalized.includes('accommodation') || normalized.includes('accomodation')) return 'hotel';
    if (normalized.includes('beach') || normalized.includes('natural') || normalized.includes('park') || normalized.includes('garden') || normalized.includes('water')) return 'nature';
    if (normalized.includes('transport') || normalized.includes('station') || normalized.includes('airport') || normalized.includes('railway')) return 'transport';
    if (normalized.includes('nightlife') || normalized.includes('amusement') || normalized.includes('shop') || normalized.includes('mall')) return 'leisure';

    return 'other';
};

const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
};

const diffDays = (start, end) => {
    if (!start || !end) return 1;
    return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
};

const addDays = (iso, n) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
};

const makeIcon = (n, color = '#6366f1') =>
    L.divIcon({
        className: '',
        html: `<div style="
            width:28px;height:28px;border-radius:50% 50% 50% 0;
            background:${color};border:2px solid #fff;display:flex;
            align-items:center;justify-content:center;color:#fff;
            font-size:11px;font-weight:700;transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,.4)">
            <span style="transform:rotate(45deg)">${n}</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
    });

function MapFitter({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points.length) return;
        if (points.length === 1) { map.setView(points[0], 13); return; }
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }, [points, map]);
    return null;
}

function CreateTripModal({ onCreated, initialData = {} }) {
    const [form, setForm] = useState({ name: '', destination: initialData.destination || '', startDate: '', endDate: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        const { name, startDate, endDate } = form;
        if (!name.trim() || !startDate || !endDate) {
            setError('Completeaza toate campurile obligatorii.');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setError('Data de final trebuie sa fie dupa data de start.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/itineraries', form);
            onCreated(data);
        } catch (e) {
            setError(e.response?.data?.message || 'Eroare la creare.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="itin-overlay">
            <div className="itin-modal create-modal">
                <div className="create-modal-bar" />
                <h2 className="modal-title">Planifica o vacanta</h2>
                <p className="modal-sub">Creeaza un itinerariu si organizeaza fiecare zi din calatorie.</p>

                <div className="itin-field">
                    <label>Numele vacantei *</label>
                    <input placeholder="ex: Summer Roadtrip 2025" value={form.name} onChange={set('name')} />
                </div>

                <div className="itin-field">
                    <label>Destinatie principala</label>
                    <input placeholder="ex: Roma, Italia" value={form.destination} onChange={set('destination')} />
                </div>

                <div className="itin-field-row">
                    <div className="itin-field">
                        <label>Data de start *</label>
                        <input type="date" value={form.startDate} onChange={set('startDate')} />
                    </div>
                    <div className="itin-field">
                        <label>Data de final *</label>
                        <input type="date" value={form.endDate} onChange={set('endDate')} />
                    </div>
                </div>

                {error && <p className="itin-error">{error}</p>}

                <div className="itin-modal-actions">
                    <button className="itin-btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Se creeaza...' : 'Creeaza itinerarul'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddStopModal({ tripId, dayIndex, dayDate, onAdded, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ category: 'other', time: '10:00', notes: '' });
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get(`/itineraries/${tripId}/search-poi?q=${encodeURIComponent(query)}`);
                setResults(Array.isArray(data) ? data : []);
            } catch { setResults([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [query, tripId]);

    const handleAdd = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            await onAdded({
                name: selected.name,
                address: selected.country_en || selected.country || '',
                lat: selected.lat ?? selected.latitude ?? null,
                lng: selected.lng ?? selected.longitude ?? null,
                dayIndex,
                category: form.category,
                time: form.time,
                notes: form.notes,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="itin-overlay" onClick={onClose}>
            <div className="itin-modal" onClick={(e) => e.stopPropagation()}>
                <button className="itin-close-btn" onClick={onClose}>✕</button>
                <h3 className="modal-title sm">Adauga o oprire</h3>
                <p className="modal-sub">Ziua {dayIndex + 1} · {fmtDate(dayDate)}</p>

                <div className="itin-field">
                    <label>Cauta locatie</label>
                    <div className="search-wrap">
                        <input
                            placeholder="Restaurant, muzeu, hotel..."
                            value={selected ? selected.name : query}
                            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                        />
                        {!selected && results.length > 0 && (
                            <ul className="search-dropdown">
                                {results.map((r) => (
                                    <li key={r.id} onClick={() => { setSelected(r); setQuery(r.name || ''); setResults([]); }}>
                                        <span className="sd-name">{r.name}</span>
                                        <span className="sd-country">{r.country_en || r.country}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="itin-field-row">
                    <div className="itin-field">
                        <label>Ora</label>
                        <input type="time" value={form.time} onChange={set('time')} />
                    </div>
                    <div className="itin-field" style={{ flex: 2 }}>
                        <label>Notite (optional)</label>
                        <input placeholder="ex: rezervare nr. 4521" value={form.notes} onChange={set('notes')} />
                    </div>
                </div>

                <div className="itin-modal-actions">
                    <button className="itin-btn-ghost" onClick={onClose}>Anuleaza</button>
                    <button className="itin-btn-primary" disabled={!selected || loading} onClick={handleAdd}>
                        {loading ? 'Se adauga...' : '+ Adauga oprire'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InviteModal({ tripId, onClose }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInvite = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError('');
        try {
            await api.post(`/itineraries/${tripId}/invite`, { email });
            setSent(true);
        } catch (e) {
            setError(e.response?.data?.message || 'Eroare la trimitere.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="itin-overlay" onClick={onClose}>
            <div className="itin-modal" onClick={(e) => e.stopPropagation()}>
                <button className="itin-close-btn" onClick={onClose}>✕</button>
                <h3 className="modal-title sm">Invita un prieten</h3>
                <p className="modal-sub">Planificati impreuna acelasi itinerariu.</p>

                {sent ? (
                    <div className="invite-sent">
                        <span>🎉</span>
                        <p>Invitatia a fost trimisa cu succes!</p>
                    </div>
                ) : (
                    <>
                        <div className="itin-field">
                            <label>Adresa de email</label>
                            <input
                                type="email"
                                placeholder="prieten@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                            />
                        </div>
                        {error && <p className="itin-error">{error}</p>}
                        <div className="itin-modal-actions">
                            <button className="itin-btn-ghost" onClick={onClose}>Anuleaza</button>
                            <button className="itin-btn-primary" onClick={handleInvite} disabled={loading}>
                                {loading ? 'Se trimite...' : 'Trimite invitatie'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function RecommendationsSection({ tripId, selectedDay, onAdded, tripStops = [] }) {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [addingXid, setAddingXid] = useState(null);

    useEffect(() => {
        if (!tripId) return;
        setRecs([]);
        setError('');
        setLoading(true);

        api.get(`/itineraries/${tripId}/recommendations`)
            .then(({ data }) => setRecs(Array.isArray(data) ? data : []))
            .catch((e) => setError(e.response?.data?.message || 'Nu am putut incarca recomandarile.'))
            .finally(() => setLoading(false));
    }, [tripId]);

    const handleAdd = async (rec) => {
        setAddingXid(rec.xid);
        try {
            const mappedCategory = inferCategoryFromKinds(rec.kinds);
            const { data } = await api.post(`/itineraries/${tripId}/items`, {
                name: rec.name,
                lat: rec.lat,
                lon: rec.lon,
                kinds: rec.kinds,
                xid: rec.xid,
                category: mappedCategory,
                day_number: selectedDay + 1,
            });
            if (onAdded) onAdded(data, selectedDay);
        } catch (e) {
            console.error('addItem error:', e);
        } finally {
            setAddingXid(null);
        }
    };
    if (loading) {
        return (
            <div className="itin-recs-section">
                <div className="itin-recs-header">
                    <span>✨</span>
                    <h3>Recomandari pentru tine</h3>
                </div>
                <p className="itin-recs-status">Se cauta atractii...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="itin-recs-section">
                <div className="itin-recs-header">
                    <span>✨</span>
                    <h3>Recomandari pentru tine</h3>
                </div>
                <p className="itin-recs-status itin-recs-error">{error}</p>
            </div>
        );
    }

    if (recs.length === 0) return null;

    return (
        <div className="itin-recs-section">
            <div className="itin-recs-header">
                <span>✨</span>
                <h3>Recomandari pentru tine</h3>
                <span className="itin-recs-subtitle">
                    Atractii bazate pe preferintele tale · se adauga in Ziua {selectedDay + 1}
                </span>
            </div>

            <div className="itin-recs-grid">
                {recs.map((rec) => {
                    const isAdded = tripStops.some(stop => stop.name === rec.name);
                    const isAdding = addingXid === rec.xid;

                    return (
                        <div key={rec.xid} className={`itin-rec-card ${isAdded ? 'itin-rec-card--added' : ''}`}>
                            <h4 className="itin-rec-name">{rec.name}</h4>
                            {rec.rate > 0 && (
                                <div className="itin-rec-rate">
                                    {'★'.repeat(Math.min(rec.rate, 3))}{'☆'.repeat(Math.max(0, 3 - rec.rate))}
                                </div>
                            )}
                            <button
                                className={`itin-rec-btn ${isAdded ? 'itin-rec-btn--added' : ''}`}
                                disabled={isAdded || isAdding}
                                onClick={() => handleAdd(rec)}
                            >
                                {isAdded ? '✓ Adaugat' : isAdding ? 'Se adauga...' : '+ Adauga in plan'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const ItinerariesPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(!!id && id !== 'new');
    const [showCreate, setShowCreate] = useState(!id || id === 'new');
    const [selectedDay, setSelectedDay] = useState(0);
    const [showAddStop, setShowAddStop] = useState(false);
    const [aiSuggestion, setAiSug] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [tmpName, setTmpName] = useState('');

    useEffect(() => {
        if (!id || id === 'new') return;
        (async () => {
            try {
                const { data } = await api.get(`/itineraries/${id}`);
                setTrip(data);
            } catch (e) {
                console.error(e);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate]);

    const initialData = {
        destination: location.state?.city
            ? `${location.state.city}${location.state.country ? ', ' + location.state.country : ''}`
            : '',
    };
    const days = useMemo(() => {
        if (!trip) return [];
        const n = diffDays(trip.startDate, trip.endDate);
        return Array.from({ length: n }, (_, i) => ({
            date: addDays(trip.startDate, i),
            stops: (trip.stops || [])
                .filter((s) => {
                    const indexCalculat = s.day_number !== undefined ? (Number(s.day_number) - 1) : Number(s.dayIndex);
                    return indexCalculat === i;
                })
                .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
        }));
    }, [trip]);

    const progress = useMemo(() => {
        if (!trip?.stops?.length) return 0;
        const done = trip.stops.filter((s) => s.done).length;
        return Math.round((done / trip.stops.length) * 100);
    }, [trip]);

    const mapPoints = useMemo(() => {
        if (!days[selectedDay]) return [];
        return days[selectedDay].stops
            .filter((s) => s.lat != null && (s.lng != null || s.lon != null))
            .map((s) => [parseFloat(s.lat), parseFloat(s.lng ?? s.lon)]);
    }, [days, selectedDay]);

    const handleCreated = (data) => {
        setTrip(data);
        setShowCreate(false);
        navigate(`/itineraries/${data.id}`, { replace: true });
        setTimeout(() => {
            setAiSug({ text: 'Am gasit locatii populare in zona destinatiei tale. Poti adauga opriri din bara laterala!' });
        }, 1400);
    };

    const handleAddStop = async (stopData) => {
        try {
            const { data } = await api.post(`/itineraries/${trip.id}/items`, stopData);
            setTrip((prev) => ({ ...prev, stops: [...(prev.stops || []), data] }));
        } catch (e) {
            console.error(e);
            setTrip((prev) => ({ ...prev, stops: [...(prev.stops || []), { ...stopData, id: Date.now() }] }));
        }
        setShowAddStop(false);
        if ((days[selectedDay]?.stops.length || 0) >= 2) {
            setAiSug({ text: 'Exista locuri apreciate de turisti intre opririle tale. Vrei mai multe sugestii?' });
        }
    };

    const handleRemoveStop = async (stopId) => {
        try { await api.delete(`/itineraries/${trip.id}/stops/${stopId}`); } catch (e) { console.error(e); }
        setTrip((prev) => ({ ...prev, stops: (prev.stops || []).filter((s) => s.id !== stopId) }));
    };

    const handleToggleDone = async (stopId) => {
        const stop = trip?.stops?.find((s) => s.id === stopId);
        if (!stop) return;
        try { await api.patch(`/itineraries/${trip.id}/stops/${stopId}`, { done: !stop.done }); } catch (e) { console.error(e); }
        setTrip((prev) => ({
            ...prev,
            stops: (prev.stops || []).map((s) => s.id === stopId ? { ...s, done: !s.done } : s),
        }));
    };

    const handleSave = async () => {
        if (!trip) return;
        setSaving(true);
        try { await api.put(`/itineraries/${trip.id}`, { name: trip.name }); } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleBookAccommodations = () => {
        navigate('/accommodations', {
            state: {
                destination: trip?.destination || '',
                checkin: trip?.startDate || '',
                checkout: trip?.endDate || '',
            },
        });
    };

    const handleRecAdded = (newItem, dayIdx) => {
        const mappedCategory = newItem.category || inferCategoryFromKinds(newItem.kinds);
        const newStop = {
            id: newItem.id,
            name: newItem.name,
            lat: newItem.lat,
            lng: newItem.lon,
            dayIndex: dayIdx,
            category: mappedCategory,
            time: '12:00',
            done: false
        };

        setTrip((prev) => ({
            ...prev,
            stops: [...(prev.stops || []), newStop]
        }));

        setAiSug({ text: `"${newItem.name}" a fost adaugat in Ziua ${dayIdx + 1}!` });
    };
    if (loading) {
        return (
            <div className="itin-loading">
                <div className="itin-spinner" />
                <p>Se incarca itinerarul...</p>
            </div>
        );
    }

    return (
        <>
            <TopNav />

            {showCreate && <CreateTripModal onCreated={handleCreated} onCancel={() => navigate('/dashboard')} initialData={initialData} />}

            {showAddStop && trip && (
                <AddStopModal
                    tripId={trip.id}
                    dayIndex={selectedDay}
                    dayDate={days[selectedDay]?.date}
                    onAdded={handleAddStop}
                    onClose={() => setShowAddStop(false)}
                />
            )}
            {trip && (
                <div className="itin-page">
                    <div className="itin-page-header">
                        <div className="itin-title-block">
                            {editingName ? (
                                <input
                                    className="itin-title-input"
                                    value={tmpName}
                                    autoFocus
                                    onChange={(e) => setTmpName(e.target.value)}
                                    onBlur={() => {
                                        if (tmpName.trim()) setTrip((p) => ({ ...p, name: tmpName.trim() }));
                                        setEditingName(false);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                />
                            ) : (
                                <h1 className="itin-title" onClick={() => { setTmpName(trip.name || ''); setEditingName(true); }}>
                                    {trip.name}
                                    <span className="itin-edit-icon">✏</span>
                                </h1>
                            )}
                            <div className="itin-meta">
                                <span>📅 {fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}</span>
                                {trip.destination && <span>📍 {trip.destination}</span>}
                            </div>
                        </div>

                        <div className="itin-header-actions">
                            <div className="itin-progress-wrap">
                                <div className="itin-progress-label">{progress}% complet</div>
                                <div className="itin-progress-bar">
                                    <div className="itin-progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <button className="itin-btn-ghost" onClick={handleBookAccommodations}>Book your accommodations</button>
                            <button className="itin-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? '...' : '💾 Salveaza'}
                            </button>
                        </div>
                    </div>

                    <div className="itin-body">
                        <div className="itin-left">
                            <div className="itin-day-tabs">
                                {days.map((d, i) => (
                                    <button
                                        key={i}
                                        className={`day-tab ${selectedDay === i ? 'day-tab--active' : ''}`}
                                        onClick={() => setSelectedDay(i)}
                                    >
                                        <span className="day-tab__num">Ziua {i + 1}</span>
                                        <span className="day-tab__date">{fmtDate(d.date)}</span>
                                        {d.stops.length > 0 && <span className="day-tab__badge">{d.stops.length}</span>}
                                    </button>
                                ))}
                            </div>

                            {aiSuggestion && (
                                <div className="ai-banner">
                                    <span className="ai-icon">✨</span>
                                    <p>{aiSuggestion.text}</p>
                                    <button className="ai-dismiss" onClick={() => setAiSug(null)}>✕</button>
                                </div>
                            )}

                            <div className="itin-stops-list">
                                {days[selectedDay]?.stops.length === 0 ? (
                                    <div className="itin-empty-day">
                                        <span>🗺</span>
                                        <p>Nicio oprire pentru aceasta zi.</p>
                                        <p className="itin-empty-hint">Apasa butonul de jos pentru a adauga.</p>
                                    </div>
                                ) : (
                                    days[selectedDay].stops.map((stop, idx) => {
                                        const meta = CATEGORY_META[stop.category] || CATEGORY_META.other;
                                        return (
                                            <div key={stop.id} className={`stop-card ${stop.done ? 'stop-card--done' : ''}`}>
                                                <div className="stop-timeline">
                                                    <div
                                                        className="stop-dot"
                                                        style={{ background: meta.color }}
                                                        onClick={() => handleToggleDone(stop.id)}
                                                        title="Marcheaza ca vizitat"
                                                    >
                                                        {stop.done ? '✓' : idx + 1}
                                                    </div>
                                                    {idx < days[selectedDay].stops.length - 1 && <div className="stop-line" />}
                                                </div>
                                                <div className="stop-content">
                                                    <div className="stop-header">
                                                        <button className="stop-remove" onClick={() => handleRemoveStop(stop.id)}>✕</button>
                                                    </div>
                                                    <h4 className="stop-name">{stop.name}</h4>
                                                    <div className="stop-meta">
                                                        {stop.time && <span>🕐 {stop.time}</span>}
                                                        {stop.address && <span>📍 {stop.address}</span>}
                                                    </div>
                                                    {stop.notes && <p className="stop-notes">{stop.notes}</p>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <button className="itin-add-stop-btn" onClick={() => setShowAddStop(true)}>
                                + Adauga o oprire
                            </button>
                        </div>

                        <div className="itin-right">
                            <MapContainer
                                center={mapPoints[0] || [45.9, 24.9]}
                                zoom={mapPoints.length ? 12 : 6}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                />
                                <MapFitter points={mapPoints} />
                                {mapPoints.length > 1 && (
                                    <Polyline
                                        positions={mapPoints}
                                        pathOptions={{ color: '#6366f1', weight: 3, dashArray: '8 4', opacity: 0.85 }}
                                    />
                                )}
                                {(days[selectedDay]?.stops || [])
                                    .filter((s) => s.lat != null && (s.lng != null || s.lon != null))
                                    .map((stop, idx) => {
                                        const validLng = stop.lng ?? stop.lon;
                                        const meta = CATEGORY_META[stop.category] || CATEGORY_META.other;
                                        return (
                                            <Marker key={stop.id} position={[parseFloat(stop.lat), parseFloat(validLng)]} icon={makeIcon(idx + 1, meta.color)}>
                                                <Popup>
                                                    <strong>{stop.name}</strong><br />
                                                    {stop.time && <small>🕐 {stop.time}</small>}
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                            </MapContainer>
                            <div className="map-overlay-badge">
                                <span className="mob-day">Ziua {selectedDay + 1}</span>
                                <span>{days[selectedDay]?.stops.length || 0} opriri</span>
                            </div>
                        </div>
                    </div>

                    <RecommendationsSection
                        tripId={trip.id}
                        selectedDay={selectedDay}
                        onAdded={handleRecAdded}
                        tripStops={trip.stops || []}
                    />
                </div>
            )}
        </>
    );
};

export default ItinerariesPage;
