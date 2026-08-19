/* Animated cartoonist-secret-style background for the Home page.
   Hand-drawn vibe: drifting mysterious shapes, scattered clues, paper texture,
   a magnifying glass, fingerprint, footprints, question marks, "anonymous" tags.
   Covers the FULL viewport, not just the top. */

const clues = [
    // top cluster
    { left: "6%",  top: "10%", delay: 0,    rot: -8,  drift: 22,  size: 44 },
    { left: "78%", top: "8%",  delay: 1.2,  rot: 6,   drift: -18, size: 40 },
    { left: "44%", top: "6%",  delay: 2.4,  rot: 3,   drift: 12,  size: 36 },
    { left: "16%", top: "26%", delay: 0.6,  rot: 4,   drift: 16,  size: 42 },
    { left: "84%", top: "22%", delay: 1.8,  rot: -5,  drift: -20, size: 38 },
    // middle cluster
    { left: "4%",  top: "44%", delay: 0.9,  rot: -3,  drift: -14, size: 40 },
    { left: "92%", top: "46%", delay: 2.2,  rot: 7,   drift: 18,  size: 36 },
    { left: "30%", top: "50%", delay: 1.4,  rot: -6,  drift: -10, size: 32 },
    { left: "70%", top: "54%", delay: 0.3,  rot: 5,   drift: 14,  size: 34 },
    // bottom cluster
    { left: "10%", top: "68%", delay: 1.6,  rot: -7,  drift: 16,  size: 42 },
    { left: "82%", top: "72%", delay: 0.4,  rot: 4,   drift: -20, size: 40 },
    { left: "48%", top: "78%", delay: 2.0,  rot: -2,  drift: 12,  size: 36 },
    { left: "62%", top: "86%", delay: 1.0,  rot: 6,   drift: -14, size: 32 },
    { left: "22%", top: "88%", delay: 1.7,  rot: -4,  drift: 10,  size: 38 },
    { left: "76%", top: "92%", delay: 0.8,  rot: 3,   drift: -16, size: 34 },
];

function Clue({ left, top, delay, rot, drift, size, children }) {
    return (
        <span
            className="clue"
            style={{
                left,
                top,
                width: `${size}px`,
                height: `${size}px`,
                "--rot": `${rot}deg`,
                "--drift": `${drift}px`,
                "--delay": `${delay}s`,
            }}
            aria-hidden="true"
        >
            {children}
        </span>
    );
}

const ClueIcon = ({ d }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const CLUE_PATHS = [
    // magnifying glass
    "M10 4a6 6 0 1 0 3.6 10.8L17 18l1-1-3.4-3.2A6 6 0 0 0 10 4Z",
    // fingerprint
    "M5 18c0-3 2-4 4-4M9 14c2 0 3-1 3-3M12 11c1-1 1-3 0-4M12 7c1 0 2 0 2-2M14 5c0-1-1-2-2-2M9 3c0-1 1-2 2-2",
    // hat (detective)
    "M3 14h18l-2-5H5l-2 5ZM7 9V6h10v3",
    // diamond/spy symbol
    "M12 2 8 6l4 4 4-4-4-4ZM12 22l-4-4 4-4 4 4-4 4ZM2 12l4-4 4 4-4 4-4-4ZM22 12l-4-4-4 4 4 4 4-4Z",
    // document with lines
    "M5 4h11l3 3v13H5zM5 9h14M9 4v5h-4M9 13h6M9 16h4",
    // file folder
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    // key
    "M14 4a4 4 0 1 1-3.5 6L7 14l-1 1 2 2-2 2h2v-2l1-1 2 2 4-4a4 4 0 0 0-1-6Z",
    // footprint
    "M8 8c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5ZM6 16c0-2 2-3 4-3s4 1 4 3-2 4-4 4-4-2-4-4Z",
    // envelope (secret message)
    "M3 6h18v12H3zM3 6l9 7 9-7",
    // lock
    "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3M12 14v2",
    // eye (surveillance)
    "M12 5c5 0 9 7 9 7s-4 7-9 7-9-7-9-7 4-7 9-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    // compass / unknown
    "M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z",
    // chat bubble (anonymous chat)
    "M4 5h16v10H10l-4 4v-4H4z",
    // question mark circle
    "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM10 9c0-1 1-2 2-2s2 1 2 2-1 2-2 3v1M12 16h.01",
    // star (top-secret)
    "M12 2 14 9 21 9 16 13 18 21 12 17 6 21 8 13 3 9 10 9Z",
];

function HomeBackground() {
    return (
        <div className="home-bg" aria-hidden="true">
            {/* soft drifting color blobs */}
            <div className="bg-blob bg-blob-a" />
            <div className="bg-blob bg-blob-b" />
            <div className="bg-blob bg-blob-c" />
            <div className="bg-blob bg-blob-d" />

            {/* thin animated grid suggesting a case file */}
            <div className="bg-grid" />

            {/* paper texture noise */}
            <div className="bg-noise" />

            {/* scattered hand-drawn clues — full viewport */}
            {clues.map((c, i) => (
                <Clue key={i} {...c}>
                    <ClueIcon d={CLUE_PATHS[i % CLUE_PATHS.length]} />
                </Clue>
            ))}

            {/* hand-drawn arrow scribbles pointing toward the ghost */}
            <svg className="bg-arrow arrow-1" viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 40 C 30 40, 50 38, 70 30" />
                <path d="M70 30 L 62 28 M70 30 L 64 36" />
            </svg>
            <svg className="bg-arrow arrow-2" viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M110 50 C 90 50, 70 48, 50 40" />
                <path d="M50 40 L 58 38 M50 40 L 56 46" />
            </svg>

            {/* small "case file" tags */}
            <div className="bg-tag tag-1">case&nbsp;№4271</div>
            <div className="bg-tag tag-2">classified</div>
            <div className="bg-tag tag-3">file&nbsp;07</div>

            {/* "ANONYMOUS" stamp + a second one for depth */}
            <div className="bg-stamp stamp-1">ANONYMOUS</div>
            <div className="bg-stamp stamp-2">TOP&nbsp;SECRET</div>

            {/* scattered tiny dots — like pin-pricks on a map, distributed top to bottom */}
            {[
                { left: "30%", top: "12%",  delay: 0 },
                { left: "84%", top: "20%",  delay: 1 },
                { left: "76%", top: "36%",  delay: 0.5 },
                { left: "6%",  top: "50%",  delay: 2 },
                { left: "22%", top: "78%",  delay: 1.5 },
                { left: "50%", top: "88%",  delay: 2.5 },
                { left: "88%", top: "60%",  delay: 0.8 },
                { left: "40%", top: "44%",  delay: 1.8 },
                { left: "62%", top: "68%",  delay: 2.2 },
                { left: "12%", top: "32%",  delay: 1.2 },
                { left: "70%", top: "14%",  delay: 0.3 },
                { left: "16%", top: "94%",  delay: 0.9 },
            ].map((d, i) => (
                <span
                    key={i}
                    className="bg-dot"
                    style={{
                        left: d.left,
                        top: d.top,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}

            {/* faint hand-drawn question marks drifting (more spread out) */}
            <span className="bg-q q1">?</span>
            <span className="bg-q q2">?</span>
            <span className="bg-q q3">?</span>
            <span className="bg-q q4">?</span>
            <span className="bg-q q5">?</span>

            {/* tiny scribbled note lines (more distributed) */}
            <svg className="bg-note note-1" viewBox="0 0 80 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5 C 20 15, 40 15, 75 5 M5 25 C 25 18, 55 18, 75 25" />
            </svg>
            <svg className="bg-note note-2" viewBox="0 0 80 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 10 C 25 20, 55 5, 75 18 M5 22 C 25 16, 55 25, 75 12" />
            </svg>

            {/* hand-drawn dashed circle outlines scattered around */}
            <span className="bg-circle c1" />
            <span className="bg-circle c2" />
            <span className="bg-circle c3" />

            {/* thin connection lines suggesting a case-board map */}
            <svg className="bg-conn conn-1" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 4" aria-hidden="true">
                <path d="M20 100 L 100 60 L 180 130" />
            </svg>
            <svg className="bg-conn conn-2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 4" aria-hidden="true">
                <path d="M30 170 L 110 110 L 180 60" />
            </svg>
        </div>
    );
}

export default HomeBackground;
