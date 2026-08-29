import { useEffect, useState, useCallback } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { Bell, MessageCircle, X, Check } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        
        const now = ctx.currentTime;

        // First note (B5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 987.77;
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Second note (E6)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 1318.51;
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        const t2 = now + 0.08; // slightly overlap
        gain2.gain.setValueAtTime(0, t2);
        gain2.gain.linearRampToValueAtTime(0.15, t2 + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.25);
        
        osc2.start(t2);
        osc2.stop(t2 + 0.25);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export default function GlobalNotifications() {
    const { addMessageListener } = useWebSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const handleAccept = async (e, friendId, toastId) => {
        e.stopPropagation();
        try {
            await fetch(`${BACKEND_URL}/api/friend/accept/${friendId}`, { method: "POST", credentials: "include" });
            window.dispatchEvent(new CustomEvent("clear_friend_notification", { detail: { senderId: friendId } }));
            removeToast(toastId);
        } catch (error) { console.error(error); }
    };

    const handleReject = async (e, friendId, toastId) => {
        e.stopPropagation();
        try {
            await fetch(`${BACKEND_URL}/api/friend/reject/${friendId}`, { method: "POST", credentials: "include" });
            window.dispatchEvent(new CustomEvent("clear_friend_notification", { detail: { senderId: friendId } }));
            removeToast(toastId);
        } catch (error) { console.error(error); }
    };

    const handleToastClick = (toast) => {
        if (toast.toastType === "chat_message" && toast.senderId) {
            navigate(`/chat?partner=${toast.senderId}`);
            window.dispatchEvent(new CustomEvent("read_message_notification", { detail: { senderId: toast.senderId } }));
            removeToast(toast.id);
        }
    };

    useEffect(() => {
        if (!addMessageListener) return;

        const activePartner = searchParams.get("partner");

        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === "notification") {
                    const id = Date.now().toString() + Math.random().toString();
                    
                    let title = "Notification";
                    let message = data.event;
                    let toastType = "generic";

                    if (data.event === "Sent friend request" && data.user) {
                        title = "New Friend Request";
                        message = `${data.user} sent you a friend request`;
                        toastType = "friend_request";
                    } else if (data.event === "Accepted your friend request" && data.user) {
                        title = "Friend Request Accepted";
                        message = `${data.user} accepted your friend request`;
                        toastType = "friend_request_accepted";
                    } else if (data.event === "Removed you from friends" && data.user) {
                        title = "Friend Removed";
                        message = `${data.user} removed you from their friends list`;
                        toastType = "friend_removed";
                    }

                    const toast = {
                        id,
                        title,
                        message,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        icon: "notification",
                        avatar: data.avatar,
                        senderId: data.session_id,
                        toastType
                    };
                    
                    playNotificationSound();
                    setToasts((prev) => [...prev, toast]);
                    
                    // Auto-dismiss all notifications after 5 seconds
                    setTimeout(() => removeToast(id), 5000);
                } 
                else if (data.type === "chat_message" || data.type === "image_message_sent") {
                    // Show toast if user is not on chat page, or if they are on chat but talking to someone else
                    if (location.pathname !== "/chat" || (activePartner !== data.sender_id && window.activeLiveMatchSessionId !== data.sender_id)) {
                        const id = Date.now().toString() + Math.random().toString();
                        const toast = {
                            id,
                            title: data.sender_name ? data.sender_name : "New Message",
                            message: data.type === "image_message_sent" ? "📷 Image" : data.text,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            icon: "chat",
                            avatar: data.sender_avatar,
                            senderId: data.sender_id,
                            toastType: "chat_message"
                        };
                        
                        playNotificationSound();
                        setToasts((prev) => [...prev, toast]);
                        setTimeout(() => removeToast(id), 5000);
                    }
                }
            } catch (e) {
                console.error("Error parsing WS message for notifications", e);
            }
        };

        const cleanup = addMessageListener(handleMessage);
        return cleanup;
    }, [addMessageListener, location.pathname, searchParams, removeToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="global-notifications-container">
            {toasts.map((toast) => (
                <div key={toast.id} className="notification-toast" onClick={() => handleToastClick(toast)}>
                    <div className="toast-icon-wrapper">
                        {toast.avatar ? (
                            <img src={toast.avatar} alt="avatar" className="toast-avatar" />
                        ) : toast.icon === "chat" ? (
                            <MessageCircle size={20} className="toast-icon" />
                        ) : (
                            <Bell size={20} className="toast-icon" />
                        )}
                    </div>
                    <div className="toast-content">
                        <div className="toast-header">
                            <h4>{toast.title}</h4>
                            <span className="toast-time">{toast.time}</span>
                        </div>
                        <p className="toast-message">{toast.message}</p>
                    </div>
                    
                    {toast.toastType === "friend_request" && toast.senderId && (
                        <div className="freq-actions" style={{ marginLeft: "auto", display: "flex", gap: "6px", alignSelf: "center", position: "relative", zIndex: 2 }} onClick={e => e.stopPropagation()}>
                            <button
                                className="freq-btn freq-accept"
                                aria-label="Accept"
                                title="Accept"
                                onClick={(e) => handleAccept(e, toast.senderId, toast.id)}
                            >
                                <Check size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                className="freq-btn freq-reject"
                                aria-label="Reject"
                                title="Reject"
                                onClick={(e) => handleReject(e, toast.senderId, toast.id)}
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}

                    {toast.toastType !== "friend_request" && (
                        <button className="toast-close" onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
