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

    const storedName = localStorage.getItem('user_name') || 'Traveler';

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
            setNameMsg('Your name was updated.');
            setTimeout(() => setNameMsg(''), 3000);
        } catch {
            setNameMsg('Could not save your changes.');
        } finally {
            setSavingName(false);
        }
    };

    /* ── change password stub ── */
    const handleChangePw = async () => {
        if (pwForm.next !== pwForm.confirm) {
            setPwMsg('Passwords do not match.');
            return;
        }
        if (pwForm.next.length < 8) {
            setPwMsg('Password must be at least 8 characters long.');
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
                setPwMsg('Could not change the password.');
            } else {
                setPwMsg('Password changed successfully!');
                setPwForm({ current: '', next: '', confirm: '' });
                setTimeout(() => { setShowPwForm(false); setPwMsg(''); }, 2500);
            }
        } catch {
            setPwMsg('Network error.');
        } finally {
            setSavingPw(false);
        }
    };

    const fmtDate = (iso) =>
        iso
            ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
                                    placeholder="Your name"
                                />
                                <button className="prof-btn-sm" onClick={handleSaveName} disabled={savingName}>
                                    {savingName ? '...' : 'Save'}
                                </button>
                                <button className="prof-btn-ghost-sm" onClick={() => setEditingName(false)}>Cancel</button>
                            </div>
                        ) : (
                            <h1 className="prof-username">
                                {storedName}
                                <button
                                    className="prof-edit-icon"
                                    onClick={() => { setTmpName(storedName); setEditingName(true); }}
                                    title="Edit name"
                                >✏️</button>
                            </h1>
                        )}
                        {nameMsg && <p className="prof-success-msg">{nameMsg}</p>}
                        <p className="prof-joined">Travel Together member</p>
                    </div>

                    <div className="prof-hero-actions">
                        <button className="prof-btn-outline" onClick={() => navigate('/questionnaire')}>
                            🎯 Update preferences
                        </button>
                        <button className="prof-btn-outline" onClick={() => navigate('/itineraries/new')}>
                            ✈️ Plan a trip
                        </button>
                    </div>
                </section>

                {/* ══ STATS ══ */}
                <section className="prof-stats">
                    <StatCard
                        icon="🌍"
                        value={loading ? '—' : countryCounts.visited}
                        label="Visited countries"
                        color="#9ba59f"
                    />
                    <StatCard
                        icon="📋"
                        value={loading ? '—' : countryCounts.planned}
                        label="Planned countries"
                        color="#766fb5"
                    />
                    <StatCard
                        icon="💛"
                        value={loading ? '—' : countryCounts.wishlist}
                        label="Wishlist countries"
                        color="#986666"
                    />
                    <StatCard
                        icon="🗺️"
                        value={loading ? '—' : (data?.itinerariesCount ?? 0)}
                        label="Created itineraries"
                        color="#6366f1"
                    />
                </section>

                <div className="prof-grid">

                    {/* ══ RECENT ITINERARIES ══ */}
                    <section className="prof-card">
                        <div className="prof-card-header">
                            <h3>Recent itineraries</h3>
                            <button className="prof-card-link" onClick={() => navigate('/itineraries/new')}>
                                + New
                            </button>
                        </div>

                        {loading ? (
                            <p className="prof-muted">Loading...</p>
                        ) : !data?.recentItineraries?.length ? (
                            <div className="prof-empty">
                                <span>🗺️</span>
                                <p>No itineraries created yet.</p>
                                <button className="prof-btn-sm" onClick={() => navigate('/itineraries/new')}>
                                    Create your first itinerary
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
                            <h3>Travel preferences</h3>
                        </div>

                        {loading ? (
                            <p className="prof-muted">Loading...</p>
                        ) : data?.profile?.hasPreferences ? (
                            <div className="prof-pref-block">
                                <div className="prof-pref-badge">
                                    <span>✅</span>
                                    <div>
                                        <p className="prof-pref-title">Your profile is set up</p>
                                        <p className="prof-muted">
                                            {data.profile.preferencesCount} saved preferences. Your recommendations are personalized for you.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="prof-btn-outline prof-btn-full"
                                    onClick={() => navigate('/questionnaire')}
                                >
                                    Update preferences
                                </button>
                            </div>
                        ) : (
                            <div className="prof-empty">
                                <span>🎯</span>
                                <p>Complete the questionnaire for personalized recommendations.</p>
                                <button className="prof-btn-sm" onClick={() => navigate('/questionnaire')}>
                                    Complete it now
                                </button>
                            </div>
                        )}
                    </section>

                    {/* ══ ACCOUNT SETTINGS ══ */}
                    <section className="prof-card prof-card--wide">
                        <div className="prof-card-header">
                            <h3>Account settings</h3>
                        </div>

                        <div className="prof-settings-row">
                            <div className="prof-settings-label">
                                <span className="prof-settings-icon">🔒</span>
                                <div>
                                    <p className="prof-settings-title">Change password</p>
                                    <p className="prof-muted">Update your account password.</p>
                                </div>
                            </div>
                            <button
                                className="prof-btn-outline"
                                onClick={() => { setShowPwForm((v) => !v); setPwMsg(''); }}
                            >
                                {showPwForm ? 'Cancel' : 'Change'}
                            </button>
                        </div>

                        {showPwForm && (
                            <div className="prof-pw-form">
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={pwForm.current}
                                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                                />
                                <input
                                    type="password"
                                    placeholder="New password (min. 8 characters)"
                                    value={pwForm.next}
                                    onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={pwForm.confirm}
                                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                                />
                                {pwMsg && (
                                    <p className={pwMsg === 'Password changed successfully!' ? 'prof-success-msg' : 'prof-error-msg'}>
                                        {pwMsg}
                                    </p>
                                )}
                                <button className="prof-btn-sm" onClick={handleChangePw} disabled={savingPw}>
                                    {savingPw ? 'Saving...' : 'Save password'}
                                </button>
                            </div>
                        )}

                        <div className="prof-divider" />

                        <div className="prof-settings-row">
                            <div className="prof-settings-label">
                                <span className="prof-settings-icon">🚪</span>
                                <div>
                                    <p className="prof-settings-title">Log out</p>
                                    <p className="prof-muted">Sign out of your account on this device.</p>
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
