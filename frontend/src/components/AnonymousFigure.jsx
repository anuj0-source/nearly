function AnonymousFigure() {
    return (
        <svg className="anon-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="60" cy="60" r="50" opacity="0.4" />
            <circle cx="60" cy="60" r="34" opacity="0.18" strokeDasharray="2 4" />

            {/* anonymous silhouette: head + shoulders */}
            <path d="M60 38c-9 0-15 7-15 15s6 14 15 14 15-6 15-14-6-15-15-15z" fill="currentColor" opacity="0.08" />
            <path d="M60 38c-9 0-15 7-15 15s6 14 15 14 15-6 15-14-6-15-15-15z" />
            <path d="M28 95c4-13 17-22 32-22s28 9 32 22" />

            {/* small mark of mystery */}
            <path d="M55 50c0-3 2-5 5-5s5 2 5 5" opacity="0.6" />
            <path d="M65 50c0-3-2-5-5-5" opacity="0.6" />

            {/* sparse points */}
            <circle cx="22" cy="32" r="1" fill="currentColor" />
            <circle cx="96" cy="40" r="1" fill="currentColor" />
            <circle cx="100" cy="80" r="1" fill="currentColor" />
            <circle cx="14" cy="78" r="1" fill="currentColor" />
        </svg>
    );
}

export default AnonymousFigure;
