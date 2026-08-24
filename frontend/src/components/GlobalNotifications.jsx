import { useEffect, useState, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { Bell, MessageCircle, X } from "lucide-react";

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
    const [searchParams] = useSearchParams();
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

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

                    if (data.event === "Sent friend request" && data.user) {
                        title = "New Friend Request";
                        message = `${data.user} sent you a friend request`;
                    } else if (data.event === "Accepted your friend request" && data.user) {
                        title = "Friend Request Accepted";
                        message = `${data.user} accepted your friend request`;
                    }

                    const toast = {
                        id,
                        title,
                        message,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        icon: "notification",
                        avatar: data.avatar
                    };
                    
                    playNotificationSound();
                    setToasts((prev) => [...prev, toast]);
                    setTimeout(() => removeToast(id), 5000);
                } 
                else if (data.type === "chat_message") {
                    // Show toast if user is not on chat page, or if they are on chat but talking to someone else
                    if (location.pathname !== "/chat" || (activePartner !== data.sender_id && window.activeLiveMatchSessionId !== data.sender_id)) {
                        const id = Date.now().toString() + Math.random().toString();
                        const toast = {
                            id,
                            title: data.sender_name ? data.sender_name : "New Message",
                            message: data.text,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            icon: "chat",
                            avatar: data.sender_avatar
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
                <div key={toast.id} className="notification-toast">
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
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
