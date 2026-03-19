import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Questionnaire.css";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
const SLIDER_STORAGE_KEY = "q_slider_answers";

const hasToken = () => !!localStorage.getItem("token");

const DEFAULT_SLIDERS = {
    pace: 3, atmosphere: 3, social: 3, budget: 3, food: 3,
    frequency: 3, planning: 3, comfort: 3, distance: 3, experience: 3,
};

function loadSavedSliders() {
    try {
        const raw = localStorage.getItem(SLIDER_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SLIDERS };
        return { ...DEFAULT_SLIDERS, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_SLIDERS };
    }
}

export default function QuestionnairePage() {
    const navigate = useNavigate();

    const tagMapping = {
        "Mountains": 1,
        "Beach / Seaside": 2,
        "Historic City": 3,
        "Nature / National Parks": 4,
        "Lakes / Waterfalls": 5,
        "Sun & Warmth": 6,
        "Snow & Winter": 7,
        "Mild Climate": 8,
        "Museum Visits": 9,
        "Hiking / Trekking": 10,
        "Shopping": 11,
        "Gastronomy": 12,
        "Water Sports": 13,
        "Nightlife / Clubbing": 14,
    };

    const sliderQuestions = [
        { key: "pace", title: "What's your ideal travel pace?", left: "Total relaxation", right: "Pure action" },
        { key: "atmosphere", title: "What atmosphere do you prefer?", left: "Peace & quiet", right: "Vibrant urban energy" },
        { key: "social", title: "How social do you want to be on vacation?", left: "Privacy / Solitude", right: "Maximum interaction" },
        { key: "budget", title: "What's your budget priority?", left: "Low-cost / Backpacking", right: "Luxury / Premium" },
        { key: "food", title: "How do you prefer to eat on vacation?", left: "Local street food", right: "Fine dining" },
        { key: "frequency", title: "How often do you travel?", left: "Rarely", right: "Very often" },
        { key: "planning", title: "How do you approach trip planning?", left: "Everything scheduled", right: "Spontaneous" },
        { key: "comfort", title: "How important is comfort to you?", left: "Minimal", right: "High comfort" },
        { key: "distance", title: "How far are you willing to travel?", left: "Nearby", right: "Anywhere in the world" },
        { key: "experience", title: "What kind of experiences are you looking for?", left: "Relaxation", right: "Adrenaline" },
    ];

    const tagQuestions = [
        { title: "What type of destinations appeal to you?", options: Object.keys(tagMapping) },
    ];

    const totalSteps = 1 + tagQuestions.length;

    const [currentStep, setCurrentStep] = useState(1);
    const [cardIndex, setCardIndex] = useState(0);
    const [loadingPrefs, setLoadingPrefs] = useState(hasToken);
    const [sliderAnswers, setSliderAnswers] = useState(loadSavedSliders);
    const [tagAnswers, setTagAnswers] = useState({});

    const hasFetched = useRef(false);

    /* ── Load saved tag preferences from API ── */
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${BASE}/api/questionnaire/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => { if (!r.ok) throw new Error("failed"); return r.json(); })
            .then((data) => {
                const prefs = data.preferences || [];
                if (prefs.length === 0) return;

                const savedTagIds = new Set(
                    prefs.filter((p) => Number(p.score) > 0).map((p) => Number(p.tag_id))
                );

                const preSelected = Object.keys(tagMapping).filter(
                    (name) => savedTagIds.has(tagMapping[name])
                );

                if (preSelected.length > 0) setTagAnswers({ 0: preSelected });
            })
            .catch(() => { })
            .finally(() => setLoadingPrefs(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Handlers ── */
    function handleSliderChange(e) {
        setSliderAnswers((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
    }

    function toggleTag(option) {
        setTagAnswers((prev) => {
            const current = prev[cardIndex] || [];
            return {
                ...prev,
                [cardIndex]: current.includes(option)
                    ? current.filter((o) => o !== option)
                    : [...current, option],
            };
        });
    }

    const tagScoreMap = {
        1: sliderAnswers.experience,
        2: sliderAnswers.pace === 1 ? 5 : 6 - sliderAnswers.pace,
        3: sliderAnswers.atmosphere,
        4: sliderAnswers.experience,
        5: sliderAnswers.experience,
        6: Math.round((sliderAnswers.pace + sliderAnswers.comfort) / 2),
        7: sliderAnswers.experience,
        8: sliderAnswers.comfort,
        9: 6 - sliderAnswers.experience,
        10: sliderAnswers.experience,
        11: sliderAnswers.budget,
        12: sliderAnswers.food,
        13: sliderAnswers.experience,
        14: sliderAnswers.social,
    };

    async function handleFinish() {
        const tokenNow = localStorage.getItem("token");
        if (!tokenNow) { alert("You are not logged in."); navigate("/login"); return; }

        localStorage.setItem(SLIDER_STORAGE_KEY, JSON.stringify(sliderAnswers));

        const allSelected = Object.values(tagAnswers).flat();
        const preferences = allSelected
            .map((name) => ({ tagId: tagMapping[name], score: tagScoreMap[tagMapping[name]] || 3 }))
            .filter((p) => p.tagId);

        const response = await fetch(`${BASE}/api/questionnaire/preferences`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenNow}` },
            body: JSON.stringify({ preferences }),
        });

        if (!response.ok) {
            alert("Error saving preferences. Please try again.");
            return;
        }

        navigate("/dashboard");
    }

    function handleNext() {
        if (currentStep === 1) { setCurrentStep(2); return; }
        if (cardIndex < tagQuestions.length - 1) {
            setCardIndex(cardIndex + 1);
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    }

    /* ── Render ── */
    function renderContent() {
        if (currentStep === 1) {
            return (
                <>
                    <h2>Customize your travel style</h2>
                    {sliderQuestions.map((q) => (
                        <div key={q.key} className="slider-group">
                            <label>{q.title}</label>
                            <input
                                type="range" min="1" max="5"
                                name={q.key}
                                value={sliderAnswers[q.key]}
                                onChange={handleSliderChange}
                            />
                            <div className="slider-labels">
                                <span>{q.left}</span>
                                <span>{q.right}</span>
                            </div>
                        </div>
                    ))}
                </>
            );
        }

        const current = tagQuestions[cardIndex];
        const selectedCount = (tagAnswers[cardIndex] || []).length;

        return (
            <>
                <h2>{current.title}</h2>
                {selectedCount > 0 && (
                    <p style={{ fontSize: "0.82rem", color: "#94a3b8", textAlign: "center", marginBottom: "12px" }}>
                        ✓ {selectedCount} {selectedCount === 1 ? "selected" : "selected"} — you can change these anytime
                    </p>
                )}
                <div className="tags">
                    {current.options.map((opt) => (
                        <button
                            key={opt}
                            className={`tag ${(tagAnswers[cardIndex] || []).includes(opt) ? "active" : ""}`}
                            onClick={() => toggleTag(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </>
        );
    }

    if (loadingPrefs) {
        return (
            <div className="q-wrapper">
                <div className="q-header">
                    <div className="q-logo">✈ Travel Together</div>
                </div>
                <div className="q-content">
                    <div className="q-card" style={{ textAlign: "center", padding: "3rem" }}>
                        <p style={{ color: "#94a3b8" }}>Loading your saved preferences...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="q-wrapper">
            <div className="q-header">
                <div className="q-logo">✈ Travel Together</div>
                <div className="q-progress-text">Page {currentStep} of {totalSteps}</div>
            </div>

            <div className="q-progress-bar-container">
                <div className="q-progress-bar" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>

            <div className="q-content">
                <div className="q-card">{renderContent()}</div>
            </div>

            <div className="q-footer">
                <button className="q-next-btn" onClick={handleNext}>
                    {currentStep === totalSteps ? "Save" : "Next"}
                </button>
            </div>
        </div>
    );
}