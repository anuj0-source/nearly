import { NavLink } from "react-router-dom";
import { Gift, Heart, MapPin, MessageCircle, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BrandLogo from "./BrandLogo";

const items = [
    { id: "chat", label: "Chat", path: "/chat", Icon: MessageCircle },
    { id: "matches", label: "Matches", path: "/matches", Icon: Heart },
    { id: "nearby", label: "Nearby", path: "/nearby", Icon: MapPin },
    { id: "profile", label: "Profile", path: "/profile", Icon: User },
    { id: "invite", label: "Invite", path: "/invite", Icon: Gift },
];

function Sidebar({ darkMode, onToggleTheme }) {
    return (
        <aside className="sb" aria-label="Primary">
            <NavLink to="/" className="sb-brand" aria-label="Nearly home">
                <BrandLogo compact />
            </NavLink>

            <nav className="sb-nav">
                {items.map(({ id, label, path, Icon }) => (
                    <NavLink
                        key={id}
                        to={path}
                        className={({ isActive }) => `sb-item ${isActive ? "active" : ""}`}
                        aria-label={label}
                        title={label}
                    >
                        <Icon size={18} strokeWidth={1.6} />
                        <span className="sb-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sb-foot">
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} icon />
            </div>
        </aside>
    );
}

export default Sidebar;
