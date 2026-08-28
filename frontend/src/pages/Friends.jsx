import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserMinus, Loader } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import { useWebSocket } from "../contexts/WebSocketContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

function Friends() {
    const navigate = useNavigate();
    const { addMessageListener } = useWebSocket();
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [loadingChat, setLoadingChat] = useState(null); // session_id of friend being opened

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
            } finally {
                setLoadingFriends(false);
            }
        }
        
        // Fetch immediately
        fetchFriends();
    }, []);

    // Listen for WebSocket events for live updates
    useEffect(() => {
        if (!addMessageListener) return;

        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Update friend's online/offline status
                if (data.type === "user_status_update") {
                    setFriends(prev => prev.map(f => 
                        f.session_id === data.session_id 
                            ? { ...f, status: data.event === "online" ? "active" : "inactive" } 
                            : f
                    ));
                }
                
                // If a friend request is accepted or a friend removes you, we should refresh the list
                if (data.type === "notification") {
                    if (data.event === "Accepted your friend request" || data.event === "Removed you from friends") {
                        // Quick refresh to ensure list is perfectly in sync
                        fetch(`${BACKEND_URL}/api/friend/friends`, {
                            method: "GET",
                            credentials: "include"
                        }).then(res => {
                            if (res.ok) res.json().then(d => setFriends(d.friends || []));
                        });
                    }
                }
            } catch (e) {
                console.error("Error parsing websocket message in Friends", e);
            }
        };

        const cleanup = addMessageListener(handleMessage);
        return cleanup;
    }, [addMessageListener]);

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

    async function handleOpenChat(e, friend) {
        e.stopPropagation();
        setLoadingChat(friend.session_id);
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/messages/conversation/${friend.session_id}`,
                { credentials: "include" }
            );
            if (res.ok) {
                const data = await res.json();
                // Build a conv object matching the shape Chat.jsx history view expects
                const conv = {
                    conversation_id: data.conversation_id,
                    partner_session_id: friend.session_id,
                    partner_name: data.partner_name || friend.name,
                    partner_avatar: data.partner_avatar || friend.avatar,
                    is_friend: data.is_friend,
                    // pre-mapped messages so Chat.jsx doesn't need to re-fetch
                    prefetchedMessages: data.messages,
                };
                navigate(`/chat?partner=${friend.session_id}`, { state: { openConv: conv } });
            } else if (res.status === 404) {
                // No conversation yet — just go to chat
                navigate(`/chat?partner=${friend.session_id}`);
            } else {
                console.error("Failed to load conversation");
            }
        } catch (err) {
            console.error("Error opening chat:", err);
            navigate(`/chat?partner=${friend.session_id}`);
        } finally {
            setLoadingChat(null);
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
                {loadingFriends ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <article key={i} className="friend-card" style={{ "--i": i, pointerEvents: "none", border: "none" }}>
                            <div className="friend-card-avatar skeleton-list-item skeleton-avatar-lg" />
                            <div className="friend-card-body">
                                <div className="skeleton-list-item skeleton-text-lg" />
                                <div className="skeleton-list-item skeleton-text-sm" />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <div className="skeleton-list-item skeleton-action-btn" />
                                <div className="skeleton-list-item skeleton-action-btn" />
                            </div>
                        </article>
                    ))
                ) : friends.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", marginTop: 24, fontSize: 14 }}>You haven't added any friends yet.</p>
                ) : (
                    friends.map((person, i) => (
                        <article
                            key={person.id}
                            className="friend-card"
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
                                <button
                                    className="friend-card-action primary"
                                    type="button"
                                    aria-label="Open conversation"
                                    data-tooltip="Open conversation"
                                    onClick={(e) => handleOpenChat(e, person)}
                                    disabled={loadingChat === person.session_id}
                                >
                                    {loadingChat === person.session_id
                                        ? <Loader size={18} className="friend-card-icon" style={{ animation: "spin 1s linear infinite" }} />
                                        : <MessageCircle size={20} className="friend-card-icon" />
                                    }
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}

export default Friends;
