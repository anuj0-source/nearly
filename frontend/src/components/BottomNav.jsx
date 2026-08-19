import { NavLink } from "react-router-dom";
import { Gift, Heart, MapPin, MessageCircle, User } from "lucide-react";

const items = [
    { label: "Chat", path: "/chat", Icon: MessageCircle },
    { label: "Matches", path: "/matches", Icon: Heart },
    { label: "Nearby", path: "/nearby", Icon: MapPin },
    { label: "Profile", path: "/profile", Icon: User },
    { label: "Invite", path: "/invite", Icon: Gift },
];

function BottomNav() {
    return (
        <nav className="bn" aria-label="Mobile">
            <div className="bn-grid">
                {items.map(({ label, path, Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => `bn-item ${isActive ? "on" : ""}`}
                        title={label}
                        aria-label={label}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
