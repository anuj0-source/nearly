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

                    <h1 className="home-headline">
                        Talk to strangers,<br />Make friends!
                    </h1>
                    <p className="home-sub">
                        A random chat alternative to find friends, connect with people, and talk to strangers nearby — anonymously.
                    </p>

                    <div className="home-cta">
                        <button className="btn btn-primary" type="button" onClick={() => navigate("/chat")}>
                            Talk Anonymously
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => navigate("/login")}>
                            <svg className="g-icon" width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.547 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                            </svg>
                            Create account
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
