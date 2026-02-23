import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";

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

export default function RegisterPage() {
    const navigate = useNavigate();

    const images = [
        img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
        img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
        img21, img22, img23, img24, img25, img26, img27, img28, img29, img30,
    ];

    const [slideIndex, setSlideIndex] = useState(0);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        const t = setInterval(() => {
            setSlideIndex((i) => (i + 1) % images.length);
        }, 5000);
        return () => clearInterval(t);
    }, [images.length]);

    async function handleRegister(e) {
        e.preventDefault();
        setErr("");

        if (!agree) {
            setErr("Trebuie sa accepti termenii si politica de confidentialitate.");
            return;
        }

        if (password.length < 8) {
            setErr("Parola trebuie sa aiba minim 8 caractere.");
            return;
        }

        setLoading(true);
        try {
            const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";

            const res = await fetch(`${base}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErr(data?.message || "Inregistrare esuata.");
                return;
            }

            navigate("/login");
        } catch {
            setErr("Nu pot ajunge la server. Verifica backend-ul si VITE_API_BASE.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrap">
            {/* LEFT - Slideshow Section */}
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
                        Discover new destinations, plan trips with friends, and create memories that last a lifetime.
                    </p>
                    <div className="dots">
                        {images.map((_, i) => (
                            <span key={i} className={`dot ${i === slideIndex ? "active" : ""}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT - Form Section */}
            <div className="auth-right">
                <div className="card">
                    <h1 className="title">Create an account</h1>
                    <p className="subtitle">Join thousands of travelers planning their next adventure.</p>

                    <div className="segmented">
                        <Link className="seg-btn linklike" to="/login">Log in</Link>
                        <button type="button" className="seg-btn active">Sign up</button>
                    </div>

                    <form onSubmit={handleRegister} className="form">
                        <div className="field">
                            <label>Full Name</label>
                            <input
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Email address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                            <div className="hint">Must contain at least 8 characters</div>
                        </div>

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                            />
                            <span>
                                I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
                            </span>
                        </label>

                        {err && <div className="error">{err}</div>}

                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? "Please wait..." : "Create Account"}
                        </button>

                        <div className="or">Or continue with</div>
                        <div className="oauth">
                            <button type="button" className="oauth-btn" disabled>Google</button>
                            <button type="button" className="oauth-btn" disabled>Facebook</button>
                        </div>

                        <div className="footer">
                            Already have an account? <Link to="/login">Log in</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
