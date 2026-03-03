import React from 'react';
import '../styles/Dashboard.css';

const DashboardPage = () => {
    return (

        <div className="dashboard flex flex-col">

            {/* HEADER */}
            <header className="dashboard-header">
                <div className="brand">
                    <div className="brand-icon">
                        <span className="material-symbols-outlined">✈</span>
                    </div>
                    <h2 className="brand-title">TravelTogether</h2>
                </div>

                <nav className="nav-pill">
                    <a className="nav-link nav-link-active" href="#">Dashboard</a>
                    <a className="nav-link nav-link-inactive" href="#">My Trips</a>
                    <a className="nav-link nav-link-inactive" href="#">Profile</a>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-slate-200 dark:border-slate-700 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzDXJk46WtZa8ll6CmOoQFky6g1b_ZwZGOMB4f10KBWLnc3AvziHMM6ge4nEbcGeILIFwh1YI8hFfJnsAoJWokukapZ2b7mfSfksy1cZHIR1ZvvQuBEjXalLGa11hFZZ_IsZmK6bOncHYuS0Me3HJfCfGzReoM4xE66W__-blhgrX0LWOxByMebn1noBUOZIRPQHFhWsEdGT6X5L_60rWRWj_HJHlSz8S0nWhq78_Lo9CociJYoJYRM8pYV7C9D57fPwYSRM0n7A")' }}></div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="hero flex-1">

                {/* HERO SECTION */}
                <div className="hero-top">
                    <div className="space-y-2">
                        <p className="hero-subtitle">
                            Visualize your journey. Select a destination on the map to view tailored offers.
                        </p>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="w-full lg:w-auto flex flex-col gap-3">
                        <div className="search-box group">
                            <input className="search-input outline-none" placeholder="Search countries, cities..." type="text" />
                            <button className="search-btn">
                                <span className="material-symbols-outlined text-[20px]">🔍</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAP COMPONENT */}
                <div className="map-card group">
                    <div className="map-controls">
                        <button className="map-btn">
                            <span className="material-symbols-outlined">add</span>
                        </button>
                        <button className="map-btn">
                            <span className="material-symbols-outlined">remove</span>
                        </button>
                        <button className="map-btn mt-2">
                            <span className="material-symbols-outlined">my_location</span>
                        </button>
                    </div>

                    {/* Harta SVG statica (urmeaza inlocuirea cu Leaflet) */}
                    <svg className="w-full h-full object-cover text-slate-700" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
                        {/* Sursa SVG ascunsa pentru simplitate. Poti folosi codul SVG complet din varianta anterioara pana integram harta reala. */}
                        <rect fill="#0f172a" height="450" width="800"></rect>
                        <text fill="white" x="350" y="225">Placeholder Harta</text>
                    </svg>
                </div>

                {/* OFFERS SECTION */}
                <div className="space-y-6 pt-4">
                    <div className="offers-top">
                        <h3 className="offers-title">
                            <span className="material-symbols-outlined text-primary">local_offer</span>
                            Curated Travel Offers
                        </h3>
                        <a className="text-primary hover:text-primary-hover text-sm font-semibold hover:underline flex items-center gap-1 transition-colors" href="#">
                            View All Deals
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </a>
                    </div>

                    <div className="offers-grid">
                        {/* Card 1 */}
                        <div className="card">
                            <div className="card-img">
                                <div className="card-img-bg" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC6wMhdRydryjdmBbSzyL_8RlUTUA5i2x9M0wZrSaq-dpc0up4jecrba6b3q_jMbGnFoXIaTU2PLDuHWxGrMOA76f-Z60EYa6mmpv48360lElR2L4Myw3OwDlFp6Si4v27NOqHj5FAhCGfuL4UWlLyUUT5PMtUZYO93RS3ungaHdErrywb8wQuzlN9jTGCb6hBzETSr17Ckevfq5Gh1zKOJFTZkhOazG6crxqqFVfhHx5CDij_QaGQyMXeGJsBdo4NaP-wjBdCHrg")' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm">
                                    Best Seller
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Parisian Weekend</h4>
                                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span> France
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">starting from</p>
                                        <p className="text-xl font-bold text-primary">€250</p>
                                    </div>
                                </div>
                                <button className="card-btn">
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="card">
                            <div className="card-img">
                                <div className="card-img-bg" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCUYJvNWRIG0jOpDXN81kONzQYNqyYaYu8DVKUzKuOZMR22W2MPgUb8f5VzhF978z5N0YSsnh335mLAIsFoEm_Ly_37Nrgz8oOqkw4XVvBCSysiiL3Q2BBF0dN84iWkZA2WRDq4OF3veDA8j9IqXz9hM1UEi0jXua55zS0qIIngb6QirVW_Vrx_ZFAmaLLILUfeoxMQjKOrmEDmHqbLy8OAHJpSoW9L-OzbzVY5xsmAvpR1RVMWGR35u3CgWs9ATGv3Un9HhXs80A")' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                <div className="absolute top-3 left-3 bg-orange-500/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm">
                                    Trending
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Rome & History</h4>
                                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span> Italy
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">starting from</p>
                                        <p className="text-xl font-bold text-primary">€180</p>
                                    </div>
                                </div>
                                <button className="card-btn">
                                    View Details
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>

    );

};

export default DashboardPage;