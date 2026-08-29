import { useEffect, useRef, useState } from "react";
import { MessageCircle, Bell, BadgeCheck, Check, X } from "lucide-react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

const ReceiveRequestIcon = ({ size = 22, strokeWidth = 1.75, color = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <mask id="badge-cutout">
            <rect width="100%" height="100%" fill="white" stroke="none" />
            <circle cx="17" cy="17" r="6.5" fill="black" stroke="none" />
        </mask>
        <g mask="url(#badge-cutout)">
            <circle cx="9" cy="7" r="4" />
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        </g>
        <circle cx="17" cy="17" r="5" />
        <path d="M17 14v6" />
        <path d="M14.5 17.5 17 20l2.5-2.5" />
    </svg>
);

export default function HeaderIcons({ session }) {
    const ws = useWebSocket();
    const navigate = useNavigate();

    const [friendRequests, setFriendRequests] = useState([]);
    const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);
    const [showRequests, setShowRequests] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [showConversations, setShowConversations] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const conversationsDropdownRef = useRef(null);
    const requestsDropdownRef = useRef(null);
    const notificationsDropdownRef = useRef(null);

    const [localSession, setLocalSession] = useState(session);

    // Initial fetch on mount
    useEffect(() => {
        if (!localSession) {
            fetch(`${BACKEND_URL}/api/session/me`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => setLocalSession(data))
                .catch(err => console.error("HeaderIcons session fetch failed:", err));
        }
        fetchFriendRequests();
        fetchConversations();
        fetchNotifications();
        
        const handleForceRefresh = () => fetchConversations();
        window.addEventListener("force_conversations_refresh", handleForceRefresh);
        return () => window.removeEventListener("force_conversations_refresh", handleForceRefresh);
    }, []);

    // WebSocket listener for live updates
    useEffect(() => {
        const removeListener = ws.addMessageListener((event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "notification") {
                    if (data.event === "Sent friend request") {
                        fetchFriendRequests();
                    } else if (data.event === "Accepted your friend request") {
                        fetchConversations();
                    }
                    fetchNotifications();
                } else if (data.type === "chat_message" || data.type === "image_message_sent") {
                    fetchConversations();
                    
                    const isChatRoute = window.location.pathname === "/chat";
                    const currentPartner = new URLSearchParams(window.location.search).get("partner");
                    const isActiveChat = isChatRoute && (currentPartner === data.sender_id || window.activeLiveMatchSessionId === data.sender_id);
                    
                    if (!isActiveChat) {
                        fetchNotifications();
                    }
                }
            } catch (e) {
                console.error("Error parsing websocket message in HeaderIcons", e);
            }
        });
        return () => removeListener();
    }, [ws]);

    // Click outside to close menus
    useEffect(() => {
        function handleClickOutside(event) {
            if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
                setShowRequests(false);
            }
            if (conversationsDropdownRef.current && !conversationsDropdownRef.current.contains(event.target)) {
                setShowConversations(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mark notifications as read when the modal is closed
    useEffect(() => {
        if (!showNotifications) {
            setNotifications(prev => {
                if (prev.some(n => !n.is_read)) {
                    fetch(`${BACKEND_URL}/api/notification/read-all`, {
                        method: "POST",
                        credentials: "include",
                    }).catch(e => console.error("Error marking all read:", e));
                    return prev.map(n => ({ ...n, is_read: true }));
                }
                return prev;
            });
        }
    }, [showNotifications]);

    // Listen for events from GlobalNotifications (toasts)
    useEffect(() => {
        const handleClearFriend = (event) => {
            const senderId = event.detail.senderId;
            const notif = notifications.find(n => n.type === "friend_request" && n.payload?.session_id === senderId);
            if (notif) clearNotification(notif.id);
        };
        const handleReadMessage = (event) => {
            const senderId = event.detail.senderId;
            setNotifications(prev => prev.map(n => 
                (n.type === "message" && n.payload?.sender_id === senderId) 
                ? { ...n, is_read: true } 
                : n
            ));
        };
        
        window.addEventListener("clear_friend_notification", handleClearFriend);
        window.addEventListener("read_message_notification", handleReadMessage);
        return () => {
            window.removeEventListener("clear_friend_notification", handleClearFriend);
            window.removeEventListener("read_message_notification", handleReadMessage);
        };
    }, [notifications]);

    async function fetchFriendRequests() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/requests`, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });
            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error getting friend requests:", error);
        }
    }

    async function toggleFriendRequests() {
        if (showRequests) {
            setShowRequests(false);
            return;
        }
        setShowRequests(true);
        setShowConversations(false);
        setShowNotifications(false);
        setFriendRequestsLoading(true);
        await fetchFriendRequests();
        setFriendRequestsLoading(false);
    }

    async function acceptFriendRequest(friendId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/accept/${friendId}`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                setFriendRequests(prev => prev.filter(req => req.session_id !== friendId));
                fetchConversations();
                
                // Clear the associated notification from state and backend
                setNotifications(prev => {
                    const notifToClear = prev.find(n => n.type === "friend_request" && n.payload?.session_id === friendId);
                    if (notifToClear) {
                        clearNotification(notifToClear.id);
                    }
                    return prev.filter(n => !(n.type === "friend_request" && n.payload?.session_id === friendId));
                });
            }
        } catch (error) {
            console.error("Error accepting friend request:", error);
        }
    }

    async function rejectFriendRequest(friendId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/reject/${friendId}`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                setFriendRequests(prev => prev.filter(req => req.session_id !== friendId));

                // Clear the associated notification from state and backend
                setNotifications(prev => {
                    const notifToClear = prev.find(n => n.type === "friend_request" && n.payload?.session_id === friendId);
                    if (notifToClear) {
                        clearNotification(notifToClear.id);
                    }
                    return prev.filter(n => !(n.type === "friend_request" && n.payload?.session_id === friendId));
                });
            }
        } catch (error) {
            console.error("Error rejecting friend request:", error);
        }
    }

    const [conversationsSkip, setConversationsSkip] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);

    async function fetchConversations(skip = 0, append = false) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/conversations?skip=${skip}&limit=7`, {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length < 7) {
                    setHasMoreConversations(false);
                } else {
                    setHasMoreConversations(true);
                }
                
                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.conversation_id));
                        const newConvs = data.filter(c => !existingIds.has(c.conversation_id));
                        return [...prev, ...newConvs];
                    });
                } else {
                    setConversations(data);
                }
                setConversationsSkip(skip);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    }

    async function loadMoreConversations() {
        if (conversationsLoading || !hasMoreConversations) return;
        setConversationsLoading(true);
        const nextSkip = conversationsSkip + 7;
        await fetchConversations(nextSkip, true);
        setConversationsLoading(false);
    }

    async function toggleConversations() {
        if (showConversations) {
            setShowConversations(false);
            return;
        }
        setShowConversations(true);
        setShowRequests(false);
        setShowNotifications(false);
        setConversationsLoading(true);
        setConversationsSkip(0);
        setHasMoreConversations(true);
        await fetchConversations(0, false);
        setConversationsLoading(false);
    }

    const handleConversationsScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            loadMoreConversations();
        }
    };

    async function openConversation(conv) {
        setShowConversations(false);
        const partnerSessionId = conv.user1_session_id === localSession?.session_id
            ? conv.user2_session_id
            : conv.user1_session_id;

        // Mark as read in backend
        if (conv.unread_count > 0) {
            try {
                await fetch(`${BACKEND_URL}/api/messages/read/${conv.conversation_id}`, {
                    method: "POST",
                    credentials: "include"
                });
                // Optimistically clear the unread count in UI
                setConversations(prev => prev.map(c => 
                    c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
                ));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }

        navigate(`/chat?partner=${partnerSessionId}`);
    }

    async function fetchNotifications() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/notification/all`, {
                credentials: "include",
                cache: "no-store",
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Error getting notifications:", error);
        }
    }

    async function toggleNotifications() {
        if (showNotifications) {
            setShowNotifications(false);
            return;
        }
        setShowNotifications(true);
        setShowConversations(false);
        setShowRequests(false);
        setNotificationsLoading(true);
        
        await fetchNotifications();
        setNotificationsLoading(false);
    }

    async function markNotificationAsRead(id) {
        try {
            await fetch(`${BACKEND_URL}/api/notification/read/${id}`, {
                method: "POST",
                credentials: "include",
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking notification read:", error);
        }
    }

    async function clearAllNotifications() {
        try {
            await fetch(`${BACKEND_URL}/api/notification/clear-all`, {
                method: "POST",
                credentials: "include",
            });
            setNotifications([]);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    }

    async function clearNotification(id) {
        try {
            await fetch(`${BACKEND_URL}/api/notification/clear/${id}`, {
                method: "PATCH",
                credentials: "include",
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error clearing notification:", error);
        }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const partnerParam = searchParams.get("partner");
    const isChatRoute = window.location.pathname === "/chat";

    const totalUnread = conversations.reduce((acc, conv) => {
        const isActive = isChatRoute && (conv.user1_session_id === partnerParam || conv.user2_session_id === partnerParam);
        return acc + (isActive ? 0 : (conv.unread_count || 0));
    }, 0);

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center", zIndex: 10 }}>
            {/* Conversations Dropdown */}
            <div ref={conversationsDropdownRef} style={{ position: "relative" }}>
                <button className="ix-btn" style={{ position: "relative" }} type="button" aria-label="Messages" {...(!showConversations ? { "data-tooltip": "Messages" } : {})} onClick={toggleConversations}>
                    <MessageCircle size={22} strokeWidth={1.75} />
                    {totalUnread > 0 && (
                        <span style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            background: "var(--primary-color, #f43f5e)",
                            color: "white",
                            fontSize: 9,
                            fontWeight: "bold",
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            boxShadow: "0 0 0 2px var(--bg, #F6F5F1)"
                        }}>
                            {totalUnread}
                        </span>
                    )}
                </button>
                {showConversations && (
                    <div className="conv-panel">
                        <div className="conv-header">
                            <div className="conv-header-left">
                                <div className="conv-header-icon">
                                    <MessageCircle size={15} strokeWidth={2.2} />
                                </div>
                                <span className="conv-header-title">Messages</span>
                            </div>
                        </div>

                        <div className="conv-list" onScroll={handleConversationsScroll}>
                            {conversationsLoading && !hasMoreConversations ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="conv-item" style={{ pointerEvents: "none" }}>
                                        <div className="skeleton-list-item skeleton-avatar-md" />
                                        <div className="conv-item-body">
                                            <div className="skeleton-list-item skeleton-text-md" />
                                            <div className="skeleton-list-item skeleton-text-sm" style={{ marginTop: 8 }} />
                                        </div>
                                    </div>
                                ))
                            ) : conversations.length === 0 && !conversationsLoading ? (
                                <div className="conv-empty">
                                    <div className="conv-empty-icon">
                                        <MessageCircle size={28} strokeWidth={1.4} />
                                    </div>
                                    <p className="conv-empty-title">No messages yet</p>
                                    <p className="conv-empty-sub">Start a chat to see your conversations here</p>
                                </div>
                            ) : (
                                conversations.map((conv, i) => {
                                    const otherId = conv.user1_session_id === localSession?.session_id ? conv.user2_session_id : conv.user1_session_id;
                                    const partnerName = conv.partner_name || `Anon ${otherId?.substring(0, 6)}`;
                                    const partnerAvatar = conv.partner_avatar;
                                    const initials = partnerName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                                    const timeSource = conv.last_message_time ? conv.last_message_time : conv.created_at;
                                    const displayDate = new Date(timeSource.endsWith("Z") ? timeSource : timeSource + "Z");
                                    const now = new Date();
                                    const diffMs = now - displayDate;
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHrs = Math.floor(diffMins / 60);
                                    const diffDays = Math.floor(diffHrs / 24);
                                    let timeLabel;
                                    if (diffMins < 1) timeLabel = "just now";
                                    else if (diffMins < 60) timeLabel = `${diffMins}m ago`;
                                    else if (diffHrs < 24) timeLabel = `${diffHrs}h ago`;
                                    else if (diffDays < 7) timeLabel = `${diffDays}d ago`;
                                    else timeLabel = displayDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                                    
                                    const previewText = conv.last_message_type === 'image' ? '📷 Image' : (conv.last_message_text ? conv.last_message_text : "Tap to open conversation");

                                    return (
                                        <div key={i} className="conv-item" onClick={() => openConversation(conv)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && openConversation(conv)}>
                                            <div className="conv-avatar" data-seed={i % 6}>
                                                {partnerAvatar ? (
                                                    <img
                                                        src={partnerAvatar}
                                                        alt={partnerName}
                                                        className="conv-avatar-img"
                                                        onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                                                    />
                                                ) : null}
                                                <span className="conv-avatar-fallback" style={{ display: partnerAvatar ? "none" : "flex" }}>
                                                    {initials}
                                                </span>
                                            </div>
                                            <div className="conv-item-body">
                                                <div className="conv-item-top">
                                                    <span className="conv-item-name">{partnerName}</span>
                                                    <span className="conv-item-time">{timeLabel}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <span className="conv-item-preview" style={{ fontWeight: conv.unread_count > 0 ? 600 : 400, color: conv.unread_count > 0 ? "var(--ink)" : "var(--muted)" }}>{previewText}</span>
                                                    {conv.unread_count > 0 && (
                                                        <span style={{
                                                            background: "var(--primary-color, #f43f5e)",
                                                            color: "white",
                                                            fontSize: 10,
                                                            fontWeight: "bold",
                                                            minWidth: 18,
                                                            height: 18,
                                                            padding: "0 5px",
                                                            borderRadius: 9,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            marginLeft: 8
                                                        }}>
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {conversationsLoading && conversations.length > 0 && (
                                <div className="conv-item" style={{ pointerEvents: "none", opacity: 0.7 }}>
                                    <div className="skeleton-list-item skeleton-avatar-md" />
                                    <div className="conv-item-body">
                                        <div className="skeleton-list-item skeleton-text-md" />
                                        <div className="skeleton-list-item skeleton-text-sm" style={{ marginTop: 8 }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Friend Requests Dropdown */}
            <div ref={requestsDropdownRef} style={{ position: "relative" }}>
                <button className="ix-btn" style={{ position: "relative" }} type="button" aria-label="Friend requests" {...(!showRequests ? { "data-tooltip": "Friend requests" } : {}) } onClick={toggleFriendRequests}>
                    <ReceiveRequestIcon size={22} strokeWidth={1.75} />
                    {friendRequests.length > 0 && (
                        <span style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            background: "var(--primary-color, #f43f5e)",
                            color: "white",
                            fontSize: 9,
                            fontWeight: "bold",
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            boxShadow: "0 0 0 2px var(--bg, #F6F5F1)"
                        }}>
                            {friendRequests.length}
                        </span>
                    )}
                </button>
                {showRequests && (
                    <div className="conv-panel">
                        <div className="conv-header">
                            <div className="conv-header-left">
                                <div className="conv-header-icon">
                                    <ReceiveRequestIcon size={15} strokeWidth={2.2} color="#fff" />
                                </div>
                                <span className="conv-header-title">Friend Requests</span>
                            </div>
                            {friendRequests.length > 0 && (
                                <span className="conv-header-count">{friendRequests.length}</span>
                            )}
                        </div>

                        <div className="conv-list">
                            {friendRequestsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="conv-item freq-item" style={{ pointerEvents: "none" }}>
                                        <div className="skeleton-list-item skeleton-avatar-md" />
                                        <div className="conv-item-body" style={{ flex: 1, paddingLeft: 12 }}>
                                            <div className="skeleton-list-item skeleton-text-md" />
                                        </div>
                                        <div className="freq-actions" style={{ display: "flex", gap: 6 }}>
                                            <div className="skeleton-list-item skeleton-action-sm" />
                                            <div className="skeleton-list-item skeleton-action-sm" />
                                        </div>
                                    </div>
                                ))
                            ) : friendRequests.length === 0 ? (
                                <div className="conv-empty">
                                    <div className="conv-empty-icon">
                                        <BadgeCheck size={28} strokeWidth={1.4} />
                                    </div>
                                    <p className="conv-empty-title">All caught up!</p>
                                    <p className="conv-empty-sub">No pending friend requests right now</p>
                                </div>
                            ) : (
                                friendRequests.map((req, i) => (
                                    <div key={i} className="conv-item freq-item">
                                        <div className="conv-avatar" data-seed={i % 6}>
                                            {req.avatar ? (
                                                <img
                                                    src={req.avatar}
                                                    alt={req.name}
                                                    className="conv-avatar-img"
                                                    onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                                                />
                                            ) : null}
                                            <span className="conv-avatar-fallback" style={{ display: req.avatar ? "none" : "flex" }}>
                                                {(req.name || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="conv-item-body">
                                            <div className="conv-item-top">
                                                <span className="conv-item-name">{req.name || "Anonymous"}</span>
                                            </div>
                                            <span className="conv-item-preview">Wants to be your friend</span>
                                        </div>

                                        <div className="freq-actions">
                                            <button
                                                className="freq-btn freq-accept"
                                                aria-label="Accept"
                                                title="Accept"
                                                onClick={() => acceptFriendRequest(req.session_id)}
                                            >
                                                <Check size={14} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                className="freq-btn freq-reject"
                                                aria-label="Reject"
                                                title="Reject"
                                                onClick={() => rejectFriendRequest(req.session_id)}
                                            >
                                                <X size={14} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Notifications Dropdown */}
            <div ref={notificationsDropdownRef} style={{ position: "relative" }}>
                <button className="ix-btn" style={{ position: "relative" }} type="button" aria-label="Notifications" {...(!showNotifications ? { "data-tooltip": "Notifications" } : {})} onClick={toggleNotifications}>
                    <Bell size={22} strokeWidth={1.75} />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            background: "var(--primary-color, #f43f5e)",
                            color: "white",
                            fontSize: 9,
                            fontWeight: "bold",
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            boxShadow: "0 0 0 2px var(--bg, #F6F5F1)"
                        }}>
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
                {showNotifications && (
                    <div className="conv-panel">
                        <div className="conv-header">
                            <div className="conv-header-left">
                                <div className="conv-header-icon">
                                    <Bell size={15} strokeWidth={2.2} />
                                </div>
                                <span className="conv-header-title">Notifications</span>
                            </div>
                            {notifications.length > 0 && (
                                <button style={{ background: "transparent", border: "none", color: "var(--primary-color, #f43f5e)", fontSize: "12px", fontWeight: "600", cursor: "pointer", padding: "6px 10px", whiteSpace: "nowrap", borderRadius: "16px", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--primary-light, rgba(244, 63, 94, 0.1))"} onMouseOut={e => e.currentTarget.style.background = "transparent"} onClick={clearAllNotifications}>
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="conv-list">
                            {notificationsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="conv-item" style={{ pointerEvents: "none" }}>
                                        <div className="skeleton-list-item skeleton-avatar-md" />
                                        <div className="conv-item-body">
                                            <div className="skeleton-list-item skeleton-text-md" />
                                        </div>
                                    </div>
                                ))
                            ) : notifications.length === 0 ? (
                                <div className="conv-empty">
                                    <div className="conv-empty-icon">
                                        <Bell size={28} strokeWidth={1.4} />
                                    </div>
                                    <p className="conv-empty-title">All caught up!</p>
                                    <p className="conv-empty-sub">No new notifications right now</p>
                                </div>
                            ) : (
                                notifications.map((notif) => {
                                    const timeSource = notif.created_at;
                                    const displayDate = new Date(timeSource.endsWith("Z") ? timeSource : timeSource + "Z");
                                    const now = new Date();
                                    const diffMs = now - displayDate;
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHrs = Math.floor(diffMins / 60);
                                    const diffDays = Math.floor(diffHrs / 24);
                                    let timeLabel;
                                    if (diffMins < 1) timeLabel = "just now";
                                    else if (diffMins < 60) timeLabel = `${diffMins}m ago`;
                                    else if (diffHrs < 24) timeLabel = `${diffHrs}h ago`;
                                    else if (diffDays < 7) timeLabel = `${diffDays}d ago`;
                                    else timeLabel = displayDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                                    
                                    let messageText = "New Notification";
                                    let avatar = null;
                                    let senderName = null;
                                    let senderId = null;

                                    if (typeof notif.payload === "string") {
                                        messageText = notif.payload;
                                    } else if (notif.payload && typeof notif.payload === "object") {
                                        if (notif.type === "message") {
                                            senderName = notif.payload.sender_name || "someone";
                                            avatar = notif.payload.sender_avatar;
                                            senderId = notif.payload.sender_id;
                                            messageText = `New message`;
                                        } else if (notif.type === "friend_request") {
                                            senderName = notif.payload.user || "someone";
                                            avatar = notif.payload.avatar;
                                            senderId = notif.payload.session_id;
                                            messageText = `Wants to be your friend`;
                                        } else if (notif.type === "friend_request_accepted") {
                                            senderName = notif.payload.user || "someone";
                                            avatar = notif.payload.avatar;
                                            messageText = `Accepted your friend request`;
                                        } else if (notif.type === "friend_removed") {
                                            senderName = notif.payload.user || "someone";
                                            avatar = notif.payload.avatar;
                                            messageText = `Removed you from their friends list`;
                                        }
                                    }

                                    const handleClick = () => {
                                        if (!notif.is_read) markNotificationAsRead(notif.id);
                                        if (notif.type === "message" && senderId) {
                                            navigate(`/chat?partner=${senderId}`);
                                            setShowNotifications(false);
                                        }
                                    };

                                    return (
                                        <div key={notif.id} className={`conv-item ${notif.type === "friend_request" ? "freq-item" : ""}`} style={{ cursor: "pointer", opacity: notif.is_read ? 0.7 : 1 }} onClick={handleClick}>
                                            {avatar || senderName ? (
                                                <div className="conv-avatar" data-seed={notif.id % 6}>
                                                    {avatar ? (
                                                        <img
                                                            src={avatar}
                                                            alt={senderName}
                                                            className="conv-avatar-img"
                                                            onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                                                        />
                                                    ) : null}
                                                    <span className="conv-avatar-fallback" style={{ display: avatar ? "none" : "flex" }}>
                                                        {(senderName || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="conv-avatar" data-seed={notif.id % 6} style={{ background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Bell size={18} strokeWidth={2} style={{ color: "var(--muted)" }} />
                                                </div>
                                            )}

                                            <div className="conv-item-body">
                                                <div className="conv-item-top">
                                                    <span className="conv-item-name" style={{ fontWeight: notif.is_read ? 400 : 600, fontSize: "14px" }}>
                                                        {senderName ? senderName : "Notification"}
                                                    </span>
                                                    <span className="conv-item-time">{timeLabel}</span>
                                                </div>
                                                <span className="conv-item-preview" style={{ fontWeight: notif.is_read ? 400 : 500, color: notif.is_read ? "var(--muted)" : "var(--ink)" }}>{messageText}</span>
                                            </div>

                                            {notif.type === "friend_request" && senderId && (
                                                <div className="freq-actions" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="freq-btn freq-accept"
                                                        aria-label="Accept"
                                                        title="Accept"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            acceptFriendRequest(senderId);
                                                            if (!notif.is_read) markNotificationAsRead(notif.id);
                                                        }}
                                                    >
                                                        <Check size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        className="freq-btn freq-reject"
                                                        aria-label="Reject"
                                                        title="Reject"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            rejectFriendRequest(senderId);
                                                            if (!notif.is_read) markNotificationAsRead(notif.id);
                                                        }}
                                                    >
                                                        <X size={14} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
