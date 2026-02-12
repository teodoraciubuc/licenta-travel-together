import { useEffect, useState } from "react";
import api from "../api/axios";


export default function Questionnaire() {
    const [tags, setTags] = useState([]);
    const [scores, setScores] = useState({});
    const [result, setResult] = useState(null);

    const reloadTags = async () => {
        setResult(null);
        try {
            const res = await api.get("/api/questionnaire/tags");
            const data = res.data;

            setTags(data);

            setScores((prev) => {
                const next = { ...prev };
                data.forEach((t) => {
                    if (next[t.id] === undefined) next[t.id] = 0;
                });
                return next;
            });
        } catch (err) {
            setResult({
                ok: false,
                status: err.response?.status,
                data: err.response?.data || err.message,
            });
        }
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const res = await api.get("/api/questionnaire/tags");
                if (!mounted) return;

                const data = res.data;
                setTags(data);

                const init = {};
                data.forEach((t) => (init[t.id] = 0));
                setScores(init);
            } catch (err) {
                if (!mounted) return;
                setResult({
                    ok: false,
                    status: err.response?.status,
                    data: err.response?.data || err.message,
                });
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const savePreferences = async () => {
        setResult(null);
        try {
            const preferences = Object.entries(scores).map(([tagId, score]) => ({
                tagId: Number(tagId),
                score: Number(score),
            }));

            const res = await api.post("/api/questionnaire/preferences", { preferences });
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
            <h2>Questionnaire</h2>

            <button onClick={reloadTags}>Reload tags</button>

            <div style={{ marginTop: 16, display: "grid", gap: 10, maxWidth: 420 }}>
                {tags.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                            <b>{t.name}</b> <span style={{ opacity: 0.6 }}>#{t.id}</span>
                        </div>

                        <select
                            value={scores[t.id] ?? 0}
                            onChange={(e) => setScores((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                        </select>
                    </div>
                ))}
            </div>

            <button onClick={savePreferences} style={{ marginTop: 16 }}>
                Save preferences
            </button>

            <pre style={{ marginTop: 16, background: "#f5f5f5", padding: 12 }}>
                {result ? JSON.stringify(result, null, 2) : "No result yet"}
            </pre>
        </div>
    );
}
