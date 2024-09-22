import "../styles/Header.css";
import icon from "../assets/icon.svg";
import PropTypes from "prop-types";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

function Header({ activePage, onPageChange }) {
	const handleTitleClick = () => {
		window.location.reload();
	};

	return (
		<div className="header">
			<div className="title" onClick={handleTitleClick}>
				<img src={icon} alt="Sweet Friend's Icon" />
				<h1>Sweet Friend</h1>
			</div>
			<div className="links">
				<Link
					to="/app/dashboard"
					className={activePage === "Dashboard" ? "active" : ""}
					onClick={() => onPageChange("Dashboard")}
				>
					Dashboard
				</Link>
				<Link
					to="/app/logs"
					className={activePage === "Logs" ? "active" : ""}
					onClick={() => onPageChange("Logs")}
				>
					Logs
				</Link>
				<Link
					to="/app/chatbot"
					className={activePage === "Chatbot" ? "active" : ""}
					onClick={() => onPageChange("Chatbot")}
				>
					ChatBot
				</Link>
			</div>
		</div>
	);
}

Header.propTypes = {
	activePage: PropTypes.string.isRequired,
	onPageChange: PropTypes.func.isRequired,
};

export default Header;
