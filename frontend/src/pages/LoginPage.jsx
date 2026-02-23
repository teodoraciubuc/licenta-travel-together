import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";

import img1 from "../assets/auth/1.jpg";
import img2 from "../assets/auth/2.jpg";
import img3 from "../assets/auth/3.jpg";
import img4 from "../assets/auth/4.jpg";
import img5 from "../assets/auth/5.jpg";
import img6 from "../assets/auth/6.jpg";
import img7 from "../assets/auth/7.jpg";
import img8 from "../assets/auth/8.jpg";
import img9 from "../assets/auth/9.jpg";
import img10 from "../assets/auth/10.jpg";
import img11 from "../assets/auth/11.jpg";
import img12 from "../assets/auth/12.jpg";
import img13 from "../assets/auth/13.jpg";
import img14 from "../assets/auth/14.jpg";
import img15 from "../assets/auth/15.jpg";
import img16 from "../assets/auth/16.jpg";
import img17 from "../assets/auth/17.jpg";
import img18 from "../assets/auth/18.jpg";
import img19 from "../assets/auth/19.jpg";
import img20 from "../assets/auth/20.jpg";
import img21 from "../assets/auth/21.jpg";
import img22 from "../assets/auth/22.jpg";
import img23 from "../assets/auth/23.jpg";
import img24 from "../assets/auth/24.jpg";
import img25 from "../assets/auth/25.jpg";
import img26 from "../assets/auth/26.jpg";
import img27 from "../assets/auth/27.jpg";
import img28 from "../assets/auth/28.jpg";
import img29 from "../assets/auth/29.jpg";
import img30 from "../assets/auth/30.jpg";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function LoginPage() {
    const navigate = useNavigate();

    const images = [
        img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
        img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
        img21, img22, img23, img24, img25, img26, img27, img28, img29, img30,
    ];
    const [slideIndex, setSlideIndex] = useState(0);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        const t = setInterval(() => {
            setSlideIndex((i) => (i + 1) % images.length);
        }, 5000);
        return () => clearInterval(t);
    }, [images.length]);

    async function handleLogin(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const r = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                setErr(data?.message || "Login esuat. Verifica email/parola.");
                return;
            }

            localStorage.setItem("token", data.token);
            navigate("/map"); // sau /itineraries /dashboard cum ai tu
        } catch {
            setErr("Nu pot ajunge la server. Verifica backend-ul si VITE_API_BASE.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrap">
            {/* LEFT */}
            <div className="auth-left">
                <div
                    className="auth-left-bg"
                    style={{ backgroundImage: `url(${images[slideIndex]})` }}
                />
                <div className="auth-left-overlay" />
                <div className="auth-left-content">
                    <div className="brand">
                        <div className="brand-logo">✈</div>
                        <div className="brand-name">TravelTogether</div>
                    </div>

                    <p className="brand-text">
                        Discover new destinations, plan trips with friends, and create memories
                        that last a lifetime.
                    </p>

                    <div className="dots">
                        {images.map((_, i) => (
                            <span key={i} className={`dot ${i === slideIndex ? "active" : ""}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="auth-right">
                <div className="card">
                    <h1 className="title">Welcome back</h1>
                    <p className="subtitle">Log in to continue planning your next trip.</p>

                    {/* Tabs Login / SignUp */}
                    <div className="segmented">
                        <button type="button" className="seg-btn active">
                            Log in
                        </button>

                        <Link className="seg-btn linklike" to="/register">
                            Sign up
                        </Link>
                    </div>

                    <form onSubmit={handleLogin} className="form">
                        <div className="field">
                            <label>Email address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                minLength={8}
                            />
                            <div className="hint">Must contain at least 8 characters</div>
                        </div>

                        {err && <div className="error">{err}</div>}

                        <button className="primary" disabled={loading}>
                            {loading ? "Please wait..." : "Log in"}
                        </button>

                        <div className="or">Or continue with</div>

                        <div className="oauth">
                            <button type="button" className="oauth-btn" disabled>
                                Google
                            </button>
                            <button type="button" className="oauth-btn" disabled>
                                Facebook
                            </button>
                        </div>

                        <div className="footer">
                            Don&apos;t have an account? <Link to="/register">Sign up</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
