import { useState, useEffect } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Log from "./components/Log";
import "./App.css";
import LoginForm from "./components/LoginForm/LoginForm";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./index.css";
import ChatBot from "./components/Chatbot";
import Cookies from "js-cookie";

function App() {
	const [activePage, setActivePage] = useState("Dashboard");

	// Function to handle page changes
	const handlePageChange = (page) => {
		setActivePage(page);
	};

	const navigate = useNavigate();

	useEffect(() => {
		if (Cookies.get("logged_in") === "true") {
			navigate("/app/dashboard");
		}
	}, []);

	return (
		<>
			<Routes>
				<Route path="/" element={<LoginForm />} />
				<Route path="/register" element={<RegisterForm />} />

				{/* Route for Dashboard, Logs, and ChatBot pages */}
				<Route
					path="/app/*"
					element={
						<>
							<Header activePage={activePage} onPageChange={handlePageChange} />
							<Routes>
								<Route path="dashboard" element={<Dashboard />} />
								<Route path="logs" element={<Log />} />
								<Route path="chatbot" element={<ChatBot />} />
							</Routes>
						</>
					}
				/>
			</Routes>
		</>
	);
}

export default App;
