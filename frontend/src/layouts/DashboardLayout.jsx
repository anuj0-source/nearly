import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";
import BottomNav from "../components/BottomNav";

function DashboardLayout({ darkMode, onToggleTheme }) {
    return (
        <div className="shell">
            <Sidebar darkMode={darkMode} onToggleTheme={onToggleTheme} />
            <main style={{ minWidth: 0, flex: 1 }}>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}

export default DashboardLayout;
