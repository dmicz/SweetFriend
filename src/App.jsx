import { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Log from "./components/Log";
import "./App.css";
import LoginForm from "./components/LoginForm/LoginForm";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import "./index.css";import ChatBot from "./components/Chatbot";

function App() {
	const [activePage, setActivePage] = useState("Dashboard");

	// Function to handle page changes
	const handlePageChange = (page) => {
		setActivePage(page);
	};

	// Conditionally render the active page
	return (
		<>
			<Routes>
				<Route path="/" element={<LoginForm/>} />
				<Route path="/register" element={<RegisterForm/>} />
				<Route path="/home" element={<Home/>} />
			</Routes>

			{/* <Header activePage={activePage} onPageChange={handlePageChange} />
			{activePage === "Dashboard" && <Dashboard /> */}
			{/* <LoginForm/> */}
			{activePage === "Logs" && <Log />}
			{activePage === "Chatbot" && <ChatBot />}
		</>
	);
}

export default App;
