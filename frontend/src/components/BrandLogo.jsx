function BrandLogo({ className = "", compact = false }) {
    return (
            <span className={`brand-logo ${compact ? "brand-logo-compact" : ""} ${className}`.trim()}>
                <span className="brand-logo-emblem" aria-hidden="true">
                <img className="brand-logo-art" src="/mask.png" alt="" />
                </span>
            {!compact && <span className="brand-logo-type">Near<span>ly</span></span>}
        </span>
    );
}

export default BrandLogo;
