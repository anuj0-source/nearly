import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, MessageCircle, UserPlus, Check } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import { sendLocation, toggleNearby, getNearbyStatus, getNearbyPeople, sendFriendRequest, getConversation } from "../services/api";

const STATUS_LABEL = {
    online: "Online",
    away: "Away",
    offline: "Offline",
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

function Nearby() {
    const navigate = useNavigate();
    const [nearbyEnabled, setNearbyEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [loading, setLoading] = useState(true); // true until DB status is fetched
    const [nearbyPeoples, setNearbyPeoples] = useState([]);
    const [loadingPeoples, setLoadingPeoples] = useState(false);
    
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

    // ── Start/stop GPS watcher based on toggle ───────────────────────────────
    useEffect(() => {
        let intervalId = null;

        const fetchPeoples = async () => {
            if (nearbyPeoples.length === 0) setLoadingPeoples(true);
            try {
                const peoples = await getNearbyPeople();
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

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow"><span className="dot" /> Approximate location only</p>
                    <h1 className="h1">Who&apos;s around?</h1>
                </div>

                <div className="nearby-header-right">
                    {nearbyEnabled && (
                        <aside className="nearby-count">
                            {nearbyPeoples.length} <span className="accent">people nearby</span>
                        </aside>
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
                        <div className="core"><img className="ring-ghost-art" src="/mask.png" alt="" /></div>
                        <div className="pip r1"><AnonymousAvatar type="fox" /></div>
                        <div className="pip r2"><AnonymousAvatar type="panda" /></div>
                        <div className="pip r3"><AnonymousAvatar type="owl" /></div>
                        <div className="pip r4"><AnonymousAvatar type="ghost" /></div>
                        <div className="pip r5"><AnonymousAvatar type="cat" /></div>
                        <span className="dist-tag t1">~800m</span>
                        <span className="dist-tag t2">~2.1km</span>
                        <span className="dist-tag t3">~1.2km</span>
                    </aside>

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
                            <article className="nearby-card" key={person.session_id} style={{ "--i": i }}>
                                <header className="nearby-head">
                                    <div className="nearby-identity">
                                        <div className="nearby-avatar">
                                            <AnonymousAvatar type={person.avatar} size="lg" online={person.status === "online"} />
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
                                        {!person.is_friend && !person.is_request_sent && (
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
                                        {person.is_request_sent && !person.is_friend && (
                                            <button 
                                                className="nearby-action-btn" 
                                                aria-label="Request sent" 
                                                title="Request Sent"
                                                disabled
                                            >
                                                <Check size={14} strokeWidth={2} />
                                            </button>
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
