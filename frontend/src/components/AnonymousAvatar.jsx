const knownTypes = new Set(["fox", "panda", "owl", "cat", "ghost"]);

function isAvatarUrl(value) {
    if (typeof value !== "string") return false;

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/* All marks: hand-drawn style with simple eyes + smile for personality. */
function AvatarMark({ type }) {
    if (type === "fox") return (
        <>
            {/* ears */}
            <path d="M8 11 11 4l4 4h6l4-4 3 7v9c0 4-3.6 6-9 6s-9-2-9-6v-9Z" />
            {/* eyes */}
            <ellipse cx="13.5" cy="16" rx="1.6" ry="2" fill="currentColor" />
            <ellipse cx="20.5" cy="16" rx="1.6" ry="2" fill="currentColor" />
            {/* smile + nose */}
            <path d="M17 18.5h.01" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 21c1 .8 2.5.8 4 0" strokeLinecap="round" />
        </>
    );
    if (type === "panda") return (
        <>
            <circle cx="16" cy="16" r="9" />
            {/* ears */}
            <circle cx="9" cy="8" r="2.5" />
            <circle cx="23" cy="8" r="2.5" />
            {/* eye patches + eyes */}
            <ellipse cx="12" cy="15" rx="2.4" ry="3" opacity="0.5" />
            <ellipse cx="20" cy="15" rx="2.4" ry="3" opacity="0.5" />
            <circle cx="12" cy="15" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="20" cy="15" r="0.9" fill="currentColor" stroke="none" />
            {/* nose + smile */}
            <path d="M16 18.5h.01" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 20.5c1 .8 2.5.8 4 0" strokeLinecap="round" />
        </>
    );
    if (type === "owl") return (
        <>
            <path d="M9 12 12 7l4 3 4-3 3 5v10c0 3-3 5-7 5s-7-2-7-5V12Z" />
            {/* large round eyes */}
            <circle cx="13" cy="16" r="2.6" fill="currentColor" stroke="none" />
            <circle cx="19" cy="16" r="2.6" fill="currentColor" stroke="none" />
            <circle cx="13" cy="16" r="1" fill="var(--paper)" stroke="none" />
            <circle cx="19" cy="16" r="1" fill="var(--paper)" stroke="none" />
            {/* beak + small smile */}
            <path d="m16 18-1.2 2h2.4L16 18Z" fill="currentColor" stroke="none" />
            <path d="M13.5 22.5c1.5 1 3.5 1 5 0" strokeLinecap="round" />
        </>
    );
    if (type === "cat") return (
        <>
            {/* pointed ears */}
            <path d="M8 13 10 5l4 4h4l4-4 2 8v8c0 4-3.6 6-7 6s-7-2-7-6v-8Z" />
            {/* eyes */}
            <ellipse cx="13" cy="16" rx="1.4" ry="2" fill="currentColor" stroke="none" />
            <ellipse cx="19" cy="16" rx="1.4" ry="2" fill="currentColor" stroke="none" />
            {/* nose + smile */}
            <path d="M16 19l-1 1h2l-1-1Z" fill="currentColor" stroke="none" />
            <path d="M13 21c1.5 1 4.5 1 6 0" strokeLinecap="round" />
            {/* whiskers */}
            <path d="M8 19h3M8 21h3M24 19h-3M24 21h-3" strokeLinecap="round" opacity="0.7" />
        </>
    );
    /* ghost — handcrafted with eyes + smile */
    return (
        <>
            <path d="M10 25v-9c0-5.5 2.6-9 6-9s6 3.5 6 9v9" />
            <path d="M10 16c1.5 1.2 3.5 1.8 6 1.8s4.5-.6 6-1.8" strokeLinecap="round" />
            <ellipse cx="13" cy="13.5" rx="1.4" ry="1.8" fill="currentColor" stroke="none" />
            <ellipse cx="19" cy="13.5" rx="1.4" ry="1.8" fill="currentColor" stroke="none" />
            <path d="M14 19.5c1 .8 2.5.8 4 0" strokeLinecap="round" />
        </>
    );
}

function AnonymousAvatar({ type = "ghost", size = "md", online = false }) {
    const cls = { sm: "av av-sm", md: "av av-md", lg: "av av-lg", xl: "av av-xl" }[size] || "av av-md";
    const hasImageUrl = isAvatarUrl(type);
    const useEmoji = !hasImageUrl && !knownTypes.has(type);
    const avatarClass = hasImageUrl ? "av-image" : `av-${type}`;

    return (
        <span className={`${cls} ${avatarClass}`} aria-label="Anonymous avatar">
            {hasImageUrl ? (
                <img src={type} alt="" />
            ) : useEmoji ? (
                <span className="av-emoji" aria-hidden="true">{type}</span>
            ) : (
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <AvatarMark type={type} />
                </svg>
            )}
        </span>
    );
}

export default AnonymousAvatar;
