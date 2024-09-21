import { useState } from "react";
import "../styles/Header.css";
import icon from "../assets/icon.svg";

function Header() {
	const [activePage, setActivePage] = useState("Dashboard");

	// Function to handle page changes and set the active page
	const handlePageChange = (page) => {
		setActivePage(page);
	};

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
					onClick={() => handlePageChange("Dashboard")}
				>
					Dashboard
				</a>
				<a
					href="#logs"
					className={activePage === "Logs" ? "active" : ""}
					onClick={() => handlePageChange("Logs")}
				>
					Logs
				</a>
			</div>
		</div>
	);
}

export default Header;
