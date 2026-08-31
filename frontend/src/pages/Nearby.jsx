import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, MessageCircle, UserPlus, UserMinus, Check, X } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import { sendLocation, toggleNearby, getNearbyStatus, getNearbyPeople, sendFriendRequest, cancelFriendRequest, getConversation } from "../services/api";
import { useWebSocket } from "../contexts/WebSocketContext";

const STATUS_LABEL = {
    active: "Active",
    away: "Away",
    inactive: "Inactive",
};

// ── Location-tracking constants ────────────────────────────────────────────────
const MIN_DISTANCE = 500;           // metres
const MIN_TIME = 2 * 60 * 1000;    // 2 minutes in ms

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6_371_000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// ────────────────────────────────────────────────────────────────────────────────

// ── Radius presets (index-based for easy slider control) ──────────────────────
const RADIUS_PRESETS = [100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];
const DEFAULT_RADIUS_IDX = 5; // 5 km

function formatRadius(meters) {
    if (meters < 1000) return { value: meters, unit: 'm' };
    const km = meters / 1000;
    return { value: km % 1 === 0 ? `${km}` : km.toFixed(1), unit: 'km' };
}
// ────────────────────────────────────────────────────────────────────────────────

function Nearby() {
    const navigate = useNavigate();
    const { addMessageListener } = useWebSocket();
    const [nearbyEnabled, setNearbyEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [loading, setLoading] = useState(true); // true until DB status is fetched
    const [nearbyPeoples, setNearbyPeoples] = useState([]);
    const [loadingPeoples, setLoadingPeoples] = useState(false);
    const [radius, setRadius] = useState(RADIUS_PRESETS[DEFAULT_RADIUS_IDX]);
    const [radiusIdx, setRadiusIdx] = useState(DEFAULT_RADIUS_IDX);
    const radiusRef = useRef(radius);

    useEffect(() => {
        radiusRef.current = radius;
    }, [radius]);
    
    // For disabling buttons while actions are in progress
    const [actioningId, setActioningId] = useState(null);

    // Refs so the watchPosition callback always sees the latest values without
    // triggering re-renders.
    const lastSentLocation = useRef(null);
    const lastSentTime = useRef(0);
    const watchId = useRef(null);

    // ── Restore toggle state from DB on mount ────────────────────────────────
    useEffect(() => {
        getNearbyStatus()
            .then(({ is_nearby_enabled }) => setNearbyEnabled(is_nearby_enabled))
            .catch((err) => console.warn("Could not fetch nearby status:", err.message))
            .finally(() => setLoading(false));
    }, []);

    // ── Listen for live friend-request events via WebSocket ─────────────────
    useEffect(() => {
        if (!addMessageListener) return;
        const handle = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type !== "notification" || !data.session_id) return;

                // Someone sent US a request — show Accept/Reject on their card
                if (data.event === "Sent friend request") {
                    setNearbyPeoples((prev) =>
                        prev.map((p) =>
                            p.session_id === data.session_id ? { ...p, is_request_received: true } : p
                        )
                    );
                }
                // Someone cancelled the request they sent us — revert to UserPlus
                if (data.event === "Cancelled your friend request") {
                    setNearbyPeoples((prev) =>
                        prev.map((p) =>
                            p.session_id === data.session_id ? { ...p, is_request_sent: false, is_request_received: false } : p
                        )
                    );
                }
                // Someone accepted our request — mark as friend
                if (data.event === "Accepted your friend request") {
                    setNearbyPeoples((prev) =>
                        prev.map((p) =>
                            p.session_id === data.session_id ? { ...p, is_friend: true, is_request_sent: false } : p
                        )
                    );
                }
            } catch { /* ignore */ }
        };
        return addMessageListener(handle);
    }, [addMessageListener]);

    // ── Start/stop GPS watcher based on toggle ───────────────────────────────
    useEffect(() => {
        let intervalId = null;

        const fetchPeoples = async () => {
            if (nearbyPeoples.length === 0) setLoadingPeoples(true);
            try {
                const peoples = await getNearbyPeople(radiusRef.current);
                setNearbyPeoples(peoples);
            } catch (err) {
                console.error("Failed to fetch nearby peoples:", err);
            } finally {
                setLoadingPeoples(false);
            }
        };

        if (!nearbyEnabled) {
            // Stop watching when disabled
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
                lastSentLocation.current = null;
                lastSentTime.current = 0;
                setNearbyPeoples([]); // Clear list when disabled
            }
            return;
        }

        // Fetch initially when enabled
        fetchPeoples();

        // Also poll every 30 seconds
        intervalId = setInterval(fetchPeoples, 30000);

        if (!navigator.geolocation) {
            console.warn("Geolocation not supported by this browser.");
            return;
        }

        watchId.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const now = Date.now();

                // ── First fix ─────────────────────────────────────────────────
                if (lastSentLocation.current === null) {
                    try {
                        await sendLocation(latitude, longitude);
                        fetchPeoples();
                    } catch (err) {
                        console.error("Failed to send initial location:", err);
                    }
                    lastSentLocation.current = { latitude, longitude };
                    lastSentTime.current = now;
                    return;
                }

                // ── Subsequent fixes ──────────────────────────────────────────
                const distance = getDistance(
                    lastSentLocation.current.latitude,
                    lastSentLocation.current.longitude,
                    latitude,
                    longitude
                );
                const timePassed = now - lastSentTime.current;

                if (distance >= MIN_DISTANCE || timePassed >= MIN_TIME) {
                    try {
                        await sendLocation(latitude, longitude);
                        fetchPeoples();
                    } catch (err) {
                        console.error("Failed to send location update:", err);
                    }
                    lastSentLocation.current = { latitude, longitude };
                    lastSentTime.current = now;
                }
            },
            (error) => console.error("Geolocation error:", error),
            { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
        );

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            if (intervalId !== null) {
                clearInterval(intervalId);
            }
        };
    }, [nearbyEnabled]);

    // ── Fetch on radius change ───────────────────────────────────────────────
    useEffect(() => {
        if (!nearbyEnabled) return;
        
        const handler = setTimeout(async () => {
            setLoadingPeoples(true);
            try {
                const peoples = await getNearbyPeople(radius);
                setNearbyPeoples(peoples);
            } catch (err) {
                console.error("Failed to fetch nearby peoples on radius change:", err);
            } finally {
                setLoadingPeoples(false);
            }
        }, 500); // debounce
        return () => clearTimeout(handler);
    }, [radius, nearbyEnabled]);

    // ── Toggle handler ────────────────────────────────────────────────────────
    async function handleToggle() {
        if (toggling) return;
        const next = !nearbyEnabled;
        setNearbyEnabled(next);   // local state — UI responds instantly
        setToggling(true);
        try {
            await toggleNearby();  // best-effort backend sync
        } catch (err) {
            // Backend unreachable or no session yet — keep the UI state as-is.
            // The user clicked intentionally; don't roll it back.
            console.warn("toggleNearby API error (non-fatal):", err.message);
        } finally {
            setToggling(false);
        }
    }
    
    // ── Radar Angles ────────────────────────────────────────────────────────
    const [radarAngles, setRadarAngles] = useState({});

    useEffect(() => {
        setRadarAngles(prev => {
            const next = { ...prev };
            let changed = false;
            nearbyPeoples.forEach((p, i) => {
                if (!(p.session_id in next)) {
                    // Distribute somewhat evenly around the circle, with some randomness
                    const baseAngle = (i / Math.max(nearbyPeoples.length, 1)) * Math.PI * 2;
                    const randomOffset = (Math.random() - 0.5) * (Math.PI / 4);
                    next[p.session_id] = baseAngle + randomOffset;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [nearbyPeoples]);

    // ── Button handlers ───────────────────────────────────────────────────────
    async function handleMessageClick(person) {
        if (actioningId) return;
        setActioningId(person.session_id);
        try {
            const data = await getConversation(person.session_id);
            const conv = {
                conversation_id: data.conversation_id,
                partner_session_id: person.session_id,
                partner_name: data.partner_name || person.name,
                partner_avatar: data.partner_avatar || person.avatar,
                is_friend: data.is_friend,
                prefetchedMessages: data.messages || [],
            };
            navigate(`/chat?partner=${person.session_id}`, { state: { openConv: conv } });
        } catch (err) {
            console.error("Failed to open chat:", err);
            alert("Failed to open chat. Please try again.");
        } finally {
            setActioningId(null);
        }
    }

    async function handleFriendRequest(personId) {
        if (actioningId) return;
        setActioningId(personId);
        try {
            await sendFriendRequest(personId);
            // Optimistically update the UI to show request sent
            setNearbyPeoples((prev) =>
                prev.map((p) =>
                    p.session_id === personId ? { ...p, is_request_sent: true } : p
                )
            );
        } catch (err) {
            console.error("Failed to send friend request:", err);
            alert("Failed to send friend request. Please try again.");
        } finally {
            setActioningId(null);
        }
    }

    async function handleCancelRequest(personId) {
        if (actioningId) return;
        setActioningId(personId);
        try {
            await cancelFriendRequest(personId);
            setNearbyPeoples((prev) =>
                prev.map((p) =>
                    p.session_id === personId ? { ...p, is_request_sent: false } : p
                )
            );
        } catch (err) {
            console.error("Failed to cancel friend request:", err);
            alert("Failed to cancel friend request. Please try again.");
        } finally {
            setActioningId(null);
        }
    }

    async function handleAcceptRequest(personId) {
        if (actioningId) return;
        setActioningId(personId);
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
            const res = await fetch(`${BACKEND_URL}/api/friend/accept/${personId}`, { method: "POST", credentials: "include" });
            if (!res.ok) throw new Error("Failed to accept");
            setNearbyPeoples((prev) =>
                prev.map((p) =>
                    p.session_id === personId ? { ...p, is_friend: true, is_request_received: false } : p
                )
            );
        } catch (err) {
            console.error("Failed to accept friend request:", err);
            alert("Failed to accept. Please try again.");
        } finally {
            setActioningId(null);
        }
    }

    async function handleRejectRequest(personId) {
        if (actioningId) return;
        setActioningId(personId);
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
            const res = await fetch(`${BACKEND_URL}/api/friend/reject/${personId}`, { method: "POST", credentials: "include" });
            if (!res.ok) throw new Error("Failed to reject");
            setNearbyPeoples((prev) =>
                prev.map((p) =>
                    p.session_id === personId ? { ...p, is_request_received: false } : p
                )
            );
        } catch (err) {
            console.error("Failed to reject friend request:", err);
            alert("Failed to reject. Please try again.");
        } finally {
            setActioningId(null);
        }
    }

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow"><span className="dot" /> Approximate location only</p>
                    <h1 className="h1">Who&apos;s around?</h1>
                </div>

                <div className="nearby-header-right">
                    {nearbyEnabled && (
                        <div className="nearby-radius-setter">
                            <div className="nearby-radius-body">
                                <span className="nearby-radius-label">Radius</span>
                                <span className="nearby-radius-value">
                                    {formatRadius(radius).value}
                                    <span className="nearby-radius-unit">{formatRadius(radius).unit}</span>
                                </span>
                            </div>
                            <div className="nearby-radius-track-container">
                                <input
                                    id="radius-slider"
                                    className="nearby-radius-input"
                                    type="range"
                                    min="0"
                                    max={RADIUS_PRESETS.length - 1}
                                    step="1"
                                    value={radiusIdx}
                                    onChange={(e) => {
                                        const idx = Number(e.target.value);
                                        setRadiusIdx(idx);
                                        setRadius(RADIUS_PRESETS[idx]);
                                    }}
                                    style={{
                                        background: `linear-gradient(to right, var(--accent) ${(radiusIdx / (RADIUS_PRESETS.length - 1)) * 100}%, var(--line) ${(radiusIdx / (RADIUS_PRESETS.length - 1)) * 100}%)`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Location toggle ── */}
                    <button
                        id="nearby-toggle"
                        className={`nearby-toggle${nearbyEnabled ? " nearby-toggle--on" : ""}${(toggling || loading) ? " nearby-toggle--busy" : ""}`}
                        onClick={handleToggle}
                        disabled={toggling || loading}
                        aria-pressed={nearbyEnabled}
                        aria-label={nearbyEnabled ? "Disable location sharing" : "Enable location sharing"}
                    >
                        <span className="nearby-toggle-track">
                            <span className="nearby-toggle-thumb">
                                <Navigation size={10} strokeWidth={2.5} />
                            </span>
                        </span>
                        <span className="nearby-toggle-label">
                            {loading ? "Loading…" : toggling ? "Updating…" : nearbyEnabled ? "Location on" : "Location off"}
                        </span>
                    </button>
                </div>
            </header>


            {nearbyEnabled ? (
                <>
                    <aside className="nearby-radar" aria-hidden="true">
                        <div className="beam"></div>
                        <div className="core"><img className="ring-ghost-art" src="/mask.png" alt="" /></div>
                        {nearbyPeoples.slice(0, 8).map((person) => {
                            const angle = radarAngles[person.session_id] || 0;
                            // distance up to 5000m maps to radius up to 42%
                            const maxDist = 5000;
                            // Ensure it's at least 22% away from center so it doesn't overlap core
                            const minRadiusPct = 22;
                            const maxRadiusPct = 42;
                            const radiusPct = minRadiusPct + Math.min((person.distance_in_meters / maxDist), 1) * (maxRadiusPct - minRadiusPct);
                            
                            const top = 50 - radiusPct * Math.cos(angle);
                            const left = 50 + radiusPct * Math.sin(angle);
                            
                            const distText = person.distance_in_meters >= 1000 
                                ? (person.distance_in_meters/1000).toFixed(1) + 'km' 
                                : Math.round(person.distance_in_meters) + 'm';

                            return (
                                <div 
                                    key={`radar-${person.session_id}`} 
                                    className="pip" 
                                    style={{ top: `${top}%`, left: `${left}%` }}
                                >
                                    <AnonymousAvatar type={person.avatar} />
                                    <span 
                                        className="dist-tag" 
                                        style={{ top: 'calc(100% - 4px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                                    >
                                        ~{distText}
                                    </span>
                                </div>
                            );
                        })}
                    </aside>

                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div className="nearby-count-pill">
                            <span className="nearby-count-number">{nearbyPeoples.length}</span>
                            <span className="nearby-count-text">people nearby</span>
                        </div>
                    </div>

                    <div className="nearby-grid">
                        {(loadingPeoples && nearbyPeoples.length === 0) ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <article className="nearby-card nearby-skeleton-card" key={`skel-${i}`}>
                                    <header className="nearby-head">
                                        <div className="nearby-identity">
                                            <div className="nearby-avatar"></div>
                                            <div className="nearby-meta">
                                                <div className="skeleton-line skeleton-title" />
                                                <div className="skeleton-line skeleton-desc" />
                                            </div>
                                        </div>
                                        <div className="skeleton-line skeleton-status" />
                                    </header>
                                    <footer className="nearby-foot">
                                        <div className="skeleton-line skeleton-dist" />
                                    </footer>
                                </article>
                            ))
                        ) : nearbyPeoples.map((person, i) => (
                            <article className="nearby-card" key={person.session_id} data-status={person.status} style={{ "--i": i }}>
                                <header className="nearby-head">
                                    <div className="nearby-identity">
                                        <div className="nearby-avatar">
                                            <AnonymousAvatar type={person.avatar} size="lg" online={person.status === "active"} />
                                        </div>
                                        <div className="nearby-meta">
                                            <h3>{person.name}</h3>
                                            <p>{person.gender}</p>
                                        </div>
                                    </div>
                                    <span className={`nearby-status status-${person.status}`}>
                                        <span className="nearby-status-pip" />
                                        {STATUS_LABEL[person.status] || person.status}
                                    </span>
                                </header>
                                <footer className="nearby-foot">
                                    <span className="nearby-dist">
                                        <MapPin size={10} strokeWidth={2} />
                                        {Math.round(person.distance_in_meters)}m
                                    </span>
                                    <div className="nearby-actions">
                                        {/* No pending request from either side — show Add Friend */}
                                        {!person.is_friend && !person.is_request_sent && !person.is_request_received && (
                                            <button 
                                                className="nearby-action-btn" 
                                                aria-label="Send friend request" 
                                                title="Add Friend"
                                                onClick={() => handleFriendRequest(person.session_id)}
                                                disabled={actioningId === person.session_id}
                                            >
                                                <UserPlus size={14} strokeWidth={2} />
                                            </button>
                                        )}
                                        {/* We sent a request — show cancel */}
                                        {person.is_request_sent && !person.is_friend && (
                                            <button 
                                                className="nearby-action-btn nearby-action-btn--cancel" 
                                                aria-label="Cancel friend request" 
                                                title="Cancel Request"
                                                onClick={() => handleCancelRequest(person.session_id)}
                                                disabled={actioningId === person.session_id}
                                            >
                                                <UserMinus size={14} strokeWidth={2} />
                                            </button>
                                        )}
                                        {/* They sent us a request — show Accept + Reject */}
                                        {person.is_request_received && !person.is_friend && (
                                            <>
                                                <button
                                                    className="nearby-action-btn nearby-action-btn--accept"
                                                    aria-label="Accept friend request"
                                                    title="Accept"
                                                    onClick={() => handleAcceptRequest(person.session_id)}
                                                    disabled={actioningId === person.session_id}
                                                >
                                                    <Check size={14} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    className="nearby-action-btn nearby-action-btn--reject"
                                                    aria-label="Reject friend request"
                                                    title="Reject"
                                                    onClick={() => handleRejectRequest(person.session_id)}
                                                    disabled={actioningId === person.session_id}
                                                >
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            className="nearby-action-btn primary" 
                                            aria-label="Send message" 
                                            title="Message"
                                            onClick={() => handleMessageClick(person)}
                                            disabled={actioningId === person.session_id}
                                        >
                                            <MessageCircle size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                </footer>
                            </article>
                        ))}
                    </div>
                </>
            ) : (
                /* ── Disabled empty state ── */
                <div className="nearby-disabled">
                    <div className="nearby-disabled-icon">
                        <Navigation size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="nearby-disabled-title">Location sharing is off</h2>
                    <p className="nearby-disabled-body">
                        Turn on location sharing to see who&apos;s around you. Your exact position is never revealed — only an approximate area.
                    </p>
                    <button
                        className="nearby-disabled-cta"
                        onClick={handleToggle}
                        disabled={toggling}
                    >
                        {toggling ? "Enabling…" : "Enable location"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Nearby;
