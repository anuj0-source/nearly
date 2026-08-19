import GhostMark from "./GhostMark";

function BrandLogo({ className = "" }) {
    return (
        <span className={`brand-logo ${className}`.trim()}>
            <GhostMark className="brand-logo-mark" />
            <span>Nearly</span>
        </span>
    );
}

export default BrandLogo;
