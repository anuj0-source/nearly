import { Bell, ChevronRight, Eye, Lock, Pencil, Shield, SlidersHorizontal } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import ThemeToggle from "../components/ThemeToggle";

function Profile({ darkMode, onToggleTheme }) {
    const settings = [
        { Icon: Pencil, title: "Edit interests", desc: "Change the clues people can find you through" },
        { Icon: Lock, title: "Privacy", desc: "Your real identity is never shared in chat" },
        { Icon: Bell, title: "Notifications", desc: "Quietly let us know when someone replies" },
        { Icon: Eye, title: "Visibility", desc: "Stay discoverable to the people nearby" },
    ];

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow">Your secret identity</p>
                    <h1 className="h1">Anonymous Fox</h1>
                </div>
                <aside>Active</aside>
            </header>

            <div className="profile-grid">
                <section className="id-card">
                    <div className="id-row">
                        <AnonymousAvatar type="fox" size="lg" online />
                        <div>
                            <h2>Anonymous Fox</h2>
                            <p className="sub"><span className="dot" /> Available for chat</p>
                        </div>
                    </div>

                    <div className="id-tags">
                        <span className="eyebrow">Interests</span>
                        {["Gaming", "Music", "Coding", "Anime"].map((item) => (
                            <span className="tag" key={item}><span className="dot" />{item}</span>
                        ))}
                    </div>

                    <button className="btn btn-ghost avatar-change" type="button">
                        <SlidersHorizontal size={13} strokeWidth={1.75} /> Change avatar
                    </button>
                </section>

                <section>
                    <div className="set-card">
                        {settings.map(({ Icon, title, desc }) => (
                            <button className="set-row" type="button" key={title}>
                                <div>
                                    <b><Icon size={14} strokeWidth={1.75} /> {title}</b>
                                    <small>{desc}</small>
                                </div>
                                <ChevronRight size={15} color="var(--faint)" />
                            </button>
                        ))}

                        <div className="set-row">
                            <div>
                                <b>Theme</b>
                                <small>Make Nearly feel like your kind of night</small>
                            </div>
                            <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} icon />
                        </div>
                    </div>

                    <button className="signin-cta" type="button">
                        <Shield size={15} strokeWidth={1.75} />
                        <div className="signin-copy">
                            <b>Not signed in</b>
                            <small>Sign in with Google to keep this identity across devices.</small>
                        </div>
                        <ChevronRight size={15} color="var(--faint)" />
                    </button>
                </section>
            </div>
        </div>
    );
}

export default Profile;
