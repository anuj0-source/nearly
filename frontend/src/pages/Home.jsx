import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import GhostMark from "../components/GhostMark";
import HomeBackground from "../components/HomeBackground";

function Home({ darkMode, onToggleTheme }) {
    const navigate = useNavigate();

    return (
        <main className="home">
            <HomeBackground />
            <header className="home-top">
                <div className="home-brand">
                    <GhostMark className="brand-logo-mark" />
                    <span>Nearly</span>
                </div>
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} icon />
            </header>

            <section className="home-stage">
                <div className="home-inner">
                    <div className="home-visual" aria-hidden="true">
                        <div className="ring r3" />
                        <div className="ring r2" />
                        <div className="ring r1" />
                        <div className="core">
                            <GhostMark />
                        </div>
                    </div>

                    <h1 className="home-headline">Who&apos;s out there?</h1>
                    <p className="home-sub">Someone nearby is also looking for someone to talk to.</p>

                    <div className="home-cta">
                        <button className="btn btn-primary" type="button" onClick={() => navigate("/chat")}>
                            Chat Anonymously
                        </button>
                        <button className="google" type="button" onClick={() => navigate("/login")}>
                            <span className="g-icon">G</span> Continue with Google
                        </button>
                    </div>

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <p className="home-foot">
                            <Shield size={11} strokeWidth={1.8} /> No account required. Your identity stays hidden.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;
