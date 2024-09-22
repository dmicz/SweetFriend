import "../styles/Header.css";
import icon from "../assets/icon.svg";
import PropTypes from "prop-types";

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
				<a
					href="#dashboard"
					className={activePage === "Dashboard" ? "active" : ""}
					onClick={() => onPageChange("Dashboard")}
				>
					Dashboard
				</a>
				<a
					href="#logs"
					className={activePage === "Logs" ? "active" : ""}
					onClick={() => onPageChange("Logs")}
				>
					Logs
				</a>

				<a
					href="#chatbot"
					className={activePage === "Chatbot" ? "active" : ""}
					onClick={() => handlePageChange("Chatbot")}
				>
					ChatBot
				</a>
			</div>
		</div>
	);
}

Header.propTypes = {
	activePage: PropTypes.string.isRequired,
	onPageChange: PropTypes.func.isRequired,
};

export default Header;
