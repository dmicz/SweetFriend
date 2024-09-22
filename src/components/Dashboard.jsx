import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { getRelativePosition } from "chart.js/helpers";
import aiIcon from "../assets/ai.svg";
import recentIcon from "../assets/recent.svg";
import "../styles/Dashboard.css";
import { DateTime } from 'luxon';
import ReactMarkdown from "react-markdown";
import List from "./List";
import Modal from "./Modal";
import AddLogModal from "./AddLogModal"; // Import the AddLogModal component

function Dashboard() {
	// State management
	const [glucoseReadings, setGlucoseReadings] = useState([]);
	const [items, setItems] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null); // State to track the selected item
	const [markers, setMarkers] = useState({
		food: [],
		exercise: [],
	});
	const [aiSuggestion, setAiSuggestion] = useState("Random AI suggestions will be displayed here...");
	const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false); // State to manage AddLogModal visibility

	useEffect(() => {
		const fetchLogEntries = async () => {
			try {
				const response = await fetch("/api/log_entries");
				const data = await response.json();
				if (data.status === "success") {
					setItems(data.entries);

					// Extract food and exercise markers from entries
					const foodMarkers = data.entries
						.filter((entry) => entry.type === "Food")
						.map((entry) => ({
							x: DateTime.fromISO(entry.timestamp).toJSDate(),
							y: 120,
						}));

					const exerciseMarkers = data.entries
						.filter((entry) => entry.type === "Exercise")
						.map((entry) => ({
							x: DateTime.fromISO(entry.timestamp).toJSDate(),
							y: 100,
						}));

					setMarkers({
						food: foodMarkers,
						exercise: exerciseMarkers,
					});
				} else {
					console.error("Failed to fetch entries:", data.message);
				}
			} catch (error) {
				console.error("Error fetching log entries:", error);
			}
		};

		fetchLogEntries();
	}, []);

	// Function to show the modal with the selected item details
	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	// Function to close the modal
	const closeModal = () => {
		setSelectedItem(null);
	};

	// Toggle the AddLogModal
	const openAddLogModal = () => {
		setIsAddLogModalOpen(true);
	};

	const closeAddLogModal = () => {
		setIsAddLogModalOpen(false);
	};

	// Function to handle the submission of a new log
	const handleAddLogSubmit = (newLog) => {
		if (newLog.type === "food") {
			setMarkers((prevMarkers) => ({
				...prevMarkers,
				food: [...prevMarkers.food, { x: new Date(newLog.timestamp), y: 120 }],
			}));
		} else if (newLog.type === "exercise") {
			setMarkers((prevMarkers) => ({
				...prevMarkers,
				exercise: [...prevMarkers.exercise, { x: new Date(newLog.timestamp), y: 100 }],
			}));
		}

		// Close the modal after submitting the log
		closeAddLogModal();
	};

	const toggleStar = (index) => {
		const updatedItems = [...items];
		updatedItems[index].starred = !updatedItems[index].starred; // Toggle starred
		setItems(updatedItems);
	};

	// Fetch glucose readings and AI suggestions
	useEffect(() => {
		const fetchGlucoseReadings = async () => {
			try {
				const response = await fetch("/api/get_glucose");
				const data = await response.json();

				// Map the API response to the expected format
				const formattedData = data.map((reading) => ({
					time: DateTime.fromISO(reading.systemTime, { zone: "utc" }).toFormat("HH:mm"),
					value: reading.value,
				}));

				setGlucoseReadings(formattedData);
			} catch (error) {
				console.error("Error fetching glucose readings:", error);
			}
		};

		const fetchAiSuggestion = async () => {
			try {
				const response = await fetch("/api/get_advice");
				const data = await response.json();
				setAiSuggestion(data.response); // Set the AI suggestion response
			} catch (error) {
				console.error("Error fetching AI suggestion:", error);
			}
		};

		fetchGlucoseReadings();
		fetchAiSuggestion();
	}, []);

	// Line chart data
	const data = {
		labels: glucoseReadings.map((reading) => reading.time),
		datasets: [
			{
				label: "Glucose Readings (mg/dL)",
				data: glucoseReadings.map((reading) => reading.value),
				borderColor: "rgba(75, 192, 192, 1)",
			},
			{
				label: "Food",
				data: markers.food,
				pointRadius: 6,
				pointBackgroundColor: "red",
				pointStyle: "circle",
				showLine: false,
			},
			{
				label: "Exercise",
				data: markers.exercise,
				pointRadius: 6,
				pointBackgroundColor: "blue",
				pointStyle: "triangle",
				showLine: false,
			},
		],
	};

	return (
		<div className="dashboard-page">
			<div className="dashboard-first-div">
				{/* Line chart for glucose readings */}
				<div style={{ height: "400px", width: "100%", cursor: "pointer" }}>
					{glucoseReadings.length === 0 ? (
						<div style={{ textAlign: "center", padding: "100px" }}>
							<p>No glucose data available.</p>
							<a href="/api/dexcom_login" style={{ color: 'blue', textDecoration: 'underline' }}>
								Click here to link your Dexcom.
							</a>
						</div>
					) : (
						<Line
							data={data}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								fullSize: true,
								layout: { padding: 0 },
								scales: {
									x: {
										type: "time",
										time: {
											tooltipFormat: "HH:mm",
											unit: "hour",
											stepSize: 1,
											displayFormats: { hour: "HH:mm" },
										},
										title: { display: true, text: "Time (24-Hour Format)" },
									},
									y: {
										title: { display: true, text: "Glucose Level (mg/dL)" },
										beginAtZero: false,
										min: Math.min(...glucoseReadings.map(reading => reading.value)) * 0.95,
										max: Math.max(...glucoseReadings.map(reading => reading.value)) * 1.05,
									},
								},
								plugins: {
									legend: {
										display: true,
										position: "top",
										align: "center",
										labels: { usePointStyle: true, padding: 20 },
									},
								},
							}}
						/>
					)}
				</div>
			</div>
			<div className="dashboard-second-div">
				<div className="ai-suggestions">
					<div className="dashboard-second-header">
						<img src={aiIcon} alt="AI Icon" />
						<h3>AI suggestions</h3>
					</div>
					<ReactMarkdown>{aiSuggestion || "Loading AI suggestion..."}</ReactMarkdown>
					<p className="disclaimer">
						Disclaimer: The AI suggestions provided are generated by a language model and should not be considered medical advice.
					</p>
				</div>
				<div className="recent-logs">
					<div className="dashboard-second-header">
						<img src={recentIcon} alt="Recent Icon" />
						<h3>Recent Logs</h3>
					</div>
					<div className="small-log">
						<List items={items} limit={5} toggleStar={toggleStar} onItemClick={handleItemClick} />
						{selectedItem && <Modal logData={selectedItem} onClose={closeModal} />}
					</div>
				</div>
			</div>

			{/* AddLogModal for adding new logs */}
			{isAddLogModalOpen && (
				<AddLogModal
					onClose={closeAddLogModal}
					onSubmit={handleAddLogSubmit}
				/>
			)}
		</div>
	);
}

export default Dashboard;
