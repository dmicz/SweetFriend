import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import "./App.css";
import LoginForm from "./components/LoginForm/LoginForm";
import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import "./index.css";
function App() {
	return (
		<>
			<Routes>
				<Route path="/" element={<LoginForm/>} />
				<Route path="/home" element={<Home/>} />
			</Routes>

			{/* <Header />
			<Dashboard /> */}
			{/* <LoginForm/> */}
		</>
	);
}

export default App;
