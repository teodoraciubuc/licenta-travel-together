import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Questionnaire.css";

export default function QuestionnairePage() {
    const navigate = useNavigate();
    const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";

    const tagMapping = {
        "Munte": 1,
        "Plaja / Litoral": 2,
        "Oras istoric": 3,
        "Natura / Parcuri nationale": 4,
        "Lacuri / Cascade": 5,
        "Soare si caldura": 6,
        "Zapada si iarna": 7,
        "Clima temperata": 8,
        "Vizitare muzee": 9,
        "Drumetii / Hiking": 10,
        "Shopping": 11,
        "Gastronomie": 12,
        "Sporturi de apa": 13,
        "Viata de noapte / Clubbing": 14,
    };

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
            options: Object.keys(tagMapping),
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
        if (!tokenNow) {
            alert("Nu esti logat.");
            navigate("/login");
            return;
        }

        const allSelected = Object.values(tagAnswers).flat();

        const preferences = allSelected
            .map((name) => {
                const tagId = tagMapping[name];
                const score = tagScoreMap[tagId] || 3;
                return { tagId, score };
            })
            .filter((p) => p.tagId);

        const response = await fetch(`${base}/api/questionnaire/preferences`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenNow}`,
            },
            body: JSON.stringify({ preferences }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.log("Save failed:", response.status, err);
            alert("Eroare la salvare");
            return;
        }

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
