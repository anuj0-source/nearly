import { Moon, Sun } from "lucide-react";

function ThemeToggle({ darkMode, onToggle, icon = false }) {
    if (icon) {
        return (
            <button
                className="theme-toggle icon"
                type="button"
                onClick={onToggle}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Light" : "Dark"}
            >
                {darkMode ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
            </button>
        );
    }

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={onToggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Light" : "Dark"}
        >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? "Light mode" : "Dark mode"}</span>
        </button>
    );
}

export default ThemeToggle;
