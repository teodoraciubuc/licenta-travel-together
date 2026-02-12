import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);

    const login = async () => {
        setResult(null);
        try {
            const res = await api.post("/api/auth/login", { email, password });
            const token = res.data.token || res.data.accessToken;
            localStorage.setItem("token", token);
            setResult({ ok: true });
            navigate("/questionnaire");
        } catch (err) {
            setResult({
                ok: false,
                status: err.response?.status,
                data: err.response?.data || err.message,
            });
        }
    };

    return (
        <div style={{ maxWidth: 360 }}>
            <h2>Login</h2>
            <div style={{ display: "grid", gap: 8 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                <button onClick={login}>Login</button>
                <Link to="/register">Nu ai cont? Register</Link>
            </div>

            <pre style={{ marginTop: 12, background: "#f5f5f5", padding: 12 }}>
                {result ? JSON.stringify(result, null, 2) : "No result"}
            </pre>
        </div>
    );
}
