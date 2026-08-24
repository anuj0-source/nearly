import { anonymousPeople, previousMatches, starterMessages } from "../data/mockData";

// These mock functions mirror the future FastAPI boundary.
export function createAnonymousSession() {
    return Promise.resolve({ id: "mock-session", status: "anonymous" });
}

export function getCurrentSession() {
    return Promise.resolve({ id: "mock-session", status: "anonymous" });
}

export function findMatch() {
    return Promise.resolve(anonymousPeople[0]);
}

export function sendMessage(message) {
    return Promise.resolve({ ...message, delivered: true });
}

export function getMatches() {
    return Promise.resolve(previousMatches);
}

export async function getNearbyPeople() {
    const res = await fetch("/api/nearby/peoples", {
        credentials: "include",
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Failed to fetch nearby peoples: ${res.status}`);
    }

    const data = await res.json();
    return data.nearby_peoples || data["nearby peoples"] || [];
}

export async function sendFriendRequest(friendId) {
    const res = await fetch(`/api/friend/request/${friendId}`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to send friend request");
    }
    return res.json();
}

export async function getConversation(partnerId) {
    const res = await fetch(`/api/messages/conversation/${partnerId}`, {
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to get conversation");
    }
    return res.json();
}

export function getProfile() {
    return Promise.resolve({
        name: "Anonymous Fox",
        avatar: "fox",
        status: "Available for chat",
    });
}

export function getStarterMessages() {
    return Promise.resolve(starterMessages);
}

export function updateProfile(profile) {
    return Promise.resolve(profile);
}

// POST /api/nearby/location — sends the device's current coordinates.
// Fires on first fix, then only when the user moves ≥500 m OR 2 minutes pass.
export async function sendLocation(latitude, longitude) {
    const res = await fetch("/api/nearby/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // forward session cookie
        body: JSON.stringify({ latitude, longitude }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Location update failed: ${res.status}`);
    }

    return res.json();
}

// POST /api/nearby/enable-disable — toggles the user's nearby visibility.
export async function toggleNearby() {
    const res = await fetch("/api/nearby/enable-disable", {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Toggle nearby failed: ${res.status}`);
    }

    return res.json(); // { message, is_nearby_enabled }
}

// GET /api/nearby/status — returns { is_nearby_enabled } for the current session.
export async function getNearbyStatus() {
    const res = await fetch("/api/nearby/status", {
        credentials: "include",
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Get status failed: ${res.status}`);
    }

    return res.json(); // { is_nearby_enabled: true | false }
}


