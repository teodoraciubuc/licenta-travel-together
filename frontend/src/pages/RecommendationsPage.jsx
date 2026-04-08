import TopNav from '../components/TopNav';
import '../styles/Recommendations.css';

export default function RecommendationsPage() {
    return (
        <div className="recommendations-page">
            <TopNav />
            <main className="recommendations-main">
                <h1>Recommendations</h1>
                <p>This page is ready for recommendation content and now uses the shared app navigation.</p>
            </main>
        </div>
    );
}
