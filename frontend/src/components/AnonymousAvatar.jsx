function AvatarMark({ type }) {
    if (type === "fox") return <><path d="M8 10 11 4l3 3h4l3-3 3 6v8c0 4-3.6 7-8 7s-8-3-8-7v-8Z" /><path d="M12 16h.01M20 16h.01M14 20c1.2.8 2.8.8 4 0" /></>;
    if (type === "panda") return <><circle cx="16" cy="16" r="8.5" /><path d="M10.5 9.5 8 7m13.5 2.5L24 7M11 16h.01M21 16h.01M14 20c1.2.8 2.8.8 4 0" /><circle cx="11" cy="16" r="2.5" opacity=".25" /><circle cx="21" cy="16" r="2.5" opacity=".25" /></>;
    if (type === "owl") return <><path d="M9 11 12 7l4 2 4-2 3 4v10c0 3-3 5-7 5s-7-2-7-5V11Z" /><circle cx="13" cy="16" r="2.5" /><circle cx="19" cy="16" r="2.5" /><path d="m16 18-1.5 2h3L16 18Z" /></>;
    if (type === "cat") return <><path d="M8 12 10 6l4 3h4l4-3 2 6v8c0 4-3.6 7-8 7s-8-3-8-7v-8Z" /><path d="M12 17h.01M20 17h.01M13 21c1.8 1.1 4.2 1.1 6 0" /></>;
    return <><path d="M10 25v-9c0-5.5 2.6-9 6-9s6 3.5 6 9v9" /><path d="M10 16c1.5 1.2 3.5 1.8 6 1.8s4.5-.6 6-1.8M13 21h.01M19 21h.01" /></>;
}

function AnonymousAvatar({ type = "ghost", size = "md", online = false }) {
    const cls = { sm: "av av-sm", md: "av av-md", lg: "av av-lg", xl: "av av-xl" }[size] || "av av-md";

    return (
        <span className={`${cls} av-${type}`} aria-label={`Anonymous ${type}`}>
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <AvatarMark type={type} />
            </svg>
            {online && <span className="pip" />}
        </span>
    );
}

export default AnonymousAvatar;
