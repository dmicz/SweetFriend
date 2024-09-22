import { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Log from "./components/Log";
import "./App.css";
import ChatBot from "./components/Chatbot";

function App() {
	const [activePage, setActivePage] = useState("Dashboard");

	// Function to handle page changes
	const handlePageChange = (page) => {
		setActivePage(page);
	};

	// Conditionally render the active page
	return (
		<>
			<Header activePage={activePage} onPageChange={handlePageChange} />
			{activePage === "Dashboard" && <Dashboard />}
			{activePage === "Logs" && <Log />}
			{activePage === "Chatbot" && <ChatBot />}
		</>
	);
}

export default App;
