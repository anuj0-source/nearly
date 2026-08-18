import { ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import AnonymousFigure from "../components/AnonymousFigure";

function Home({ darkMode, onToggleTheme }) {
    const navigate = useNavigate();

    return (
        <main className="home">
            <header className="home-top">
                <span className="home-mark">Nearly<span className="dot" /></span>
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} compact />
            </header>

            <section className="home-stage">
                <div>
                    <p className="label">A secret layer of campus</p>
                    <h1 className="home-headline">
                        Who&apos;s<br /><em>out there?</em>
                    </h1>
                    <p className="home-sub">
                        Someone nearby is also looking for someone to talk to. Two anonymous people — finding out what they say.
                    </p>
                    <div className="home-cta-row">
                        <button className="btn btn-primary" type="button" onClick={() => navigate("/chat")}>
                            Chat Anonymously <ArrowRight size={15} />
                        </button>
                        <a className="ghost-like" onClick={(e) => { e.preventDefault(); navigate("/login"); }} href="#login">Continue with Google</a>
                    </div>
                    <p className="home-foot">
                        <Shield size={12} /> No account required. Your identity stays hidden.
                    </p>
                </div>

                <aside className="anon-frame" aria-hidden="true">
                    <div className="anon-cap">
                        <small>anon · #037</small>
                        <span className="ix">new</span>
                    </div>
                    <div className="anon-figure">
                        <AnonymousFigure />
                    </div>
                    <div className="anon-foot">
                        <span className="anon-handle">Anonymous.</span>
                        <small>~ 800m · idle</small>
                    </div>
                    <div className="anon-meta">
                        <div className="anon-row"><span>Vibe</span><b>Gaming · Music</b></div>
                        <div className="anon-row"><span>Last seen</span><b>2 min ago</b></div>
                        <div className="anon-row"><span>Status</span><b>Open to chat</b></div>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default Home;
