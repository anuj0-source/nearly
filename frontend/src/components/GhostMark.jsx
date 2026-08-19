/* Brand mark — the ghost emoji 👻, used everywhere the anonymous symbol appears. */
function GhostMark({ className = "", style }) {
    return (
        <span
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                lineHeight: 1,
                userSelect: "none",
                ...style,
            }}
            aria-hidden="true"
        >
            👻
        </span>
    );
}

export default GhostMark;
