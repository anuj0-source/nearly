import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserMinus } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Friends() {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        async function fetchFriends() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/friend/friends`, {
                    method: "GET",
                    credentials: "include"
                });
                if (response.ok) {
                    const data = await response.json();
                    setFriends(data.friends || []);
                } else {
                    console.error("Failed to fetch friends");
                }
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        }
        fetchFriends();
    }, []);

    async function handleRemoveFriend(e, friendId) {
        e.stopPropagation();
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/remove/${friendId}`, {
                method: "POST",
                credentials: "include"
            });
            if (response.ok) {
                setFriends(prev => prev.filter(f => f.session_id !== friendId));
            } else {
                console.error("Failed to remove friend");
            }
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    }

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow"><span className="dot" /> Peoples you know</p>
                    <h1 className="h1">Friends</h1>
                </div>
                <aside>{friends.length} <span className="accent">so far</span></aside>
            </header>

            <div className="match-list">
                {friends.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", marginTop: 24, fontSize: 14 }}>You haven't added any friends yet.</p>
                ) : (
                    friends.map((person, i) => (
                        <article
                            key={person.id}
                            className="friend-card"
                            onClick={() => navigate("/chat")}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/chat")}
                            role="button"
                            tabIndex={0}
                            style={{ "--i": i }}
                        >
                            <div className="friend-card-avatar">
                                <AnonymousAvatar type={person.avatar} size="lg" online={person.status === "active"} />
                            </div>

                            <div className="friend-card-body">
                                <span className="friend-card-name">{person.name || "Anonymous"}</span>
                                <span className="friend-card-status" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {person.status === "active" ? (
                                        <>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success-color, #22c55e)", flexShrink: 0 }} />
                                            Online now
                                        </>
                                    ) : (
                                        "Offline"
                                    )}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button 
                                    className="friend-card-action danger" 
                                    type="button" 
                                    aria-label="Remove friend" 
                                    data-tooltip="Remove friend"
                                    onClick={(e) => handleRemoveFriend(e, person.session_id)}
                                    style={{ border: "none" }}
                                >
                                    <UserMinus size={20} className="friend-card-icon" />
                                </button>
                                <div className="friend-card-action primary">
                                    <MessageCircle size={20} className="friend-card-icon" />
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}

export default Friends;
