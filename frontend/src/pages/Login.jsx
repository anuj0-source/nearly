import { ArrowLeft, Check, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function Login({ darkMode, onToggleTheme }) {
    const navigate = useNavigate();
    return (
        <main className="login">
            <div className="login-theme">
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} compact />
            </div>
            <section className="login-card">
                <span className="home-mark login-mark">
                    Nearly<span className="dot" />
                </span>
                <p className="label">Optional identity layer</p>
                <h1>Sometimes it&apos;s nice to know who you are.</h1>
                <p className="login-sub">
                    Keep your profile and discoveries across devices. Your identity still stays hidden while you chat.
                </p>

                <button className="btn btn-ghost google" type="button" onClick={() => navigate("/chat")}>
                    <span className="g-icon">G</span> Continue with Google
                </button>

                <div className="login-points">
                    <span><Check size={13} /> Keep your matches across devices</span>
                    <span><Shield size={13} /> Stay anonymous in chat</span>
                </div>

                <a className="back" href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                    <ArrowLeft size={13} /> Back to Nearly
                </a>
            </section>
        </main>
    );
}

export default Login;
