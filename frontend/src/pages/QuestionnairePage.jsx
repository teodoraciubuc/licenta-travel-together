import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Questionnaire.css";

export default function QuestionnairePage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";

    // ================= SLIDER QUESTIONS =================

    const sliderQuestions = [
        {
            key: "pace",
            title: "Cum arata ritmul tau ideal?",
            left: "Relaxare totala",
            right: "Actiune pura",
        },
        {
            key: "atmosphere",
            title: "Ce atmosfera preferi intr-o destinatie?",
            left: "Liniste si retragere",
            right: "Oras vibrant si energie urbana",
        },
        {
            key: "social",
            title: "Cat de social vrei sa fii in vacanta?",
            left: "Intimitate / Izolare",
            right: "Interactiune maxima",
        },
        {
            key: "budget",
            title: "Care este prioritatea bugetului tau?",
            left: "Low-cost / Backpacking",
            right: "Luxury / Premium",
        },
        {
            key: "food",
            title: "Cum preferi sa mananci in vacanta?",
            left: "Street food local",
            right: "Fine dining",
        },
        {
            key: "frequency",
            title: "Cat de des calatoresti?",
            left: "Rar",
            right: "Foarte des",
        },
        {
            key: "planning",
            title: "Cum abordezi planificarea?",
            left: "Totul programat",
            right: "Spontan",
        },
        {
            key: "comfort",
            title: "Cat de important este confortul pentru tine?",
            left: "Minimal",
            right: "Confort ridicat",
        },
        {
            key: "distance",
            title: "Cat de departe esti dispus sa calatoresti?",
            left: "Aproape",
            right: "Oriunde in lume",
        },
        {
            key: "experience",
            title: "Ce tip de experiente cauti?",
            left: "Relaxare",
            right: "Adrenalina",
        },
    ];

    const tagQuestions = [
        {
            title: "Ce tip de destinatii te atrag?",
            options: [
                "Orase mari",
                "Orase istorice",
                "Statiuni la mare",
                "Munti",
                "Natura salbatica",
                "Sate autentice",
                "Insule",
                "Destinatii exotice",
            ],
        },
        {
            title: "Care este continentul tau preferat?",
            options: [
                "Europa",
                "Asia",
                "America de Nord",
                "America de Sud",
                "Africa",
                "Australia & Oceania",
            ],
        },
    ];

    const totalSteps = 1 + tagQuestions.length;

    const [currentStep, setCurrentStep] = useState(1);
    const [cardIndex, setCardIndex] = useState(0);

    const [sliderAnswers, setSliderAnswers] = useState(
        sliderQuestions.reduce((acc, q) => {
            acc[q.key] = 3;
            return acc;
        }, {})
    );

    const [tagAnswers, setTagAnswers] = useState({});

    function handleSliderChange(e) {
        setSliderAnswers({
            ...sliderAnswers,
            [e.target.name]: Number(e.target.value),
        });
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

    async function handleFinish() {
        if (!token) return;

        const preferences = [];

        Object.entries(sliderAnswers).forEach(([, value], index) => {
            preferences.push({
                tagId: index + 1,
                score: value,
            });
        });

        await fetch(`${base}/api/questionnaire/preferences`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preferences }),
        });

        navigate("/dashboard");
    }

    function handleNext() {
        if (currentStep === 1) {
            setCurrentStep(2);
            return;
        }

        if (cardIndex < tagQuestions.length - 1) {
            setCardIndex(cardIndex + 1);
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    }

    function renderContent() {
        if (currentStep === 1) {
            return (
                <>
                    <h2>Customize your travel style</h2>

                    {sliderQuestions.map((q) => (
                        <div key={q.key} className="slider-group">
                            <label>{q.title}</label>

                            <input
                                type="range"
                                min="1"
                                max="5"
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

        return (
            <>
                <h2>{current.title}</h2>

                <div className="tags">
                    {current.options.map((opt) => (
                        <button
                            key={opt}
                            className={`tag ${(tagAnswers[cardIndex] || []).includes(opt)
                                ? "active"
                                : ""
                                }`}
                            onClick={() => toggleTag(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </>
        );
    }

    return (
        <div className="q-wrapper">
            <div className="q-header">
                <div className="q-logo">✈ Travel Together</div>
                <div className="q-progress-text">
                    Page {currentStep} of {totalSteps}
                </div>
            </div>

            <div className="q-progress-bar-container">
                <div
                    className="q-progress-bar"
                    style={{
                        width: `${(currentStep / totalSteps) * 100}%`,
                    }}
                />
            </div>

            <div className="q-content">
                <div className="q-card">
                    {renderContent()}
                </div>
            </div>

            <div className="q-footer">
                <button className="q-next-btn" onClick={handleNext}>
                    {currentStep === totalSteps ? "Finish" : "Next"}
                </button>
            </div>
        </div>
    );
}