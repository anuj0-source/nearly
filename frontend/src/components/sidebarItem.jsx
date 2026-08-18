import { Link } from "react-router-dom";


function SidebarItem({ icon, label, path }) {

    return (
        <Link
            to={path}
            className="sidebar-item"
        >
            <span className="sidebar-icon">
                {icon}
            </span>

            <span>
                {label}
            </span>
        </Link>
    );
}


export default SidebarItem;