import { useState } from "react";
import Questionnaire from "./Questionnaire";
import api from "./api";


export default function App() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Test1234!");
  const [result, setResult] = useState(null);

  const handleLogin = async () => {
    setResult(null);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const token = res.data.token || res.data.accessToken;
      localStorage.setItem("token", token);
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({
        ok: false,
        status: err.response?.status,
        data: err.response?.data || err.message,
      });
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: "Arial" }}>
      <h2>Login test</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
        />
        <button onClick={handleLogin}>Login</button>
      </div>

      <pre style={{ marginTop: 16, background: "#f5f5f5", padding: 12 }}>
        {result ? JSON.stringify(result, null, 2) : "No result yet"}
      </pre>
      <hr style={{ margin: "24px 0" }} />
      <Questionnaire />

    </div>
  );
}
