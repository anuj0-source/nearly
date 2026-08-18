import { Moon, Sun } from "lucide-react";

function ThemeToggle({ darkMode, onToggle, compact = false }) {
    return (
        <button
            className={`theme-toggle${compact ? " compact" : ""}`}
            type="button"
            onClick={onToggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Light" : "Dark"}
        >
            {darkMode ? <Sun size={compact ? 15 : 14} /> : <Moon size={compact ? 15 : 14} />}
            {!compact && <span>{darkMode ? "Light mode" : "Dark mode"}</span>}
        </button>
    );
}

export default ThemeToggle;
