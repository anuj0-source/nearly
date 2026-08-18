import { NavLink } from "react-router-dom";
import { Archive, MapPin, MessageCircle, Send, UserRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const items = [
    { id: "01", label: "Chat", path: "/chat", Icon: MessageCircle },
    { id: "02", label: "Matches", path: "/matches", Icon: Archive },
    { id: "03", label: "Nearby", path: "/nearby", Icon: MapPin },
    { id: "04", label: "Profile", path: "/profile", Icon: UserRound },
    { id: "05", label: "Invite", path: "/invite", Icon: Send },
];

function Sidebar({ darkMode, onToggleTheme }) {
    return (
        <aside className="sb">
            <NavLink to="/" className="sb-brand" aria-label="Nearly home">
                Nearly<span className="dot" />
            </NavLink>
            <div className="sb-tag">Anonymous · nearby</div>

            <nav className="sb-nav" aria-label="Main">
                {items.map(({ id, label, path, Icon }) => (
                    <NavLink
                        key={id}
                        to={path}
                        className={({ isActive }) => `sb-item ${isActive ? "active" : ""}`}
                    >
                        <span className="sb-item-label"><Icon size={15} strokeWidth={1.75} />{label}</span>
                        <span className="ix">{id}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sb-foot">
                <small>Anonymous mode is on.<br />Your real identity never leaves this device.</small>
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
            </div>
        </aside>
    );
}

export default Sidebar;
