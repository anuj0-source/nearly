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

export function getNearbyPeople() {
    return Promise.resolve(anonymousPeople);
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
