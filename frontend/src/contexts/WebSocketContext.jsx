import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

const WebSocketContext = createContext(null);

export function useWebSocket() {
    return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
    const websocketRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);
    const listenersRef = useRef(new Set());

    // ── Subscribe / unsubscribe to raw message events ──
    const addMessageListener = useCallback((fn) => {
        listenersRef.current.add(fn);
        return () => listenersRef.current.delete(fn);
    }, []);

    const connectingPromiseRef = useRef(null);

    // ── Open a new WebSocket (closes any existing one first) ──
    const connect = useCallback((sessionId) => {
        if (!sessionId || !BACKEND_URL) {
            return Promise.reject(new Error("Missing sessionId or BACKEND_URL"));
        }

        if (connectingPromiseRef.current) {
            return connectingPromiseRef.current;
        }

        const wsUrl = `${BACKEND_URL.replace(/^http/, "ws")}/api/chat/ws?session_id=${sessionId}`;

        if (websocketRef.current && (websocketRef.current.readyState === WebSocket.OPEN || websocketRef.current.readyState === WebSocket.CONNECTING) && websocketRef.current.url === wsUrl) {
            return Promise.resolve(websocketRef.current);
        }

        // Close existing socket cleanly before opening a new one.
        if (websocketRef.current) {
            websocketRef.current.onclose = null;
            websocketRef.current.onerror = null;
            websocketRef.current.close();
            websocketRef.current = null;
        }

        const promise = new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            websocketRef.current = ws;

            ws.onopen = () => {
                setSocketReady(true);
                connectingPromiseRef.current = null;
                resolve(ws);
            };

            ws.onclose = () => {
                setSocketReady(false);
                if (connectingPromiseRef.current === promise) {
                    connectingPromiseRef.current = null;
                }
            };

            ws.onerror = () => {
                setSocketReady(false);
                if (connectingPromiseRef.current === promise) {
                    connectingPromiseRef.current = null;
                }
                reject(new Error("WebSocket connection failed"));
            };

            ws.onmessage = (event) => {
                // Fan out to all registered listeners.
                listenersRef.current.forEach((fn) => {
                    try { fn(event); } catch (e) { console.error("WS listener error", e); }
                });
            };
        });

        connectingPromiseRef.current = promise;
        return promise;
    }, []);

    // ── Explicitly close the socket (used by endChat / user_left) ──
    const disconnect = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.onclose = null;
            websocketRef.current.close();
            websocketRef.current = null;
        }
        setSocketReady(false);
    }, []);

    // ── Send a JSON payload ──
    const sendJson = useCallback((data) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify(data));
        }
    }, []);

    // ── Auto-reconnect on page load / refresh if a session exists ──
    useEffect(() => {
        let cancelled = false;

        async function autoReconnect() {
            if (!BACKEND_URL) return;
            // Don't reconnect if we already have an open socket.
            if (websocketRef.current?.readyState === WebSocket.OPEN) return;

            try {
                const res = await fetch(`${BACKEND_URL}/api/session/me`, {
                    credentials: "include",
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;

                if (data.session_id) {
                    await connect(data.session_id);
                }
            } catch {
                // No valid session — nothing to reconnect.
            }
        }

        autoReconnect();

        return () => { cancelled = true; };
    }, [connect]);

    const value = {
        websocketRef,
        socketReady,
        connect,
        disconnect,
        sendJson,
        addMessageListener,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}
