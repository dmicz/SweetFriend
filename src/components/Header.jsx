import "../styles/Header.css";
import icon from "../assets/icon.svg";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom"; // Import useLocation to get the current URL
import { useEffect } from "react";

function Header({ activePage, onPageChange }) {
	const location = useLocation(); // Get the current URL location

	// Set the active page based on the URL path during the initial render
	const determineActivePage = (path) => {
		if (path.includes("/app/starred-logs")) {
		  return "StarredLogs"; // Prioritize starred-logs over logs
		} else if (path.includes("/app/logs")) {
		  return "Logs"; 
		} else if (path.includes("/app/chatbot")) {
		  return "Chatbot";
		} else if (path.includes("/app/dashboard")) {
		  return "Dashboard";
		}
		return "Dashboard"; // Default to Dashboard if no match
	  };

	// Get the initial active page value based on the URL
	useEffect(() => {
		const initialPage = determineActivePage(location.pathname);
		onPageChange(initialPage); // Set the correct active page during the initial render
	}, [location, onPageChange]);

	return (
		<div className="header">
			<Link
				className="title"
				to="/app/dashboard"
				onClick={() => onPageChange("Dashboard")}
			>
				<img src={icon} alt="Sweet Friend's Icon" />
				<h1>Sweet Friend</h1>
			</Link>
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
					to="/app/starred-logs"
					className={activePage === "StarredLogs" ? "active" : ""}
					onClick={() => onPageChange("StarredLogs")}
				>
					Starred Logs
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
