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

function Dashboard() {
	// eslint-disable-next-line no-unused-vars
	const [glucoseReadings, setGlucoseReadings] = useState([]);
	const [items, setItems] = useState([]);

	const [selectedItem, setSelectedItem] = useState(null); // State to track the selected item

	// Function to show the modal with the selected item details
	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	// Function to close the modal
	const closeModal = () => {
		setSelectedItem(null);
	};

	useEffect(() => {
		const fetchLogEntries = async () => {
			try {
				const response = await fetch("/api/log_entries");
				const data = await response.json();
				if (data.status === "success") {
					setItems(data.entries);
				} else {
					console.error("Failed to fetch entries:", data.message);
				}
			} catch (error) {
				console.error("Error fetching log entries:", error);
			}
		};

		fetchLogEntries();
	}, []);

	const toggleStar = (index) => {
		const updatedItems = [...items];
		updatedItems[index].starred = !updatedItems[index].starred; // Toggle starred
		setItems(updatedItems);
	};

	const [markers, setMarkers] = useState({
		food: [],
		exercise: [],
	});

	const [aiSuggestion, setAiSuggestion] = useState("Random AI suggestions will be displayed here. For example, &quot;You \
						should drink more water&quot; or &quot;You should go for a \
						walk.&quot;");

	const fetchGlucoseReadings = async () => {
		try {
			const response = await fetch("/api/get_glucose");
			const data = await response.json();

			// Map the API response to the expected format
			const formattedData = data.map((reading) => ({
				time: DateTime.fromISO(reading.systemTime, { zone: "utc" }) // Set timezone to UTC
					.toFormat("HH:mm"),

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


	useEffect(() => {
		fetchGlucoseReadings();
		fetchAiSuggestion();
	}, []);

	useEffect(() => {
		console.log("Updated glucoseReadings:", glucoseReadings);
	}, [glucoseReadings]);

	// Line chart data
	const data = {
		labels: glucoseReadings.map((reading) => reading.time),
		datasets: [
			{
				label: "Glucose Readings (mg/dL)",
				data: glucoseReadings.map((reading) => reading.value),
				borderColor: "rgba(75, 192, 192, 1)",
			},
			// Food markers
			{
				label: "Food",
				data: markers.food,
				pointRadius: 6,
				pointBackgroundColor: "red",
				pointStyle: "circle",
				showLine: false, // Do not connect the markers
			},
			// Exercise markers
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

	// Handle chart click to add a marker for either food or exercise
	const handleChartClick = (event, type) => {
		const chart = event.chart;

		// Get the exact relative position of the click on the canvas
		const canvasPosition = getRelativePosition(event, chart);

		// Use the relative position to get the exact data coordinates
		const xValue = chart.scales.x.getValueForPixel(canvasPosition.x); // Time in hours
		const yValue = chart.scales.y.getValueForPixel(canvasPosition.y); // Glucose value

		// Add new marker based on the type (food or exercise)
		const newMarker = { x: xValue, y: yValue };

		setMarkers((prevMarkers) => {
			if (type === "food") {
				return { ...prevMarkers, food: [...prevMarkers.food, newMarker] };
			} else if (type === "exercise") {
				return {
					...prevMarkers,
					exercise: [...prevMarkers.exercise, newMarker],
				};
			}
			return prevMarkers;
		});
	};

	return (
		<div className="dashboard-page">
			<div className="dashboard-first-div">
				{/* Line chart for glucose readings */}
				<div style={{ height: "400px", width: "100%", cursor: "pointer" }}>
					<Line
						data={data}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							fullSize: true,
							layout: {
								padding: 0,
							},
							scales: {
								x: {
									type: "time",
									time: {
										tooltipFormat: "HH:mm", // Display time in hours and minutes
										unit: "hour",
										stepSize: 1,
										displayFormats: {
											hour: "HH:mm", // Display x-axis in 24-hour format
										},
									},
									title: {
										display: true,
										text: "Time (24-Hour Format)",
									},
									min: "2024-09-22T00:00:00",
									max: "2024-09-22T23:59:59",
								},
								y: {
									title: {
										display: true,
										text: "Glucose Level (mg/dL)",
									},
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
									labels: {
										usePointStyle: true,
										padding: 20,
									},
								},
							},
							onClick: (event) => {
								const markerType = window.prompt(
									"Enter 'food' or 'exercise' to mark the event:"
								);
								if (markerType === "food" || markerType === "exercise") {
									handleChartClick(event, markerType);
								}
							},
						}}
					/>
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
						Disclaimer: The AI suggestions provided are generated by a language model and should not be considered medical advice. Always consult with a healthcare professional for medical advice and treatment.
					</p>
				</div>
				<div className="recent-logs">
					<div className="dashboard-second-header">
						<img src={recentIcon} alt="Recent Icon" />
						<h3>Recent Logs</h3>
					</div>
					
					<div className="small-log">
						<List items={items} limit={5} toggleStar={toggleStar} onItemClick={handleItemClick} />
						{selectedItem && <Modal item={selectedItem} onClose={closeModal} />}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
