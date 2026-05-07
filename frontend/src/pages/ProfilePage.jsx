import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import '../styles/Profile.css';
import TopNav from '../components/TopNav';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const RADIAN = Math.PI / 180;
const ANALYTICS_COLORS = {
    visited: '#c4c0ec',
    planned: '#8B84D8',
    wishlist: '#C58A92',
};
const ANALYTICS_TOOLTIP_STYLE = {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '12px',
    color: '#e2e8f0',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.28)',
};

function formatTimelineDate(value, mode = 'tick') {
    if (!value) return '';

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;

    if (mode === 'tooltip') {
        return parsed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    const month = parsed.toLocaleDateString('en-GB', { month: 'short' });
    const year = String(parsed.getFullYear()).slice(-2);
    return `${month} '${year}`;
}

function AnalyticsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 19.5V5.5M4 19.5H20M8 15L11 12L14 14L19 8.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="8" cy="15" r="1.5" fill="currentColor" />
            <circle cx="11" cy="12" r="1.5" fill="currentColor" />
            <circle cx="14" cy="14" r="1.5" fill="currentColor" />
            <circle cx="19" cy="8.5" r="1.5" fill="currentColor" />
        </svg>
    );
}

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
    /* travel analytics */
    const analyticsStatusData = React.useMemo(() => ([
        {
            key: 'visited',
            name: 'Visited',
            value: data?.mapCounts?.visited ?? 0,
            color: ANALYTICS_COLORS.visited,
        },
        {
            key: 'planned',
            name: 'Planned',
            value: data?.mapCounts?.planned ?? 0,
            color: ANALYTICS_COLORS.planned,
        },
        {
            key: 'wishlist',
            name: 'Wishlist',
            value: data?.mapCounts?.wishlist ?? 0,
            color: ANALYTICS_COLORS.wishlist,
        },
    ]), [data]);

    const tripsTimelineData = React.useMemo(() => {
        const timeline = Array.isArray(data?.tripsTimeline) ? data.tripsTimeline : [];

        if (!timeline.length) {
            return [{ date: '', total: 0 }];
        }

        return timeline.map((point) => ({
            date: point.date,
            total: Number(point.total) || 0,
        }));
    }, [data]);

    const analyticsTotal = analyticsStatusData.reduce((sum, item) => sum + item.value, 0);
    const totalTrips = data?.itinerariesCount ?? 0;
    const donutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
        if (!value || !analyticsTotal) return null;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#f8fafc"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
            >
                {`${Math.round(percent * 100)}%`}
            </text>
        );
    };

    /* avatar initials */
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

                <section className="prof-card prof-analytics">
                    <div className="prof-card-header prof-analytics-header">
                        <div className="prof-analytics-title-wrap">
                            <span className="prof-analytics-title-icon">
                                <AnalyticsIcon />
                            </span>
                            <h3>Travel analytics</h3>
                        </div>
                        <span className="prof-analytics-range">Last 12 months</span>
                    </div>

                    <div className="prof-analytics-grid">
                        <div className="prof-analytics-panel">
                            <div className="prof-analytics-panel-head">
                                <div>
                                    <h4>Countries by status</h4>
                                </div>
                            </div>

                            <div className="prof-analytics-donut">
                                <div className="prof-analytics-chart prof-analytics-chart--donut">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[{ name: 'Total', value: 1 }]}
                                                dataKey="value"
                                                innerRadius={62}
                                                outerRadius={92}
                                                stroke="none"
                                                fill="rgba(148, 163, 184, 0.14)"
                                                isAnimationActive={false}
                                            />
                                            <Pie
                                                data={analyticsStatusData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={62}
                                                outerRadius={92}
                                                paddingAngle={analyticsTotal ? 1.5 : 0}
                                                stroke="rgba(15, 23, 42, 0.96)"
                                                strokeWidth={2}
                                                labelLine={false}
                                                label={donutLabel}
                                            >
                                                {analyticsStatusData.map((entry) => (
                                                    <Cell
                                                        key={entry.key}
                                                        fill={entry.color}
                                                        fillOpacity={entry.value > 0 ? 1 : 0.25}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [value, 'Countries']}
                                                contentStyle={ANALYTICS_TOOLTIP_STYLE}
                                                itemStyle={{ color: '#e2e8f0' }}
                                                labelStyle={{ color: '#cbd5e1' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="prof-analytics-donut-center">
                                        <span>{analyticsTotal}</span>
                                        <small>Total</small>
                                    </div>
                                </div>

                                <div className="prof-analytics-legend">
                                    {analyticsStatusData.map((entry) => (
                                        <div key={entry.key} className="prof-analytics-legend-item">
                                            <div className="prof-analytics-legend-label">
                                                <span
                                                    className="prof-analytics-legend-dot"
                                                    style={{ '--legend-color': entry.color }}
                                                />
                                                <span>{entry.name}</span>
                                            </div>
                                            <strong>{entry.value}</strong>
                                        </div>
                                    ))}
                                    <div className="prof-analytics-legend-total">
                                        <span>Total</span>
                                        <strong>{analyticsTotal}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="prof-analytics-panel">
                            <div className="prof-analytics-panel-head">
                                <div>
                                    <h4>Trips over time</h4>
                                </div>
                                <span className="prof-analytics-summary">{totalTrips}</span>
                            </div>

                            <div className="prof-analytics-chart prof-analytics-chart--timeline">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={tripsTimelineData}
                                        margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
                                    >
                                        <defs>
                                            <linearGradient id="profTripsThemeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="rgba(139, 124, 255, 0.28)" />
                                                <stop offset="95%" stopColor="rgba(139, 124, 255, 0.03)" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            stroke="rgba(148, 163, 184, 0.12)"
                                            strokeDasharray="4 4"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => formatTimelineDate(value)}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={20}
                                            tickMargin={10}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <YAxis
                                            dataKey="total"
                                            allowDecimals={false}
                                            axisLine={false}
                                            tickLine={false}
                                            width={28}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            domain={[0, (max) => Math.max(1, max)]}
                                        />
                                        <Tooltip
                                            formatter={(value) => [value, 'Trips']}
                                            labelFormatter={(label) => formatTimelineDate(label, 'tooltip')}
                                            contentStyle={ANALYTICS_TOOLTIP_STYLE}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            labelStyle={{ color: '#cbd5e1' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#8B7CFF"
                                            strokeWidth={3}
                                            fill="url(#profTripsThemeGradient)"
                                            dot={{ r: 4, fill: '#A699FF', stroke: '#e4defe', strokeWidth: 2 }}
                                            activeDot={{ r: 5, fill: '#A699FF', stroke: '#f2efff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="prof-grid">

                    {/* ══ RECENT ITINERARIES ══ */}
                    <section className="prof-card prof-card--recent">
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
                            <div className="prof-itin-scroll">
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
                            </div>
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
