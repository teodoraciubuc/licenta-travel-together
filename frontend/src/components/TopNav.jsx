import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/TopNav.css';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/map', label: 'My Map' },
    { to: '/flights/explore', label: 'Flights' },
    { to: '/accommodations', label: 'Accommodations' },
    { to: '/profile', label: 'Profile' },
];

export default function TopNav() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <header className="top-nav">
            <div className="top-nav__brand">
                <h2>Travel Together</h2>
            </div>

            <nav className="top-nav__menu">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => (isActive ? 'top-nav__item active' : 'top-nav__item')}
                    >
                        {item.label}
                    </NavLink>
                ))}

                <button type="button" className="top-nav__item top-nav__logout" onClick={handleLogout}>
                    Logout
                </button>
            </nav>
        </header>
    );
}
