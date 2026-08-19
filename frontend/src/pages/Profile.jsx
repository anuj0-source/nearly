import { useEffect, useState } from "react";
import { Bell, ChevronRight, Eye, Lock, Shield, SlidersHorizontal } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import ThemeToggle from "../components/ThemeToggle";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

const settings = [
    { Icon: Lock, title: "Privacy", desc: "Your real identity is never shared in chat" },
    { Icon: Bell, title: "Notifications", desc: "Quietly let us know when someone replies" },
    { Icon: Eye, title: "Visibility", desc: "Stay discoverable to the people nearby" },
];

function ProfileSkeleton() {
    return (
        <div className="page profile-skeleton">
            <header className="page-head">
                <div>
                    <div className="skeleton-line skeleton-eyebrow" />
                    <div className="skeleton-line skeleton-title" />
                </div>
                <aside className="skeleton-chip" />
            </header>

            <div className="profile-grid">
                <section className="id-card">
                    <div className="id-row">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-stack">
                            <div className="skeleton-line skeleton-name" />
                            <div className="skeleton-line skeleton-sub" />
                        </div>
                    </div>

                    <div className="skeleton-button" />
                </section>

                <section>
                    <div className="set-card">
                        {settings.map(({ title }) => (
                            <div className="set-row skeleton-set-row" key={title}>
                                <div>
                                    <div className="skeleton-line skeleton-set-title" />
                                    <div className="skeleton-line skeleton-set-desc" />
                                </div>
                                <div className="skeleton-chevron" />
                            </div>
                        ))}

                        <div className="set-row skeleton-set-row">
                            <div>
                                <div className="skeleton-line skeleton-set-title" />
                                <div className="skeleton-line skeleton-set-desc" />
                            </div>
                            <div className="skeleton-toggle" />
                        </div>
                    </div>

                    <div className="signin-cta skeleton-signin">
                        <div className="skeleton-shield" />
                        <div className="signin-copy">
                            <div className="skeleton-line skeleton-set-title" />
                            <div className="skeleton-line skeleton-set-desc" />
                        </div>
                        <div className="skeleton-chevron" />
                    </div>
                </section>
            </div>
        </div>
    );
}

function Profile({ darkMode, onToggleTheme }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadProfile() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${BACKEND_URL}/api/session/me`, {
                    credentials: "include",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load profile");
                }

                const data = await response.json();
                setProfile(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err);
                    setError("We couldn’t load your profile right now.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadProfile();
        return () => controller.abort();
    }, []);

    if (loading) {
        return <ProfileSkeleton />;
    }

    const name = profile?.name ?? "Anonymous";
    const avatar = profile?.avatar ?? "ghost";
    const language = profile?.language ?? "hinglish";
    const gender = profile?.gender ?? "not-defined";

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow">Your secret identity</p>
                    <h1 className="h1">{name}</h1>
                </div>
                <aside>{error ? "Unavailable" : "Active"}</aside>
            </header>

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-grid">
                <section className="id-card">
                    <div className="id-row">
                        <AnonymousAvatar type={avatar} size="lg" online />
                        <div>
                            <h2>{name}</h2>
                            <p className="sub"><span className="dot" /> Available for chat</p>
                        </div>
                    </div>

                    <div className="profile-meta">
                        <span className="meta-pill">Language: {language}</span>
                        <span className="meta-pill">Gender: {gender}</span>
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
