import { ArrowLeft, Check, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import GhostMark from "../components/GhostMark";

function Login({ darkMode, onToggleTheme }) {
    const navigate = useNavigate();
    return (
        <main className="login">
            <div className="login-theme">
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} icon />
            </div>
            <section className="login-card">
                <div className="home-brand">
                    <GhostMark className="brand-logo-mark" />
                    <span>Nearly</span>
                </div>
                <h1>Save your anonymous profile.</h1>
                <p className="login-sub">
                    Keep your matches and discoveries across devices. Your identity still stays hidden while you chat.
                </p>

                <button className="btn btn-ghost google" type="button" onClick={() => navigate("/chat")}>
                    <span className="g-icon">G</span> Continue with Google
                </button>

                <div className="login-points">
                    <span><Check size={12} strokeWidth={2} /> Keep your matches across devices</span>
                    <span><Shield size={12} strokeWidth={1.8} /> Stay anonymous in chat</span>
                </div>

                <a className="back" href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                    <ArrowLeft size={12} strokeWidth={1.8} /> Back to Nearly
                </a>
            </section>
        </main>
    );
}

export default Login;
