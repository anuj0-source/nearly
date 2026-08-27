import { useEffect, useState, useRef } from "react";
import { ChevronRight, Shield, SlidersHorizontal, Pencil, Trash2 } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import ThemeToggle from "../components/ThemeToggle";
import EditProfileModal from "../components/EditProfileModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

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
                        <div className="set-row skeleton-set-row">
                            <div>
                                <div className="skeleton-line skeleton-set-title" />
                                <div className="skeleton-line skeleton-set-desc" />
                            </div>
                            <div className="skeleton-toggle" />
                        </div>
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${BACKEND_URL}/api/profile/upload-avatar`, {
                method: "PATCH",
                credentials: "include",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload avatar");
            }

            const data = await response.json();
            setProfile(data);
            setError("");
        } catch (err) {
            console.error("Avatar upload failed:", err);
            setError("Failed to upload avatar. Please try again.");
        }
        
        e.target.value = null;
    };

    const handleRemoveAvatar = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/profile/remove-avatar`, {
                method: "PATCH",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to remove avatar");
            }

            const data = await response.json();
            setProfile(data);
            setError("");
        } catch (err) {
            console.error("Avatar remove failed:", err);
            setError("Failed to remove avatar. Please try again.");
        }
    };

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
    const joinedDate = profile?.created_at 
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
        : null;

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
                        <div className="avatar-wrapper" style={{ position: 'relative', display: 'flex' }}>
                            <AnonymousAvatar type={avatar} size="lg" online />
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept="image/jpeg, image/png, image/webp" 
                                onChange={handleAvatarChange} 
                            />
                            <button 
                                className="avatar-edit-badge"
                                onClick={() => fileInputRef.current.click()}
                                aria-label="Change Avatar"
                                data-tooltip="Change avatar"
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div>
                            <h2>{name}</h2>
                            <p className="sub"><span className="dot" /> Available for chat</p>
                        </div>
                    </div>

                    <div className="profile-meta">
                        <span className="meta-pill">Language: {language}</span>
                        <span className="meta-pill">Gender: {gender}</span>
                        {joinedDate && <span className="meta-pill">Joined: {joinedDate}</span>}
                    </div>

                    {avatar?.includes("res.cloudinary.com") && (
                        <button className="btn btn-ghost danger" type="button" onClick={handleRemoveAvatar} style={{ marginTop: "16px", width: "100%", color: "#e53e3e", background: "rgba(229, 62, 62, 0.08)" }}>
                            <Trash2 size={14} strokeWidth={1.75} /> Remove Photo
                        </button>
                    )}

                    <button className="btn btn-ghost avatar-change" type="button" style={{ marginTop: avatar?.includes("res.cloudinary.com") ? "8px" : "16px", width: "100%" }} onClick={() => setIsModalOpen(true)}>
                        <SlidersHorizontal size={14} strokeWidth={1.75} /> Edit Profile
                    </button>
                </section>

                <section>
                    <div className="set-card">
                        <div className="set-row">
                            <div>
                                <b>Theme</b>
                                <small>Make Nearly feel like your kind of night</small>
                            </div>
                            <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} icon />
                        </div>
                    </div>

                    <button className="signin-cta" type="button" style={{ marginTop: "16px" }}>
                        <Shield size={15} strokeWidth={1.75} />
                        <div className="signin-copy">
                            <b>Claim Account</b>
                            <small>Sign in with Google to keep this identity across devices.</small>
                        </div>
                        <ChevronRight size={15} color="var(--faint)" />
                    </button>
                </section>
            </div>
            
            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profile={profile}
                onSave={(updatedProfile) => setProfile(updatedProfile)}
            />
        </div>
    );
}

export default Profile;
