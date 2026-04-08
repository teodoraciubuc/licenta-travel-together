import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import TopNav from '../components/TopNav';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function StatCard({ icon, value, label, color }) {
    return (
        <div className="prof-stat-card" style={{ '--accent': color }}>
            <div className="prof-stat-icon">{icon}</div>
            <div className="prof-stat-value">{value}</div>
            <div className="prof-stat-label">{label}</div>
        </div>
    );
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    /* edit username */
    const [editingName, setEditingName] = useState(false);
    const [tmpName, setTmpName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameMsg, setNameMsg] = useState('');

    /* change password */
    const [showPwForm, setShowPwForm] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwMsg, setPwMsg] = useState('');
    const [savingPw, setSavingPw] = useState(false);

    const storedName = localStorage.getItem('user_name') || 'Călătorule';

    const [mapData, setMapData] = useState(null);

    /* ── fetch dashboard + map data ── */
    useEffect(() => {
        (async () => {
            try {
                const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
                const [dashRes, mapRes] = await Promise.all([
                    fetch(`${BASE}/api/dashboard`, { headers }),
                    fetch(`${BASE}/api/map/me`, { headers }),
                ]);
                if (dashRes.ok) setData(await dashRes.json());
                if (mapRes.ok) setMapData(await mapRes.json());
            } catch {
                /* silently degrade */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── country counts by status ── */
    const countryCounts = React.useMemo(() => {
        const counts = { visited: 0, planned: 0, wishlist: 0 };
        for (const c of (mapData?.countries || [])) {
            if (counts[c.status] !== undefined) counts[c.status]++;
        }
        return counts;
    }, [mapData]);

    /* ── avatar initials ── */
    const initials = storedName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    /* ── save display name (localStorage only — add endpoint if needed) ── */
    const handleSaveName = async () => {
        if (!tmpName.trim()) return;
        setSavingName(true);
        try {
            const res = await fetch(`${BASE}/api/auth/username`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: tmpName.trim() }),
            });
            if (!res.ok) throw new Error();
            localStorage.setItem('user_name', tmpName.trim());
            setEditingName(false);
            setNameMsg('Numele a fost actualizat.');
            setTimeout(() => setNameMsg(''), 3000);
        } catch {
            setNameMsg('Eroare la salvare.');
        } finally {
            setSavingName(false);
        }
    };

    /* ── change password stub ── */
    const handleChangePw = async () => {
        if (pwForm.next !== pwForm.confirm) {
            setPwMsg('Parolele nu se potrivesc.');
            return;
        }
        if (pwForm.next.length < 8) {
            setPwMsg('Parola trebuie să aibă minim 8 caractere.');
            return;
        }
        setSavingPw(true);
        setPwMsg('');
        try {
            const res = await fetch(`${BASE}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: pwForm.current,
                    newPassword: pwForm.next,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setPwMsg(err.message || 'Eroare la schimbarea parolei.');
            } else {
                setPwMsg('✓ Parola a fost schimbată cu succes!');
                setPwForm({ current: '', next: '', confirm: '' });
                setTimeout(() => { setShowPwForm(false); setPwMsg(''); }, 2500);
            }
        } catch {
            setPwMsg('Eroare de rețea.');
        } finally {
            setSavingPw(false);
        }
    };

    const fmtDate = (iso) =>
        iso
            ? new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—';

    return (
        <div className="prof-page">
            {/* ── NAV ── */}
            <TopNav />

            <main className="prof-main">

                {/* ══ HERO CARD ══ */}
                <section className="prof-hero">
                    <div className="prof-avatar">{initials}</div>

                    <div className="prof-hero-info">
                        {editingName ? (
                            <div className="prof-name-edit">
                                <input
                                    className="prof-name-input"
                                    value={tmpName}
                                    autoFocus
                                    onChange={(e) => setTmpName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    placeholder="Numele tău"
                                />
                                <button className="prof-btn-sm" onClick={handleSaveName} disabled={savingName}>
                                    {savingName ? '...' : 'Salvează'}
                                </button>
                                <button className="prof-btn-ghost-sm" onClick={() => setEditingName(false)}>Anulează</button>
                            </div>
                        ) : (
                            <h1 className="prof-username">
                                {storedName}
                                <button
                                    className="prof-edit-icon"
                                    onClick={() => { setTmpName(storedName); setEditingName(true); }}
                                    title="Editează numele"
                                >✏️</button>
                            </h1>
                        )}
                        {nameMsg && <p className="prof-success-msg">{nameMsg}</p>}
                        <p className="prof-joined">Membru Travel Together</p>
                    </div>

                    <div className="prof-hero-actions">
                        <button className="prof-btn-outline" onClick={() => navigate('/questionnaire')}>
                            🎯 Actualizează preferințele
                        </button>
                        <button className="prof-btn-outline" onClick={() => navigate('/itineraries/new')}>
                            ✈️ Planifică o vacanță
                        </button>
                    </div>
                </section>

                {/* ══ STATS ══ */}
                <section className="prof-stats">
                    <StatCard
                        icon="🌍"
                        value={loading ? '—' : countryCounts.visited}
                        label="Țări vizitate"
                        color="#9ba59f"
                    />
                    <StatCard
                        icon="📋"
                        value={loading ? '—' : countryCounts.planned}
                        label="Țări planificate"
                        color="#766fb5"
                    />
                    <StatCard
                        icon="💛"
                        value={loading ? '—' : countryCounts.wishlist}
                        label="Țări pe wishlist"
                        color="#986666"
                    />
                    <StatCard
                        icon="🗺️"
                        value={loading ? '—' : (data?.itinerariesCount ?? 0)}
                        label="Itinerarii create"
                        color="#6366f1"
                    />
                </section>

                <div className="prof-grid">

                    {/* ══ RECENT ITINERARIES ══ */}
                    <section className="prof-card">
                        <div className="prof-card-header">
                            <h3>Itinerarii recente</h3>
                            <button className="prof-card-link" onClick={() => navigate('/itineraries/new')}>
                                + Nou
                            </button>
                        </div>

                        {loading ? (
                            <p className="prof-muted">Se încarcă...</p>
                        ) : !data?.recentItineraries?.length ? (
                            <div className="prof-empty">
                                <span>🗺️</span>
                                <p>Niciun itinerariu creat încă.</p>
                                <button className="prof-btn-sm" onClick={() => navigate('/itineraries/new')}>
                                    Creează primul itinerariu
                                </button>
                            </div>
                        ) : (
                            <ul className="prof-itin-list">
                                {data.recentItineraries.map((it) => (
                                    <li
                                        key={it.id}
                                        className="prof-itin-item"
                                        onClick={() => navigate(`/itineraries/${it.id}`)}
                                    >
                                        <div className="prof-itin-icon">✈️</div>
                                        <div className="prof-itin-body">
                                            <span className="prof-itin-title">{it.title}</span>
                                            <span className="prof-itin-dates">
                                                {fmtDate(it.start_date)} → {fmtDate(it.end_date)}
                                            </span>
                                        </div>
                                        <span className="prof-itin-arrow">›</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* ══ TRAVEL PREFERENCES ══ */}
                    <section className="prof-card">
                        <div className="prof-card-header">
                            <h3>Preferințe de călătorie</h3>
                        </div>

                        {loading ? (
                            <p className="prof-muted">Se încarcă...</p>
                        ) : data?.profile?.hasPreferences ? (
                            <div className="prof-pref-block">
                                <div className="prof-pref-badge">
                                    <span>✅</span>
                                    <div>
                                        <p className="prof-pref-title">Profilul tău e configurat</p>
                                        <p className="prof-muted">
                                            {data.profile.preferencesCount} preferințe salvate — recomandările sunt personalizate pentru tine.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="prof-btn-outline prof-btn-full"
                                    onClick={() => navigate('/questionnaire')}
                                >
                                    🎯 Actualizează preferințele
                                </button>
                            </div>
                        ) : (
                            <div className="prof-empty">
                                <span>🎯</span>
                                <p>Completează chestionarul pentru recomandări personalizate.</p>
                                <button className="prof-btn-sm" onClick={() => navigate('/questionnaire')}>
                                    Completează acum
                                </button>
                            </div>
                        )}
                    </section>

                    {/* ══ ACCOUNT SETTINGS ══ */}
                    <section className="prof-card prof-card--wide">
                        <div className="prof-card-header">
                            <h3>Setări cont</h3>
                        </div>

                        <div className="prof-settings-row">
                            <div className="prof-settings-label">
                                <span className="prof-settings-icon">🔒</span>
                                <div>
                                    <p className="prof-settings-title">Schimbă parola</p>
                                    <p className="prof-muted">Actualizează parola contului tău.</p>
                                </div>
                            </div>
                            <button
                                className="prof-btn-outline"
                                onClick={() => { setShowPwForm((v) => !v); setPwMsg(''); }}
                            >
                                {showPwForm ? 'Anulează' : 'Schimbă'}
                            </button>
                        </div>

                        {showPwForm && (
                            <div className="prof-pw-form">
                                <input
                                    type="password"
                                    placeholder="Parola curentă"
                                    value={pwForm.current}
                                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                                />
                                <input
                                    type="password"
                                    placeholder="Parola nouă (min. 8 caractere)"
                                    value={pwForm.next}
                                    onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmă parola nouă"
                                    value={pwForm.confirm}
                                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                                />
                                {pwMsg && (
                                    <p className={pwMsg.startsWith('✓') ? 'prof-success-msg' : 'prof-error-msg'}>
                                        {pwMsg}
                                    </p>
                                )}
                                <button className="prof-btn-sm" onClick={handleChangePw} disabled={savingPw}>
                                    {savingPw ? 'Se salvează...' : 'Salvează parola'}
                                </button>
                            </div>
                        )}

                        <div className="prof-divider" />

                        <div className="prof-settings-row">
                            <div className="prof-settings-label">
                                <span className="prof-settings-icon">🚪</span>
                                <div>
                                    <p className="prof-settings-title">Deconectare</p>
                                    <p className="prof-muted">Ieși din contul tău pe acest dispozitiv.</p>
                                </div>
                            </div>
                            <button className="prof-btn-danger" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
