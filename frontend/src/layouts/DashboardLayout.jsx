import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar";
import BottomNav from "../components/BottomNav";
import BrandLogo from "../components/BrandLogo";

function DashboardLayout({ darkMode, onToggleTheme }) {
    const { pathname } = useLocation();
    const hideTopbar = pathname === "/chat";

    return (
        <div className="shell">
            <Sidebar darkMode={darkMode} onToggleTheme={onToggleTheme} />
            <main className="dashboard-main">
                {!hideTopbar && (
                    <header className="topbar">
                        <div className="topbar-left">
                            <BrandLogo className="dashboard-brand" />
                        </div>
                    </header>
                )}
                <div className="dashboard-content">
                    <Outlet />
                </div>
            </main>
            <BottomNav />
        </div>
    );
}

export default DashboardLayout;
