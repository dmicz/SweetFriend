import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { getRelativePosition } from "chart.js/helpers";
import { DateTime } from 'luxon';

function Dashboard() {
	// eslint-disable-next-line no-unused-vars
	const [glucoseReadings, setGlucoseReadings] = useState([]);

	const [markers, setMarkers] = useState({
		food: [],
		exercise: [],
	});

	const fetchGlucoseReadings = async () => {
		try {
			const response = await fetch('http://localhost:5000/api/get_glucose');
			const data = await response.json();
			
			// Map the API response to the expected format
			const formattedData = data.map(reading => ({
				time: DateTime.fromISO(reading.systemTime, { zone: 'utc' }) // Set timezone to UTC
				.toFormat('HH:mm'),
				
				value: reading.value,
			}));

			setGlucoseReadings(formattedData);
		} catch (error) {
			console.error("Error fetching glucose readings:", error);
		}
	};

	useEffect(() => {
		fetchGlucoseReadings();
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
				<div style={{ height: "400px", width: "100%" }}>
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
									min: "2024-09-21T00:00:00",
									max: "2024-09-21T23:59:59",
								},
								y: {
									title: {
										display: true,
										text: "Glucose Level (mg/dL)",
									},
									beginAtZero: false,
									min: Math.min(glucoseReadings.values) * 0.95,
									max: Math.max(glucoseReadings.values) * 1.05,
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
								tooltip: {
									mode: "index",
									intersect: false,
								},
							},
							hover: {
								mode: "nearest",
								intersect: false,
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
		</div>
	);
}

export default Dashboard;
