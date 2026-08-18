import { NavLink } from "react-router-dom";
import { Archive, MapPin, MessageCircle, Send, UserRound } from "lucide-react";

const items = [
    { label: "Chat", path: "/chat", Icon: MessageCircle },
    { label: "Matches", path: "/matches", Icon: Archive },
    { label: "Nearby", path: "/nearby", Icon: MapPin },
    { label: "Profile", path: "/profile", Icon: UserRound },
    { label: "Invite", path: "/invite", Icon: Send },
];

function BottomNav() {
    return (
        <nav className="bn" aria-label="Mobile">
            <div className="bn-grid">
                {items.map(({ label, path, Icon }) => (
                    <NavLink key={path} to={path} className={({ isActive }) => `bn-item ${isActive ? "on" : ""}`}>
                        {() => (
                            <>
                                <Icon size={16} strokeWidth={1.7} />
                                <span>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
